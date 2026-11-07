import { notFound } from "next/navigation";
import { CARDS, cardById } from "@/lib/library";
import CardView from "./CardView";

export const dynamicParams = false;
export function generateStaticParams() {
  return CARDS.map((c) => ({ id: c.id }));
}

export default async function CardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!cardById(id)) notFound();
  return <CardView id={id} />;
}
