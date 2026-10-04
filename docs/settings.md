# Settings

Open the settings panel with the sliders button in the bottom-right corner. Close it with ×, by tapping the dimmed background, or with Escape. Every choice is saved immediately in the browser's `localStorage` on the device — nothing is sent to a server.

## Theme

Twenty swatches; tap one to apply it. See [Appearance](appearance.md).

## Clock

| Setting | Options | Default |
|---|---|---|
| Time format | 12-hour / 24-hour | 12-hour |
| Clock font | 10 styles | System |
| World clocks | On / Off, plus three city pickers | On — New Delhi, London, Sydney |
| Audio visualizer | Off / Ambient / Microphone | Ambient |
| Sound level (dB) meter | On / Off | Off |
| Calibration | −1 / +1 / Reset (offset applied to the dB reading) | +94 dB |

See [Clock, world clocks & visualizer](clock.md).

## Font

Interface font for everything except the clock — 10 styles, default System.

## Widgets

| Setting | Options | Default |
|---|---|---|
| Animated weather background | On / Off | On |
| Widget to colour | Clock, Now, Today, Feels like, Word, Quote, Forecast | Clock |
| Background | Auto or one of 22 colours | Auto |
| Text | Auto or one of 16 colours | Auto |
| Reset all widget colours | button | — |

See [Appearance](appearance.md).

## Location

- Shows the current location and whether it was auto-detected.
- **Search for a city…** — type at least two characters; pick from up to six matches. The choice is remembered.
- **Use my current location** — clears the manual choice and re-detects (browser geolocation, then IP fallback).

See [Weather](weather.md).

## Where settings are stored

| Key | Contents |
|---|---|
| `sd:theme` | Theme id |
| `sd:hour12` | `true` for 12-hour |
| `sd:location` | `{ lat, lon, name }` when a city was chosen manually |
| `sd:custom` | Fonts, visualizer mode, dB meter and calibration, world clocks, animated weather flag, per-widget colours |

Clearing the site's data in Safari (Settings → Safari → Advanced → Website Data) resets everything to defaults.
