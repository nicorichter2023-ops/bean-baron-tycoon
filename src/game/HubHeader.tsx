import venture from '@/assets/hubs/venture.jpg';
import supply from '@/assets/hubs/supply.jpg';
import marketing from '@/assets/hubs/marketing.jpg';
import finca from '@/assets/hubs/finca.jpg';
import research from '@/assets/hubs/research.jpg';
import greenBeans from '@/assets/hubs/green-beans.jpg';
import hq from '@/assets/hubs/hq.jpg';
import retail from '@/assets/hubs/retail.jpg';
import stocks from '@/assets/hubs/stocks.jpg';
import rivals from '@/assets/hubs/rivals.jpg';
import property from '@/assets/hubs/property.jpg';

const ART = { venture, supply, finca, marketing, research, greenBeans, hq, retail, stocks, rivals, property } as const;
/** Painted header shared by the central hubs so every menu reads as one place. */
export function HubHeader({ art, eyebrow, title, children }: { art: keyof typeof ART; eyebrow: string; title: string; children?: React.ReactNode }) {
  return <header className="hub-header"><img src={ART[art]} alt="" width={1024} height={640} loading="lazy" /><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{children}</div></header>;
}
