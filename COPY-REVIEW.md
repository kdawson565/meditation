# Copy to review

Every new or changed line a person reads in this release, by screen, with where it lives. Items marked **Decide** are judgement calls I made that you may want to change. Everything else follows the existing voice: calm, short sentences, no exclamation points, never "missed".

## 1. The Library cards (yours to write)

All 10 cards in `content/library/` are **DRAFT placeholders** I wrote to show the format. Replace them with your own; `npm run library` checks each one. The format and rules are in `content/library/README.md`.

- **Decide:** the influences I tagged (Seneca, Marcus Aurelius, Epictetus, Alan Watts, René Girard, Viktor Frankl, Lao Tzu) are placeholders too.
- **Decide:** the themes are named for the kind of day a card helps: "When you're grinding", "When it's foggy", "When it's calm", "On Ballast days". `lib/library.ts:25`

## 2. Today

| Copy | Where |
|---|---|
| "Today I carry…" / "Today I carry **Craft**" (value chooser on the card) | `app/(app)/today/page.tsx:593` |
| "These measure how today feels, not how well you're doing. There's no right answer, only an honest one." | `app/(app)/today/page.tsx:363` |
| "Today's practice · *{title}* · {blurb}. Picked from your dials; you can choose another next." / "…From the Library; you can choose another next." | `app/(app)/today/page.tsx:368` |
| Button: "Begin" (was "Continue") | same card |
| "Your Sail" (title of the Sail step once values exist) and "Carrying **Family** today." | `app/(app)/today/page.tsx:499`, `:503` |
| "The tide is a little higher." / "Added." (when adding a second practice) + "Nothing else is needed from you today." | `app/(app)/today/page.tsx:309` |
| Logged card: "TODAY IS LOGGED" · "Carrying Family" + definition, or "That's enough for today." | `app/(app)/today/page.tsx:256`, `:262` |
| "Today's Sail" · "Serves Craft" | logged view |
| Buttons: "See the tide" (was "See the map") | logged and close views |
| **Decide:** "TODAY'S BEARING" (the label above the AI Bearing) | `components/Bearing.tsx:11` |

## 3. Tide

| Copy | Where |
|---|---|
| "{n} days practiced" / "…so far" (this month) | `app/(app)/tide/page.tsx:60` |
| "What the dots mean" and the legend: "Ballast: settled and hungry", "Grind: hungry, not settled", "Harbor: settled, a little still", "Fog: low on both", "Brass ring: you noted living a value", "No dot: a day you didn't check in. Nothing is missed." | `app/(app)/tide/page.tsx:66`, `components/DayDot.tsx:29`–`34` |
| Day sheet: "No check-in this day. That's fine; the next one is simply another place to begin." / "No moment noted. Carrying it counts." / "Open in the archive" | `components/DayDetail.tsx:13`, `:30` |
| "Your values" · "Moments you noted living each value, all time." | `app/(app)/tide/page.tsx:78` |
| Value with no moment: "Carried {n} days. A moment will show here when you note one." / "Not carried yet. It's here when you want it." | `app/(app)/tide/page.tsx:89` |
| No values: "Once you choose your values, each one shows here with the moments you lived it, in your own words." | `app/(app)/tide/page.tsx:75` |
| "Seasons" · "Every 90 days from your first check-in, a look back at the whole stretch." | `app/(app)/tide/page.tsx:104` |
| Current season: "Day 31 of 90. Its review arrives after January 4." | `app/(app)/tide/page.tsx:112` |
| Data season review sentences: "You checked in on 66 of 90 days." · "Peace went from 3.8 in the first month to 6.2 in the last, and Drive held near 7.0." · "Most days landed in the Harbor: settled, a little still." · "You carried Family most often (9 days) and noted 6 moments you lived it; Presence came next." · "22 of the 50 Sails you checked back on filled." | `lib/tide.ts:115`–`130` |
| "In your words" | `app/(app)/tide/page.tsx:125` |
| Empty season: "No check-ins this season. The next one is simply another place to begin." (only reachable if a season has no days, which is now hidden) | `lib/tide.ts:97` |
| AI season review footnote: "Written by Claude from your own words and numbers, and the Library cards shown." · "The numbers" (collapsed data view) | `components/SeasonAI.tsx:42` |

## 4. Monthly Tide Report

| Copy | Where |
|---|---|
| "BALLAST · TIDE REPORT" · "{Month Year}" · "{n} days practiced" · "A number, not a streak." | `app/(app)/tide/report/page.tsx:46` |
| Section titles: "The month's path", "Day by day", "The dials, on average", "Values lived" | same file |
| "Include my own words (the moments I noted)" | `app/(app)/tide/report/page.tsx:83` |
| Footer: "Made on this device from your own check-ins. Grow without losing your peace." | `app/(app)/tide/report/page.tsx:94` |

## 5. Library

| Copy | Where |
|---|---|
| "Short principles in Ballast's own words. Read one, carry its question, or start its practice." | `app/(app)/library/page.tsx:50` |
| Ask Ballast entry: "A short conversation, answered from these cards and your own words." | `app/(app)/library/page.tsx:56` |
| "FOR TODAY" · "Chosen from the value you're carrying (Craft) and how today feels." / "Check in today and these will follow your value and how the day feels." | `app/(app)/library/page.tsx:64` |
| "More values (16)" / "Only my values" | same file |
| Saved, empty: "Nothing saved yet. Save a card to keep it close; it travels with your export and leaves with your data if you delete it." | `app/(app)/library/page.tsx:108` |
| Card page: "Helps most when you're grinding." · "A question to carry" · "Start the practice: {title}" · "Save this card" / "Saved" | `app/(app)/library/[id]/CardView.tsx:28`, `:34` |
| **Decide:** "Influences: Seneca. The ideas here are in Ballast's own words. Nothing is a quotation, and nothing implies their endorsement." | `app/(app)/library/[id]/CardView.tsx:45` |
| The DRAFT mark on cards | `components/CardBits.tsx` |

## 6. Ask Ballast

| Copy | Where |
|---|---|
| "A short conversation, not a chat. Up to five questions, each answered from one Library card and your own words. Three conversations a day." | `app/(app)/library/ask/page.tsx:80` |
| "What's on your mind?" / "Question 3 of 5" · placeholder "I hit the goal and felt nothing…" · button "Ask" / "Thinking it over…" | `app/(app)/library/ask/page.tsx:125` |
| "{n} of 3 conversations left today" | same file |
| "Sends your question, your values and the last seven days of dials, evidence lines and Sails to Claude, with a few Library cards to draw on." | `app/(app)/library/ask/page.tsx:131` |
| **Decide:** the close: "That's the conversation. The rest is yours to carry." | `app/(app)/library/ask/page.tsx:118` |
| Daily limit: "That's today's three conversations. The Library is still here, and tomorrow there are more." | `app/(app)/library/ask/page.tsx:63` |
| Support line instead of an answer: "That sounds heavy, and it deserves more than a short answer from an app. Ballast isn't a therapist…" | `app/api/ai/ask/route.ts:37` |
| "Try: {practice}" · "A question to carry" · "Source: {card}" | same page |

## 7. AI consent and notes

| Copy | Where |
|---|---|
| **Decide:** the whole "Before you turn on AI" explanation (what each feature sends, what's never sent, no analytics, where outputs are kept) | `components/AiExplainer.tsx:5` |
| Settings: "AI features (Bearing, Ask Ballast, reflections, season reviews)" · "On." / "Off." · "What's sent, exactly" · "Turn on AI" / "Not now" · "AI is off. Nothing more will be sent." | `app/(app)/settings/page.tsx:141` |
| Onboarding toggle: "A daily Bearing, Ask Ballast, and written reflections, drawn only from Ballast's Library and your own words. Off by default." | `app/onboarding/page.tsx:119` |
| Reflection: "Next week, try: {practice}" · "Written by Claude from your entries and the Library cards shown." · "Writing it sends this week's entries, dials, values and evidence lines to Claude through Ballast's server, along with a few Library cards to draw on." | `app/(app)/reflection/page.tsx:99`, `:102` |
| Fallback notes: "That's today's limit for this. It resets over the next day." · "This conversation has had its five questions." · "The AI didn't answer this one, so this was made on your device." | `lib/ai-client.ts:32` |

## 8. What the AI is told (its voice)

These set how every AI answer sounds. Read them as copy: they're the house style for the guide.

| Prompt | Where |
|---|---|
| Shared rules: voice, grounding, banned phrases, safety | `lib/ai-server.ts:90` (`CORE_RULES`) |
| Bearing: two sentences, 20–45 words | `app/api/ai/bearing/route.ts:17` |
| Weekly reflection: 130–160 words, 1–2 cards, one practice | `app/api/ai/reflection/route.ts:18` |
| Ask Ballast: ≤90 words, one card, calm close | `app/api/ai/ask/route.ts:29` |
| Season review: ~300 words, mostly their words | `app/api/ai/season/route.ts:19` |

**Sample outputs from testing** (with the sample data):

- Bearing: "Today you carry Craft: taking one piece of work further than it needs to go. On a low day, shrink that to one step small enough to finish before tonight, and let that be the piece."
- Ask, last turn: "…Your own definition of Family is already a line: home in body and mind at dinner. That one can be met tonight. Results move. Values hold. Now, back to your day."

## 9. Navigation

| Copy | Where |
|---|---|
| Tabs: "Today", "Tide", "Map", "Library" · "You" (icon, top right; spoken as "You: values, ledger, thanks, reflection and settings") | `components/Shell.tsx` |
| You page groups: "Your practice", "Wants and people", "Settings" | `app/(app)/you/page.tsx:15` |
| Tide placeholder copy is gone; Library placeholder copy is gone. | |
