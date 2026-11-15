import { describe, expect, it } from 'vitest';
import { createInitialState } from '@/data';
import { MASTER } from '@/data/master';
import { NEIGHBOR_RULES, neighborSlots, neighborhoodEffects, orderedCityBuildings } from '@/engine/neighborhood';
import { catalogAction, campaignMultiplier, researchDuration, worldEffects } from '@/engine/world';
import { createExpansion, weekBonus } from '@/engine/expansion';
import { processTurn } from '@/engine/engine';
import { CITY_GEOGRAPHY } from '@/data/cityGeography';

describe('Drei Nachbarschaftsslots', () => {
  it('gewichtet links, rechts und gegenüber exakt mit 100/50/25 Prozent', () => {
    const b = orderedCityBuildings('berlin')[7]; if (!b) throw Error('Standort fehlt');
    expect(neighborSlots(b.id).map(s=>s.weight)).toEqual([1,.5,.25]);
    expect(neighborSlots(b.id).map(s=>s.building?.id)).toEqual([orderedCityBuildings('berlin')[6]?.id,orderedCityBuildings('berlin')[8]?.id,orderedCityBuildings('berlin')[2]?.id]);
  });
  it('verbindet Randgrundstücke nicht mit dem Ende der vorigen Zeile',()=>{
    const b=orderedCityBuildings('berlin')[5]; if(!b) throw Error('Standort fehlt');
    expect(neighborSlots(b.id)[0]?.building).toBeUndefined();
  });
  it('begrenzt Boni auf 30% Volumen, 15% Marge, 25% Takeaway und 10 Prestige',()=>{
    expect([NEIGHBOR_RULES.volumeCap,NEIGHBOR_RULES.marginCap,NEIGHBOR_RULES.takeawayCap,NEIGHBOR_RULES.prestigeCap]).toEqual([.3,.15,.25,10]);
    const g=createInitialState();
    for(const city of MASTER.cities) for(const b of city.buildings){ const n=neighborhoodEffects(g,b.id); expect(n.volume).toBeLessThanOrEqual(.3);expect(n.margin).toBeLessThanOrEqual(.15);expect(n.takeaway).toBeLessThanOrEqual(.25);expect(n.prestige).toBeLessThanOrEqual(10); }
  });
  it('begrenzt Rivalenabfluss auf 25%, Kundengewinn auf 15% und Nachfrage auf mindestens 75%',()=>{
    expect([NEIGHBOR_RULES.lossCap,NEIGHBOR_RULES.gainCap,NEIGHBOR_RULES.demandFloor]).toEqual([.25,.15,.75]);
    const g=createInitialState(),b=orderedCityBuildings('berlin')[7];if(!b)throw Error('Standort fehlt');
    const slots=neighborSlots(b.id);const game={...g,stores:g.stores.map(s=>({...s,districtId:b.id,qualityIndex:100})),world:{...g.world,occupants:Object.fromEntries(slots.flatMap(s=>s.building?[[s.building.id,'beanstar']]:[]))}};
    const n=neighborhoodEffects(game,b.id);expect(n.loss).toBeCloseTo(.21);expect(n.gain).toBeLessThanOrEqual(.15);expect(n.demand).toBeGreaterThanOrEqual(.75);
    const acquired={...game,capitalMarkets:{...game.capitalMarkets,rivals:game.capitalMarkets.rivals.map(r=>r.id==='beanstar'?{...r,acquired:true}:r)}};
    expect(neighborhoodEffects(acquired,b.id).loss).toBe(0);
  });
  it('Rivalennachbarn verändern tatsächlich den wöchentlichen Filialumsatz',()=>{
    const g=createInitialState(),s=g.stores[0];if(!s)throw Error('Filiale fehlt');
    const slots=neighborSlots(s.districtId);
    const clear={...g,stores:g.stores.map(s=>({...s,pricePerCup:12})),world:{...g.world,occupants:{}}};
    const rival={...clear,world:{...clear.world,occupants:Object.fromEntries(slots.flatMap(s=>s.building?[[s.building.id,'beanstar']]:[]))}};
    expect(processTurn(rival).stores[0]?.weeklyRevenue).toBeLessThan(processTurn(clear).stores[0]?.weeklyRevenue ?? 0);
  });
});
describe('CMO, CTO und Forschung',()=>{
  it('CMO verstärkt echte Kampagnen um 12% statt pauschal alle Nachfrage',()=>{
    const g=createInitialState(),cmo=catalogAction(g,'candidate','cand_cmo_01').state;
    expect(campaignMultiplier(cmo)).toBe(1.12);
    const exp={...createExpansion(),campaigns:[{id:'test',kind:'social' as const,cityId:'berlin',weeksLeft:2}]};
    const stores=g.stores.map(s=>({...s,weeklyRevenue:10000}));
    expect(weekBonus({...cmo,stores},exp).profit).toBe(840);
    expect(weekBonus({...g,stores},exp).profit).toBe(750);
    expect(worldEffects(cmo).demand).toBe(1);
  });
  it('CTO mit 48 Punkten verkürzt sechs Forschungswochen auf fünf und spart 5% Kosten',()=>{
    const g=catalogAction(createInitialState(),'candidate','cand_cto_01').state;
    expect(researchDuration(g,6)).toBe(5);
    const r=catalogAction(g,'research','tech_digital_t1');
    expect(r.state.cash).toBe(g.cash-23750);expect(r.state.world.research[0]?.finishWeek).toBe(6);
  });
  it('alle 16 Tech-Knoten besitzen wirksamen Durchsatz und Zufriedenheitswerte',()=>{
    const g=createInitialState();expect(MASTER.techTree).toHaveLength(16);
    for(const t of MASTER.techTree){const e=worldEffects({...g,world:{...g.world,technologies:[t.id]}});expect(e.capacity).toBe(t.effects.throughputMultiplier);expect(e.quality).toBe(t.effects.customerSatisfactionBonus/4);expect(e.beanFactor).toBe(1-t.effects.beanLossReduction);}
  });
  it('20 Städte haben eigene geografische Kennzeichnungen',()=>{
    expect(Object.keys(CITY_GEOGRAPHY)).toHaveLength(20);for(const c of MASTER.cities)expect(CITY_GEOGRAPHY[c.cityId]?.water).toBeTruthy();
    expect(CITY_GEOGRAPHY['london']?.water).toBe('Themse');expect(CITY_GEOGRAPHY['paris']?.water).toBe('Seine');expect(CITY_GEOGRAPHY['amsterdam']?.kind).toBe('canals');expect(CITY_GEOGRAPHY['tokio']?.water).toBe('Tokyo Bay');expect(CITY_GEOGRAPHY['sydney']?.water).toBe('Sydney Harbour');
  });
});