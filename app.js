/* ==========================================================================
   ScreenDash — app.js
   Plain ES5 + XHR on purpose so it runs on older iPad Safari.
   Free services: Open-Meteo (weather + geocoding), BigDataCloud (reverse
   geocoding), GeoJS (IP fallback), Free Dictionary API, DummyJSON quotes.
   ========================================================================== */
(function () {
  'use strict';

  var GAP = 16;
  var WEATHER_REFRESH_MS = 15 * 60 * 1000;
  var WEATHER_STALE_MS = 10 * 60 * 1000;
  var WEATHER_RETRY_MS = 2 * 60 * 1000;

  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];

  /* ---------------------------------------------------------------------- */
  /* Helpers                                                                */
  /* ---------------------------------------------------------------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function round(n) { return Math.round(n); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function debounce(fn, ms) {
    var t;
    return function () {
      var self = this, args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, ms);
    };
  }
  function withAlpha(color, alpha) {
    var m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color);
    if (!m) return color;
    var h = m[1];
    if (h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
    var n = parseInt(h, 16);
    return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + alpha + ')';
  }
  // WCAG relative luminance (0 = black, 1 = white) for a hex colour.
  function luminance(hex) {
    var m = /^#([0-9a-f]{6})$/i.exec(hex);
    if (!m) return 0;
    var n = parseInt(m[1], 16);
    var lin = function (c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  }
  function cssVar(name, fallback, el) {
    var v = getComputedStyle(el || document.documentElement).getPropertyValue(name);
    v = v ? v.trim() : '';
    return v || fallback;
  }

  var store = {
    get: function (k) { try { var v = localStorage.getItem('sd:' + k); return v === null ? null : JSON.parse(v); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem('sd:' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
    remove: function (k) { try { localStorage.removeItem('sd:' + k); } catch (e) { /* ignore */ } }
  };

  function getJSON(url, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.timeout = timeoutMs || 12000;
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText)); }
          catch (e) { reject(new Error('Bad JSON from ' + url)); }
        } else {
          reject(new Error('HTTP ' + xhr.status + ' from ' + url));
        }
      };
      xhr.onerror = function () { reject(new Error('Network error: ' + url)); };
      xhr.ontimeout = function () { reject(new Error('Timeout: ' + url)); };
      xhr.send();
    });
  }

  function fmtHM(h, m, hour12) {
    if (hour12) {
      var hh = h % 12 || 12;
      return hh + ':' + pad2(m) + ' ' + (h < 12 ? 'AM' : 'PM');
    }
    return pad2(h) + ':' + pad2(m);
  }
  // Open-Meteo returns local ISO strings ("2026-10-04T06:41"); parse by hand to dodge old-Safari Date quirks.
  function fmtISOTime(iso) {
    var m = /T(\d{2}):(\d{2})/.exec(iso || '');
    return m ? fmtHM(+m[1], +m[2], settings.hour12) : '—';
  }
  function dateFromISO(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }

  /* ---------------------------------------------------------------------- */
  /* Settings                                                               */
  /* ---------------------------------------------------------------------- */
  var settings = {
    theme: store.get('theme') || 'midnight',
    hour12: store.get('hour12') === null ? true : !!store.get('hour12'),
    location: store.get('location') // { lat, lon, name } when chosen manually
  };
  // Appearance overrides layered on top of the theme.
  var saved = store.get('custom') || {};
  var custom = {
    font: saved.font || 'system',
    clockFont: saved.clockFont || 'system',
    weatherAnim: saved.weatherAnim !== false,
    cards: saved.cards || {} // key -> { bg: '#hex' | null, text: '#hex' | null }
  };
  function saveCustom() { store.set('custom', custom); }
  function themeById(id) {
    for (var i = 0; i < window.SD_THEMES.length; i++) if (window.SD_THEMES[i].id === id) return window.SD_THEMES[i];
    return window.SD_THEMES[0];
  }
  function fontById(id) {
    for (var i = 0; i < window.SD_FONTS.length; i++) if (window.SD_FONTS[i].id === id) return window.SD_FONTS[i];
    return window.SD_FONTS[0];
  }

  /* ---------------------------------------------------------------------- */
  /* Icons (stroke-based, inherit currentColor)                             */
  /* ---------------------------------------------------------------------- */
  var CLOUD = 'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z';
  var ICONS = {
    sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    cloud: '<path d="' + CLOUD + '"/>',
    partly: '<circle cx="6.5" cy="6.5" r="2.6"/><path d="M6.5 1.5v1.6M1.5 6.5h1.6M3 3l1.1 1.1M10 3 8.9 4.1M3 10l1.1-1.1"/>' +
      '<g transform="translate(7 7) scale(0.7)"><path d="' + CLOUD + '" vector-effect="non-scaling-stroke"/></g>',
    partlyNight: '<g transform="translate(1 1) scale(0.45)"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" vector-effect="non-scaling-stroke"/></g>' +
      '<g transform="translate(7 7) scale(0.7)"><path d="' + CLOUD + '" vector-effect="non-scaling-stroke"/></g>',
    fog: '<path d="M5 8h14M3 12h18M5 16h14M8 20h8"/>',
    drizzle: '<path d="M8 19v2M8 13v2M16 19v2M16 13v2M12 21v2M12 15v2M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>',
    rain: '<path d="M16 13v8M8 13v8M12 15v8M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>',
    snow: '<path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25M8 16h.01M8 20h.01M12 18h.01M12 22h.01M16 16h.01M16 20h.01"/>',
    thunder: '<path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9M13 11l-4 6h6l-4 6"/>',
    thermo: '<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    quote: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    speaker: '<path d="M11 5 6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/>'
  };
  function svgIcon(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || ICONS.cloud) + '</svg>';
  }
  function wmo(code, isDay) {
    var e = window.SD_WMO[code];
    if (!e) return { label: 'Unknown', icon: 'cloud' };
    return { label: e[0], icon: isDay === 0 ? e[2] : e[1] };
  }
  function injectStaticIcons() {
    $all('[data-icon]').forEach(function (el) {
      el.insertAdjacentHTML('afterbegin', svgIcon(el.getAttribute('data-icon')));
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Masonry layout                                                         */
  /* ---------------------------------------------------------------------- */
  var grid = $('#grid');
  var cards = $all('.card', grid);
  var lastChartWidth = 0;
  // Stretchable cards (word, quote) use a fixed height in multi-column layouts so the
  // full-width forecast beneath them always starts flush and stays on screen.
  var STRETCH_PREF = 260, STRETCH_MIN = 150;
  var FIT_STEPS = [1, 0.92, 0.85, 0.78];

  // Keep in sync with the breakpoints in styles.css.
  function columnsFor(viewportWidth) {
    if (viewportWidth < 600) return 1;
    if (viewportWidth < 900) return 2;
    if (viewportWidth < 1024) return 3;
    return 4;
  }

  function layout() {
    var width = grid.clientWidth;
    if (!width) return;
    var cols = columnsFor(window.innerWidth);
    var colW = (width - GAP * (cols - 1)) / cols;
    var heights = [], bottomCard = [];
    for (var i = 0; i < cols; i++) { heights.push(0); bottomCard.push(null); }

    // Resize stretchable cards at the bottom of their columns so every column ends at the
    // same y as the tallest fixed card (e.g. the chart). Called before placing a full-width card.
    function equalize() {
      var anchor = 0, anchored = false, k;
      for (k = 0; k < cols; k++) {
        if (bottomCard[k] && !bottomCard[k].stretch) { anchor = Math.max(anchor, heights[k]); anchored = true; }
      }
      if (!anchored) {
        for (k = 0; k < cols; k++) if (bottomCard[k]) anchor = Math.max(anchor, bottomCard[k].top + STRETCH_PREF + GAP);
      }
      for (k = 0; k < cols; k++) {
        var p = bottomCard[k];
        if (!p || !p.stretch || p.done) continue;
        p.done = true;
        var h = Math.max(STRETCH_MIN, anchor - GAP - p.top);
        p.card.style.height = h + 'px';
        for (var c = p.col; c < p.col + p.span; c++) heights[c] = p.top + h + GAP;
      }
    }

    cards.forEach(function (card) {
      var wanted = (cols >= 4 && card.getAttribute('data-span-wide')) || card.getAttribute('data-span');
      var span = Math.min(parseInt(wanted, 10) || 1, cols);
      var stretch = cols > 1 && card.hasAttribute('data-stretch');
      if (span === cols && cols > 1) equalize();

      card.style.width = Math.floor(colW * span + GAP * (span - 1)) + 'px';
      card.style.height = stretch ? STRETCH_PREF + 'px' : '';

      // Pick the column window whose tallest column is lowest; ties go left.
      var best = 0, bestH = Infinity;
      for (var c = 0; c <= cols - span; c++) {
        var h = 0;
        for (var k = c; k < c + span; k++) h = Math.max(h, heights[k]);
        if (h < bestH - 1) { bestH = h; best = c; }
      }
      var x = Math.round(best * (colW + GAP));
      var y = Math.round(bestH);
      var t = 'translate3d(' + x + 'px,' + y + 'px,0)';
      card.style.webkitTransform = t;
      card.style.transform = t;

      var cardH = card.offsetHeight;
      var placed = { card: card, top: y, col: best, span: span, stretch: stretch };
      for (var k2 = best; k2 < best + span; k2++) {
        heights[k2] = y + cardH + GAP;
        bottomCard[k2] = placed;
      }
    });

    var total = 0;
    for (i = 0; i < cols; i++) total = Math.max(total, heights[i]);
    grid.style.height = Math.max(0, total - GAP) + 'px';

    if (!grid.classList.contains('ready')) {
      // Enable transitions only after the first paint so cards don't fly in from 0,0.
      setTimeout(function () { grid.classList.add('ready'); }, 30);
    }

    fitStretchCards();
    var canvas = $('#feelsChart');
    if (canvas && canvas.clientWidth !== lastChartWidth) drawChart();
  }

  // Shrink type in fixed-height cards step by step; if it still overflows, fade it and offer the modal.
  function fitStretchCards() {
    $all('.card[data-stretch]', grid).forEach(function (card) {
      var body = $('.card-body', card), hint = $('.more-hint', card);
      if (!body) return;
      hint.hidden = true;
      card.classList.remove('clipped');
      if (!card.style.height) { body.style.removeProperty('--fit'); return; }
      var i = 0;
      body.style.setProperty('--fit', FIT_STEPS[0]);
      while (body.scrollHeight > body.clientHeight + 1 && i < FIT_STEPS.length - 1) {
        i++;
        body.style.setProperty('--fit', FIT_STEPS[i]);
      }
      if (body.scrollHeight > body.clientHeight + 1) {
        card.classList.add('clipped');
        hint.hidden = false;
      }
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Clock                                                                  */
  /* ---------------------------------------------------------------------- */
  var elHM = $('#clockHM'), elAmPm = $('#clockAmPm'), elSec = $('#clockSec'),
    elDay = $('#clockDay'), elDate = $('#clockDate');
  var lastDateKey = null;
  var lastViewportW = window.innerWidth;

  function tickClock() {
    var d = new Date();
    var h = d.getHours(), m = d.getMinutes(), s = d.getSeconds();
    if (settings.hour12) {
      elHM.textContent = (h % 12 || 12) + ':' + pad2(m);
      elAmPm.textContent = h < 12 ? 'AM' : 'PM';
    } else {
      elHM.textContent = pad2(h) + ':' + pad2(m);
      elAmPm.textContent = '';
    }
    elSec.textContent = pad2(s);
    elDay.textContent = DAYS[d.getDay()];
    elDate.textContent = d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();

    var key = d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();
    if (lastDateKey && key !== lastDateKey) onNewDay();
    lastDateKey = key;

    // Safety net: some older Safari builds skip the resize event on rotation.
    if (window.innerWidth !== lastViewportW) {
      lastViewportW = window.innerWidth;
      layout();
      drawChart();
    }
  }
  function startClock() {
    tickClock();
    // Align ticks to the wall-clock second.
    setTimeout(function () {
      tickClock();
      setInterval(tickClock, 1000);
    }, 1000 - (Date.now() % 1000));
  }
  function onNewDay() {
    loadWord();
    loadQuote();
    refreshWeather();
  }

  /* ---------------------------------------------------------------------- */
  /* Location                                                               */
  /* ---------------------------------------------------------------------- */
  var autoLocation = null;

  function geolocate() {
    return new Promise(function (resolve, reject) {
      if (!navigator.geolocation) return reject(new Error('Geolocation unsupported'));
      var done = false;
      var timer = setTimeout(function () {
        if (!done) { done = true; reject(new Error('Geolocation timeout')); }
      }, 10000);
      navigator.geolocation.getCurrentPosition(function (pos) {
        if (done) return;
        done = true; clearTimeout(timer);
        resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      }, function (err) {
        if (done) return;
        done = true; clearTimeout(timer);
        reject(err);
      }, { enableHighAccuracy: false, timeout: 9000, maximumAge: 10 * 60 * 1000 });
    });
  }
  function reverseGeocode(c) {
    var url = 'https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' + c.lat +
      '&longitude=' + c.lon + '&localityLanguage=en';
    return getJSON(url, 8000).then(function (r) {
      var name = r.city || r.locality || r.principalSubdivision || '';
      if (name && (r.countryCode || r.countryName)) name += ', ' + (r.countryCode || r.countryName);
      return { lat: c.lat, lon: c.lon, name: name || 'My location' };
    }).catch(function () {
      return { lat: c.lat, lon: c.lon, name: 'My location' };
    });
  }
  function ipLocate() {
    return getJSON('https://get.geojs.io/v1/ip/geo.json', 8000).then(function (r) {
      var lat = parseFloat(r.latitude), lon = parseFloat(r.longitude);
      if (!isFinite(lat) || !isFinite(lon)) throw new Error('No coordinates from IP lookup');
      var name = r.city || r.region || '';
      if (name && r.country_code) name += ', ' + r.country_code;
      return { lat: lat, lon: lon, name: name || 'Approximate location' };
    });
  }
  function resolveLocation() {
    if (settings.location) return Promise.resolve(settings.location);
    if (autoLocation) return Promise.resolve(autoLocation);
    return geolocate().then(reverseGeocode).catch(ipLocate).then(function (loc) {
      autoLocation = loc;
      return loc;
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Weather                                                                */
  /* ---------------------------------------------------------------------- */
  var weather = { data: null, loc: null, fetchedAt: 0, today: null };
  var weatherRetryTimer = null;

  function weatherURL(loc) {
    return 'https://api.open-meteo.com/v1/forecast?latitude=' + loc.lat + '&longitude=' + loc.lon +
      '&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m' +
      '&hourly=temperature_2m,apparent_temperature' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max' +
      '&timezone=auto&forecast_days=7';
  }

  function refreshWeather() {
    clearTimeout(weatherRetryTimer);
    return resolveLocation().then(function (loc) {
      $('#nowLocation').textContent = loc.name;
      $('#locCurrent').textContent = loc.name + (settings.location ? '' : ' (auto-detected)');
      return getJSON(weatherURL(loc)).then(function (data) {
        weather.data = data;
        weather.loc = loc;
        weather.fetchedAt = Date.now();
        weather.today = extractToday(data);
        renderWeather();
      });
    }).catch(function (err) {
      if (window.console) console.warn('Weather failed:', err && err.message ? err.message : err);
      if (!weather.data) {
        $('#nowTemp').textContent = '—';
        $('#nowFeels').textContent = 'Weather unavailable';
        $('#condText').textContent = 'Could not load weather';
        $('#forecast').innerHTML = '<div class="muted">Forecast unavailable</div>';
        $('#chartEmpty').textContent = 'Chart unavailable';
        if (!weather.loc) $('#nowLocation').textContent = 'Location unknown';
        layout();
      }
      weatherRetryTimer = setTimeout(refreshWeather, WEATHER_RETRY_MS);
    });
  }

  // Current wall-clock time at the forecast location (may differ from the device).
  function locationNow() {
    var off = (weather.data && weather.data.utc_offset_seconds) || 0;
    var d = new Date(Date.now() + off * 1000);
    return { hour: d.getUTCHours(), minute: d.getUTCMinutes() };
  }

  function extractToday(data) {
    var hourly = data.hourly || {};
    var times = hourly.time || [];
    var key = (data.daily && data.daily.time && data.daily.time[0]) || '';
    var feels = [], temps = [];
    for (var i = 0; i < times.length; i++) {
      if (key && times[i].indexOf(key) !== 0) continue;
      feels.push(hourly.apparent_temperature[i]);
      temps.push(hourly.temperature_2m[i]);
    }
    if (feels.length < 2) {
      feels = (hourly.apparent_temperature || []).slice(0, 24);
      temps = (hourly.temperature_2m || []).slice(0, 24);
    }
    return { feels: feels, temps: temps };
  }

  function renderWeather() {
    var data = weather.data;
    if (!data) return;
    var cur = data.current, daily = data.daily;
    var now = wmo(cur.weather_code, cur.is_day);
    var updated = new Date(weather.fetchedAt);

    // Now
    $('#nowTemp').textContent = round(cur.temperature_2m) + '°';
    $('#nowFeels').textContent = 'Feels like ' + round(cur.apparent_temperature) + '°';
    $('#nowIcon').innerHTML = svgIcon(now.icon);
    $('#nowHi').textContent = 'H ' + round(daily.temperature_2m_max[0]) + '°';
    $('#nowLo').textContent = 'L ' + round(daily.temperature_2m_min[0]) + '°';
    $('#nowLocation').textContent = weather.loc.name;
    $('#nowUpdated').textContent = 'Updated ' + fmtHM(updated.getHours(), updated.getMinutes(), settings.hour12);
    setScene(now.icon);

    // Today's conditions
    $('#condIcon').innerHTML = svgIcon(now.icon);
    $('#condText').textContent = now.label;
    var rainChance = daily.precipitation_probability_max[0];
    var uv = daily.uv_index_max[0];
    var stats = [
      ['Humidity', cur.relative_humidity_2m != null ? round(cur.relative_humidity_2m) + '%' : '—'],
      ['Wind', cur.wind_speed_10m != null ? round(cur.wind_speed_10m) + ' km/h' : '—'],
      ['Rain chance', rainChance != null ? round(rainChance) + '%' : '—'],
      ['UV index', uv != null ? round(uv) : '—'],
      ['Sunrise', fmtISOTime(daily.sunrise[0])],
      ['Sunset', fmtISOTime(daily.sunset[0])]
    ];
    $('#condStats').innerHTML = stats.map(function (s) {
      return '<div class="stat"><div class="stat-k">' + esc(s[0]) + '</div><div class="stat-v">' + esc(s[1]) + '</div></div>';
    }).join('');

    // 7-day forecast
    var html = '';
    for (var i = 0; i < daily.time.length && i < 7; i++) {
      var d = dateFromISO(daily.time[i]);
      var w = wmo(daily.weather_code[i], 1);
      var label = i === 0 ? 'Today' : (d ? DAYS_SHORT[d.getDay()] : '');
      html += '<div class="fc' + (i === 0 ? ' today' : '') + '">' +
        '<div class="fc-day">' + label + '</div>' + svgIcon(w.icon) +
        '<div class="fc-cond">' + esc(w.label) + '</div>' +
        '<div class="fc-temps"><span class="fc-hi">' + round(daily.temperature_2m_max[i]) + '°</span>' +
        '<span class="fc-lo">' + round(daily.temperature_2m_min[i]) + '°</span></div></div>';
    }
    $('#forecast').innerHTML = html;

    layout();
    drawChart();
  }

  /* ---------------------------------------------------------------------- */
  /* Feels-like chart (canvas)                                              */
  /* ---------------------------------------------------------------------- */
  function smoothPath(ctx, pts) {
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      ctx.bezierCurveTo(
        p1.x + (p2.x - p0.x) / 6, p1.y + (p2.y - p0.y) / 6,
        p2.x - (p3.x - p1.x) / 6, p2.y - (p3.y - p1.y) / 6,
        p2.x, p2.y
      );
    }
  }
  function interp(arr, t) {
    var i = Math.floor(t);
    if (i >= arr.length - 1) return arr[arr.length - 1];
    if (i < 0) return arr[0];
    return arr[i] + (arr[i + 1] - arr[i]) * (t - i);
  }
  function hourLabel(h) {
    if (!settings.hour12) return pad2(h);
    if (h === 0 || h === 24) return '12am';
    if (h === 12) return '12pm';
    return h < 12 ? h + 'am' : (h - 12) + 'pm';
  }

  function drawChart() {
    var canvas = $('#feelsChart');
    var empty = $('#chartEmpty');
    var today = weather.today;
    if (!canvas || !canvas.getContext) return;
    var cssW = canvas.clientWidth, cssH = canvas.clientHeight;
    if (!cssW || !cssH) return;
    lastChartWidth = cssW;
    if (!today || today.feels.length < 2) return;
    empty.hidden = true;

    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    var chartCard = $('.card-chart');
    var accent = cssVar('--tint', '#818cf8', chartCard);
    var muted = cssVar('--muted', '#94a3b8', chartCard);
    var text = cssVar('--text', '#e2e8f0', chartCard);
    var gridC = cssVar('--tint-line', 'rgba(128,128,128,0.3)', chartCard);
    var font = cssVar('--font', 'sans-serif');

    var feels = today.feels, temps = today.temps, n = feels.length;
    var padL = 36, padR = 14, padT = 22, padB = 24;
    var w = cssW - padL - padR, h = cssH - padT - padB;

    var all = feels.concat(temps).filter(function (v) { return typeof v === 'number' && isFinite(v); });
    var min = Math.min.apply(null, all), max = Math.max.apply(null, all);
    var range = max - min;
    if (range < 4) { var mid = (min + max) / 2; min = mid - 2; max = mid + 2; }
    else { min -= range * 0.15; max += range * 0.15; }
    range = max - min;

    function X(t) { return padL + (t / (n - 1)) * w; }
    function Y(v) { return padT + (1 - (v - min) / range) * h; }
    function pts(arr) { var out = []; for (var i = 0; i < arr.length; i++) out.push({ x: X(i), y: Y(arr[i]) }); return out; }

    ctx.clearRect(0, 0, cssW, cssH);
    ctx.font = '11px ' + font;
    ctx.lineWidth = 1;

    // Horizontal grid + °C labels
    ctx.strokeStyle = gridC;
    ctx.fillStyle = muted;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (var g = 0; g <= 3; g++) {
      var v = min + (range * g) / 3;
      var yy = Math.round(Y(v)) + 0.5;
      ctx.beginPath(); ctx.moveTo(padL, yy); ctx.lineTo(padL + w, yy); ctx.stroke();
      ctx.fillText(round(v) + '°', padL - 8, yy);
    }

    // Hour labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    [0, 6, 12, 18].forEach(function (hr) {
      if (hr < n) ctx.fillText(hourLabel(hr), X(hr), padT + h + 8);
    });

    // Actual temperature (dashed, subdued)
    ctx.save();
    if (ctx.setLineDash) ctx.setLineDash([4, 5]);
    ctx.strokeStyle = muted;
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); smoothPath(ctx, pts(temps)); ctx.stroke();
    ctx.restore();

    // Feels-like area fill
    var fp = pts(feels);
    ctx.beginPath();
    smoothPath(ctx, fp);
    ctx.lineTo(fp[fp.length - 1].x, padT + h);
    ctx.lineTo(fp[0].x, padT + h);
    ctx.closePath();
    var grad = ctx.createLinearGradient(0, padT, 0, padT + h);
    grad.addColorStop(0, withAlpha(accent, 0.35));
    grad.addColorStop(1, withAlpha(accent, 0));
    ctx.fillStyle = grad;
    if (withAlpha(accent, 0) === accent) ctx.globalAlpha = 0.18; // accent wasn't hex; fade the solid fill instead
    ctx.fill();
    ctx.globalAlpha = 1;

    // Feels-like line
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath(); smoothPath(ctx, fp); ctx.stroke();

    // "Now" marker
    var ln = locationNow();
    var t = ln.hour + ln.minute / 60;
    if (t <= n - 1) {
      var nx = X(t), nv = interp(feels, t), ny = Y(nv);
      ctx.save();
      if (ctx.setLineDash) ctx.setLineDash([3, 4]);
      ctx.strokeStyle = muted;
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(nx, padT); ctx.lineTo(nx, padT + h); ctx.stroke();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(nx, ny, 5, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = cssVar('--bg0', '#000');
      ctx.stroke();

      ctx.font = 'bold 12px ' + font;
      ctx.fillStyle = text;
      ctx.textBaseline = 'bottom';
      var lx = nx, labelW = ctx.measureText(round(nv) + '°').width;
      ctx.textAlign = 'center';
      if (lx - labelW / 2 < padL) { ctx.textAlign = 'left'; lx = padL; }
      if (lx + labelW / 2 > padL + w) { ctx.textAlign = 'right'; lx = padL + w; }
      var ly = ny - 10;
      if (ly < padT + 10) { ly = ny + 22; }
      ctx.fillText(round(nv) + '°', lx, ly);
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Word of the day                                                        */
  /* ---------------------------------------------------------------------- */
  // Both sources are normalised to { word, phonetic, audio, meanings: [{ pos, definition, example }] }.
  function fromDictionaryApi(word) {
    return getJSON('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(word), 6000).then(function (res) {
      var entry = res && res[0];
      if (!entry || !entry.meanings || !entry.meanings.length) throw new Error('No entry');
      var phon = '', audio = '';
      (entry.phonetics || []).forEach(function (p) {
        if (p.audio && !audio) { audio = p.audio; if (p.text) phon = p.text; }
      });
      if (!phon) {
        phon = entry.phonetic || '';
        (entry.phonetics || []).forEach(function (p) { if (!phon && p.text) phon = p.text; });
      }
      if (audio && audio.indexOf('//') === 0) audio = 'https:' + audio;
      var meanings = [];
      entry.meanings.forEach(function (m) {
        var def = m.definitions && m.definitions[0];
        if (def) meanings.push({ pos: m.partOfSpeech, definition: def.definition, example: def.example || '' });
      });
      return { word: entry.word, phonetic: phon, audio: audio, meanings: meanings };
    });
  }

  var DATAMUSE_POS = { n: 'noun', v: 'verb', adj: 'adjective', adv: 'adverb', u: '' };
  function fromDatamuse(word) {
    return getJSON('https://api.datamuse.com/words?sp=' + encodeURIComponent(word) + '&md=dr&ipa=1&max=1', 8000).then(function (res) {
      var e = res && res[0];
      if (!e || e.word !== word || !e.defs || !e.defs.length) throw new Error('No entry');
      var phon = '';
      (e.tags || []).forEach(function (t) { if (t.indexOf('ipa_pron:') === 0) phon = '/' + t.slice(9) + '/'; });
      var meanings = [], seen = {};
      e.defs.forEach(function (d) {
        var parts = d.split('\t');
        var pos = DATAMUSE_POS.hasOwnProperty(parts[0]) ? DATAMUSE_POS[parts[0]] : parts[0];
        var text = (parts.length > 1 ? parts[1] : parts[0]).trim();
        if (!text || seen[pos] || meanings.length >= 4) return;
        seen[pos] = true;
        meanings.push({ pos: pos, definition: text, example: '' });
      });
      return { word: e.word, phonetic: phon, audio: '', meanings: meanings };
    });
  }

  var lastWord = null, lastQuote = null;

  function loadWord(attempt) {
    attempt = attempt || 0;
    var word = pick(window.SD_WORDS);
    // Query both sources at once so a slow/down primary doesn't delay the card.
    var fallback = fromDatamuse(word);
    fallback.catch(function () { /* handled below */ });
    return fromDictionaryApi(word)
      .catch(function () { return fallback; })
      .then(renderWord)
      .catch(function () {
        if (attempt < 2) return loadWord(attempt + 1);
        lastWord = null;
        $('#wordBody').innerHTML = '<div class="word">' + esc(word) + '</div>' +
          '<div class="word-def muted">Definition unavailable right now.</div>';
        layout();
      });
  }

  // Compact: first sense (+ example, or a short second sense). Full: up to four senses with examples.
  function wordHTML(entry, full) {
    var canSpeak = !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
    var sizeCls = entry.word.length > 12 ? ' word-sm' : entry.word.length > 9 ? ' word-md' : '';
    var html = '<div class="word' + sizeCls + '">' + esc(entry.word) + '</div>' +
      '<div class="word-phon"><span>' + esc(entry.phonetic) + '</span>' +
      ((entry.audio || canSpeak)
        ? '<button type="button" class="icon-btn say-btn" data-word="' + esc(entry.word) + '" data-audio="' + esc(entry.audio) +
          '" aria-label="Pronounce ' + esc(entry.word) + '">' + svgIcon('speaker') + '</button>'
        : '') +
      '</div>';
    var first = entry.meanings[0], second = entry.meanings[1];
    var senses = full ? entry.meanings.slice(0, 4) : [first];
    if (!full && !first.example && second && first.definition.length < 90 && second.definition.length < 120) senses.push(second);
    senses.forEach(function (m) {
      html += '<div class="word-pos">' + esc(m.pos) + '</div><div class="word-def">' + esc(m.definition) + '</div>';
      if (m.example) html += '<div class="word-ex">“' + esc(m.example) + '”</div>';
    });
    return html;
  }

  function renderWord(entry) {
    lastWord = entry;
    $('#wordBody').innerHTML = wordHTML(entry, false);
    layout();
  }

  function pronounce(word, audioUrl) {
    function tts() {
      if (!(window.speechSynthesis && window.SpeechSynthesisUtterance)) return;
      var u = new SpeechSynthesisUtterance(word);
      u.lang = 'en-US';
      u.rate = 0.9;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    }
    if (!audioUrl) return tts();
    var a = new Audio(audioUrl);
    a.onerror = tts;
    var p = a.play();
    if (p && p.catch) p.catch(tts);
  }

  /* ---------------------------------------------------------------------- */
  /* Quote of the day                                                       */
  /* ---------------------------------------------------------------------- */
  function quoteHTML(text, author) {
    return '<div class="quote-mark" aria-hidden="true">“</div>' +
      '<blockquote class="quote-text' + (text.length > 140 ? ' quote-long' : '') + '">' + esc(text) + '</blockquote>' +
      (author ? '<div class="quote-author">— ' + esc(author) + '</div>' : '');
  }
  function renderQuote(text, author) {
    lastQuote = { text: text, author: author };
    $('#quoteBody').innerHTML = quoteHTML(text, author);
    layout();
  }
  function loadQuote(attempt) {
    attempt = attempt || 0;
    return getJSON('https://dummyjson.com/quotes/random', 8000)
      .then(function (r) {
        if (!r || !r.quote) throw new Error('Empty quote');
        // Very long quotes stretch the card; try once more for a shorter one.
        if (r.quote.length > 180 && attempt < 2) return loadQuote(attempt + 1);
        renderQuote(r.quote, r.author);
      })
      .catch(function () {
        return getJSON('https://api.quotable.io/quotes/random', 8000).then(function (r) {
          var q = r && (r[0] || r);
          if (!q || !q.content) throw new Error('Empty quote');
          renderQuote(q.content, q.author);
        });
      })
      .catch(function () {
        var q = pick(window.SD_QUOTES);
        renderQuote(q[0], q[1]);
      });
  }

  /* ---------------------------------------------------------------------- */
  /* Appearance: theme, per-widget colours, weather scene, fonts            */
  /* ---------------------------------------------------------------------- */
  var SCENES = {
    sun: 'sc-clear-day', moon: 'sc-clear-night', partly: 'sc-partly-day', partlyNight: 'sc-partly-night',
    cloud: 'sc-cloudy', fog: 'sc-fog', drizzle: 'sc-drizzle', rain: 'sc-rain', snow: 'sc-snow', thunder: 'sc-thunder'
  };
  var currentSceneIcon = null;
  var TINT_VARS = ['--tint', '--tint-a', '--tint-b', '--tint-line', '--tint-soft', '--text', '--muted'];

  function cardEl(key) { return $('.card-' + key); }

  function setScene(icon) {
    currentSceneIcon = icon;
    var card = cardEl('now');
    if (!custom.weatherAnim) return;
    var hour = new Date().getHours();
    var cls = SCENES[icon] || (hour >= 6 && hour < 19 ? 'sc-partly-day' : 'sc-partly-night');
    card.className = card.className.replace(/\s*\bsc-[\w-]+/g, '') + ' ' + cls;
  }

  function applyCardColors() {
    var theme = themeById(settings.theme);
    var light = !!theme.light;
    window.SD_CARDS.forEach(function (c, i) {
      var card = cardEl(c.key);
      var o = custom.cards[c.key] || {};
      TINT_VARS.forEach(function (p) { card.style.removeProperty(p); });

      var scene = c.key === 'now' && custom.weatherAnim;
      card.classList.toggle('has-scene', scene);
      if (scene) { setScene(currentSceneIcon); return; }
      card.className = card.className.replace(/\s*\bsc-[\w-]+/g, '');

      var s = card.style;
      if (o.bg) {
        // Solid user colour: derive readable accents from its brightness.
        var dark = luminance(o.bg) < 0.45;
        s.setProperty('--tint-a', withAlpha(o.bg, 0.96));
        s.setProperty('--tint-b', withAlpha(o.bg, 0.82));
        s.setProperty('--tint-line', dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)');
        s.setProperty('--tint-soft', dark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.07)');
        s.setProperty('--tint', dark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.6)');
        s.setProperty('--text', dark ? '#ffffff' : '#111827');
        s.setProperty('--muted', dark ? 'rgba(255,255,255,0.72)' : 'rgba(17,24,39,0.65)');
      } else {
        var tint = theme.tints[i];
        s.setProperty('--tint', tint);
        s.setProperty('--tint-a', withAlpha(tint, light ? 0.34 : 0.3));
        s.setProperty('--tint-b', withAlpha(tint, 0.06));
        s.setProperty('--tint-line', withAlpha(tint, light ? 0.3 : 0.35));
        s.setProperty('--tint-soft', withAlpha(tint, 0.18));
      }
      if (o.text) {
        s.setProperty('--text', o.text);
        s.setProperty('--muted', withAlpha(o.text, 0.7));
      }
    });
    drawChart();
  }

  function applyFonts() {
    var root = document.documentElement.style;
    root.setProperty('--font', fontById(custom.font).stack);
    root.setProperty('--font-clock', fontById(custom.clockFont).stack);
    $all('#fontPick .font-btn').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-font') === custom.font); });
    $all('#clockFontPick .font-btn').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-font') === custom.clockFont); });
    layout();
    drawChart();
  }

  function applyTheme(id, save) {
    document.documentElement.setAttribute('data-theme', id);
    settings.theme = id;
    if (save !== false) store.set('theme', id);
    $all('.swatch-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-theme-id') === id);
    });
    applyCardColors();
  }

  /* ---------------------------------------------------------------------- */
  /* Settings panel & detail modal                                          */
  /* ---------------------------------------------------------------------- */
  var panel = $('#panel'), backdrop = $('#backdrop'), modal = $('#modal');

  function openPanel() { modal.hidden = true; panel.hidden = false; backdrop.hidden = false; }
  function closePanel() { panel.hidden = true; backdrop.hidden = true; }
  function closeOverlays() { panel.hidden = true; modal.hidden = true; backdrop.hidden = true; }

  // Full word/quote content in a modal that borrows the source card's colours.
  function openModal(key) {
    var card = cardEl(key), mc = $('#modalCard');
    TINT_VARS.forEach(function (p) {
      var v = card.style.getPropertyValue(p);
      if (v) mc.style.setProperty(p, v); else mc.style.removeProperty(p);
    });
    $('#modalLabel').innerHTML = $('.card-label', card).innerHTML;
    var body;
    if (key === 'word') body = lastWord ? wordHTML(lastWord, true) : $('#wordBody').innerHTML;
    else body = lastQuote ? quoteHTML(lastQuote.text, lastQuote.author) : $('#quoteBody').innerHTML;
    $('#modalBody').innerHTML = body;
    panel.hidden = true;
    modal.hidden = false;
    backdrop.hidden = false;
    mc.scrollTop = 0;
  }

  function setHour12(v) {
    settings.hour12 = v;
    store.set('hour12', v);
    $all('#hourSeg button').forEach(function (b) {
      b.classList.toggle('active', (b.getAttribute('data-h12') === '1') === v);
    });
    tickClock();
    renderWeather();
  }

  function setManualLocation(loc) {
    settings.location = loc;
    store.set('location', loc);
    weather.data = null;
    $('#locResults').innerHTML = '';
    $('#locSearch').value = '';
    $('#locCurrent').textContent = loc.name;
    $('#nowLocation').textContent = loc.name;
    $('#nowFeels').textContent = 'Loading weather…';
    refreshWeather();
  }

  // Walk up from a click target to the nearest element carrying `attr`, stopping at `root`.
  function closestAttr(target, root, attr) {
    var el = target;
    while (el && el !== root && !(el.getAttribute && el.getAttribute(attr) !== null)) el = el.parentNode;
    return el && el !== root ? el : null;
  }

  var pickedCard = 'clock';

  function fontPickerHTML(current) {
    return window.SD_FONTS.map(function (f) {
      return '<button type="button" class="font-btn' + (f.id === current ? ' active' : '') + '" data-font="' + f.id + '" aria-label="' + esc(f.name) + '">' +
        '<div class="font-pre" style="font-family:' + esc(f.stack) + '">Aa</div><div class="font-name">' + esc(f.name) + '</div></button>';
    }).join('');
  }
  function paletteHTML(colors) {
    return '<button type="button" class="dot auto" data-color="" aria-label="Automatic"></button>' +
      colors.map(function (c) {
        return '<button type="button" class="dot" data-color="' + c + '" style="--dot:' + c + '" aria-label="' + c + '"></button>';
      }).join('');
  }
  function refreshWidgetControls() {
    var o = custom.cards[pickedCard] || {};
    var sceneLocked = pickedCard === 'now' && custom.weatherAnim;
    $all('#widgetPick .chip-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-card') === pickedCard);
    });
    $('#bgPalette').classList.toggle('disabled', sceneLocked);
    $('#textPalette').classList.toggle('disabled', sceneLocked);
    $all('#bgPalette .dot').forEach(function (b) { b.classList.toggle('active', (b.getAttribute('data-color') || '') === (o.bg || '')); });
    $all('#textPalette .dot').forEach(function (b) { b.classList.toggle('active', (b.getAttribute('data-color') || '') === (o.text || '')); });
    $all('#animSeg button').forEach(function (b) { b.classList.toggle('active', (b.getAttribute('data-on') === '1') === custom.weatherAnim); });
  }
  function setCardColor(prop, color) {
    var o = custom.cards[pickedCard] || (custom.cards[pickedCard] = {});
    o[prop] = color || null;
    if (!o.bg && !o.text) delete custom.cards[pickedCard];
    saveCustom();
    applyCardColors();
    refreshWidgetControls();
  }

  function buildPanel() {
    $('#swatches').innerHTML = window.SD_THEMES.map(function (t) {
      return '<div class="swatch"><button type="button" class="swatch-btn" data-theme-id="' + t.id + '" aria-label="' + esc(t.name) + ' theme">' +
        '<div class="swatch-pre" data-theme="' + t.id + '"></div>' +
        '<div class="swatch-name">' + esc(t.name) + '</div></button></div>';
    }).join('');

    $('#swatches').addEventListener('click', function (e) {
      var el = closestAttr(e.target, this, 'data-theme-id');
      if (el) applyTheme(el.getAttribute('data-theme-id'));
    });

    $('#hourSeg').addEventListener('click', function (e) {
      var b = closestAttr(e.target, this, 'data-h12');
      if (b) setHour12(b.getAttribute('data-h12') === '1');
    });

    // Fonts
    $('#fontPick').innerHTML = fontPickerHTML(custom.font);
    $('#clockFontPick').innerHTML = fontPickerHTML(custom.clockFont);
    $('#fontPick').addEventListener('click', function (e) {
      var b = closestAttr(e.target, this, 'data-font');
      if (b) { custom.font = b.getAttribute('data-font'); saveCustom(); applyFonts(); }
    });
    $('#clockFontPick').addEventListener('click', function (e) {
      var b = closestAttr(e.target, this, 'data-font');
      if (b) { custom.clockFont = b.getAttribute('data-font'); saveCustom(); applyFonts(); }
    });

    // Widget colours
    $('#widgetPick').innerHTML = window.SD_CARDS.map(function (c) {
      return '<button type="button" class="chip-btn" data-card="' + c.key + '">' + esc(c.name) + '</button>';
    }).join('');
    $('#bgPalette').innerHTML = paletteHTML(window.SD_BG_PALETTE);
    $('#textPalette').innerHTML = paletteHTML(window.SD_TEXT_PALETTE);
    $('#widgetPick').addEventListener('click', function (e) {
      var b = closestAttr(e.target, this, 'data-card');
      if (b) { pickedCard = b.getAttribute('data-card'); refreshWidgetControls(); }
    });
    $('#bgPalette').addEventListener('click', function (e) {
      var b = closestAttr(e.target, this, 'data-color');
      if (b) setCardColor('bg', b.getAttribute('data-color'));
    });
    $('#textPalette').addEventListener('click', function (e) {
      var b = closestAttr(e.target, this, 'data-color');
      if (b) setCardColor('text', b.getAttribute('data-color'));
    });
    $('#animSeg').addEventListener('click', function (e) {
      var b = closestAttr(e.target, this, 'data-on');
      if (!b) return;
      custom.weatherAnim = b.getAttribute('data-on') === '1';
      saveCustom();
      applyCardColors();
      refreshWidgetControls();
    });
    $('#resetWidgets').addEventListener('click', function () {
      custom.cards = {};
      saveCustom();
      applyCardColors();
      refreshWidgetControls();
    });
    refreshWidgetControls();

    var search = $('#locSearch'), results = $('#locResults');
    search.addEventListener('input', debounce(function () {
      var q = search.value.trim();
      if (q.length < 2) { results.innerHTML = ''; return; }
      getJSON('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(q) + '&count=6&language=en&format=json', 8000)
        .then(function (r) {
          var list = (r && r.results) || [];
          if (!list.length) { results.innerHTML = '<div class="muted">No matches</div>'; return; }
          results.innerHTML = list.map(function (p) {
            var label = [p.name, p.admin1, p.country].filter(Boolean).join(', ');
            var short = p.name + (p.country_code ? ', ' + p.country_code : '');
            return '<button type="button" data-lat="' + p.latitude + '" data-lon="' + p.longitude +
              '" data-name="' + esc(short) + '">' + esc(label) + '</button>';
          }).join('');
        })
        .catch(function () { results.innerHTML = '<div class="muted">Search unavailable</div>'; });
    }, 350));

    results.addEventListener('click', function (e) {
      var b = e.target;
      while (b && b !== this && b.nodeName !== 'BUTTON') b = b.parentNode;
      if (!b || b === this) return;
      setManualLocation({
        lat: parseFloat(b.getAttribute('data-lat')),
        lon: parseFloat(b.getAttribute('data-lon')),
        name: b.getAttribute('data-name')
      });
      closePanel();
    });

    $('#locAuto').addEventListener('click', function () {
      settings.location = null;
      store.remove('location');
      autoLocation = null;
      weather.data = null;
      $('#locCurrent').textContent = 'Detecting…';
      $('#nowLocation').textContent = 'Locating…';
      $('#nowFeels').textContent = 'Loading weather…';
      refreshWeather();
      closePanel();
    });

    $('#settingsBtn').addEventListener('click', openPanel);
    $('#panelClose').addEventListener('click', closePanel);
    $('#modalClose').addEventListener('click', closeOverlays);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeOverlays(); });
    backdrop.addEventListener('click', closeOverlays);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' || e.keyCode === 27) closeOverlays(); });

    // Pronounce buttons live inside tappable cards and the modal; capture phase keeps the tap from opening the modal.
    document.addEventListener('click', function (e) {
      var b = closestAttr(e.target, document.documentElement, 'data-word');
      if (!b) return;
      e.stopPropagation();
      pronounce(b.getAttribute('data-word'), b.getAttribute('data-audio'));
    }, true);
    grid.addEventListener('click', function (e) {
      var card = closestAttr(e.target, grid, 'data-stretch');
      if (card) openModal(card.getAttribute('data-stretch'));
    });
    grid.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ' && e.keyCode !== 13 && e.keyCode !== 32) return;
      var card = closestAttr(e.target, grid, 'data-stretch');
      if (card && e.target === card) { e.preventDefault(); openModal(card.getAttribute('data-stretch')); }
    });

    $all('#hourSeg button').forEach(function (b) {
      b.classList.toggle('active', (b.getAttribute('data-h12') === '1') === settings.hour12);
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Init                                                                   */
  /* ---------------------------------------------------------------------- */
  function init() {
    injectStaticIcons();
    buildPanel();
    applyFonts();
    applyTheme(settings.theme, false);
    startClock();
    layout();

    refreshWeather();
    loadWord();
    loadQuote();

    setInterval(function () { if (!document.hidden) refreshWeather(); }, WEATHER_REFRESH_MS);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && Date.now() - weather.fetchedAt > WEATHER_STALE_MS) refreshWeather();
    });

    var relayout = debounce(function () { layout(); drawChart(); }, 120);
    window.addEventListener('resize', relayout);
    window.addEventListener('orientationchange', function () { setTimeout(relayout, 300); });
    window.addEventListener('load', layout);
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(debounce(layout, 50));
      cards.forEach(function (c) { ro.observe(c); });
    }
  }

  init();
})();
