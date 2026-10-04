# iPad setup & troubleshooting

ScreenDash was designed for a spare iPad kept on a desk or shelf. These steps give the best always-on experience; they were verified on iPadOS 15.8.

## Install as a full-screen app

1. Open https://beewiser-software.github.io/ScreenDash/ in **Safari** (it must be Safari — other iOS browsers can't add full-screen web apps).
2. Tap the **Share** button → **Add to Home Screen** → Add.
3. Launch from the new icon. It runs without the address bar or tabs, and the status bar is translucent over the page.

Launching from the Home Screen icon is also the only way to get the full 1024×768 canvas that the layout is tuned for.

## Keep the screen on

Settings → Display & Brightness → **Auto-Lock → Never**.

Optional: use **Guided Access** (Settings → Accessibility → Guided Access) to lock the iPad to the dashboard, and turn down the brightness to help an older battery.

## Permissions

- **Location** — Safari asks the first time; allow it so the weather matches where you are. Or skip it and set a city in Settings → Location.
- **Microphone** — only asked if you choose the Microphone visualizer. To stop Safari re-asking after every reload, open the site in Safari, tap **aA → Website Settings**, and set Microphone to *Allow*. For the Home Screen app, iOS remembers the choice per session; a single tap on the page starts listening after a reload.

## Updating

The app updates itself when the page reloads (it also reloads data at midnight). Pull down to refresh in Safari, or close and reopen the Home Screen app.

## Troubleshooting

**New settings or features appear but don't respond**
The iPad is holding an old copy of `app.js`. Asset URLs are versioned (`app.js?v=N`) precisely to prevent this, but if it happens:
- Safari: Settings → Safari → Advanced → Website Data → swipe to delete `beewiser-software.github.io`, then reopen the page.
- Home Screen app: delete the icon and add it again from Safari.

**Weather shows "Weather unavailable"**
The device is offline or Open-Meteo is unreachable. It retries every 2 minutes automatically. Check Wi-Fi; if the problem persists, set the city manually in Settings → Location.

**"Location unknown"**
Geolocation was denied and the IP lookup failed. Set the city manually.

**Visualizer bars don't move in Microphone mode**
Tap anywhere once (iOS needs a gesture to start audio), check the microphone permission, and make sure nothing else is using the mic. If the note says the microphone is unavailable, the bars are showing the Ambient animation instead.

**The 7-day forecast is cut off at the bottom**
This should not happen on a 1024×768 screen in landscape. Make sure the page is running as a Home Screen app (Safari's toolbars take ~70 px), and that Settings → Display → Display Zoom is set to *Standard*, not *Larger Text*.

**Text looks slightly different from the screenshots**
Fonts are system fonts, so they vary by platform; on iPadOS you get San Francisco / New York as intended.

## Older iPads

The code is written in plain ES5 and avoids recent CSS features, so it should also work on iPadOS 13–14. iOS 12 and earlier lack some CSS (`conic-gradient`, `mask`) used by the weather scenes and visualizer colours; the rest of the dashboard still works.
