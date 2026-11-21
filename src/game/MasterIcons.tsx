import { Sprout, Award, Gavel, Ship, PlaneTakeoff, Flame, Leaf, Star, Radio, FileSignature, ShoppingCart, Handshake, Swords, Eye } from 'lucide-react';
/** Icons for the systems the player actually touches: supply chain, market, trends, retail, rivals. */
export const SYSTEM_ICONS = { plantation: Sprout, cupping: Award, auction: Gavel, ship: Ship, air: PlaneTakeoff, trend: Flame, season: Leaf, review: Star, vibe: Radio, franchise: FileSignature, retail: ShoppingCart, b2b: Handshake, rival: Swords, spy: Eye } as const;
export function SystemIcon({ kind, size = 20 }: { kind: keyof typeof SYSTEM_ICONS; size?: number }) { const Icon = SYSTEM_ICONS[kind]; return <Icon size={size} className={`system-icon system-${kind}`} aria-hidden />; }
