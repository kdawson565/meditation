import type { Checkin, Entry, Value } from "./types";

/** The deck for the values sort. Each has a sample "on a good day" line, used only as a placeholder. */
export const VALUE_DECK: { name: string; example: string }[] = [
  { name: "Growth", example: "I try one thing I'm not yet good at." },
  { name: "Peace", example: "I do the work without a knot in my chest." },
  { name: "Integrity", example: "What I say in the room matches what I do after." },
  { name: "Family", example: "I'm home in body and in mind at dinner." },
  { name: "Craft", example: "I take one piece of work further than it needs to go." },
  { name: "Courage", example: "I make the call I've been putting off." },
  { name: "Health", example: "I move, eat like I mean it, and sleep enough." },
  { name: "Curiosity", example: "I ask the question instead of pretending I know." },
  { name: "Generosity", example: "I give credit, time or money without keeping score." },
  { name: "Freedom", example: "I spend at least part of the day on my own terms." },
  { name: "Presence", example: "When someone's talking, my phone stays down." },
  { name: "Faith", example: "I make room to pray, or to trust what I can't see." },
  { name: "Excellence", example: "I hold the standard even when no one would notice." },
  { name: "Loyalty", example: "I show up for my people when it costs me something." },
  { name: "Adventure", example: "I say yes to something unfamiliar." },
  { name: "Humility", example: "I let myself be wrong, out loud." },
  { name: "Service", example: "Someone's day is easier because of something I did." },
  { name: "Discipline", example: "I do the thing I said I'd do, on the day I said." },
  { name: "Honesty", example: "I say the true thing kindly, instead of the easy thing." },
  { name: "Kindness", example: "I'm gentle with someone who's having a hard day, including me." },
  { name: "Legacy", example: "I build something that will outlast this quarter." },
  { name: "Creativity", example: "I make something that didn't exist this morning." },
  { name: "Gratitude", example: "I notice what I already have before I reach for more." },
  { name: "Patience", example: "I let something take the time it takes." },
  { name: "Friendship", example: "I reach out first." },
  { name: "Love", example: "The people closest to me feel it, not just know it." },
  { name: "Leadership", example: "I make it easier for my team to do their best work." },
  { name: "Joy", example: "I do one thing purely because I like it." },
  { name: "Resilience", example: "I get back up after a hit, without pretending it didn't land." },
  { name: "Wisdom", example: "I pause before I react, and choose." },
];

export const MIN_VALUES = 3;
export const MAX_VALUES = 5;

export function exampleFor(name: string) {
  return VALUE_DECK.find((v) => v.name.toLowerCase() === name.toLowerCase())?.example ?? "On a good day, this looks like…";
}

/** The values a person currently holds, in their order. */
export function coreValues(all: Value[] | undefined) {
  return (all ?? []).filter((v) => v.core).sort((a, b) => a.position - b.position);
}

export function valueName(all: Value[] | undefined, id: string | undefined) {
  if (!id) return undefined;
  return all?.find((v) => v.id === id)?.name;
}

/** A day "lived a value" when it has an evidence line. */
export const livedValue = (c: Checkin) => !!c.evidence?.trim();

/** Sails marked "Not sure" in the window, for the gentle Whose-hunger offer. */
export function unsureSails(entries: Entry[], since: string) {
  return entries.filter((e) => e.sailValue === "unsure" && !e.deletedAt && e.localDate >= since).length;
}
