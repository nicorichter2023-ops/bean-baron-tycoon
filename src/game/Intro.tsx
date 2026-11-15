import { useEffect, useState } from 'react';
import { Coffee, Plane } from 'lucide-react';

export function SplashScreen({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  const [min, setMin] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMin(true), 2200); return () => clearTimeout(t); }, []);
  useEffect(() => { if (ready && min) { const t = setTimeout(onDone, 450); return () => clearTimeout(t); } }, [ready, min, onDone]);
  return <div className={`splash ${ready && min ? 'splash-out' : ''}`} role="status" aria-label="Coffee Empire lädt">
    <div className="splash-cup"><Coffee size={64} /><span className="steam s1" /><span className="steam s2" /><span className="steam s3" /></div>
    <h1>Coffee Empire</h1><p>Vom Kiosk zum Weltkonzern</p>
    <div className="splash-bar"><i /></div>
  </div>;
}

export function FlightOverlay({ from, to, onDone }: { from: string; to: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [onDone]);
  return <div className="flight" role="status" aria-label={`Flug ${from} nach ${to}`} onClick={onDone}>
    <span className="cloud c1" /><span className="cloud c2" /><span className="cloud c3" /><span className="cloud c4" />
    <div className="flight-plane"><Plane size={72} /></div>
    <div className="flight-route"><strong>{from}</strong><span className="flight-line"><i /></span><strong>{to}</strong></div>
  </div>;
}
