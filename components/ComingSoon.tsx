import Link from "next/link";

export default function ComingSoon({ title, line }: { title: string; line: string }) {
  return (
    <div className="fade-in">
      <p className="text-sm text-muted">Arriving in Phase 2</p>
      <h1 className="mt-1 font-serif text-3xl">{title}</h1>
      <p className="mt-4 max-w-md font-serif text-lg leading-relaxed">{line}</p>
      <Link href="/today" className="btn btn-ghost mt-8">Back to today</Link>
    </div>
  );
}
