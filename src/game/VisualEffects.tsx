import { useState } from 'react';
import { VISUAL_ASSETS } from './visualAssets';
import { art } from './sheetArt';

export function SceneAsset({ slot, fallback, ...props }: { slot?: string | undefined; fallback: string; className?: string; alt: string; draggable?: boolean; fetchPriority?: 'high' | 'low' | 'auto' }) {
  const [failed, setFailed] = useState<string>();
  const configured = slot ? VISUAL_ASSETS[slot] : undefined;
  const src = configured && failed !== configured ? configured : fallback;
  return <img {...props} src={src} data-asset-slot={slot} onError={() => { if (src === configured) setFailed(src); }} />;
}

export function CafeSteam() {
  return <span className="espresso-steam" aria-hidden="true">{[0, 1, 2, 3].map(i => <i key={i} />)}</span>;
}

export function NeonSign({ shop = false }: { shop?: boolean }) {
  return <span className={shop ? 'shop-neon' : 'bean-baron-neon'} aria-hidden="true">{shop ? 'COFFEE' : 'Bean Baron'}</span>;
}

export function CityTraffic() {
  return <div className="city-traffic" aria-hidden="true">{[0, 1, 2, 3, 4, 5].map(i =>
    <span key={i} className={`traffic-route traffic-route-${i}`}><img src={art('traffic', i % 2 ? 34 : 30).replace('.webp', '-map.webp')} alt="" /></span>
  )}</div>;
}