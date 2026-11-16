import { masterImage, MASTER_ART } from './masterArt';
export function MasterArt({ kind, className = '' }: { kind: keyof typeof MASTER_ART; className?: string }) {
  return <div className={`master-art master-art-${kind} ${className}`} aria-hidden><img src={masterImage(kind)} alt="" loading="lazy" /></div>;
}
export function MasterHeading({ kind, title, detail }: { kind: keyof typeof MASTER_ART; title: string; detail?: string }) {
  return <header className="master-heading"><MasterArt kind={kind} /><div><h1>{title}</h1>{detail && <p>{detail}</p>}</div></header>;
}
