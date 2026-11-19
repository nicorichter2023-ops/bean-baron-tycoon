import { useState } from 'react';
import { VISUAL_ASSETS } from './visualAssets';

export function SceneAsset({ slot, fallback, ...props }: { slot?: string | undefined; fallback: string; className?: string; alt: string; draggable?: boolean; fetchPriority?: 'high' | 'low' | 'auto' }) {
  const [failed, setFailed] = useState<string>();
  const configured = slot ? VISUAL_ASSETS[slot] : undefined;
  const src = configured && failed !== configured ? configured : fallback;
  return <img {...props} src={src} data-asset-slot={slot} data-custom-asset={Boolean(configured && src === configured)} onError={() => { if (src === configured) setFailed(src); }} />;
}


export function NeonSign({ shop = false }: { shop?: boolean }) {
  return <span className={shop ? 'shop-neon' : 'bean-baron-neon'} aria-hidden="true">{shop ? 'COFFEE' : 'Bean Baron'}</span>;
}

