"use client";
import { useEffect, useRef } from "react";

/** A bottom sheet on the native <dialog>: focus is trapped, Escape and the backdrop close it. */
export default function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="sheet" aria-label={title} onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      <div className="max-h-[85dvh] overflow-y-auto px-5 pb-8 pt-3" style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}>
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" aria-hidden />
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-serif text-2xl">{title}</h2>
          <button type="button" className="btn-quiet -mr-3 rounded-full text-sm" onClick={onClose}>Close</button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </dialog>
  );
}
