import type { CSSProperties } from 'react';
import { ATLASES } from './sceneAssets';

export function Sprite({ sheet, index, className = '', label }: { sheet: string; index: number; className?: string; label?: string }) {
  const url = ATLASES[sheet];
  if (!url) return null;
  const style: CSSProperties = { backgroundImage: `url(${url})`, backgroundSize: '400% 400%', backgroundPosition: `${(index % 4) * 100 / 3}% ${Math.floor(index / 4) * 100 / 3}%` };
  return <span role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} className={`sprite ${className}`} style={style} />;
}