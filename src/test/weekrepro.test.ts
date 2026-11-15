import { it } from 'vitest';
import { createInitialState } from '@/data';
import { createExpansion } from '@/engine/expansion';
import * as E from '@/engine/empire';
import * as C from '@/engine/cafe';
import * as P from '@/engine/progression';
it('repro', () => {
  let g = { ...createInitialState(), cash: 5e7 }; const s = g.stores[0]!;
  g = C.upgradeGear(g, s.id, 'espresso').state;
  const pk = Object.keys(P).filter(k=>/lever|set|upgrade/i.test(k)); console.log(pk);
  console.log('before', JSON.stringify(C.storeCafe(g, g.stores[0]!).gear), JSON.stringify(g.stores[0]!.equipment), JSON.stringify(g.progress?.stores[s.id]));
  const exp = createExpansion(g as any);
  const r = E.processEmpireWeek(g, exp as any); g = (r as any).state ?? r;
  console.log('after', JSON.stringify(C.storeCafe(g, g.stores[0]!).gear), JSON.stringify(g.stores[0]!.equipment), JSON.stringify(g.progress?.stores[s.id]), Object.keys(g.cafe?.stores??{}));
});
