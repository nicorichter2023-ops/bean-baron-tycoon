import { masterAtlas, MASTER_ART } from './masterArt';
export function MasterArt({ kind, className = '' }: { kind: keyof typeof MASTER_ART; className?: string }) {
  const index = MASTER_ART[kind], x = index % 5, y = Math.floor(index / 5);
  return <div className={`master-art master-art-${kind} ${className}`} aria-hidden><span className="master-art-cell"><img src={masterAtlas} alt="" loading="lazy" width={1536} height={1024} style={{ transform: `translate(-${x * 20}%, -${y * 50}%)` }} /></span></div>;
}
export function MasterHeading({ kind, title, detail }: { kind: keyof typeof MASTER_ART; title: string; detail?: string }) {
  return <header className="master-heading"><MasterArt kind={kind} /><div><h1>{title}</h1>{detail && <p>{detail}</p>}</div></header>;
}