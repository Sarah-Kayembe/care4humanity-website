/**
 * Care for Humanity events: shared data layer.
 * Loads events from events-data.js (window.CFH_EVENTS) and, if set, from a
 * published Google Sheet (window.CFH_EVENTS_SHEET), then cleans them up into
 * one sorted list. Used by the News & Events page and the single event page.
 */
(function() {
  "use strict";

  const TZ = 'Africa/Gaborone'
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const SHORT = MONTHS.map(m => m.slice(0, 3))
  const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

  const CATEGORIES = [
    { name: 'Volunteering', icon: 'bx-donate-heart' },
    { name: 'Fundraiser', icon: 'bx-cake' },
    { name: 'Education', icon: 'bx-book-open' },
    { name: 'Wildlife', icon: 'bx-leaf' },
    { name: 'Health', icon: 'bx-plus-medical' },
    { name: 'Community', icon: 'bx-group' },
    { name: 'Celebration', icon: 'bx-party' },
    { name: 'News', icon: 'bx-news' }
  ]

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  const slug = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
  const yes = v => /^(y|yes|true|1|x)$/i.test(String(v == null ? '' : v).trim())
  const ymd = d => d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0')
  const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

  // Dates: "2026-11-14" is best. Also accepts 14/11/2026 (day first) and "14 November 2026".
  function parseDate(v) {
    v = String(v == null ? '' : v).trim()
    if (!v) return null
    let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
    if (m) return new Date(+m[1], +m[2] - 1, +m[3])
    m = v.match(/^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})$/)
    if (m) {
      // Day first (Botswana style) unless the second number can only be a day, e.g. 11/14/2026
      const a = +m[1], b = +m[2]
      return b > 12 && a <= 12 ? new Date(+m[3], a - 1, b) : new Date(+m[3], b - 1, a)
    }
    m = v.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/)
    if (m) {
      const mi = MONTHS.findIndex(x => x.toLowerCase().startsWith(m[2].toLowerCase().slice(0, 3)))
      if (mi >= 0) return new Date(+m[3], mi, +m[1])
    }
    const d = new Date(v)
    return isNaN(d) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate())
  }
  // Times: "09:00", "9:00", "9am", "9:30 PM"
  function parseTime(v) {
    v = String(v == null ? '' : v).trim().toLowerCase()
    if (!v) return ''
    const m = v.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/)
    if (!m) return ''
    let h = +m[1]; const min = +(m[2] || 0)
    if (m[3] === 'pm' && h < 12) h += 12
    if (m[3] === 'am' && h === 12) h = 0
    return String(h).padStart(2, '0') + ':' + String(min).padStart(2, '0')
  }
  // Google Drive share links become direct image links
  function imageUrl(u) {
    u = String(u || '').trim()
    if (!u) return ''
    const m = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]+)/)
    if (m) return 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w1600'
    return u
  }
  const list = v => Array.isArray(v) ? v : String(v || '').split(/[,;\n]+/).map(s => s.trim()).filter(Boolean)

  function normalize(raw, i) {
    const r = {}
    Object.keys(raw || {}).forEach(k => { r[k.trim().toLowerCase().replace(/[\s_-]+/g, '')] = raw[k] })
    const title = String(r.title || '').trim()
    const start = parseDate(r.date || r.startdate)
    if (!title || !start) return null
    const end = parseDate(r.enddate) || start
    const cat = String(r.category || r.type || '').trim()
    const catMatch = CATEGORIES.find(c => c.name.toLowerCase() === cat.toLowerCase())
    const e = {
      title,
      start, end: end < start ? start : end,
      date: ymd(start),
      time: parseTime(r.time || r.starttime),
      endTime: parseTime(r.endtime),
      hours: String(r.hours || '').trim(),
      days: list(r.days || r.repeat).map(d => d.slice(0, 3).toLowerCase()).filter(d => DAYS.includes(d)),
      category: catMatch ? catMatch.name : (cat || 'Community'),
      organizer: String(r.organizer || r.presentedby || 'Care for Humanity').trim(),
      location: String(r.location || '').trim(),
      online: yes(r.online) || /^online$/i.test(String(r.location || '').trim()),
      address: String(r.address || '').trim(),
      lat: parseFloat(r.lat || r.latitude),
      lng: parseFloat(r.lng || r.lon || r.longitude),
      phone: String(r.phone || '').trim(),
      email: String(r.email || '').trim(),
      summary: String(r.summary || '').trim(),
      description: String(r.description || '').trim(),
      image: imageUrl(r.image || r.cover || r.photo),
      gallery: list(r.gallery || r.photos).map(imageUrl),
      instagram: String(r.instagram || '').trim(),
      link: String(r.link || r.website || '').trim(),
      linkLabel: String(r.linklabel || '').trim(),
      signup: yes(r.signup),
      featured: String(r.featured || '').trim().toLowerCase(),
      inTimeline: yes(r.intimeline),
      hidden: yes(r.hidden) || yes(r.draft)
    }
    if (e.online && !e.location) e.location = 'Online'
    // No main photo? Use the first extra photo so the card still has its own picture.
    if (!e.image && e.gallery.length) e.image = e.gallery.shift()
    if (!e.summary && e.description) e.summary = e.description.split(/\n/)[0].slice(0, 160)
    e.id = slug(r.id) || slug(e.title + '-' + e.date) || 'event-' + i
    return e
  }

  // Small CSV parser (handles quotes, commas and line breaks inside cells)
  function parseCSV(text) {
    const rows = []; let row = []; let cell = ''; let q = false
    for (let i = 0; i < text.length; i++) {
      const c = text[i]
      if (q) {
        if (c === '"' && text[i + 1] === '"') { cell += '"'; i++ }
        else if (c === '"') q = false
        else cell += c
      } else if (c === '"') q = true
      else if (c === ',') { row.push(cell); cell = '' }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++
        row.push(cell); rows.push(row); row = []; cell = ''
      } else cell += c
    }
    if (cell || row.length) { row.push(cell); rows.push(row) }
    const head = (rows.shift() || []).map(h => h.trim())
    return rows.filter(r => r.some(c => c.trim())).map(r => {
      const o = {}; head.forEach((h, i) => { o[h] = r[i] }); return o
    })
  }

  let cache = null
  function load() {
    if (cache) return cache
    const local = (window.CFH_EVENTS || []).slice()
    const url = String(window.CFH_EVENTS_SHEET || '').trim()
    const fromSheet = url
      ? fetch(url, { cache: 'no-store' })
          .then(r => r.ok ? r.text() : '')
          .then(text => {
            // Live feed from the Google script returns JSON; a published sheet returns CSV.
            const t = text.trim()
            if (t.startsWith('{') || t.startsWith('[')) {
              const data = JSON.parse(t)
              return Array.isArray(data) ? data : (data.events || [])
            }
            return parseCSV(text)
          })
          .catch(() => [])
      : Promise.resolve([])
    cache = fromSheet.then(rows => {
      const seen = new Set()
      return rows.concat(local).map(normalize).filter(e => e && !e.hidden)
        .filter(e => { if (seen.has(e.id)) return false; seen.add(e.id); return true })
        .sort((a, b) => a.start - b.start || a.time.localeCompare(b.time) || a.title.localeCompare(b.title))
    })
    return cache
  }

  // Labels
  const today = () => { const t = new Date(); t.setHours(0, 0, 0, 0); return t }
  const isPast = e => e.end < today()
  const fmt12 = t => { if (!t) return ''; let [h, m] = t.split(':').map(Number); const ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return h + (m ? ':' + String(m).padStart(2, '0') : '') + ' ' + ap }
  const longDate = d => d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear()
  const dateRange = e => sameDay(e.start, e.end) ? longDate(e.start) : longDate(e.start) + ' to ' + longDate(e.end)
  const shortRange = e => {
    const a = SHORT[e.start.getMonth()] + ' ' + e.start.getDate()
    if (sameDay(e.start, e.end)) return a + (e.start.getFullYear() !== new Date().getFullYear() ? ', ' + e.start.getFullYear() : '')
    return a + ' to ' + SHORT[e.end.getMonth()] + ' ' + e.end.getDate() + (e.end.getFullYear() !== new Date().getFullYear() ? ', ' + e.end.getFullYear() : '')
  }
  const pillRange = e => {
    const f = d => SHORT[d.getMonth()].toUpperCase() + ' ' + d.getDate() + ', ' + d.getFullYear()
    return sameDay(e.start, e.end) ? f(e.start) : f(e.start) + ' to ' + f(e.end)
  }
  const timeLabel = e => e.time ? fmt12(e.time) + (e.endTime ? ' to ' + fmt12(e.endTime) : '') : ''
  const dayNames = { sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday' }
  const hoursLabel = e => {
    if (e.hours) return e.hours
    const t = timeLabel(e)
    if (e.days.length) return 'Every ' + e.days.map(d => dayNames[d]).join(' and ') + (t ? ', ' + t : '')
    return t || 'All day'
  }
  const place = e => e.online ? 'Online' : [e.location, e.address].filter(Boolean).join(', ')
  const mapsLink = e => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(!isNaN(e.lat) && !isNaN(e.lng) ? e.lat + ',' + e.lng : place(e))
  const mapsEmbed = e => 'https://maps.google.com/maps?q=' + encodeURIComponent(!isNaN(e.lat) && !isNaN(e.lng) ? e.lat + ',' + e.lng : place(e)) + '&z=15&output=embed'
  const onDay = (e, d) => d >= e.start && d <= e.end && (!e.days.length || e.days.includes(DAYS[d.getDay()]))
  const url = e => 'event.html?id=' + encodeURIComponent(e.id)
  const catIcon = name => (CATEGORIES.find(c => c.name === name) || { icon: 'bx-calendar-event' }).icon

  // Add to calendar
  const stampStart = e => e.time ? ymd(e.start) + 'T' + e.time.replace(':', '') + '00' : ymd(e.start)
  const stampEnd = e => {
    const lastDay = e.days.length ? e.start : e.end
    if (!e.time) { const x = new Date(lastDay); x.setDate(x.getDate() + 1); return ymd(x) }
    if (e.endTime) return ymd(lastDay) + 'T' + e.endTime.replace(':', '') + '00'
    const [h, m] = e.time.split(':').map(Number)
    return ymd(lastDay) + 'T' + String(Math.min(h + 2, 23)).padStart(2, '0') + String(m).padStart(2, '0') + '00'
  }
  const googleCal = e => 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    '&text=' + encodeURIComponent(e.title) + '&dates=' + stampStart(e) + '/' + stampEnd(e) +
    '&ctz=' + encodeURIComponent(TZ) +
    '&details=' + encodeURIComponent((e.summary || e.description || '') + '\n\n' + location.origin + location.pathname.replace(/[^/]*$/, '') + url(e)) +
    '&location=' + encodeURIComponent(place(e))
  function downloadIcs(e) {
    const line = s => String(s || '').replace(/\\/g, '\\\\').replace(/[,;]/g, m => '\\' + m).replace(/\n/g, '\\n')
    const dt = (k, v) => e.time ? k + ';TZID=' + TZ + ':' + v : k + ';VALUE=DATE:' + v
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Care for Humanity//Events//EN', 'BEGIN:VEVENT',
      'UID:' + e.id + '@careforhumanity.co.bw',
      'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, ''),
      dt('DTSTART', stampStart(e)), dt('DTEND', stampEnd(e))]
    if (e.days.length) lines.push('RRULE:FREQ=WEEKLY;BYDAY=' + e.days.map(d => d.slice(0, 2).toUpperCase()).join(',') + ';UNTIL=' + ymd(e.end) + 'T235959Z')
    lines.push('SUMMARY:' + line(e.title), 'LOCATION:' + line(place(e)), 'DESCRIPTION:' + line(e.summary || e.description), 'END:VEVENT', 'END:VCALENDAR')
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = (e.id || 'event') + '.ics'
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  // Event card used on listing pages
  function card(e) {
    const img = e.image || 'assets/img/photos/hero.webp'
    return `<a class="ev-tile" href="${url(e)}">
      <div class="ev-tile-img"><img src="${esc(img)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='assets/img/photos/hero.webp'">${isPast(e) ? '<span class="ev-flag">Past event</span>' : ''}</div>
      <div class="ev-tile-body">
        <span class="ev-kicker"><i class="bx ${catIcon(e.category)}"></i> ${esc(e.category)}</span>
        <h3>${esc(e.title)}</h3>
        <span class="ev-when">${esc(shortRange(e))}${e.location ? ' · ' + esc(e.location) : ''}</span>
      </div>
    </a>`
  }

  window.CFHEvents = {
    load, CATEGORIES, MONTHS, SHORT, esc, isPast, today, sameDay, onDay, url, card, catIcon,
    dateRange, shortRange, pillRange, timeLabel, hoursLabel, place, mapsLink, mapsEmbed, googleCal, downloadIcs
  }
})()
