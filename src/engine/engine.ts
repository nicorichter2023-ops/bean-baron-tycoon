// ============================================================
// Coffee Empire: Bean to Billion — engine.ts
// Pure Game Loop, deterministisch, ohne externe Bibliotheken
// ============================================================

import type {
  ActionResult,
  B2BContract,
  B2BState,
  CapitalMarketsState,
  City,
  CoffeeMarket,
  District,
  Employee,
  Era,
  GameState,
  LuxuryGood,
  ModuleId,
  RivalCompany,
  Roastery,
  StartupInvestment,
  Store,
  StoreTier,
  TurnReport,
} from './types';

// -----------------------------------------------------------
// Balance-Konfiguration
// -----------------------------------------------------------

export const GAME_CONFIG = {
  SCHEMA_VERSION: 2 as const,
  START_CASH: 50_000,
  STORE_OPENING_COST: { 1: 12_000, 2: 55_000, 3: 180_000 } as Record<StoreTier, number>,
  STORE_UPGRADE_COST: { 2: 45_000, 3: 160_000 } as Record<2 | 3, number>,
  START_DATE: '2026-01-05',
  /** Sicherheitsgrenze für Spielwochen (~1.900 Jahre, Date bleibt gültig) */
  MAX_WEEK: 100_000,
  /** Obergrenze für Geldwerte: hält alle Werte weit unter 2^53 */
  MONEY_CAP: 1e13,
  KG_PER_CUP: 0.018,
  /** Basis-Kundenkapazität pro Woche je Tier */
  TIER_CAPACITY: { 1: 900, 2: 2600, 3: 6500 } as Record<StoreTier, number>,
  /** Benötigte Mitarbeiter für 100 % Auslastung je Tier */
  TIER_REQUIRED_STAFF: { 1: 1, 2: 4, 3: 10 } as Record<StoreTier, number>,
  /** Mietmultiplikator je Tier */
  TIER_RENT_FACTOR: { 1: 0.5, 2: 1.0, 3: 2.5 } as Record<StoreTier, number>,
  /** Basiswert einer Filiale je Tier (für die Firmenbewertung) */
  TIER_BASE_VALUE: { 1: 40_000, 2: 180_000, 3: 650_000 } as Record<StoreTier, number>,
  IDEAL_CUP_PRICE: 4.5,
  FUTURES_ANCHOR_PRICE: 5.5,
  FUTURES_MIN_PRICE: 1.5,
  FUTURES_MAX_PRICE: 20,
  /** Kosten Rohbohne beim Nachkauf = Futures * Faktor (Logistik/Zoll) */
  GREEN_BEAN_MARKUP: 1.15,
  /** Aufpreis, wenn Röstkaffee extern zugekauft wird (solange keine eigene Rösterei läuft) */
  EXTERNAL_ROAST_PREMIUM: 1.25,
  /** Röstverlust, der für die Berechnung des externen Preises angenommen wird */
  DEFAULT_ROAST_LOSS_PERCENT: 16,
  /** Max. gerösteter Lagerbestand in Wochen-Röstkapazitäten */
  ROASTED_STOCK_CAP_WEEKS: 2,
  /** Bewertungsfaktor für gerösteten Bestand (relativ zum Futures-Preis) */
  ROASTED_VALUE_MULTIPLIER: 1.6,
  /** Wöchentliche Steuer auf positives Betriebsergebnis */
  TAX_RATE: 0.15,
  /** Obergrenze des wöchentlichen Schuldzinses (0.5 % ≈ 30 % p. a.) */
  MAX_WEEKLY_INTEREST: 0.005,
  ROASTERY_COST: 250_000,
  PRICE_HISTORY_MAX: 104,
  /** Wöchentliche Wahrscheinlichkeit, dass ein Startup-Investment aufgelöst wird (Ø 26 Wochen) */
  STARTUP_RESOLUTION_HAZARD: 1 / 26,
  /** Wöchentliches Basiswachstum der Rivalen-Bewertungen */
  RIVAL_WEEKLY_GROWTH: 0.0012,
  MIN_SHARE_PRICE: 0.01,
  MAX_SHARE_PRICE: 10_000_000,
  UNLOCK_THRESHOLDS: {
    roastery: 250_000,
    b2b_trade: 1_500_000,
    capital_markets: 15_000_000,
  },
  ERA_THRESHOLDS: { local_chain: 100_000, national_brand: 1_000_000, global_empire: 10_000_000 },
  BANKRUPTCY_FLOOR: -50_000,
} as const;

// -----------------------------------------------------------
// Mathe-Helpers & deterministischer PRNG
// -----------------------------------------------------------

/** NaN-sicher: NaN wird auf min gezogen, ±Infinity auf min/max. */
export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function hashSeed(input: number): number {
  let h = input ^ 0x9e3779b9;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

/** FNV-1a Hash für Strings (stabile Seeds pro Entity-ID) */
function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Mulberry32: schneller, deterministischer PRNG */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function round2(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

function capMoney(n: number): number {
  const cap = GAME_CONFIG.MONEY_CAP;
  return clamp(finiteOr(n, 0), -cap, cap);
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function unique<T>(items: T[]): T[] {
  return items.filter((item, index) => items.indexOf(item) === index);
}

const START_DATE_MS = Date.UTC(2026, 0, 5);

/** Datum wird deterministisch aus der Woche abgeleitet (kein Drift, kein Invalid Date). */
export function dateForWeek(week: number): string {
  const w = clamp(Math.floor(finiteOr(week, 1)), 1, GAME_CONFIG.MAX_WEEK);
  return new Date(START_DATE_MS + (w - 1) * 7 * 86_400_000).toISOString().slice(0, 10);
}

// -----------------------------------------------------------
// Geforderte Kernfunktionen
// -----------------------------------------------------------

/**
 * Kundennachfrage pro Woche (Anzahl Kunden).
 * price in €, quality 0–100, competition 0–100,
 * footTraffic 0–100, cityWealth 0.5–2.0.
 */
export function calculateCustomerDemand(
  price: number,
  quality: number,
  competition: number,
  footTraffic: number,
  cityWealth: number,
): number {
  const wealth = clamp(finiteOr(cityWealth, 1), 0.5, 2.0);
  const safePrice = clamp(finiteOr(price, 0), 0, 100);
  const ideal = GAME_CONFIG.IDEAL_CUP_PRICE * wealth;
  const sigma = Math.max(0.1, 1.8 * wealth);
  const priceScore = Math.exp(-((safePrice - ideal) ** 2) / (2 * sigma * sigma));
  const qualityScore = 0.35 + (clamp(finiteOr(quality, 0), 0, 100) / 100) * 1.3;
  const competitionFactor = clamp(
    1 - clamp(finiteOr(competition, 0), 0, 100) * 0.006,
    0.4,
    1,
  );
  const base = clamp(finiteOr(footTraffic, 0), 0, 100) * 45;
  return Math.max(0, Math.round(base * priceScore * qualityScore * competitionFactor));
}

/**
 * Kaffee-Futures: Random Walk mit Mean-Reversion.
 * volatility in Prozent, turn als Seed → reproduzierbare Kurse.
 */
export function simulateCoffeeFutures(
  currentPrice: number,
  volatility: number,
  turn: number,
): number {
  const price =
    Number.isFinite(currentPrice) && currentPrice > 0
      ? currentPrice
      : GAME_CONFIG.FUTURES_ANCHOR_PRICE;
  const vol = clamp(finiteOr(volatility, 0), 0, 50);
  const rng = mulberry32(hashSeed(Math.floor(finiteOr(turn, 0)) * 7919));
  const shockPct = (rng() * 2 - 1) * vol;
  const secondShock = (rng() * 2 - 1) * vol * 0.35;
  const reversion =
    ((GAME_CONFIG.FUTURES_ANCHOR_PRICE - price) / GAME_CONFIG.FUTURES_ANCHOR_PRICE) * 0.06;
  const next = price * (1 + (shockPct + secondShock) / 100 + reversion);
  return round2(clamp(next, GAME_CONFIG.FUTURES_MIN_PRICE, GAME_CONFIG.FUTURES_MAX_PRICE));
}

/**
 * M&A-Prüfung: Akzeptieren die Gesellschafter das Angebot?
 */
export function evaluateMergerAndAcquisition(
  targetCompany: RivalCompany,
  offeredPrice: number,
): { success: boolean; reason: string } {
  if (targetCompany.acquired) {
    return { success: false, reason: 'TARGET_ALREADY_ACQUIRED' };
  }
  if (
    !Number.isFinite(targetCompany.valuation) ||
    !Number.isFinite(offeredPrice) ||
    targetCompany.valuation <= 0 ||
    offeredPrice <= 0
  ) {
    return { success: false, reason: 'INVALID_VALUATION_OR_OFFER' };
  }
  const premium = offeredPrice / targetCompany.valuation;
  const requiredPremium = Math.max(
    1.0,
    1.05 +
      (clamp(finiteOr(targetCompany.aggression, 50), 0, 100) / 100) * 0.35 -
      (clamp(finiteOr(targetCompany.strategicSynergy, 0), 0, 100) / 100) * 0.15,
  );
  if (premium < 1.0) {
    return { success: false, reason: 'OFFER_BELOW_VALUATION' };
  }
  if (premium < requiredPremium) {
    return {
      success: false,
      reason: `BOARD_DEMANDS_${Math.round(requiredPremium * 100)}_PCT_OF_VALUATION`,
    };
  }
  return { success: true, reason: 'OFFER_ACCEPTED' };
}

// -----------------------------------------------------------
// Turn-Verarbeitung
// -----------------------------------------------------------

/** Preis pro kg extern zugekauftem Röstkaffee (inkl. Röstverlust und Aufpreis). */
export function externalRoastedPricePerKg(futuresPricePerKg: number): number {
  const yieldFactor = 1 - GAME_CONFIG.DEFAULT_ROAST_LOSS_PERCENT / 100;
  return round2(
    (finiteOr(futuresPricePerKg, GAME_CONFIG.FUTURES_ANCHOR_PRICE) *
      GAME_CONFIG.GREEN_BEAN_MARKUP *
      GAME_CONFIG.EXTERNAL_ROAST_PREMIUM) /
      yieldFactor,
  );
}

interface StoreResult {
  revenue: number;
  salaries: number;
  rent: number;
  servedCustomers: number;
  beansConsumedKg: number;
  stockLimited: boolean;
}

/**
 * availableRoastedKg = null → externe Versorgung (unbegrenzt, kostenpflichtig).
 */
function processStore(
  store: Store,
  district: District,
  city: City,
  availableRoastedKg: number | null,
): { store: Store; result: StoreResult } {
  const tier = store.tier;
  const staff = store.employees;
  const requiredStaff = Math.max(1, GAME_CONFIG.TIER_REQUIRED_STAFF[tier] ?? 1);
  const staffingRatio = staff.length === 0 ? 0 : clamp(staff.length / requiredStaff, 0.25, 1.25);
  const avgSkill = average(staff.map((e) => e.skill));
  const managers = staff.filter((e) => e.role === 'manager').length;

  // Qualitätsdrift Richtung Zielniveau (Personal, Management, Tier)
  const targetQuality = clamp(35 + avgSkill * 0.5 + managers * 4 + tier * 4, 0, 100);
  const qualityIndex = round2(
    clamp(store.qualityIndex + (targetQuality - store.qualityIndex) * 0.12, 0, 100),
  );

  const rawDemand = calculateCustomerDemand(
    store.pricePerCup,
    qualityIndex,
    district.competition,
    district.footTraffic,
    city.purchasingPower,
  );
  const cultureBoost = 1 + clamp(city.coffeeCultureIndex, 0, 100) / 400;
  const capacity =
    (GAME_CONFIG.TIER_CAPACITY[tier] ?? 0) * staffingRatio * (1 + avgSkill / 600) * cultureBoost;

  let served = Math.max(0, Math.min(rawDemand, Math.floor(capacity)));
  let stockLimited = false;
  if (availableRoastedKg !== null) {
    // Bohnen-Limit: 18 g Röstkaffee pro Tasse
    const beanLimited = Math.floor(Math.max(0, availableRoastedKg) / GAME_CONFIG.KG_PER_CUP);
    if (beanLimited < served) stockLimited = true;
    served = Math.max(0, Math.min(served, beanLimited));
  }

  const revenue = round2(served * Math.max(0, store.pricePerCup));
  const salaries = round2(staff.reduce((sum, e) => sum + Math.max(0, e.salaryWeekly), 0));
  const rent = round2(
    Math.max(0, district.rentWeekly) * (GAME_CONFIG.TIER_RENT_FACTOR[tier] ?? 1),
  );

  return {
    store: {
      ...store,
      qualityIndex,
      weeklyRevenue: revenue,
      customersServedLastWeek: served,
    },
    result: {
      revenue,
      salaries,
      rent,
      servedCustomers: served,
      beansConsumedKg: round2(served * GAME_CONFIG.KG_PER_CUP),
      stockLimited,
    },
  };
}

function processRoastery(
  roastery: Roastery,
  market: CoffeeMarket,
  cash: number,
): { roastery: Roastery; autoBuyCost: number } {
  if (!roastery.owned) return { roastery, autoBuyCost: 0 };

  let rawBeanStockKg = Math.max(0, roastery.rawBeanStockKg);
  let beanLots = roastery.beanLots.map((lot) => ({ ...lot }));
  const roastedStockKg = Math.max(0, roastery.roastedStockKg);
  const capacity = Math.max(0, roastery.capacityKgPerWeek);
  const yieldFactor = 1 - clamp(roastery.roastLossPercent, 0, 60) / 100;

  const roasterBoost = 1 + average(roastery.employees.map((e) => e.skill)) / 500;
  const maxInput = capacity * roasterBoost;
  const stockCap = capacity * GAME_CONFIG.ROASTED_STOCK_CAP_WEEKS;
  const room = Math.max(0, stockCap - roastedStockKg);
  const targetInput = Math.min(maxInput, room / yieldFactor);

  let autoBuyCost = 0;
  if (roastery.autoRestock) {
    const desiredRaw = Math.max(Math.max(0, roastery.safetyStockKg), targetInput);
    const pricePerKg = market.futuresPricePerKg * GAME_CONFIG.GREEN_BEAN_MARKUP;
    if (rawBeanStockKg < desiredRaw && Number.isFinite(pricePerKg) && pricePerKg > 0) {
      const buyKg = desiredRaw - rawBeanStockKg;
      const affordableKg = Math.min(buyKg, Math.floor(Math.max(0, cash) / pricePerKg));
      if (affordableKg > 0) {
        rawBeanStockKg += affordableKg;
        autoBuyCost = round2(affordableKg * pricePerKg);
        const beanId = beanLots[0]?.beanId ?? 'house_blend';
        const existing = beanLots.find((lot) => lot.beanId === beanId);
        if (existing) {
          const total = existing.quantityKg + affordableKg;
          existing.averagePricePerKg = round2(
            (existing.quantityKg * existing.averagePricePerKg + affordableKg * pricePerKg) / total,
          );
          existing.quantityKg = round2(total);
        } else {
          beanLots.push({ beanId, quantityKg: round2(affordableKg), averagePricePerKg: round2(pricePerKg) });
        }
      }
    }
  }

  const roastInput = Math.max(0, Math.min(rawBeanStockKg, targetInput));
  const produced = roastInput * yieldFactor;
  let consumptionLeft = roastInput;
  beanLots = beanLots
    .map((lot) => {
      const consumed = Math.min(lot.quantityKg, consumptionLeft);
      consumptionLeft -= consumed;
      return { ...lot, quantityKg: round2(lot.quantityKg - consumed) };
    })
    .filter((lot) => lot.quantityKg > 0.001);

  return {
    roastery: {
      ...roastery,
      beanLots,
      rawBeanStockKg: round2(rawBeanStockKg - roastInput),
      roastedStockKg: round2(roastedStockKg + produced),
    },
    autoBuyCost,
  };
}

function processB2B(
  b2b: B2BState,
  roastedAvailableKg: number,
  rng: () => number,
): { b2b: B2BState; revenue: number; roastedUsedKg: number; notes: string[] } {
  const startStock = Math.max(0, roastedAvailableKg);
  let stockLeft = startStock;
  let revenue = 0;
  const notes: string[] = [];
  const contracts: B2BContract[] = [];

  for (const c of b2b.contracts) {
    if (c.weeksRemaining <= 0) continue;
    const volume = Math.max(0, c.volumeKgPerWeek);
    const delivered = Math.min(volume, stockLeft);
    stockLeft -= delivered;
    if (delivered < volume) {
      notes.push(`UNDERDELIVERY:${c.partnerName}`);
    }
    // Kunden mit schlechter Zahlungsmoral zahlen 2 % Skonto-Abzug,
    // kleines Ausfallrisiko (1 % bei reliability < 40)
    let multiplier = c.reliability >= 80 ? 1 : 0.98;
    if (c.reliability < 40 && rng() < 0.01) {
      multiplier = 0;
      notes.push(`PAYMENT_DEFAULT:${c.partnerName}`);
    }
    revenue += delivered * Math.max(0, c.pricePerKg) * multiplier;
    contracts.push({ ...c, weeksRemaining: c.weeksRemaining - 1 });
  }

  const used = startStock - stockLeft;
  return {
    b2b: {
      contracts,
      lifetimeVolumeKg: round2(Math.max(0, b2b.lifetimeVolumeKg) + used),
    },
    revenue: round2(revenue),
    roastedUsedKg: round2(used),
    notes,
  };
}

function processCapitalMarkets(
  cm: CapitalMarketsState,
  netIncomeSoFar: number,
  week: number,
  fairValuation: number,
): {
  capitalMarkets: CapitalMarketsState;
  cashDelta: number;
  taxableGain: number;
  upkeep: number;
  notes: string[];
} {
  const notes: string[] = [];
  let cashDelta = 0;
  let taxableGain = 0;

  // Startup-Portfolio: Zufällige Auflösung (Ø 26 Wochen), dann Erfolg mit successChance.
  // → Gesamt-Erfolgswahrscheinlichkeit entspricht exakt successChance.
  const startups: StartupInvestment[] = cm.startups.map((s) => {
    if (s.status !== 'active' || s.investedAmount <= 0) return s;
    const rng = mulberry32(hashSeed(week * 104729 + hashString(s.id)));
    if (rng() >= GAME_CONFIG.STARTUP_RESOLUTION_HAZARD) return s;
    const succeeded = rng() * 100 < clamp(s.successChance, 0, 100);
    if (succeeded) {
      const payout = round2(s.investedAmount * Math.max(1, s.payoutMultiple));
      cashDelta += payout;
      taxableGain += Math.max(0, payout - s.investedAmount);
      notes.push(`STARTUP_EXIT:${s.name}`);
      return { ...s, status: 'succeeded' as const };
    }
    notes.push(`STARTUP_FAILED:${s.name}`);
    return { ...s, status: 'failed' as const };
  });

  // Börsenwerte und Aktienkurse entwickeln sich gemeinsam, damit Kauf/Verkauf und M&A konsistent bleiben.
  const rivals: RivalCompany[] = cm.rivals.map((r) => {
    if (r.acquired) return r;
    const rng = mulberry32(hashSeed(week * 7907 + hashString(r.id)));
    const growth = GAME_CONFIG.RIVAL_WEEKLY_GROWTH + (rng() - 0.5) * 0.01;
    const valuation = Math.round(clamp(r.valuation * (1 + growth), 1, GAME_CONFIG.MONEY_CAP));
    const sharePrice = round2(
      clamp(valuation / Math.max(1, r.sharesOutstanding), GAME_CONFIG.MIN_SHARE_PRICE, GAME_CONFIG.MAX_SHARE_PRICE),
    );
    return { ...r, valuation, sharePrice };
  });

  const dividendCash = round2(
    cm.holdings.reduce((sum, holding) => {
      const company = rivals.find((r) => r.id === holding.companyId);
      if (!company || company.acquired) return sum;
      return sum + holding.shares * company.sharePrice * (company.dividendYield / 52);
    }, 0),
  );
  if (dividendCash > 0) {
    cashDelta += dividendCash;
    taxableGain += dividendCash;
    notes.push(`DIVIDENDS:${dividendCash}`);
  }

  // Aktienkurs: Rückkehr zum fairen Wert (Asset-Bewertung / Aktien) + Performance + Rauschen
  let sharePrice = cm.sharePrice;
  let marketCap = cm.marketCap;
  if (cm.isPublic && cm.sharesOutstanding > 0) {
    const rng = mulberry32(hashSeed(week * 31337));
    const current = Math.max(GAME_CONFIG.MIN_SHARE_PRICE, finiteOr(sharePrice, 10));
    const fairPrice = Math.max(0, fairValuation) / cm.sharesOutstanding;
    const reversion = clamp((fairPrice - current) / current, -0.5, 0.5) * 0.08;
    const perfDrift = netIncomeSoFar >= 0 ? 0.002 : -0.004;
    const noise = (rng() - 0.5) * 0.04;
    sharePrice = round2(
      clamp(
        current * (1 + reversion + perfDrift + noise),
        GAME_CONFIG.MIN_SHARE_PRICE,
        GAME_CONFIG.MAX_SHARE_PRICE,
      ),
    );
    marketCap = Math.round(clamp(sharePrice * cm.sharesOutstanding, 0, GAME_CONFIG.MONEY_CAP));
  }

  // Luxusgüter: laufende Kosten
  const upkeep = round2(
    cm.luxuryGoods.filter((l) => l.owned).reduce((sum, l) => sum + Math.max(0, l.upkeepWeekly), 0),
  );

  return {
    capitalMarkets: { ...cm, startups, rivals, sharePrice, marketCap },
    cashDelta: round2(cashDelta),
    taxableGain: round2(taxableGain),
    upkeep,
    notes,
  };
}

// -----------------------------------------------------------
// Bewertung, Ären & Modul-Freischaltung
// -----------------------------------------------------------

/** Reine Substanzbewertung (ohne Börsen-Floor). */
export function calculateAssetValuation(state: GameState): number {
  const storeValue = state.stores.reduce(
    (sum, s) =>
      sum +
      (GAME_CONFIG.TIER_BASE_VALUE[s.tier] ?? 0) * (0.5 + clamp(s.qualityIndex, 0, 100) / 100),
    0,
  );
  const futures = Math.max(0, finiteOr(state.market.futuresPricePerKg, 0));
  const inventoryValue =
    Math.max(0, state.roastery.roastedStockKg) * futures * GAME_CONFIG.ROASTED_VALUE_MULTIPLIER +
    Math.max(0, state.roastery.rawBeanStockKg) * futures;
  const roasteryValue = state.roastery.owned ? GAME_CONFIG.ROASTERY_COST * 0.9 : 0;
  const startupBookValue = state.capitalMarkets.startups
    .filter((s) => s.status === 'active' || s.acquired)
    .reduce(
      (sum, s) => sum + (s.acquired ? Math.max(0, s.valuation) * 0.8 : Math.max(0, s.investedAmount)),
      0,
    );
  const stockValue = state.capitalMarkets.holdings.reduce((sum, holding) => {
    const company = state.capitalMarkets.rivals.find((r) => r.id === holding.companyId);
    return sum + (company ? holding.shares * company.sharePrice : 0);
  }, 0);
  const acquiredRivalValue = state.capitalMarkets.rivals
    .filter((r) => r.acquired)
    .reduce((sum, r) => sum + r.valuation * 0.8, 0);
  const b2bValue = state.b2b.contracts.reduce(
    (sum, c) =>
      sum +
      Math.max(0, c.volumeKgPerWeek) *
        Math.max(0, c.pricePerKg) *
        Math.max(0, c.weeksRemaining) *
        0.6,
    0,
  );
  const brandValue = clamp(state.brandReputation, 0, 100) * 2_500;

  return capMoney(
    state.cash +
      storeValue +
      roasteryValue +
      inventoryValue +
      startupBookValue +
      stockValue +
      acquiredRivalValue +
      b2bValue +
      brandValue -
      state.debt,
  );
}

export function calculateCompanyValuation(state: GameState): number {
  const assetValuation = calculateAssetValuation(state);
  if (state.capitalMarkets.isPublic) {
    return Math.max(Math.round(assetValuation), Math.round(state.capitalMarkets.marketCap * 0.9));
  }
  return Math.round(assetValuation);
}

function resolveEra(valuation: number): Era {
  const t = GAME_CONFIG.ERA_THRESHOLDS;
  if (valuation >= t.global_empire) return 'global_empire';
  if (valuation >= t.national_brand) return 'national_brand';
  if (valuation >= t.local_chain) return 'local_chain';
  return 'street_vendor';
}

function resolveUnlocks(state: GameState, valuation: number): ModuleId[] {
  const t = GAME_CONFIG.UNLOCK_THRESHOLDS;
  const unlocks: ModuleId[] = ['core_cafe'];
  if (valuation >= t.roastery) unlocks.push('roastery');
  if (valuation >= t.b2b_trade && state.unlockedModules.includes('roastery')) {
    unlocks.push('b2b_trade');
  }
  if (valuation >= t.capital_markets) unlocks.push('capital_markets');
  return unique([...state.unlockedModules, ...unlocks]);
}

// -----------------------------------------------------------
// Spieler-Aktion: Rösterei kaufen
// -----------------------------------------------------------

export function purchaseRoastery(state: GameState): {
  state: GameState;
  ok: boolean;
  reason: string;
} {
  if (!state.unlockedModules.includes('roastery')) {
    return { state, ok: false, reason: 'MODULE_LOCKED' };
  }
  if (state.roastery.owned) {
    return { state, ok: false, reason: 'ALREADY_OWNED' };
  }
  if (state.cash < GAME_CONFIG.ROASTERY_COST) {
    return { state, ok: false, reason: 'INSUFFICIENT_CASH' };
  }
  return {
    state: {
      ...state,
      cash: round2(state.cash - GAME_CONFIG.ROASTERY_COST),
      roastery: { ...state.roastery, owned: true },
    },
    ok: true,
    reason: 'PURCHASED',
  };
}

// -----------------------------------------------------------
// Weitere Spieler-Aktionen
// -----------------------------------------------------------

function rejected(state: GameState, reason: string): ActionResult {
  return { state, ok: false, reason };
}

function finalizeAction(state: GameState): GameState {
  const companyValuation = calculateCompanyValuation(state);
  return {
    ...state,
    companyValuation,
    era: resolveEra(companyValuation),
    unlockedModules: resolveUnlocks(state, companyValuation),
  };
}

export function storeOpeningCost(district: District, tier: StoreTier): number {
  return Math.round(GAME_CONFIG.STORE_OPENING_COST[tier] + district.rentWeekly * GAME_CONFIG.TIER_RENT_FACTOR[tier] * 2);
}

export function openStore(
  state: GameState,
  cityId: string,
  districtId: string,
  tier: StoreTier,
): ActionResult {
  const city = state.cities.find((candidate) => candidate.id === cityId);
  const district = city?.districts.find((candidate) => candidate.id === districtId);
  if (!city || !district) return rejected(state, 'DISTRICT_NOT_FOUND');
  if (state.stores.some((store) => store.districtId === districtId)) return rejected(state, 'DISTRICT_OCCUPIED');
  if (tier > district.maxStoreTier) return rejected(state, 'TIER_NOT_ALLOWED');
  const cost = storeOpeningCost(district, tier);
  if (state.cash < cost) return rejected(state, 'INSUFFICIENT_CASH');
  const store: Store = {
    id: `store-${state.week}-${state.stores.length + 1}`,
    cityId,
    name: `${tier === 1 ? 'Kiosk' : tier === 2 ? 'Café' : 'Flagship'} ${district.name}`,
    districtId,
    tier,
    employees: [],
    qualityIndex: 45,
    pricePerCup: 4.5,
    weeklyRevenue: 0,
    customersServedLastWeek: 0,
    openedAtWeek: state.week,
  };
  return {
    state: finalizeAction({ ...state, cash: round2(state.cash - cost), stores: [...state.stores, store] }),
    ok: true,
    reason: `STORE_OPENED:${store.name}`,
  };
}

export function upgradeStore(state: GameState, storeId: string): ActionResult {
  const store = state.stores.find((candidate) => candidate.id === storeId);
  if (!store) return rejected(state, 'STORE_NOT_FOUND');
  if (store.tier >= 3) return rejected(state, 'MAX_TIER_REACHED');
  const district = state.cities.flatMap((city) => city.districts).find((candidate) => candidate.id === store.districtId);
  if (!district) return rejected(state, 'DISTRICT_NOT_FOUND');
  const nextTier = (store.tier + 1) as 2 | 3;
  if (nextTier > district.maxStoreTier) return rejected(state, 'TIER_NOT_ALLOWED');
  const cost = GAME_CONFIG.STORE_UPGRADE_COST[nextTier];
  if (state.cash < cost) return rejected(state, 'INSUFFICIENT_CASH');
  return {
    state: finalizeAction({
      ...state,
      cash: round2(state.cash - cost),
      stores: state.stores.map((candidate) => candidate.id === storeId ? { ...candidate, tier: nextTier } : candidate),
    }),
    ok: true,
    reason: `STORE_UPGRADED:${store.name}`,
  };
}

const BARISTA_NAMES = ['Mila', 'Jonas', 'Ayla', 'Noah', 'Emma', 'Levi', 'Nora', 'Sam'];
const MANAGER_NAMES = ['Sophie', 'David', 'Mara', 'Felix', 'Clara', 'Ben', 'Ida', 'Luis'];

export function hireEmployee(state: GameState, storeId: string, role: 'barista' | 'manager'): ActionResult {
  const store = state.stores.find((candidate) => candidate.id === storeId);
  if (!store) return rejected(state, 'STORE_NOT_FOUND');
  const seed = hashSeed(state.week * 8191 + hashString(storeId) + store.employees.length * 131 + (role === 'manager' ? 17 : 0));
  const skill = 35 + (seed % 56);
  const salaryWeekly = role === 'manager' ? 900 + skill * 9 : 420 + skill * 6;
  if (state.cash < salaryWeekly) return rejected(state, 'INSUFFICIENT_CASH');
  const names = role === 'manager' ? MANAGER_NAMES : BARISTA_NAMES;
  const employee: Employee = {
    id: `emp-${state.week}-${storeId}-${store.employees.length + 1}-${role}`,
    name: names[seed % names.length]!,
    role,
    skill,
    salaryWeekly,
    hiredAtWeek: state.week,
  };
  return {
    state: finalizeAction({
      ...state,
      cash: round2(state.cash - salaryWeekly),
      stores: state.stores.map((candidate) => candidate.id === storeId
        ? { ...candidate, employees: [...candidate.employees, employee] }
        : candidate),
    }),
    ok: true,
    reason: `EMPLOYEE_HIRED:${employee.name}`,
  };
}

export function fireEmployee(state: GameState, storeId: string, employeeId: string): ActionResult {
  const store = state.stores.find((candidate) => candidate.id === storeId);
  const employee = store?.employees.find((candidate) => candidate.id === employeeId);
  if (!store || !employee) return rejected(state, 'EMPLOYEE_NOT_FOUND');
  if (state.cash < employee.salaryWeekly) return rejected(state, 'INSUFFICIENT_CASH');
  return {
    state: finalizeAction({
      ...state,
      cash: round2(state.cash - employee.salaryWeekly),
      stores: state.stores.map((candidate) => candidate.id === storeId
        ? { ...candidate, employees: candidate.employees.filter((item) => item.id !== employeeId) }
        : candidate),
    }),
    ok: true,
    reason: `EMPLOYEE_RELEASED:${employee.name}`,
  };
}

export function takeLoan(state: GameState, amount: number): ActionResult {
  const value = Math.floor(amount);
  if (!Number.isFinite(value) || value <= 0) return rejected(state, 'INVALID_AMOUNT');
  if (value > 1_000_000 || state.debt + value > Math.max(250_000, state.companyValuation)) {
    return rejected(state, 'LOAN_LIMIT_REACHED');
  }
  return {
    state: finalizeAction({ ...state, cash: round2(state.cash + value), debt: round2(state.debt + value) }),
    ok: true,
    reason: `LOAN_TAKEN:${value}`,
  };
}

export function repayLoan(state: GameState, amount: number): ActionResult {
  const value = Math.floor(amount);
  if (!Number.isFinite(value) || value <= 0) return rejected(state, 'INVALID_AMOUNT');
  if (value > state.debt) return rejected(state, 'AMOUNT_EXCEEDS_DEBT');
  if (value > state.cash) return rejected(state, 'INSUFFICIENT_CASH');
  return {
    state: finalizeAction({ ...state, cash: round2(state.cash - value), debt: round2(state.debt - value) }),
    ok: true,
    reason: `LOAN_REPAID:${value}`,
  };
}

function requireCapitalMarkets(state: GameState): boolean {
  return state.unlockedModules.includes('capital_markets');
}

export function buyShares(state: GameState, companyId: string, shares: number): ActionResult {
  if (!requireCapitalMarkets(state)) return rejected(state, 'MODULE_LOCKED');
  const company = state.capitalMarkets.rivals.find((candidate) => candidate.id === companyId);
  const count = Math.floor(shares);
  if (!company || company.acquired) return rejected(state, 'COMPANY_NOT_AVAILABLE');
  if (!Number.isFinite(count) || count <= 0) return rejected(state, 'INVALID_AMOUNT');
  const cost = round2(count * company.sharePrice);
  if (cost > state.cash) return rejected(state, 'INSUFFICIENT_CASH');
  const existing = state.capitalMarkets.holdings.find((holding) => holding.companyId === companyId);
  const holdings = existing
    ? state.capitalMarkets.holdings.map((holding) => holding.companyId === companyId ? {
        ...holding,
        shares: holding.shares + count,
        averagePrice: round2((holding.shares * holding.averagePrice + cost) / (holding.shares + count)),
      } : holding)
    : [...state.capitalMarkets.holdings, { companyId, shares: count, averagePrice: company.sharePrice }];
  return {
    state: finalizeAction({
      ...state,
      cash: round2(state.cash - cost),
      capitalMarkets: { ...state.capitalMarkets, holdings },
    }),
    ok: true,
    reason: `SHARES_BOUGHT:${count}:${company.ticker}`,
  };
}

export function sellShares(state: GameState, companyId: string, shares: number): ActionResult {
  if (!requireCapitalMarkets(state)) return rejected(state, 'MODULE_LOCKED');
  const company = state.capitalMarkets.rivals.find((candidate) => candidate.id === companyId);
  const holding = state.capitalMarkets.holdings.find((candidate) => candidate.companyId === companyId);
  const count = Math.floor(shares);
  if (!company || !holding) return rejected(state, 'NO_SHARES_OWNED');
  if (!Number.isFinite(count) || count <= 0) return rejected(state, 'INVALID_AMOUNT');
  if (count > holding.shares) return rejected(state, 'NOT_ENOUGH_SHARES');
  const proceeds = round2(count * company.sharePrice);
  const holdings = state.capitalMarkets.holdings
    .map((item) => item.companyId === companyId ? { ...item, shares: item.shares - count } : item)
    .filter((item) => item.shares > 0);
  return {
    state: finalizeAction({
      ...state,
      cash: round2(state.cash + proceeds),
      capitalMarkets: { ...state.capitalMarkets, holdings },
    }),
    ok: true,
    reason: `SHARES_SOLD:${count}:${company.ticker}`,
  };
}

export function acquireRival(state: GameState, companyId: string, offeredPrice: number): ActionResult {
  if (!requireCapitalMarkets(state)) return rejected(state, 'MODULE_LOCKED');
  const company = state.capitalMarkets.rivals.find((candidate) => candidate.id === companyId);
  if (!company) return rejected(state, 'COMPANY_NOT_AVAILABLE');
  const evaluation = evaluateMergerAndAcquisition(company, offeredPrice);
  if (!evaluation.success) return rejected(state, evaluation.reason);
  if (offeredPrice > state.cash) return rejected(state, 'INSUFFICIENT_CASH');
  return {
    state: finalizeAction({
      ...state,
      cash: round2(state.cash - offeredPrice),
      brandReputation: clamp(state.brandReputation + 5, 0, 100),
      capitalMarkets: {
        ...state.capitalMarkets,
        holdings: state.capitalMarkets.holdings.filter((holding) => holding.companyId !== companyId),
        rivals: state.capitalMarkets.rivals.map((rival) => rival.id === companyId
          ? { ...rival, acquired: true, acquiredAtWeek: state.week }
          : rival),
      },
    }),
    ok: true,
    reason: `COMPANY_ACQUIRED:${company.name}`,
  };
}

export function investInStartup(state: GameState, startupId: string, amount: number): ActionResult {
  if (!requireCapitalMarkets(state)) return rejected(state, 'MODULE_LOCKED');
  const startup = state.capitalMarkets.startups.find((candidate) => candidate.id === startupId);
  if (!startup || startup.acquired || startup.status !== 'active') return rejected(state, 'STARTUP_NOT_AVAILABLE');
  if (!Number.isFinite(amount) || amount <= 0) return rejected(state, 'INVALID_AMOUNT');
  if (amount > state.cash) return rejected(state, 'INSUFFICIENT_CASH');
  return {
    state: finalizeAction({
      ...state,
      cash: round2(state.cash - amount),
      capitalMarkets: {
        ...state.capitalMarkets,
        startups: state.capitalMarkets.startups.map((item) => item.id === startupId ? {
          ...item,
          investedAmount: round2(item.investedAmount + amount),
          investedAtWeek: item.investedAmount > 0 ? item.investedAtWeek : state.week,
        } : item),
      },
    }),
    ok: true,
    reason: `STARTUP_FUNDED:${startup.name}`,
  };
}

export function acquireStartup(state: GameState, startupId: string): ActionResult {
  if (!requireCapitalMarkets(state)) return rejected(state, 'MODULE_LOCKED');
  const startup = state.capitalMarkets.startups.find((candidate) => candidate.id === startupId);
  if (!startup || startup.acquired) return rejected(state, 'STARTUP_NOT_AVAILABLE');
  if (startup.valuation > state.cash) return rejected(state, 'INSUFFICIENT_CASH');
  return {
    state: finalizeAction({
      ...state,
      cash: round2(state.cash - startup.valuation),
      brandReputation: clamp(state.brandReputation + 3, 0, 100),
      capitalMarkets: {
        ...state.capitalMarkets,
        startups: state.capitalMarkets.startups.map((item) => item.id === startupId
          ? { ...item, acquired: true, acquiredAtWeek: state.week }
          : item),
      },
    }),
    ok: true,
    reason: `STARTUP_ACQUIRED:${startup.name}`,
  };
}

export function beanPricePerKg(state: GameState, beanId: string): number {
  const bean = state.market.beanVarieties.find((candidate) => candidate.id === beanId);
  if (!bean) return 0;
  return round2(bean.basePricePerKg * (state.market.futuresPricePerKg / GAME_CONFIG.FUTURES_ANCHOR_PRICE) * GAME_CONFIG.GREEN_BEAN_MARKUP);
}

export function buyBeans(state: GameState, beanId: string, quantityKg: number): ActionResult {
  if (!state.roastery.owned) return rejected(state, 'ROASTERY_REQUIRED');
  const bean = state.market.beanVarieties.find((candidate) => candidate.id === beanId);
  const quantity = round2(quantityKg);
  if (!bean) return rejected(state, 'BEAN_NOT_FOUND');
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 10_000) return rejected(state, 'INVALID_AMOUNT');
  const pricePerKg = beanPricePerKg(state, beanId);
  const cost = round2(quantity * pricePerKg);
  if (cost > state.cash) return rejected(state, 'INSUFFICIENT_CASH');
  const existing = state.roastery.beanLots.find((lot) => lot.beanId === beanId);
  const beanLots = existing
    ? state.roastery.beanLots.map((lot) => lot.beanId === beanId ? {
        ...lot,
        quantityKg: round2(lot.quantityKg + quantity),
        averagePricePerKg: round2((lot.quantityKg * lot.averagePricePerKg + cost) / (lot.quantityKg + quantity)),
      } : lot)
    : [...state.roastery.beanLots, { beanId, quantityKg: quantity, averagePricePerKg: pricePerKg }];
  return {
    state: finalizeAction({
      ...state,
      cash: round2(state.cash - cost),
      roastery: {
        ...state.roastery,
        beanLots,
        rawBeanStockKg: round2(state.roastery.rawBeanStockKg + quantity),
      },
    }),
    ok: true,
    reason: `BEANS_BOUGHT:${quantity}:${bean.name}`,
  };
}

export function signB2BContract(
  state: GameState,
  partnerName: string,
  volumeKgPerWeek: number,
  weeks: number,
  pricePerKg: number,
): ActionResult {
  if (!state.unlockedModules.includes('b2b_trade')) return rejected(state, 'MODULE_LOCKED');
  if (!state.roastery.owned) return rejected(state, 'ROASTERY_REQUIRED');
  if (!partnerName.trim() || !Number.isFinite(volumeKgPerWeek) || volumeKgPerWeek <= 0 || volumeKgPerWeek > 1000) {
    return rejected(state, 'INVALID_CONTRACT');
  }
  if (!Number.isInteger(weeks) || weeks < 4 || weeks > 52 || !Number.isFinite(pricePerKg) || pricePerKg <= 0) {
    return rejected(state, 'INVALID_CONTRACT');
  }
  const contract: B2BContract = {
    id: `contract-${state.week}-${state.b2b.contracts.length + 1}`,
    partnerName: partnerName.trim(),
    volumeKgPerWeek: round2(volumeKgPerWeek),
    pricePerKg: round2(pricePerKg),
    weeksRemaining: weeks,
    reliability: 55 + (hashString(partnerName) % 41),
  };
  return {
    state: finalizeAction({ ...state, b2b: { ...state.b2b, contracts: [...state.b2b.contracts, contract] } }),
    ok: true,
    reason: `CONTRACT_SIGNED:${partnerName}`,
  };
}

export function applyEventChoice(state: GameState, choiceIndex: number): ActionResult {
  const event = state.pendingEvent;
  const choice = event?.choices[choiceIndex];
  if (!event || !choice) return rejected(state, 'NO_PENDING_EVENT');
  const futuresPricePerKg = round2(clamp(
    state.market.futuresPricePerKg * choice.beanPriceMultiplier,
    GAME_CONFIG.FUTURES_MIN_PRICE,
    GAME_CONFIG.FUTURES_MAX_PRICE,
  ));
  const priceHistory = [...state.market.priceHistory];
  if (priceHistory.length) priceHistory[priceHistory.length - 1] = futuresPricePerKg;
  const lastReport = state.lastReport
    ? { ...state.lastReport, notes: [...state.lastReport.notes, `EVENT_APPLIED:${event.title}`] }
    : null;
  return {
    state: finalizeAction({
      ...state,
      cash: capMoney(round2(state.cash + choice.cashImpact)),
      brandReputation: round2(clamp(state.brandReputation + choice.reputationImpact, 0, 100)),
      market: { ...state.market, futuresPricePerKg, priceHistory },
      pendingEvent: null,
      resolvedEventIds: [...state.resolvedEventIds, event.id].slice(-30),
      lastReport,
    }),
    ok: true,
    reason: `EVENT_RESOLVED:${event.title}`,
  };
}

// -----------------------------------------------------------
// Haupt-Loop
// -----------------------------------------------------------

export function processTurn(state: GameState): GameState {
  if (state.week >= GAME_CONFIG.MAX_WEEK || state.pendingEvent) return state;

  const week = state.week + 1;
  const dateIso = dateForWeek(week);
  const rngTurn = mulberry32(hashSeed(week * 31));
  const notes: string[] = [];
  const isModule = (m: ModuleId) => state.unlockedModules.includes(m);

  // 1) Kaffeebörse
  const futuresPricePerKg = simulateCoffeeFutures(
    state.market.futuresPricePerKg,
    state.market.volatility,
    week,
  );
  const priceHistory = [...state.market.priceHistory, futuresPricePerKg].slice(
    -GAME_CONFIG.PRICE_HISTORY_MAX,
  );
  const market: CoffeeMarket = { ...state.market, futuresPricePerKg, priceHistory };

  // 2) Rösterei (vor Verkauf, damit frisch Geröstetes zählt).
  // Der Rohbohnen-Einkauf wird nur über costBeans verbucht (nicht doppelt über cash).
  let cash = state.cash;
  let costBeans = 0;
  let roastery = state.roastery;
  const ownRoasteryActive = isModule('roastery') && roastery.owned;
  if (ownRoasteryActive) {
    const r = processRoastery(roastery, market, cash);
    roastery = r.roastery;
    costBeans += r.autoBuyCost;
  }

  // 3) Filialen
  let revenueCafes = 0;
  let costSalaries = 0;
  let costRent = 0;
  let roastedPool = roastery.roastedStockKg;
  const externalPrice = externalRoastedPricePerKg(futuresPricePerKg);
  const districtById = new Map(state.cities.flatMap((city) => city.districts.map((d) => [d.id, d] as const)));
  const stores = state.stores.map((store) => {
    const district = districtById.get(store.districtId);
    const storeCity = state.cities.find((city) => city.id === store.cityId);
    if (!district || !storeCity) {
      notes.push(`ORPHAN_STORE:${store.name}`);
      costSalaries += store.employees.reduce((sum, e) => sum + Math.max(0, e.salaryWeekly), 0);
      return store;
    }
    const { store: updated, result } = processStore(
      store,
      district,
      storeCity,
      ownRoasteryActive ? roastedPool : null,
    );
    if (ownRoasteryActive) {
      roastedPool = round2(Math.max(0, roastedPool - result.beansConsumedKg));
    } else {
      costBeans += round2(result.beansConsumedKg * externalPrice);
    }
    revenueCafes += result.revenue;
    costSalaries += result.salaries;
    costRent += result.rent;
    if (result.stockLimited) {
      notes.push(`NO_STOCK:${store.name}`);
    }
    return updated;
  });
  if (ownRoasteryActive) {
    roastery = { ...roastery, roastedStockKg: Math.max(0, roastedPool) };
  } else if (stores.length > 0) {
    notes.push('EXTERNAL_SUPPLY_ONLY');
  }

  // Rösterei-Personalkosten
  costSalaries += roastery.employees.reduce((sum, e) => sum + Math.max(0, e.salaryWeekly), 0);

  // 4) B2B-Handel
  let revenueB2B = 0;
  let b2b = state.b2b;
  if (isModule('b2b_trade')) {
    const b = processB2B(b2b, roastery.roastedStockKg, rngTurn);
    b2b = b.b2b;
    revenueB2B = b.revenue;
    roastery = {
      ...roastery,
      roastedStockKg: Math.max(0, round2(roastery.roastedStockKg - b.roastedUsedKg)),
    };
    notes.push(...b.notes);
  }

  // 5) Zinsen (linear auf Restschuld, kein Zinseszins)
  const interestRate = clamp(state.weeklyInterestRate, 0, GAME_CONFIG.MAX_WEEKLY_INTEREST);
  const costInterest = round2(Math.max(0, state.debt) * interestRate);

  // 6) Kapitalmarkt
  let capitalMarkets = state.capitalMarkets;
  let revenueCapital = 0;
  let taxableCapitalGain = 0;
  let costLuxuryUpkeep = 0;
  if (isModule('capital_markets')) {
    const operatingSoFar =
      revenueCafes + revenueB2B - costSalaries - costRent - costBeans - costInterest;
    const c = processCapitalMarkets(
      capitalMarkets,
      operatingSoFar,
      week,
      calculateAssetValuation(state),
    );
    capitalMarkets = c.capitalMarkets;
    revenueCapital = c.cashDelta;
    taxableCapitalGain = c.taxableGain;
    costLuxuryUpkeep = c.upkeep;
    notes.push(...c.notes);
  }

  // 7) Steuern auf positives Ergebnis (bei Startup-Exits nur auf den Gewinn)
  revenueCafes = round2(revenueCafes);
  costSalaries = round2(costSalaries);
  costRent = round2(costRent);
  costBeans = round2(costBeans);
  const revenueTotal = round2(revenueCafes + revenueB2B + revenueCapital);
  const preTax = round2(
    revenueCafes +
      revenueB2B +
      taxableCapitalGain -
      costSalaries -
      costRent -
      costBeans -
      costInterest -
      costLuxuryUpkeep,
  );
  const costTax = preTax > 0 ? round2(preTax * GAME_CONFIG.TAX_RATE) : 0;

  const costTotal = round2(
    costSalaries + costRent + costBeans + costInterest + costLuxuryUpkeep + costTax,
  );
  const netIncome = round2(revenueTotal - costTotal);
  cash = capMoney(round2(cash + netIncome));

  // 8) Markenreputation (Qualität + Luxus-Prestige)
  const avgQuality = average(stores.map((s) => s.qualityIndex));
  const prestige = capitalMarkets.luxuryGoods
    .filter((l) => l.owned)
    .reduce((sum, l) => sum + l.prestigeBonus, 0);
  const targetReputation = clamp(avgQuality * 0.8 + Math.min(20, prestige * 0.5), 0, 100);
  const brandReputation = round2(
    clamp(state.brandReputation + (targetReputation - state.brandReputation) * 0.05, 0, 100),
  );

  // 9) Bewertung, Ära, Freischaltungen
  const interim: GameState = {
    ...state,
    week,
    dateIso,
    cash,
    brandReputation,
    stores,
    roastery,
    market,
    b2b,
    capitalMarkets,
  };
  const companyValuation = calculateCompanyValuation(interim);
  const era = resolveEra(companyValuation);
  const unlockedModules = resolveUnlocks(state, companyValuation);
  const newUnlocks = unlockedModules.filter((m) => !state.unlockedModules.includes(m));

  if (cash < GAME_CONFIG.BANKRUPTCY_FLOOR) notes.push('BANKRUPTCY_WARNING');

  const lastReport: TurnReport = {
    week,
    revenueCafes,
    revenueB2B,
    revenueCapital,
    revenueTotal,
    costSalaries,
    costRent,
    costBeans,
    costInterest,
    costLuxuryUpkeep,
    costTax,
    costTotal,
    netIncome,
    companyValuation,
    newUnlocks,
    notes,
  };

  const eraLevel = { street_vendor: 1, local_chain: 2, national_brand: 3, global_empire: 4 }[era];
  const recentEvents = state.resolvedEventIds.slice(-15);
  const eraEvents = state.eventDeck.filter((event) => event.eraRequirement <= eraLevel);
  const freshEvents = eraEvents.filter((event) => !recentEvents.includes(event.id));
  const availableEvents = freshEvents.length > 0 ? freshEvents : eraEvents;
  const eventRng = mulberry32(hashSeed(week * 1741 + 97));
  const pendingEvent = availableEvents.length
    ? availableEvents[Math.floor(eventRng() * availableEvents.length)]!
    : null;

  return {
    schemaVersion: GAME_CONFIG.SCHEMA_VERSION,
    week,
    dateIso,
    cash,
    debt: state.debt,
    weeklyInterestRate: state.weeklyInterestRate,
    companyValuation,
    brandReputation,
    era,
    unlockedModules,
    city: state.city,
    cities: state.cities,
    stores,
    roastery,
    market,
    b2b,
    capitalMarkets,
    eventDeck: state.eventDeck,
    pendingEvent,
    resolvedEventIds: state.resolvedEventIds,
    lastReport,
  };
}
