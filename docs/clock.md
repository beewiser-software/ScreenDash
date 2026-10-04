# Clock, world clocks & audio visualizer

The clock is the largest card and the anchor of the dashboard. It spans two columns and contains three things: the main time, up to three world clocks, and an audio visualizer.

## Main time

- Shows hours and minutes in a large tabular-numeral face; seconds and AM/PM sit in a small column to the right.
- The day name and full date sit beneath.
- **12-hour or 24-hour** format: Settings → Clock. The choice also applies to sunrise/sunset, the "Updated" time, the chart's hour labels and the world clocks.
- Ticks are aligned to the wall-clock second, so the seconds change exactly on the second.
- At midnight the dashboard refreshes the word, quote and weather automatically.

The clock has its own **font setting** (Settings → Clock → Clock font) independent of the interface font — see [Appearance](appearance.md).

## World clocks

Three compact rows to the right of the main time, each showing a city and its current local time.

- **Defaults:** New Delhi, London, Sydney.
- **Configure:** Settings → Clock → World clocks. Toggle them On/Off and pick a city for each of the three slots from a grouped list (Americas, Europe, Africa & Middle East, Asia, Oceania, UTC). Choose *None* to leave a slot empty.
- A small **+1 / −1** marker appears when that city is already on tomorrow's (or still on yesterday's) date relative to your local date.
- Times follow your 12/24-hour setting.
- When world clocks are on, the main time steps down one size so everything fits on one row; turning them off restores the larger face.

Zone maths is done by the browser's `Intl.DateTimeFormat`, which uses the device's time-zone database — so daylight-saving changes are handled automatically with no updates to the app. Cities are listed in `SD_CITIES` in `data.js`; add any `['Name', 'IANA/Zone']` pair to extend the list.

## Audio visualizer

A Winamp-style spectrum analyser in the bottom-right of the card: segmented bars (3 px blocks, 1 px gaps), three colour bands derived from the current theme (widget tint → theme accent → text colour), and peak caps that hold for a moment and then fall.

Settings → Clock → Audio visualizer:

| Mode | Behaviour |
|---|---|
| **Off** | Hidden |
| **Ambient** (default) | Simulated music: slow swells, a kick on the low bars at ~112 BPM and hi-hats on the high bars. Needs no permissions. |
| **Microphone** | Live spectrum from the device microphone via Web Audio (FFT 512, 24–48 log-spaced bars from 40 Hz to 12 kHz). Reacts to music playing in the room. |

Notes:

- The animation runs at 30 fps and pauses when the tab is hidden, to be kind to battery.
- Microphone audio is analysed locally and never recorded or uploaded.
- iPadOS asks for microphone permission when you choose the mode. To avoid being asked on every reload, open the site's **aA → Website Settings** in Safari and set Microphone to *Allow*.
- iOS requires a user tap before audio processing can start. If you reload with Microphone mode saved, a note says "Tap anywhere on the page to start listening" — the first touch starts it.
- If the microphone is denied or unavailable, the bars fall back to Ambient and a note explains why.
