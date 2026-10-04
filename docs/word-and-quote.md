# Word & quote of the day

Two single-column cards that change on **every page load** (and automatically at midnight), so you see something new each day without having to do anything.

## Word of the day

- A word is picked at random from a curated vocabulary list of ~190 interesting English words (`SD_WORDS` in `data.js`) — the kind you'd actually want to learn, not obscure dictionary filler.
- The card shows: the word, its **IPA pronunciation**, a **speaker button**, the part of speech, the first definition and — when available — an example sentence (or a short second sense if there is no example).
- **Pronunciation:** the speaker button plays the dictionary's recorded audio when one exists, otherwise it uses the device's speech synthesis to say the word.
- **Tap the card** (anywhere except the speaker) to open a detail view with up to four senses and their examples.

Definitions come from the Free Dictionary API, with Datamuse as an automatic fallback (both are queried at once so a slow service never delays the card). If a word can't be found, another is picked; after three misses a short "definition unavailable" message is shown instead.

## Quote of the day

- Fetched from DummyJSON's quotes API on each load; if that fails it tries Quotable, and finally a small built-in list of public-domain quotes.
- Shows the quote and author. Quotes longer than ~180 characters are re-rolled once or twice so the card stays readable; long ones use a slightly smaller type size.
- **Tap the card** to read the full quote in the detail view.

## Fixed-height cards and the detail view

On multi-column layouts these two cards have a **fixed height** aligned with the bottom of the chart card (see [Layout](layout.md)), so a long definition or quote can never push the forecast off the screen. Content that doesn't fit is handled in two steps:

1. **Auto-fit:** the text shrinks in steps (100 % → 92 % → 85 % → 78 %) until it fits.
2. **Tap for more:** if it still overflows, the bottom fades out and a small "Tap for more" hint appears. Tapping the card opens a modal, styled in that widget's colours, with the full content at a comfortable size. Close with the × button, by tapping outside, or with Escape.

On a single-column (phone) layout the cards grow to their natural height instead.
