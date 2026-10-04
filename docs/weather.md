# Weather

Four cards share one Open-Meteo request: **Now**, **Today**, **Feels like today** and **7-day forecast**. All temperatures are in °C and wind in km/h.

## Location

On first load the dashboard works out where you are:

1. **Browser geolocation** (needs HTTPS and your permission). The coordinates are turned into a place name with BigDataCloud's free reverse-geocoding endpoint.
2. If that is denied or times out, **IP-based location** from GeoJS.
3. Or set a city manually: Settings → Location → *Search for a city…* (Open-Meteo's geocoder). A manual choice is remembered; *Use my current location* clears it.

The location name is shown in the header of the Now card.

## Now card

- Current temperature (large) and "Feels like".
- Today's high and low as chips.
- **Animated weather background** chosen from the live condition code and whether it is day or night:

| Condition | Scene |
|---|---|
| Clear, day | Blue sky, sun with pulsing glow and slowly rotating rays |
| Clear, night | Deep navy, crescent moon, two layers of twinkling stars |
| Partly cloudy | Sun or moon plus clouds drifting across |
| Overcast | Grey sky with layered clouds |
| Fog | Blurred mist bands sliding back and forth |
| Drizzle / rain | Two parallax layers of falling streaks (lighter and slower for drizzle) |
| Snow | Three irregular snowflake layers drifting down |
| Thunderstorm | Dark sky, rain, periodic lightning flash and bolt |

Text turns white with a soft shadow for legibility over the scene. The animation can be turned off (Settings → Widgets → *Animated weather background*), in which case the card takes the theme colour like the others and becomes colour-customisable. Animations respect the system *Reduce Motion* preference.

## Today card

Condition icon and name, plus a 2×3 grid of: humidity, wind speed, rain chance (daily maximum precipitation probability), UV index (daily maximum), sunrise and sunset (in your 12/24-hour format).

## Feels like today

A canvas line chart of the day's hourly **apparent temperature** (the solid line, filled beneath) with the actual air temperature as a dashed secondary line. A dashed vertical marker with a dot and label shows the current time and value — in the *location's* time zone, so it stays correct if you set a city elsewhere in the world. Hour labels follow your 12/24-hour setting. Colours come from the card's tint, so it re-colours with themes.

## 7-day forecast

A full-width strip (on wide layouts) with one column per day: day name (first is "Today"), condition icon and label, high and low. The header shows when the data was last updated.

## Refresh behaviour

| Trigger | Interval / rule |
|---|---|
| Regular refresh | Every 15 minutes while the page is visible |
| Page becomes visible again | Immediately, if the data is older than 10 minutes |
| After a failed request | Retry after 2 minutes |
| Midnight | Refresh (together with the word and quote) |
| Location changed | Immediately |

That is roughly 100 requests a day — well within Open-Meteo's free, no-key allowance (10,000/day).

## Weather codes

Conditions use the WMO weather interpretation codes returned by Open-Meteo; the mapping from code to label and day/night icon is `SD_WMO` in `data.js`. Icons are inline SVG strokes that inherit the widget's colour.
