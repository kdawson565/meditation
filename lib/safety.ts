/** A blunt local check. It only decides whether to show a gentle pointer to real-world support. It never diagnoses. */
const PATTERNS = [
  /\bsuicid/i, /\bkill myself\b/i, /\bend (it all|my life)\b/i, /\bwant to die\b/i, /\bdon'?t want to (be here|live|exist)\b/i,
  /\bself[- ]harm/i, /\bhurt(ing)? myself\b/i, /\bno reason to (live|go on)\b/i, /\bbetter off (without me|dead)\b/i,
];

export function suggestsDistress(texts: string[]) {
  return texts.some((t) => PATTERNS.some((p) => p.test(t)));
}
