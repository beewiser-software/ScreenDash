# Layout

ScreenDash uses a small JavaScript masonry layout (no library) so cards can have natural heights while still packing tightly. It was tuned so a **1024×768 iPad in landscape shows everything with no scrolling**.

## Columns

The number of columns follows the viewport width; the breakpoints are shared between `columnsFor()` in `app.js` and the media queries in `styles.css`:

| Viewport width | Columns | Typical device |
|---|---|---|
| < 600 px | 1 | Phone |
| 600 – 899 px | 2 | iPad portrait |
| 900 – 1023 px | 3 | Small laptop window |
| ≥ 1024 px | 4 | iPad landscape, desktop |

## Card spans and order

Cards are placed in DOM order, each into the column window whose tallest column is lowest (ties go left):

| Card | Span | Notes |
|---|---|---|
| Clock | 2 | Always the largest card; has a minimum height |
| Now | 1 | |
| Today | 1 | |
| Feels like today | 2 | |
| Word of the day | 1 | Stretchable (see below) |
| Quote of the day | 1 | Stretchable |
| 7-day forecast | 2, or **4** on four-column layouts | Full-width strip at the bottom on the iPad |

Spans are clamped to the column count, so on a phone everything is one column.

## Stretchable cards

The Word and Quote cards carry `data-stretch`. In multi-column layouts they get a fixed height rather than their natural one:

- Just before a full-width card (the forecast) is placed, the layout **equalises** the columns: any stretchable card sitting at the bottom of a column is resized so that column ends exactly where the tallest fixed card (the chart) ends. The forecast therefore always starts flush and stays on screen.
- If there is no fixed card to align to (e.g. two-column portrait), stretchable cards share a sensible preferred height (260 px).
- Content that doesn't fit is auto-shrunk and then made expandable — see [Word & quote](word-and-quote.md).
- In a single column, stretchable cards simply take their natural height.

## Responsiveness details

- Type sizes step with the breakpoints (the clock face goes from 18 vw on a phone up to 11 rem on very wide screens, and steps down slightly when world clocks are shown).
- The 7-day forecast switches from seven columns to a vertical list on phones.
- Layout re-runs on resize, orientation change, whenever a card's content changes, and via a `ResizeObserver` on each card; a once-a-second check also catches rotations on older Safari builds that don't fire `resize`.
- Position changes animate with a short transform transition after the first paint.
