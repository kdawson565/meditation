import Link from "next/link";

const LINKS = [
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
    </div>
  );
}
