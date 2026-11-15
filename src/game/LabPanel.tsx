import { useState } from 'react';
import { FlaskConical, Megaphone, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { eur, useGame } from './GameContext';
import { BASES, BIOME_TASTE, CAMPAIGNS, EXTRAS, MAX_RECIPES, MILKS, addRecipe, cupsSold, fairPrice, recipeCost, recipeQuality, startCampaign, type Base, type CampaignKind, type Extra, type Milk } from '@/engine/expansion';

const sel = 'h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground';
const BIOME_LABEL: Record<string, string> = { european_classic: 'Europäisch', modern_industrial: 'Modern-Industriell', east_asian: 'Ostasiatisch', tropical: 'Tropisch' };

export function LabPanel() {
  const { state, exp, setBoth } = useGame();
  const [name, setName] = useState('');
  const [base, setBase] = useState<Base>('espresso');
  const [milk, setMilk] = useState<Milk>('oat');
  const [extra, setExtra] = useState<Extra>('none');
  const draft = { base, milk, extra };
  const [price, setPrice] = useState(fairPrice(draft));
  const cost = recipeCost(draft);
  const cities = [...new Set(state.stores.map((s) => s.cityId))].map((id) => state.cities.find((c) => c.id === id)).filter(Boolean) as typeof state.cities;
  const [cityId, setCityId] = useState(cities[0]?.id ?? '');
  const sample = state.stores[0];
  const sampleBiome = state.cities.find((c) => c.id === sample?.cityId)?.biome ?? '';
  const est = sample ? cupsSold({ ...draft, id: '', name, price, createdWeek: 0 }, sample, sampleBiome, 0) : 0;

  return <div className="lab-panel space-y-5">
    <section className="lab-card">
      <h2 className="flex items-center gap-2"><FlaskConical className="h-4 w-4 text-primary" /> Rezeptur-Labor</h2>
      <p className="text-xs text-muted-foreground">Kreiere bis zu {MAX_RECIPES} Signature Drinks. Sie werden jede Woche in allen Filialen verkauft.</p>
      <div className="mt-3 grid gap-2">
        <input className={sel} placeholder="Name, z. B. Berliner Hafer-Flat" value={name} maxLength={32} onChange={(e) => setName(e.target.value)} />
        <select className={sel} aria-label="Brühmethode" value={base} onChange={(e) => setBase(e.target.value as Base)}>{Object.entries(BASES).map(([k, v]) => <option key={k} value={k}>{v.label} · {v.cost.toFixed(2).replace(".", ",")} €</option>)}</select>
        <select className={sel} aria-label="Milch" value={milk} onChange={(e) => setMilk(e.target.value as Milk)}>{Object.entries(MILKS).map(([k, v]) => <option key={k} value={k}>{v.label} · {v.cost.toFixed(2).replace(".", ",")} €</option>)}</select>
        <select className={sel} aria-label="Extra" value={extra} onChange={(e) => setExtra(e.target.value as Extra)}>{Object.entries(EXTRAS).map(([k, v]) => <option key={k} value={k}>{v.label} · {v.cost.toFixed(2).replace(".", ",")} €</option>)}</select>
        <label className="text-xs text-muted-foreground">Verkaufspreis: <strong className="text-foreground">{price.toFixed(2).replace('.', ',')} €</strong> (fair: {fairPrice(draft).toFixed(2).replace('.', ',')} €)
          <input type="range" className="mt-1 h-11 w-full accent-primary" min={1} max={9} step={0.1} value={price} onChange={(e) => setPrice(+e.target.value)} /></label>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="lab-stat"><span>Kosten</span><strong>{cost.toFixed(2).replace('.', ',')} €</strong></div>
          <div className="lab-stat"><span>Qualität</span><strong>{recipeQuality(draft)} / 23</strong></div>
          <div className="lab-stat"><span>≈ Tassen/Wo</span><strong>{est}</strong></div>
        </div>
        <Button className="h-11" onClick={() => setBoth((g, e) => { const r = addRecipe(e, { name, base, milk, extra, price, createdWeek: g.week }); if (typeof r === 'string') return r; window.__lovableEvents?.track?.('project.recipe_created', { base, milk, extra, price, unit_cost: cost, week: g.week, recipe_count: r.recipes.length }); return { game: g, exp: r }; })}>Signature Drink einführen</Button>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">Tipp: Jede Stadtart hat Vorlieben – {Object.entries(BIOME_TASTE).map(([b, t]) => `${BIOME_LABEL[b]}: ${MILKS[t.milk].label}, ${BASES[t.base].label}`).join(' · ')}.</p>
    </section>
    {exp.recipes.length > 0 && <section className="lab-card"><h2>Deine Signature Drinks</h2><ul className="mt-2 space-y-2">{exp.recipes.map((r) => <li key={r.id} className="flex items-center justify-between gap-2 text-sm"><span><strong>{r.name}</strong><small className="block text-xs text-muted-foreground">{BASES[r.base].label} · {MILKS[r.milk].label} · {EXTRAS[r.extra].label} · Marge {(r.price - recipeCost(r)).toFixed(2).replace('.', ',')} €</small></span><Button size="icon" variant="ghost" className="h-11 w-11" aria-label={`${r.name} entfernen`} onClick={() => setBoth((g, e) => ({ game: g, exp: { ...e, recipes: e.recipes.filter((x) => x.id !== r.id) } }))}><Trash2 /></Button></li>)}</ul></section>}
    <p className="text-xs text-muted-foreground">Kampagnen findest du jetzt gesammelt unter HQ → Marketing.</p>
  </div>;
}
