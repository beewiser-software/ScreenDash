/* ScreenDash — static data: themes, vocabulary, fallback quotes, WMO weather codes */

/* Each theme carries a per-widget tint so every card gets its own colour. Order: clock, now, cond, chart, word, quote, forecast. */
window.SD_THEMES = [
  { id: 'midnight', name: 'Midnight', tints: ['#818cf8', '#38bdf8', '#22d3ee', '#34d399', '#fbbf24', '#f472b6', '#a78bfa'] },
  { id: 'slate', name: 'Slate', tints: ['#2dd4bf', '#60a5fa', '#38bdf8', '#4ade80', '#facc15', '#fb7185', '#a78bfa'] },
  { id: 'charcoal', name: 'Charcoal', tints: ['#f5a524', '#ffd166', '#f87171', '#4ade80', '#60a5fa', '#e879f9', '#94a3b8'] },
  { id: 'forest', name: 'Forest', tints: ['#6ee7b7', '#bef264', '#34d399', '#2dd4bf', '#fde047', '#fb923c', '#86efac'] },
  { id: 'ocean', name: 'Ocean', tints: ['#22d3ee', '#7dd3fc', '#38bdf8', '#2dd4bf', '#fde68a', '#f0abfc', '#818cf8'] },
  { id: 'aubergine', name: 'Aubergine', tints: ['#f472b6', '#c084fc', '#e879f9', '#a78bfa', '#fbbf24', '#fb7185', '#67e8f9'] },
  { id: 'ember', name: 'Ember', tints: ['#fb923c', '#f87171', '#fbbf24', '#fb7185', '#fde68a', '#f472b6', '#fdba74'] },
  { id: 'sunset', name: 'Sunset', tints: ['#fb7185', '#fbbf24', '#fb923c', '#f472b6', '#fde68a', '#c084fc', '#f9a8d4'] },
  { id: 'nord', name: 'Nord', tints: ['#88c0d0', '#81a1c1', '#8fbcbb', '#a3be8c', '#ebcb8b', '#b48ead', '#d08770'] },
  { id: 'dracula', name: 'Dracula', tints: ['#bd93f9', '#8be9fd', '#50fa7b', '#ffb86c', '#f1fa8c', '#ff79c6', '#ff5555'] },
  { id: 'gruvbox', name: 'Gruvbox', tints: ['#fabd2f', '#83a598', '#8ec07c', '#b8bb26', '#fe8019', '#d3869b', '#fb4934'] },
  { id: 'solarized-dark', name: 'Solarized Dark', tints: ['#2aa198', '#268bd2', '#859900', '#b58900', '#cb4b16', '#d33682', '#6c71c4'] },
  { id: 'mono', name: 'Mono', tints: ['#ffffff', '#d4d4d4', '#a3a3a3', '#e5e5e5', '#bdbdbd', '#9a9a9a', '#c8c8c8'] },
  { id: 'solarized-light', name: 'Solarized Light', light: true, tints: ['#268bd2', '#2aa198', '#859900', '#b58900', '#cb4b16', '#d33682', '#6c71c4'] },
  { id: 'paper', name: 'Paper', light: true, tints: ['#2563eb', '#0ea5e9', '#14b8a6', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6'] },
  { id: 'linen', name: 'Linen', light: true, tints: ['#c2663a', '#d4a373', '#e9b44c', '#8a9a5b', '#bc6c25', '#a44a3f', '#7f9183'] },
  { id: 'mint', name: 'Mint', light: true, tints: ['#0f9d7a', '#2f6fdb', '#14b8a6', '#22c55e', '#eab308', '#f472b6', '#60a5fa'] },
  { id: 'sky', name: 'Sky', light: true, tints: ['#0369a1', '#0ea5e9', '#06b6d4', '#10b981', '#d97706', '#e11d48', '#6366f1'] },
  { id: 'rose', name: 'Rose', light: true, tints: ['#be123c', '#f472b6', '#fb7185', '#e11d48', '#f59e0b', '#9d174d', '#c084fc'] },
  { id: 'lavender', name: 'Lavender', light: true, tints: ['#6d28d9', '#a78bfa', '#8b5cf6', '#db2777', '#f59e0b', '#ec4899', '#3b82f6'] }
];

/* Widget keys in the same order as theme tints; `cls` is the card's class suffix. */
window.SD_CARDS = [
  { key: 'clock', name: 'Clock' },
  { key: 'now', name: 'Now' },
  { key: 'cond', name: 'Today' },
  { key: 'chart', name: 'Feels like' },
  { key: 'word', name: 'Word' },
  { key: 'quote', name: 'Quote' },
  { key: 'forecast', name: 'Forecast' }
];

/* Font stacks built from fonts that ship with iPadOS; no downloads needed. */
window.SD_FONTS = [
  { id: 'system', name: 'System', stack: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
  { id: 'rounded', name: 'Rounded', stack: 'ui-rounded, "SF Pro Rounded", -apple-system, "Segoe UI", Roboto, sans-serif' },
  { id: 'serif', name: 'Serif', stack: 'ui-serif, "New York", Charter, Georgia, "Times New Roman", serif' },
  { id: 'avenir', name: 'Avenir', stack: '"Avenir Next", Avenir, "Segoe UI", "Helvetica Neue", sans-serif' },
  { id: 'futura', name: 'Futura', stack: 'Futura, "Century Gothic", "Trebuchet MS", sans-serif' },
  { id: 'optima', name: 'Optima', stack: 'Optima, Candara, "Gill Sans", "Segoe UI", sans-serif' },
  { id: 'gill', name: 'Gill Sans', stack: '"Gill Sans", "Gill Sans MT", Calibri, "Segoe UI", sans-serif' },
  { id: 'georgia', name: 'Georgia', stack: 'Georgia, "Times New Roman", serif' },
  { id: 'didot', name: 'Didot', stack: 'Didot, "Bodoni 72", "Playfair Display", Georgia, serif' },
  { id: 'mono', name: 'Mono', stack: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace' }
];

/* Cities offered for the world clocks, grouped for the picker. IANA zone ids are resolved by Intl.DateTimeFormat. */
window.SD_CITIES = [
  { group: 'Americas', items: [
    ['Honolulu', 'Pacific/Honolulu'], ['Anchorage', 'America/Anchorage'], ['Los Angeles', 'America/Los_Angeles'],
    ['Vancouver', 'America/Vancouver'], ['Denver', 'America/Denver'], ['Chicago', 'America/Chicago'],
    ['Mexico City', 'America/Mexico_City'], ['New York', 'America/New_York'], ['Toronto', 'America/Toronto'],
    ['Bogotá', 'America/Bogota'], ['Lima', 'America/Lima'], ['Santiago', 'America/Santiago'],
    ['São Paulo', 'America/Sao_Paulo'], ['Buenos Aires', 'America/Argentina/Buenos_Aires']
  ] },
  { group: 'Europe', items: [
    ['London', 'Europe/London'], ['Dublin', 'Europe/Dublin'], ['Lisbon', 'Europe/Lisbon'], ['Paris', 'Europe/Paris'],
    ['Amsterdam', 'Europe/Amsterdam'], ['Berlin', 'Europe/Berlin'], ['Madrid', 'Europe/Madrid'], ['Rome', 'Europe/Rome'],
    ['Zurich', 'Europe/Zurich'], ['Stockholm', 'Europe/Stockholm'], ['Warsaw', 'Europe/Warsaw'], ['Athens', 'Europe/Athens'],
    ['Kyiv', 'Europe/Kyiv'], ['Istanbul', 'Europe/Istanbul'], ['Moscow', 'Europe/Moscow']
  ] },
  { group: 'Africa & Middle East', items: [
    ['Lagos', 'Africa/Lagos'], ['Cairo', 'Africa/Cairo'], ['Johannesburg', 'Africa/Johannesburg'], ['Nairobi', 'Africa/Nairobi'],
    ['Tel Aviv', 'Asia/Jerusalem'], ['Riyadh', 'Asia/Riyadh'], ['Dubai', 'Asia/Dubai'], ['Tehran', 'Asia/Tehran']
  ] },
  { group: 'Asia', items: [
    ['Karachi', 'Asia/Karachi'], ['New Delhi', 'Asia/Kolkata'], ['Mumbai', 'Asia/Kolkata'], ['Kathmandu', 'Asia/Kathmandu'],
    ['Dhaka', 'Asia/Dhaka'], ['Bangkok', 'Asia/Bangkok'], ['Jakarta', 'Asia/Jakarta'], ['Singapore', 'Asia/Singapore'],
    ['Kuala Lumpur', 'Asia/Kuala_Lumpur'], ['Hong Kong', 'Asia/Hong_Kong'], ['Shanghai', 'Asia/Shanghai'], ['Beijing', 'Asia/Shanghai'],
    ['Taipei', 'Asia/Taipei'], ['Manila', 'Asia/Manila'], ['Seoul', 'Asia/Seoul'], ['Tokyo', 'Asia/Tokyo']
  ] },
  { group: 'Oceania', items: [
    ['Perth', 'Australia/Perth'], ['Adelaide', 'Australia/Adelaide'], ['Brisbane', 'Australia/Brisbane'],
    ['Sydney', 'Australia/Sydney'], ['Melbourne', 'Australia/Melbourne'], ['Auckland', 'Pacific/Auckland']
  ] },
  { group: 'Other', items: [['UTC', 'UTC']] }
];

/* Colour choices offered for widget backgrounds and text. */
window.SD_BG_PALETTE = [
  '#0f172a', '#1f2937', '#111111', '#374151', '#4f46e5', '#2563eb', '#0ea5e9', '#0d9488',
  '#059669', '#65a30d', '#ca8a04', '#ea580c', '#dc2626', '#db2777', '#9333ea', '#7c3aed',
  '#f8fafc', '#fde68a', '#fbcfe8', '#bfdbfe', '#bbf7d0', '#e9d5ff'
];
window.SD_TEXT_PALETTE = [
  '#ffffff', '#f1f5f9', '#fde68a', '#fbcfe8', '#bfdbfe', '#bbf7d0', '#94a3b8', '#64748b',
  '#334155', '#1e293b', '#0f172a', '#000000', '#7c2d12', '#14532d', '#1e3a8a', '#581c87'
];

/* Curated vocabulary; one is picked at random on every page load. */
window.SD_WORDS = [
  'serendipity', 'ephemeral', 'luminous', 'resilience', 'eloquent', 'meticulous', 'ubiquitous',
  'benevolent', 'candor', 'diligent', 'ethereal', 'gregarious', 'halcyon', 'idyllic', 'jubilant',
  'kindred', 'labyrinth', 'mellifluous', 'nostalgia', 'oblivion', 'panacea', 'quintessential',
  'reverie', 'solace', 'tranquil', 'umbrage', 'verdant', 'whimsical', 'zenith', 'zephyr',
  'alacrity', 'ambivalent', 'audacious', 'austere', 'brevity', 'cacophony', 'catharsis',
  'clandestine', 'cogent', 'copious', 'demure', 'desolate', 'ebullient', 'effervescent', 'elusive',
  'enigma', 'epiphany', 'equanimity', 'euphoria', 'exquisite', 'fastidious', 'felicity', 'fortitude',
  'frugal', 'garrulous', 'hapless', 'harbinger', 'hubris', 'immaculate', 'impeccable', 'incandescent',
  'indelible', 'ineffable', 'insatiable', 'intrepid', 'iridescent', 'juxtapose', 'kaleidoscope',
  'languid', 'lucid', 'magnanimous', 'melancholy', 'mercurial', 'nebulous', 'nonchalant', 'opulent',
  'ostentatious', 'paradox', 'pensive', 'perennial', 'pragmatic', 'precocious', 'pristine', 'prolific',
  'prudent', 'quixotic', 'resplendent', 'sagacious', 'sanguine', 'serene', 'sonorous', 'stoic',
  'sublime', 'succinct', 'superfluous', 'surreptitious', 'taciturn', 'tenacious', 'tantalize',
  'unanimous', 'vehement', 'venerable', 'vicarious', 'vivacious', 'voracious', 'wanderlust', 'wistful',
  'zealous', 'abundant', 'adroit', 'aesthetic', 'affable', 'altruism', 'amiable', 'anomaly', 'aplomb',
  'arcane', 'ardent', 'articulate', 'astute', 'benign', 'bucolic', 'candid', 'capricious', 'cherish',
  'coalesce', 'conundrum', 'dauntless', 'delineate', 'discern', 'eclectic', 'elated', 'empathy',
  'emulate', 'endeavor', 'enthrall', 'evanescent', 'exuberant', 'fathom', 'fervent', 'flourish',
  'gratitude', 'harmony', 'humility', 'illuminate', 'imbue', 'inquisitive', 'integrity', 'jovial',
  'keen', 'kinetic', 'lithe', 'loquacious', 'luminary', 'meander', 'mirth', 'mosaic', 'myriad',
  'nimble', 'nuance', 'oasis', 'pacify', 'placid', 'plethora', 'poignant', 'quaint', 'radiant',
  'rejuvenate', 'resonate', 'savor', 'scintillating', 'sincere', 'solitude', 'sophisticated',
  'spontaneous', 'steadfast', 'synergy', 'tenacity', 'thrive', 'timeless', 'tolerance', 'unwavering',
  'uplift', 'utopia', 'valiant', 'vibrant', 'vigilant', 'virtuoso', 'wholesome', 'wisdom', 'zest'
];

/* Used only if the online quote services are unreachable. */
window.SD_QUOTES = [
  ['Simplicity is the ultimate sophistication.', 'Leonardo da Vinci'],
  ['It always seems impossible until it is done.', 'Nelson Mandela'],
  ['Well done is better than well said.', 'Benjamin Franklin'],
  ['The journey of a thousand miles begins with a single step.', 'Lao Tzu'],
  ['Whatever you are, be a good one.', 'Abraham Lincoln'],
  ['In the middle of difficulty lies opportunity.', 'Albert Einstein'],
  ['Happiness depends upon ourselves.', 'Aristotle'],
  ['Act as if what you do makes a difference. It does.', 'William James'],
  ['Life is really simple, but we insist on making it complicated.', 'Confucius'],
  ['The best way out is always through.', 'Robert Frost'],
  ['Turn your wounds into wisdom.', 'Oprah Winfrey'],
  ['What we think, we become.', 'Buddha']
];

/* WMO weather interpretation codes → [label, day icon, night icon] */
window.SD_WMO = {
  0:  ['Clear sky', 'sun', 'moon'],
  1:  ['Mainly clear', 'sun', 'moon'],
  2:  ['Partly cloudy', 'partly', 'partlyNight'],
  3:  ['Overcast', 'cloud', 'cloud'],
  45: ['Fog', 'fog', 'fog'],
  48: ['Rime fog', 'fog', 'fog'],
  51: ['Light drizzle', 'drizzle', 'drizzle'],
  53: ['Drizzle', 'drizzle', 'drizzle'],
  55: ['Dense drizzle', 'drizzle', 'drizzle'],
  56: ['Freezing drizzle', 'drizzle', 'drizzle'],
  57: ['Freezing drizzle', 'drizzle', 'drizzle'],
  61: ['Light rain', 'rain', 'rain'],
  63: ['Rain', 'rain', 'rain'],
  65: ['Heavy rain', 'rain', 'rain'],
  66: ['Freezing rain', 'rain', 'rain'],
  67: ['Freezing rain', 'rain', 'rain'],
  71: ['Light snow', 'snow', 'snow'],
  73: ['Snow', 'snow', 'snow'],
  75: ['Heavy snow', 'snow', 'snow'],
  77: ['Snow grains', 'snow', 'snow'],
  80: ['Light showers', 'rain', 'rain'],
  81: ['Showers', 'rain', 'rain'],
  82: ['Heavy showers', 'rain', 'rain'],
  85: ['Snow showers', 'snow', 'snow'],
  86: ['Heavy snow showers', 'snow', 'snow'],
  95: ['Thunderstorm', 'thunder', 'thunder'],
  96: ['Thunderstorm with hail', 'thunder', 'thunder'],
  99: ['Thunderstorm with hail', 'thunder', 'thunder']
};
