# Data sources & privacy

ScreenDash is a static site with no backend. The browser talks directly to a handful of free, key-less public APIs; nothing is proxied or logged by the project.

## Services used

| Purpose | Service | Endpoint | When |
|---|---|---|---|
| Weather (current, hourly, 7-day) | [Open-Meteo](https://open-meteo.com/) | `api.open-meteo.com/v1/forecast` | Every 15 min, on wake, at midnight, on location change |
| City search | Open-Meteo Geocoding | `geocoding-api.open-meteo.com/v1/search` | While typing in Settings → Location |
| Coordinates → place name | [BigDataCloud](https://www.bigdatacloud.com/) | `api.bigdatacloud.net/data/reverse-geocode-client` | Once, after browser geolocation succeeds |
| IP-based location | [GeoJS](https://www.geojs.io/) | `get.geojs.io/v1/ip/geo.json` | Only if geolocation is denied/unavailable and no city is set |
| Dictionary | [Free Dictionary API](https://dictionaryapi.dev/) | `api.dictionaryapi.dev/api/v2/entries/en/{word}` | On load and at midnight |
| Dictionary fallback | [Datamuse](https://www.datamuse.com/api/) | `api.datamuse.com/words?sp={word}&md=dr&ipa=1` | Queried alongside the primary; used if the primary fails |
| Quotes | [DummyJSON](https://dummyjson.com/) | `dummyjson.com/quotes/random` | On load and at midnight |
| Quotes fallback | Quotable, then a built-in list | `api.quotable.io/quotes/random` | Only if DummyJSON fails |

None of these require an account or API key, so there are no secrets in the repository and nothing to expire.

## Fallbacks

Every network feature degrades gracefully:

- Weather failure → cards show "unavailable" and retry every 2 minutes; the last good data stays on screen if there was any.
- Dictionary failure → second source, then a different word (up to three tries), then a plain "definition unavailable".
- Quote failure → second source, then a built-in quote.
- Geolocation failure → IP location → manual city.

## Privacy

- **Location:** browser geolocation is only requested if you haven't set a city manually. Coordinates go to Open-Meteo (weather) and BigDataCloud (place name). IP-based lookup sends your IP to GeoJS only as a fallback.
- **Microphone:** used only if you choose the Microphone visualizer mode. Audio is analysed in the browser with the Web Audio API to drive the bars and is never recorded, stored or transmitted. The default Ambient mode doesn't touch the microphone.
- **Storage:** themes, fonts, colours, world clocks and location are saved in the browser's `localStorage` on the device only.
- **No analytics, cookies or tracking** of any kind.

## Rate limits

At the default refresh cadence the dashboard makes roughly 100 Open-Meteo requests per day (free allowance: 10,000) and one or two requests each to the dictionary and quote services per day. Searching for cities triggers one geocoding request per keystroke pause.

## Attribution

Weather data by Open-Meteo.com, licensed CC BY 4.0. Attributions for all services appear at the bottom of the settings panel.
