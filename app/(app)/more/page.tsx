import Link from "next/link";

const LINKS = [
  { href: "/values", title: "Your values", line: "Goals move. Values hold. Change what you carry" },
  { href: "/archive", title: "Archive", line: "Search and filter everything you've written" },
  { href: "/insights", title: "What moves you", line: "Before and after, by practice" },
  { href: "/reflection", title: "Weekly Reflection", line: "A short note on what your week seems to be saying" },
  { href: "/settings", title: "Settings", line: "Reminders, export, your data" },
];

export default function More() {
  return (
    <div className="fade-in">
      <h1 className="font-serif text-3xl">More</h1>
      <ul className="mt-6 divide-y divide-line border-y border-line">
        {LINKS.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="block py-5">
              <span className="font-serif text-xl">{l.title}</span>
              <span className="mt-1 block text-[15px] text-muted">{l.line}</span>
            </Link>
          </li>
        ))}
      </ul>
      <section aria-labelledby="how" className="mt-10 space-y-3">
        <h2 id="how" className="font-serif text-xl">How Ballast works</h2>
        <p className="font-serif text-lg leading-relaxed">Grow without losing your peace.</p>
        <p className="text-[15px] leading-relaxed text-muted">Goals are never enough on their own. Each one gets replaced by the next. Values can't be finished, only lived. Your values are the ballast: low and steady. Your goals are the sails: raised, changed, sometimes dropped. Growth and Peace are what you get when both are set well. The dials are your instruments: how today actually felt.</p>
        <p className="text-[15px] leading-relaxed text-muted">The practice is returning to your values, not keeping a perfect record. A day you drifted and came back counts.</p>
      </section>
    </div>
  );
}
