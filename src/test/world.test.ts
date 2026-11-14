import { describe, expect, it } from 'vitest';
import { createInitialState } from '@/data';
import { MASTER, MASTER_CITIES } from '@/data/master';
import { advanceWorld, catalogAction, locationEffects, travelToCity, worldEffects, worldWeeklyFlows, applyWorldSupply } from '@/engine/world';
import { openStore, processTurn, storeOpeningCost } from '@/engine/engine';
import { balanceSheet, hasExecutive, recordManagementAction, processManagementWeek } from '@/engine/management';
import { createExpansion } from '@/engine/expansion';
import { loadGame, migrateV4ToV5, saveGame } from '@/engine/save';

describe('Masterdaten und internationale Standorte', () => {
  it('bindet exakt 20 Städte mit jeweils 30 Gebäuden und alle Datenkategorien ein', () => {
    expect(MASTER_CITIES).toHaveLength(20); expect(MASTER_CITIES.every(c => c.districts.length === 30)).toBe(true);
    expect(MASTER_CITIES.flatMap(c => c.districts)).toHaveLength(600);
    expect([MASTER.airports.length, MASTER.competitors.length, MASTER.techTree.length, MASTER.cSuiteCandidates.length, MASTER.startups.length, MASTER.plantations.length]).toEqual([20,4,16,50,20,14]);
  });
  it('Economy nach Paris kostet 420 Euro und wird dauerhaft gespeichert', () => {
    const g = createInitialState(), result = travelToCity(g, 'paris', 'economy');
    expect(result.ok).toBe(true); expect(result.state.cash).toBe(49580); expect(result.state.city.id).toBe('paris');
    saveGame(result.state); expect(loadGame().world.travelHistory[0]?.cost).toBe(420);
    expect(travelToCity({ ...g, cash:419 }, 'paris', 'economy').ok).toBe(false);
  });
  it('Business nach Paris kostet die gelieferten 1550 Euro', () => {
    expect(travelToCity(createInitialState(), 'paris', 'business').state.cash).toBe(48450);
  });
  it('Konkurrenz belegt gelieferte Standorte und verhindert Doppeleröffnung', () => {
    const g=createInitialState(); expect(g.world.occupants['paris-02']).toBe('aromalux');
    expect(openStore(g,'paris','paris-02',1).ok).toBe(false);
  });
  it('Paris-01 hat 12200 Wochenmiete und 7550000 Immobilienpreis', () => {
    const g={...createInitialState(),cash:10000000}, d=MASTER_CITIES.find(c=>c.id==='paris')?.districts[0]; if(!d) throw Error('Standort fehlt');
    expect(storeOpeningCost(d,1)).toBe(36400);
    const next=openStore(g,'paris','paris-01',1,true).state; expect(next.cash).toBe(2438000); expect(next.stores.at(-1)?.propertyBookValue).toBe(7550000);
    expect(balanceSheet(next).stores-balanceSheet(g).stores).toBe(7588000);
  });
  it('Volumen und Takeaway-Boni wirken auf Nachfrage und Kapazität', () => {
    const g=createInitialState(); expect(locationEffects(g,'paris-05').capacity).toBe(1.35);
    expect(locationEffects(g,'paris-03').demand).toBeGreaterThan(locationEffects(g,'paris-01').demand);
  });
  it('Forschung kostet 25000, dauert sechs Wochen und benötigt Voraussetzungen', () => {
    const g=createInitialState(), r=catalogAction(g,'research','tech_digital_t1'); expect(r.state.cash).toBe(25000);
    expect(r.state.world.research).toEqual([{id:'tech_digital_t1',finishWeek:7}]);
    expect(catalogAction(g,'research','tech_digital_t2').ok).toBe(false);
    expect(advanceWorld({...r.state,week:6}).world.technologies).toEqual([]);
    const done=advanceWorld({...r.state,week:7}); expect(done.world.technologies).toContain('tech_digital_t1'); expect(worldEffects(done).capacity).toBe(1.1);
    expect(catalogAction(done,'research','tech_digital_t1').ok).toBe(false);
  });
  it('Master-COO kostet 3500 und 1450 pro Woche und zählt als COO', () => {
    const g=createInitialState(),r=catalogAction(g,'candidate','cand_coo_01'); expect(r.state.cash).toBe(46500); expect(hasExecutive(r.state,'coo')).toBe(true);
    expect(worldWeeklyFlows(r.state).salaries).toBe(1450); expect(catalogAction(r.state,'candidate','cand_coo_02').ok).toBe(false);
  });
  it('Plantage kapitalisiert 480000 Euro und liefert 17000 kg nach 26 Wochen', () => {
    const g={...createInitialState(),cash:1000000},r=catalogAction(g,'plantation','farm_colombia_huila'); expect(r.state.cash).toBe(520000);
    expect(balanceSheet(r.state).investments).toBe(480000); expect(worldWeeklyFlows({...r.state,week:27})).toMatchObject({harvest:17000,upkeep:3200});
    expect(applyWorldSupply({...r.state,week:27}).roastery.rawBeanStockKg).toBe(17000);
  });
  it('Preisabsicherung kostet 12000 und verbraucht nur die tatsächlich geschützte Menge', () => {
    const r=catalogAction(createInitialState(),'future','future_arabica_santos_6m'); expect(r.state.cash).toBe(38000);
    const next=applyWorldSupply(processTurn(r.state)); expect(next.world.assets[0]?.remainingKg).toBeLessThan(20000); expect(next.lastReport?.costBeans).toBeLessThan(processTurn(r.state).lastReport?.costBeans ?? 0);
  });
  it('Konkurrenz expandiert über echte Wochen und lässt eigene Standorte unangetastet', () => {
    const g=createInitialState(); let next=g;
    for(let week=2;week<=20;week++) next=advanceWorld({...next,week});
    expect(Object.keys(next.world.occupants).length).toBeGreaterThan(Object.keys(g.world.occupants).length);
    expect(next.world.occupants['berlin-09']).toBeUndefined(); expect(g.world.news).toEqual([]);
  });
  it('Alte Filialen, Bargeld und Geräte bleiben bei Migration erhalten', () => {
    const g=createInitialState(),legacy={...g,schemaVersion:4 as const,stores:g.stores.map(s=>({...s,districtId:'berlin-kreuzberg'})),cities:g.cities.map(c=>c.id==='berlin'?{...c,districts:[...c.districts,{id:'berlin-kreuzberg',name:'Kreuzberg',footTraffic:70,rentWeekly:550,competition:40,maxStoreTier:3 as const}]}:c)};
    const next=migrateV4ToV5(legacy); expect(next.cash).toBe(50000); expect(next.stores).toEqual(legacy.stores); expect(next.city.districts.some(d=>d.id==='berlin-kreuzberg')).toBe(true);
  });
  it('Neue Vertragskosten, Gehälter und Einnahmen stimmen mit Cashflow und GuV überein', () => {
    const g=createInitialState(),next=recordManagementAction(g,catalogAction(g,'candidate','cand_coo_01').state);
    const end=processManagementWeek(next,createExpansion()).game,r=end.management.history.at(-1); if(!r) throw Error('Bericht fehlt');
    expect(r.salaries).toBe(2000); expect(r.cashStart+r.operating+r.investing+r.financing).toBeCloseTo(r.cashEnd,2);
    expect(r.cups+r.b2b+r.other-r.ingredients-r.salaries-r.rent-r.beans-r.interest-r.upkeep-r.tax-r.oneOff+r.inventoryChange).toBeCloseTo(r.profit,2);
  });
});