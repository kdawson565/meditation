import Link from "next/link";
import HorizonLine from "@/components/HorizonLine";

const GROUPS: { title: string; links: { href: string; title: string; line: string }[] }[] = [
  {
    title: "Your practice",
    links: [
      { href: "/values", title: "Your values", line: "Goals move. Values hold. Change what you carry" },
      { href: "/reflection", title: "Weekly reflection", line: "A short note on what your week seems to be saying" },
      { href: "/archive", title: "Archive", line: "Search and filter everything you've written" },
      { href: "/insights", title: "What moves you", line: "Before and after, by practice" },
    ],
  },
  {
    title: "Wants and people",
    links: [
      { href: "/ledger", title: "Ledger", line: "What you're reaching for, and what you already have" },
      { href: "/thanks", title: "Thanks", line: "The people you owe a thank-you" },
    ],
  },
  { title: "Settings", links: [{ href: "/settings", title: "Settings", line: "Reminders, AI, export, your data" }] },
];

export default function You() {
  return (
    <div className="fade-in">
      <h1 className="font-serif text-3xl">You</h1>
      <HorizonLine className="mt-4" tick={0.18} />
      {GROUPS.map((g) => (
        <section key={g.title} aria-labelledby={`g-${g.title}`} className="mt-8">
          <h2 id={`g-${g.title}`} className="eyebrow">{g.title}</h2>
          <ul className="mt-2 divide-y divide-line border-y border-line">
            {g.links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="block py-4">
                  <span className="font-serif text-xl">{l.title}</span>
                  <span className="mt-1 block text-[15px] text-muted">{l.line}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <section aria-labelledby="how" className="mt-10 space-y-3">
        <h2 id="how" className="font-serif text-xl">How Ballast works</h2>
        <p className="font-serif text-lg">Grow without losing your peace.</p>
        <p className="text-[15px] leading-relaxed text-muted">Goals are never enough on their own. Each one gets replaced by the next. Values can't be finished, only lived. Your values are the ballast: low and steady. Your goals are the sails: raised, changed, sometimes dropped. Growth and Peace are what you get when both are set well. The dials are your instruments: how today actually felt.</p>
        <p className="text-[15px] leading-relaxed text-muted">The practice is returning to your values, not keeping a perfect record. A day you drifted and came back counts.</p>
      </section>
    </div>
  );
}
