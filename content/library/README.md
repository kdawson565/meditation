# The Ballast Library

One principle card per file: `<id>.md`, with frontmatter, then the body.

```
---
id: enough-is-a-number            # must match the file name
title: Enough is a number
status: draft                     # draft | published. Drafts show a DRAFT mark in the app.
values: [Gratitude, Peace]        # names from the 30-value deck (lib/values.ts)
quadrants: [grind]                # ballast | grind | harbor | fog: where it helps most
influences: [Seneca]              # thinker names only. Never in the body.
reflection_question: What would enough look like this month?
linked_practice_id: enough_line   # a practice id from lib/types.ts
---
Body, 80 to 150 words, in Ballast's own voice.
```

Rules (the checker enforces what it can; `npm run library` runs it, and so does every build):
- Ideas are always in Ballast's own words. Never quote a thinker, never put words in their mouth.
- Thinkers appear only in `influences`, never in the body, and never as an endorsement.
- Calm, specific, short sentences. No exclamation points, no therapy language, never "want less".
