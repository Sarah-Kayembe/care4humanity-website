/**
 * News & Events page: spotlight banner, featured events, category picker,
 * search, filters, sort, and Grid / Calendar / Map views.
 */
(function() {
  "use strict";
  const E = window.CFHEvents
  if (!E) return
  const $ = s => document.querySelector(s)
  const $$ = s => [...document.querySelectorAll(s)]
  const esc = E.esc

  const state = { period: 'upcoming', q: '', cats: new Set(), loc: '', start: null, end: null, sort: 'date', view: 'grid', shown: 12, month: null }
  let all = []

  E.load().then(events => {
    all = events
    const params = new URLSearchParams(location.search)
    if (params.get('category')) state.cats.add(params.get('category'))
    if (!all.some(e => !E.isPast(e))) state.period = 'all'
    spotlight(); featured(); categories(); locations(); bind(); render()
  })

  // ---------- Spotlight banner ----------
  function spotlight() {
    const box = $('#ev-spotlight')
    if (!box) return
    const up = all.filter(e => !E.isPast(e))
    const e = up.find(x => x.featured === 'spotlight')
    const data = e ? {
      img: e.image || 'assets/img/photos/hero.webp', flag: e.category, kicker: E.dateRange(e) + (e.location ? ' · ' + e.location : ''),
      title: e.title, text: e.summary || e.description, btn: 'Find out more', href: E.url(e)
    } : {
      img: 'assets/img/photos/volunteers-clearing-plants.webp', flag: 'Volunteer', kicker: 'Open all year round',
      title: 'Volunteer with Care for Humanity',
      text: 'If you’re passionate about making a difference, we’d love to have you on board. Tutor students, care for wildlife, pack food hampers and more, side by side with our team.',
      btn: 'Join our community', href: 'contact.html?topic=Volunteer'
    }
    box.innerHTML = `
      <div class="spot-img"><img src="${esc(data.img)}" alt="" loading="lazy"><span class="spot-flag">${esc(data.flag)}</span></div>
      <div class="spot-body">
        <span class="spot-kicker">${esc(data.kicker)}</span>
        <h3>${esc(data.title)}</h3>
        <p>${esc(data.text)}</p>
        <a href="${data.href}" class="btn-orange d-inline-block">${esc(data.btn)}</a>
      </div>`
  }

  // ---------- Featured events ----------
  function featured() {
    const sec = $('#ev-featured'), grid = $('#ev-featured-grid')
    if (!sec || !grid) return
    const up = all.filter(e => !E.isPast(e))
    let list = up.filter(e => e.featured === 'yes' || e.featured === 'spotlight')
    if (list.length < 3) list = list.concat(up.filter(e => !list.includes(e))).slice(0, 3)
    if (!list.length) { sec.hidden = true; return }
    grid.innerHTML = list.slice(0, 3).map(e => `<div class="col-md-6 col-lg-4 mb-4">${E.card(e)}</div>`).join('')
  }

  // ---------- Category picker ----------
  function categories() {
    const track = $('#ev-cats')
    if (!track) return
    const used = new Set(all.map(e => e.category))
    const cats = E.CATEGORIES.concat([...used].filter(c => !E.CATEGORIES.some(x => x.name === c)).map(n => ({ name: n, icon: 'bx-calendar-event' })))
    track.innerHTML = cats.map(c => `<button type="button" class="cat-btn" data-cat="${esc(c.name)}" aria-pressed="false">
      <span class="cat-icon"><i class="bx ${c.icon}"></i></span><span class="cat-name">${esc(c.name)}</span></button>`).join('')
    const scroll = d => track.scrollBy({ left: d * Math.max(200, track.clientWidth * 0.7), behavior: 'smooth' })
    $('#ev-cats-prev') && $('#ev-cats-prev').addEventListener('click', () => scroll(-1))
    $('#ev-cats-next') && $('#ev-cats-next').addEventListener('click', () => scroll(1))
  }

  function locations() {
    const box = $('#ev-locations')
    if (!box) return
    // Three choices only: everything, in person in Botswana, or online
    const opt = (v, label, icon) => `<label class="f-chip"><input type="radio" name="ev-loc" value="${v}"${v === '' ? ' checked' : ''}><span><i class="bx ${icon}"></i> ${label}</span></label>`
    box.innerHTML = opt('', 'Browse all', 'bx-world') + opt('botswana', 'Botswana', 'bx-map') + opt('online', 'Online', 'bx-globe')
  }

  // ---------- Controls ----------
  function bind() {
    const on = (sel, ev, fn) => $$(sel).forEach(el => el.addEventListener(ev, fn))
    on('#ev-search', 'input', e => { state.q = e.target.value.trim().toLowerCase(); state.shown = 12; render() })
    on('[data-period]', 'click', e => { state.period = e.currentTarget.dataset.period; state.shown = 12; state.month = null; render() })
    on('[data-sort]', 'click', e => { state.sort = e.currentTarget.dataset.sort; render() })
    on('[data-view]', 'click', e => { state.view = e.currentTarget.dataset.view; render() })
    on('#ev-cats', 'click', e => {
      const b = e.target.closest('.cat-btn'); if (!b) return
      // One category at a time: picking another one replaces it, picking the same one clears it
      const c = b.dataset.cat
      const wasOn = state.cats.has(c)
      state.cats.clear()
      if (!wasOn) state.cats.add(c)
      state.shown = 12; render()
    })
    on('#ev-locations', 'change', e => { state.loc = e.target.value; state.shown = 12; render() })
    on('#ev-start', 'change', e => { state.start = e.target.value ? new Date(e.target.value + 'T00:00') : null; render() })
    on('#ev-end', 'change', e => { state.end = e.target.value ? new Date(e.target.value + 'T00:00') : null; render() })
    on('#ev-reset', 'click', () => {
      Object.assign(state, { q: '', cats: new Set(), loc: '', start: null, end: null, shown: 12 })
      $('#ev-search').value = ''; $('#ev-start').value = ''; $('#ev-end').value = ''
      const r = $('input[name=ev-loc][value=""]'); if (r) r.checked = true
      render()
    })
    on('#ev-filter-toggle', 'click', () => {
      const layout = $('.ev-layout'); layout.classList.toggle('filters-closed')
      $('#ev-filter-toggle').setAttribute('aria-expanded', !layout.classList.contains('filters-closed'))
    })
    on('#ev-more', 'click', () => { state.shown += 12; render() })
    if (window.matchMedia('(max-width: 991px)').matches) $('.ev-layout').classList.add('filters-closed')
  }

  // ---------- Filtering ----------
  function filtered() {
    const t = E.today()
    let list = all.filter(e => {
      if (state.period === 'upcoming' && e.end < t) return false
      if (state.period === 'past' && e.end >= t) return false
      if (state.cats.size && !state.cats.has(e.category)) return false
      if (state.loc === 'online' && !e.online) return false
      if (state.loc === 'botswana' && e.online) return false
      if (state.start && e.end < state.start) return false
      if (state.end && e.start > state.end) return false
      if (state.q) {
        const hay = [e.title, e.summary, e.description, e.location, e.address, e.organizer, e.category].join(' ').toLowerCase()
        if (!state.q.split(/\s+/).every(w => hay.includes(w))) return false
      }
      return true
    })
    if (state.sort === 'title') list.sort((a, b) => a.title.localeCompare(b.title))
    else if (state.period !== 'upcoming') {
      const up = list.filter(e => e.end >= t), past = list.filter(e => e.end < t).reverse()
      list = up.concat(past)
    }
    return list
  }

  function render() {
    // Control states
    $$('[data-period]').forEach(b => b.classList.toggle('on', b.dataset.period === state.period))
    $$('[data-sort]').forEach(b => b.classList.toggle('on', b.dataset.sort === state.sort))
    $$('[data-view]').forEach(b => b.classList.toggle('on', b.dataset.view === state.view))
    $$('.cat-btn').forEach(b => { const on = state.cats.has(b.dataset.cat); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on) })

    const list = filtered()
    const count = $('#ev-count')
    const active = state.cats.size + (state.loc ? 1 : 0) + (state.start || state.end ? 1 : 0) + (state.q ? 1 : 0)
    if (count) count.textContent = list.length + ' ' + (list.length === 1 ? 'event' : 'events') + (active ? (list.length === 1 ? ' matches' : ' match') + ' your filters' : '')

    $('#ev-grid').hidden = state.view !== 'grid'
    $('#ev-cal').hidden = state.view !== 'calendar'
    $('#ev-map').hidden = state.view !== 'map'
    $('#ev-more').hidden = true

    if (state.view === 'grid') renderGrid(list)
    if (state.view === 'calendar') renderCal(list)
    if (state.view === 'map') renderMap(list)
  }

  function emptyState() {
    const anyUp = all.some(e => !E.isPast(e))
    if (state.period === 'upcoming' && !anyUp) {
      return `<div class="ev-empty"><i class="bx bx-calendar-heart"></i><h4>New events are on the way</h4>
        <p>We haven't posted our next event yet. We announce new events on Instagram first.</p>
        <button type="button" class="btn-outline-sage" data-period="all">See past events</button>
        <a href="https://www.instagram.com/care4humanity_/" target="_blank" rel="noopener" class="btn-orange d-inline-block ms-sm-2 mt-2 mt-sm-0">Follow on Instagram</a></div>`
    }
    return `<div class="ev-empty"><i class="bx bx-search-alt"></i><h4>No events match</h4>
      <p>Try a different search, or clear the filters.</p>
      <button type="button" class="btn-outline-sage" onclick="document.getElementById('ev-reset').click()">Clear filters</button></div>`
  }

  function renderGrid(list) {
    const grid = $('#ev-grid')
    if (!list.length) {
      grid.innerHTML = emptyState()
      grid.querySelectorAll('[data-period]').forEach(b => b.addEventListener('click', () => { state.period = b.dataset.period; render() }))
      return
    }
    grid.innerHTML = '<div class="ev-grid">' + list.slice(0, state.shown).map(E.card).join('') + '</div>'
    $('#ev-more').hidden = list.length <= state.shown
  }

  // ---------- Calendar view ----------
  function renderCal(list) {
    const box = $('#ev-cal')
    if (!state.month) {
      const first = list.find(e => !E.isPast(e)) || list[0]
      const d = first ? first.start : new Date()
      state.month = new Date(d.getFullYear(), d.getMonth(), 1)
    }
    const y = state.month.getFullYear(), m = state.month.getMonth()
    const lead = (new Date(y, m, 1).getDay() + 6) % 7
    const days = new Date(y, m + 1, 0).getDate()
    const t = E.today()
    let cells = ''
    for (let i = 0; i < lead; i++) cells += '<div class="bc-cell empty"></div>'
    for (let d = 1; d <= days; d++) {
      const date = new Date(y, m, d)
      const evs = list.filter(e => E.onDay(e, date))
      cells += `<div class="bc-cell${E.sameDay(date, t) ? ' today' : ''}${date < t ? ' past' : ''}${evs.length ? ' has' : ''}">
        <span class="bc-num">${d}</span>
        ${evs.slice(0, 3).map(e => `<a class="bc-ev" href="${E.url(e)}" title="${esc(e.title)}"><i class="bx ${E.catIcon(e.category)}"></i> ${esc(e.title)}</a>`).join('')}
        ${evs.length > 3 ? `<span class="bc-more">+${evs.length - 3} more</span>` : ''}
        ${evs.length ? `<span class="bc-dot" aria-hidden="true"></span>` : ''}
      </div>`
    }
    const monthList = list.filter(e => e.start <= new Date(y, m, days) && e.end >= new Date(y, m, 1))
    box.innerHTML = `
      <div class="bc-head">
        <button type="button" class="cal-nav" data-step="-1" aria-label="Previous month"><i class="bx bx-chevron-left"></i></button>
        <h3>${E.MONTHS[m]} ${y}</h3>
        <button type="button" class="cal-nav" data-step="1" aria-label="Next month"><i class="bx bx-chevron-right"></i></button>
      </div>
      <div class="bc-grid bc-dow">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(x => `<span>${x}</span>`).join('')}</div>
      <div class="bc-grid">${cells}</div>
      <div class="bc-list">${monthList.length ? '<h4>This month</h4>' + monthList.map(e => `<a href="${E.url(e)}" class="cal-item"><span>${esc(E.shortRange(e))}</span>${esc(e.title)}${e.location ? ` <em>· ${esc(e.location)}</em>` : ''}</a>`).join('') : '<p class="cal-none">No events this month. Use the arrows to look at other months.</p>'}</div>`
    box.querySelectorAll('.cal-nav').forEach(b => b.addEventListener('click', () => {
      state.month = new Date(y, m + Number(b.dataset.step), 1); render()
    }))
  }

  // ---------- Map view (map library loads only when this view is opened) ----------
  let leafletReady = null, map = null, layer = null
  function loadLeaflet() {
    if (leafletReady) return leafletReady
    leafletReady = new Promise((res, rej) => {
      const css = document.createElement('link'); css.rel = 'stylesheet'
      css.href = 'assets/vendor/leaflet/leaflet.css'; document.head.appendChild(css)
      const js = document.createElement('script'); js.src = 'assets/vendor/leaflet/leaflet.js'
      js.onload = () => res(window.L); js.onerror = rej; document.body.appendChild(js)
    })
    return leafletReady
  }
  function renderMap(list) {
    const box = $('#ev-map')
    const pts = list.filter(e => !isNaN(e.lat) && !isNaN(e.lng))
    const noCoords = list.filter(e => isNaN(e.lat) || isNaN(e.lng))
    if (!box.querySelector('.map-canvas')) box.innerHTML = '<div class="map-canvas"></div><div class="map-note"></div>'
    const note = box.querySelector('.map-note')
    note.innerHTML = noCoords.length ? `<h4>Also happening</h4>` + noCoords.map(e => `<a class="cal-item" href="${E.url(e)}"><span>${esc(E.shortRange(e))}</span>${esc(e.title)}${e.location ? ` <em>· <i class="bx bx-map"></i> ${esc(e.location)}</em>` : ''}</a>`).join('') : ''
    loadLeaflet().then(L => {
      if (!map) {
        map = L.map(box.querySelector('.map-canvas'), { scrollWheelZoom: false }).setView([-24.6282, 25.9231], 11) // Gaborone
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap contributors' }).addTo(map)
      }
      if (layer) layer.remove()
      layer = L.layerGroup(pts.map(e => L.marker([e.lat, e.lng]).bindPopup(`<strong>${esc(e.title)}</strong><br>${esc(E.shortRange(e))}<br><a href="${E.url(e)}">View event</a>`))).addTo(map)
      setTimeout(() => {
        map.invalidateSize()
        if (pts.length) map.fitBounds(L.latLngBounds(pts.map(e => [e.lat, e.lng])).pad(0.3), { maxZoom: 14 })
      }, 50)
    }).catch(() => { box.querySelector('.map-canvas').innerHTML = '<p class="cal-none p-4">The map could not load. Please check your connection.</p>' })
  }
})()
