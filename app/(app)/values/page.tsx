"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useValues } from "@/lib/hooks";
import { coreValues } from "@/lib/values";
import { saveValues } from "@/lib/store";
import ValuesSetup from "@/components/ValuesSetup";

/** Set or change your values. Reached from the Today invitation and from Settings. Never blocks the ritual. */
export default function ValuesPage() {
  const router = useRouter();
  const values = useValues();
  const [busy, setBusy] = useState(false);
  if (!values) return <div aria-busy="true" />;
  const back = () => (history.length > 1 ? router.back() : router.replace("/today"));
  return (
    <div className="fade-in">
      <ValuesSetup
        initial={coreValues(values).map((v) => ({ name: v.name, definition: v.definition, custom: v.custom }))}
        onBack={back}
        busy={busy}
        onDone={async (chosen) => { setBusy(true); await saveValues(chosen); back(); }}
      />
    </div>
  );
}
