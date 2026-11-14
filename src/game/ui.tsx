import { createContext, useContext, type ReactNode } from "react";
export const SectionFilter = createContext<string[] | null>(null);
export function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  const filter = useContext(SectionFilter);
  if (filter && !filter.some((prefix) => title.startsWith(prefix))) return null;
  return <section className="mb-5"><div className="mb-2 flex items-center justify-between"><h2 className="font-display text-lg font-bold">{title}</h2>{action}</div>{children}</section>;
}
export function Panel({ children }: { children: ReactNode }) {
  return <div className="mb-2 rounded-lg border border-border bg-card p-3">{children}</div>;
}
export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">{children}</p>;
}
