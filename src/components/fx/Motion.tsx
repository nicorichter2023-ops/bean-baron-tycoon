import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

export function MotionSheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-card p-4 text-card-foreground shadow-2xl"
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }}
          drag="y" dragConstraints={{ top: 0, bottom: 0 }} onDragEnd={(_, i) => i.offset.y > 80 && onClose()}>
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-muted" />{children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function CoinPopup({ amount, id }: { amount: number; id: number }) {
  return (
    <motion.div key={id} className={`pointer-events-none fixed left-1/2 top-1/3 z-50 text-2xl font-bold ${amount >= 0 ? "text-primary" : "text-destructive"}`}
      initial={{ opacity: 0, y: 0, x: "-50%" }} animate={{ opacity: [0, 1, 0], y: -80 }} transition={{ duration: 1.4 }}>
      {amount >= 0 ? "+" : ""}{amount.toLocaleString("de-DE")} €
    </motion.div>
  );
}

export function NewspaperEvent({ title, text, onClose }: { title: string; text: string; onClose: () => void }) {
  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center bg-background/60 p-6" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.article className="max-w-sm rounded bg-card p-5 text-card-foreground shadow-2xl" initial={{ scale: 0.2, rotate: -540 }} animate={{ scale: 1, rotate: -2 }} transition={{ type: "spring", damping: 14 }}>
        <h2 className="mb-2 border-b pb-1 font-serif text-2xl">{title}</h2><p className="font-serif">{text}</p>
      </motion.article>
    </motion.div>
  );
}
