// Vercel serverless funkce: přečte iCal feed Google Kalendáře rezervací
// a vrátí JSON intervalů obsazenosti [od, do) – bez názvů a detailů
// událostí, ty zůstávají jen zde na serveru.
//
// Kalendář NENÍ veřejný. Čte se přes „Tajnou adresu ve formátu iCal"
// (Nastavení kalendáře → Integrace kalendáře), uloženou v proměnné
// prostředí OBSAZENOST_ICS_URL na Vercelu (Settings → Environment
// Variables). Tajná adresa nesmí do repa – repo je veřejné.

const ICS_URL = process.env.OBSAZENOST_ICS_URL;

// 'YYYYMMDD' → 'YYYY-MM-DD'
function isoDate(v) {
  return v.slice(0, 4) + '-' + v.slice(4, 6) + '-' + v.slice(6, 8);
}

// posune 'YYYY-MM-DD' o +1 den
function nextDay(iso) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

// Z ICS vytáhne intervaly [od, do). Celodenní události mají DTEND už
// exkluzivní; u událostí s časem se den konce zaokrouhlí nahoru.
// Opakované události (RRULE) se neexpandují – počítá se jen první výskyt.
function parseIcs(ics) {
  const unfolded = ics.replace(/\r?\n[ \t]/g, ''); // rozbalení zalomených řádků
  const intervals = [];
  for (const block of unfolded.split('BEGIN:VEVENT').slice(1)) {
    const event = block.split('END:VEVENT')[0];
    if (/^STATUS:CANCELLED$/m.test(event)) continue;
    const start = event.match(/^DTSTART[^:]*:(\d{8})(T(\d{6}))?/m);
    const end = event.match(/^DTEND[^:]*:(\d{8})(T(\d{6}))?/m);
    if (!start || !end) continue;
    const od = isoDate(start[1]);
    let do_ = isoDate(end[1]);
    if (end[3] && end[3] !== '000000') do_ = nextDay(do_); // čas > půlnoc → celý den obsazen
    if (do_ <= od) do_ = nextDay(od); // událost kratší než den
    intervals.push({ od, do: do_ });
  }
  return intervals;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // kvůli mirroru na GitHub Pages
  try {
    if (!ICS_URL) throw new Error('OBSAZENOST_ICS_URL není nastavena');
    const r = await fetch(ICS_URL, { headers: { 'User-Agent': 'javorinka.eu obsazenost' } });
    if (!r.ok) throw new Error('ICS feed: HTTP ' + r.status);
    const intervals = parseIcs(await r.text());
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');
    res.status(200).json(intervals);
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
};

module.exports.parseIcs = parseIcs; // export pro testy
