# Appearance: themes, fonts and widget colours

Everything visual is driven by CSS custom properties, so the whole dashboard — including the canvas chart and visualizer — re-colours instantly when you change a setting. All choices are saved on the device.

## Themes

Twenty built-in themes, chosen from Settings → Theme (swatches show each theme's background and accent):

| Dark | Light |
|---|---|
| Midnight, Slate, Charcoal, Forest, Ocean, Aubergine, Ember, Sunset, Nord, Dracula, Gruvbox, Solarized Dark, Mono | Solarized Light, Paper, Linen, Mint, Sky, Rose, Lavender |

A theme defines the page background (usually a soft gradient), card surface, text and muted text colours, two accents — **and a palette of seven tints, one per widget**, so every card gets its own coordinated colour (e.g. on Midnight: indigo clock, cyan Today, emerald chart, amber word, pink quote, violet forecast). The tint colours the card's background wash, border, label, icons, chips and the chart line.

Themes live in two places: the colour variables in `styles.css` (`[data-theme="…"]` blocks) and the per-widget tints in `SD_THEMES` in `data.js`.

## Fonts

Settings offers two independent font choices, each with ten styles built from fonts that ship with iPadOS (nothing is downloaded):

- **Clock font** — applies to the time, day and date.
- **Font** — applies to everything else.

Styles: System, Rounded, Serif (New York), Avenir, Futura, Optima, Gill Sans, Georgia, Didot, Mono. Each is shown as a live "Aa" preview in the picker. On non-Apple devices the stacks fall back to the closest common equivalents.

## Widget colours

Settings → Widgets lets you override the theme per card:

1. Pick a widget (Clock, Now, Today, Feels like, Word, Quote, Forecast).
2. Choose a **Background** from 22 colours — dark neutrals, vivid hues and light pastels — or *Auto* to use the theme tint.
3. Choose a **Text** colour from 16 options, or *Auto*.

When you set a solid background, the label, icons, chips and text colours are derived automatically for contrast (light text on dark backgrounds, dark text on light ones) unless you also pick a text colour. *Reset all widget colours* returns every card to the theme.

The **Now** card follows the weather instead while *Animated weather background* is on; switch that off to colour it like the others.

## Animated weather background

Settings → Widgets → *Animated weather background* turns the Now card's sky scene on or off. See [Weather](weather.md) for the scenes.

## How it fits together

- The theme sets global variables on `<html>`.
- `applyCardColors()` in `app.js` writes `--tint`, `--tint-a/-b` (gradient stops), `--tint-line`, `--tint-soft`, and optionally `--text`/`--muted` onto each card element — from the theme tints or your overrides.
- Cards, icons, the chart and the visualizer all read those variables, so one change propagates everywhere.
