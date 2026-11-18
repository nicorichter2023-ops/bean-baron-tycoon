import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface StoreBranch { id: string; name: string; tier: number; tileX: number; tileY: number }
export interface StockQuote { id: string; name: string; price: number; history: number[] }

export interface EmpireState {
  schemaVersion: 1;
  capital: number;
  week: number; // Woche 1 = erste Januarwoche 1880
  beans: number; // kg
  reputation: number; // 0..100
  branches: StoreBranch[];
  stocks: StockQuote[];
  muted: boolean;
  addCapital: (amount: number) => void;
  nextWeek: () => void;
  addBranch: (b: StoreBranch) => void;
  setMuted: (m: boolean) => void;
  reset: () => void;
}

export const START_YEAR = 1880;
export function calendarOf(week: number) {
  const w = week - 1;
  return { year: START_YEAR + Math.floor(w / 52), weekOfYear: (w % 52) + 1 };
}

const initial = () => ({
  schemaVersion: 1 as const,
  capital: 5000,
  week: 1,
  beans: 50,
  reputation: 10,
  branches: [{ id: "b1", name: "Kaffeehaus am Markt", tier: 1, tileX: 3, tileY: 3 }],
  stocks: [
    { id: "rost", name: "Hanse Rösterei AG", price: 42, history: [42] },
    { id: "ship", name: "Levante Reederei", price: 18, history: [18] },
  ],
});

export const useEmpire = create<EmpireState>()(
  persist(
    (set) => ({
      ...initial(),
      muted: false,
      addCapital: (amount) => set((s) => ({ capital: s.capital + amount })),
      nextWeek: () =>
        set((s) => ({
          week: s.week + 1,
          stocks: s.stocks.map((q) => {
            const price = Math.max(1, +(q.price * (1 + (Math.random() - 0.48) * 0.08)).toFixed(2));
            return { ...q, price, history: [...q.history, price].slice(-52) };
          }),
        })),
      addBranch: (b) => set((s) => ({ branches: [...s.branches, b] })),
      setMuted: (muted) => set({ muted }),
      reset: () => set(initial()),
    }),
    {
      name: "coffee-empire-zustand",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
