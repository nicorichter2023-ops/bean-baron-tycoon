import type { GameState, TurnReport } from './types';
import { GAME_CONFIG, calculateCompanyValuation, hireEmployee, processTurn } from './engine';
import { applyExpansionWeek, type ExpansionState, cupsSold, recipeCost, CAMPAIGNS } from './expansion';
import { equipmentOf } from './equipment';
import { MASTER } from '@/data/master';
import { advanceWorld, applyWorldSupply, worldWeeklyFlows } from './world';

export type ExecutiveRole = 'coo' | 'cfo';
export const EXECUTIVES = {
  coo: { name: 'Clara Hoffmann', title: 'Chief Operating Officer', fee: 12000, salary: 1800 },
  cfo: { name: 'David Weber', title: 'Chief Financial Officer', fee: 10000, salary: 1500 },
} as const;
export interface Executive { role: ExecutiveRole; hiredWeek: number; }
export interface CashJournal { operating: number; investing: number; financing: number; }
export interface AccountingWeek {
  week: number; cups: number; b2b: number; other: number; ingredients: number;
  salaries: number; rent: number; beans: number; interest: number; upkeep: number; tax: number;
  oneOff: number; inventoryChange: number; profit: number; cashStart: number; cashEnd: number;
  operating: number; investing: number; financing: number; cooHires: number; interestSaved: number;
}
export interface ManagementState {
  executives: Executive[]; delegation: boolean; openingCash: number; openingInventory: number; journal: CashJournal;
  oneOff: number; beanPurchases: number; history: AccountingWeek[];
}
const money = (n: number) => Math.round(n * 100) / 100;
export const createManagement = (cash: number, inventory = 0): ManagementState => ({ executives: [], delegation: false, openingCash: cash, openingInventory: inventory, journal: { operating: 0, investing: 0, financing: 0 }, oneOff: 0, beanPurchases: 0, history: [] });
export const hasExecutive = (g: GameState, role: ExecutiveRole) => (g.management?.executives.some(e => e.role === role) ?? false) || (g.world?.candidates.some(id => MASTER.cSuiteCandidates.find(c => c.id === id)?.role.toLowerCase() === role) ?? false);
export const effectiveInterestRate = (g: GameState) => Math.max(0, Math.min(GAME_CONFIG.MAX_WEEKLY_INTEREST, Math.max(0, g.weeklyInterestRate)) * (g.management.executives.some(e => e.role === 'cfo') ? 0.8 : 1) - g.world.candidates.reduce((n, id) => n + ((MASTER.cSuiteCandidates.find(c => c.id === id)?.perks as Record<string, number> | undefined)?.['loanInterestDiscount'] ?? 0) / 52, 0));
export function hireExecutive(game: GameState, role: ExecutiveRole) {
  if (hasExecutive(game, role)) return 'Diese Position ist bereits besetzt.';
  const candidate = EXECUTIVES[role];
  if (game.cash < candidate.fee) return 'Nicht genug Barvermögen für die Einstellung.';
  return { ...game, cash: money(game.cash - candidate.fee), management: { ...(game.management ?? createManagement(game.cash)), executives: [...(game.management?.executives ?? []), { role, hiredWeek: game.week }] } };
}
export function releaseExecutive(game: GameState, role: ExecutiveRole): GameState {
  return { ...game, world: { ...game.world, candidates: game.world.candidates.filter(id => MASTER.cSuiteCandidates.find(c => c.id === id)?.role.toLowerCase() !== role) }, management: { ...(game.management ?? createManagement(game.cash)), executives: (game.management?.executives ?? []).filter(e => e.role !== role), delegation: role === 'coo' ? false : game.management?.delegation ?? false } };
}
export function balanceSheet(game: GameState) {
  const equipment = game.stores.reduce((n, s) => n + equipmentOf(s).bookValue, 0);
  const stores = game.stores.reduce((n, s) => n + GAME_CONFIG.TIER_BASE_VALUE[s.tier] * (0.5 + s.qualityIndex / 100) + (s.propertyBookValue ?? 0), 0) + equipment;
  const inventory = game.roastery.rawBeanStockKg * game.market.futuresPricePerKg + game.roastery.roastedStockKg * game.market.futuresPricePerKg * GAME_CONFIG.ROASTED_VALUE_MULTIPLIER;
  const roastery = game.roastery.owned ? GAME_CONFIG.ROASTERY_COST * 0.9 : 0;
  const investments = (game.world?.assets.reduce((n, a) => n + a.bookValue, 0) ?? 0) + game.capitalMarkets.holdings.reduce((n, h) => n + h.shares * (game.capitalMarkets.rivals.find(r => r.id === h.companyId)?.sharePrice ?? 0), 0)
    + game.capitalMarkets.startups.reduce((n, s) => n + (s.acquired ? s.valuation * 0.8 : s.status === 'active' ? s.investedAmount : 0), 0)
    + game.capitalMarkets.rivals.filter(r => r.acquired).reduce((n, r) => n + r.valuation * 0.8, 0);
  const luxury = game.capitalMarkets.luxuryGoods.filter(l => l.owned).reduce((n, l) => n + l.purchaseCost, 0);
  const assets = money(game.cash + stores + inventory + roastery + investments + luxury);
  return { cash: game.cash, stores: money(stores), equipment, inventory: money(inventory), roastery, investments: money(investments), luxury, assets, debt: game.debt, equity: money(assets - game.debt) };
}
/** Every successful action is journalled once, using the actual cash movement. */
export function recordManagementAction(before: GameState, after: GameState): GameState {
  if (after.week < before.week) return after;
  const delta = money(after.cash - before.cash);
  const m = after.management ?? createManagement(before.cash);
  if (!delta) return { ...after, management: m };
  const debtDelta = money(after.debt - before.debt);
  const investment = before.stores.length !== after.stores.length || before.stores.some((s, i) => s.tier !== after.stores[i]?.tier || equipmentOf(s).bookValue !== (after.stores[i] ? equipmentOf(after.stores[i]).bookValue : 0))
    || before.roastery.owned !== after.roastery.owned || JSON.stringify(before.capitalMarkets) !== JSON.stringify(after.capitalMarkets)
    || (before.world?.assets.reduce((n, a) => n + a.bookValue, 0) ?? 0) !== (after.world?.assets.reduce((n, a) => n + a.bookValue, 0) ?? 0);
  const inventoryPurchase = after.roastery.rawBeanStockKg > before.roastery.rawBeanStockKg;
  const category = debtDelta ? 'financing' : investment ? 'investing' : 'operating';
  return { ...after, management: { ...m, journal: { ...m.journal, [category]: money(m.journal[category] + delta) }, beanPurchases: money(m.beanPurchases + (inventoryPurchase ? -delta : 0)), oneOff: money(m.oneOff + (category === 'operating' && !inventoryPurchase ? -delta : 0)) } };
}

export function processManagementWeek(state: GameState, exp: ExpansionState) {
  if (state.pendingEvent || state.week >= GAME_CONFIG.MAX_WEEK) return { game: state, exp };
  const m = state.management ?? createManagement(state.cash);
  let prepared = state;
  let cooHires = 0;
  if (hasExecutive(state, 'coo') && m.delegation) {
    for (const store of state.stores) {
      const needed = Math.max(0, GAME_CONFIG.TIER_REQUIRED_STAFF[store.tier] - store.employees.length);
      for (let i = 0; i < needed; i++) {
        const result = hireEmployee(prepared, store.id, 'barista');
        if (!result.ok) break;
        prepared = result.state; cooHires++;
      }
    }
    if (prepared.roastery.owned) prepared = { ...prepared, roastery: { ...prepared.roastery, autoRestock: true } };
  }
  const recruitment = money(state.cash - prepared.cash);
  const baseRate = prepared.weeklyInterestRate;
  const turned = applyWorldSupply(advanceWorld(processTurn({ ...prepared, weeklyInterestRate: effectiveInterestRate(prepared) })));
  const r = turned.lastReport;
  if (!r) return { game: state, exp };
  const salary = m.executives.reduce((n, e) => n + EXECUTIVES[e.role].salary, 0);
  const flows = worldWeeklyFlows(turned);
  const expansion = applyExpansionWeek(turned, exp);
  let recipeRevenue = 0, ingredients = 0;
  for (const store of turned.stores) {
    const boost = exp.campaigns.filter(c => c.cityId === store.cityId).reduce((n, c) => n + CAMPAIGNS[c.kind].boost, 0);
    for (const recipe of exp.recipes) {
      const cups = cupsSold(recipe, store, turned.cities.find(c => c.id === store.cityId)?.biome ?? '', boost);
      recipeRevenue += cups * recipe.price; ingredients += cups * recipeCost(recipe);
    }
  }
  // Preserve existing rounded laboratory payout, but expose gross sales and ingredient costs separately.
  const other = money(r.revenueCapital + expansion.exp.lastBonus + ingredients - recipeRevenue + flows.income);
  const taxableBonus = expansion.exp.lastBonus - salary + flows.income - flows.upkeep - flows.salaries;
  const basePreTax = r.costTax > 0 ? r.costTax / GAME_CONFIG.TAX_RATE : r.revenueCafes + r.revenueB2B - r.costSalaries - r.costRent - r.costBeans - r.costInterest - r.costLuxuryUpkeep;
  const taxDiscount = state.world.candidates.reduce((n, id) => n + ((MASTER.cSuiteCandidates.find(c => c.id === id)?.perks as Record<string, number> | undefined)?.['taxRateDiscount'] ?? 0), 0);
  const tax = money(Math.max(0, basePreTax + taxableBonus) * Math.max(0, GAME_CONFIG.TAX_RATE - taxDiscount));
  const gameCash = money(expansion.game.cash - salary + flows.income - flows.upkeep - flows.salaries - (tax - r.costTax));
  const inventoryChange = money(balanceSheet(turned).inventory - m.openingInventory);
  const cashOperating = money(m.journal.operating + gameCash - state.cash);
  const row: AccountingWeek = {
    week: turned.week, cups: money(r.revenueCafes + recipeRevenue), b2b: r.revenueB2B, other,
    ingredients: money(ingredients), salaries: r.costSalaries + salary + flows.salaries, rent: r.costRent, beans: money(r.costBeans + m.beanPurchases),
    interest: r.costInterest, upkeep: r.costLuxuryUpkeep + flows.upkeep, tax, oneOff: money(m.oneOff + recruitment), inventoryChange,
    profit: money(r.revenueTotal + taxableBonus - r.costTotal - (tax - r.costTax) - m.oneOff - recruitment - m.beanPurchases + inventoryChange),
    cashStart: m.openingCash, cashEnd: gameCash, operating: cashOperating, investing: m.journal.investing, financing: m.journal.financing,
    cooHires, interestSaved: money(state.debt * Math.min(GAME_CONFIG.MAX_WEEKLY_INTEREST, Math.max(0, baseRate)) - r.costInterest),
  };
  const report: TurnReport = { ...r, revenueCafes: row.cups, revenueCapital: other, revenueTotal: money(row.cups + row.b2b + other), costSalaries: row.salaries,
    costBeans: money(row.beans + row.ingredients), costTax: tax, costTotal: money(row.cups + row.b2b + row.other - row.profit),
    costLuxuryUpkeep: row.upkeep, netIncome: row.profit, notes: [...r.notes, ...turned.world.news, ...(cooHires ? [`COO: ${cooHires} Baristas eingestellt.`] : []), ...(salary + flows.salaries ? [`HQ-Gehälter: ${salary + flows.salaries} €.`] : [])] };
  const game: GameState = { ...expansion.game, cash: gameCash, weeklyInterestRate: baseRate, lastReport: report,
    management: { ...m, openingCash: gameCash, openingInventory: balanceSheet(turned).inventory, journal: { operating: 0, investing: 0, financing: 0 }, oneOff: 0, beanPurchases: 0, history: [...m.history, row].slice(-104) } };
  game.companyValuation = calculateCompanyValuation(game);
  game.lastReport = { ...report, companyValuation: game.companyValuation };
  return { game, exp: expansion.exp };
}
export function financialForecast(game: GameState) {
  const last = game.management?.history.at(-1);
  const weekly = last ? last.operating - (last.oneOff ? -last.oneOff : 0) : -(game.management?.executives.reduce((n, e) => n + EXECUTIVES[e.role].salary, 0) ?? 0);
  return { weekly: money(weekly), cashInFourWeeks: money(game.cash + weekly * 4), interest: money(game.debt * effectiveInterestRate(game)) };
}