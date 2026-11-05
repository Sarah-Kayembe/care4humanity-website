/**
 * "Leave a note" wall on the home page.
 * Notes are saved in the "Notes" tab of the CFH Website Events Google Sheet
 * through the same Web app link as the events (window.CFH_EVENTS_SHEET,
 * set in assets/js/events-data.js). Server side: _setup/Notes.gs
 */
(function() {
  "use strict";
  const board = document.getElementById('notes-board')
  const form = document.getElementById('note-form')
  if (!board || !form) return

  const url = String(window.CFH_EVENTS_SHEET || '')
  const live = /\/exec(\?|$)/.test(url)
  const more = document.getElementById('notes-more')
  const status = document.getElementById('note-status')
  const preview = document.getElementById('note-preview')
  const counter = document.getElementById('note-count')
  const PAGE = window.matchMedia('(max-width: 575px)').matches ? 4 : 9
  const TYPE_ICON = { 'Encouragement': 'bx-heart', 'Feedback on the website': 'bx-laptop', 'Message for the team': 'bx-envelope' }
  let notes = []
  let shown = PAGE

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  const day = d => { const t = new Date(d); return isNaN(t) ? '' : t.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) }

  function card(n, fresh) {
    const icon = TYPE_ICON[n.type] || 'bx-heart'
    return `<figure class="note${fresh ? ' note-new' : ''}">
      <span class="note-type"><i class="bx ${icon}"></i> ${esc(n.type || 'Encouragement')}</span>
      <blockquote>${esc(n.message)}</blockquote>
      <figcaption><span class="note-name">${esc(n.name || 'A friend of CFH')}</span>${n.date ? `<time datetime="${esc(n.date)}">${esc(day(n.date))}</time>` : ''}</figcaption>
    </figure>`
  }

  function render() {
    if (!notes.length) {
      board.innerHTML = `<div class="notes-empty"><i class="bx bx-message-square-edit"></i><p>No notes yet. Be the first to leave one!</p></div>`
      more.hidden = true
      return
    }
    board.innerHTML = notes.slice(0, shown).map(n => card(n)).join('')
    more.hidden = notes.length <= shown
  }

  if (live) {
    board.innerHTML = '<p class="notes-loading">Loading notes…</p>'
    fetch(url + (url.includes('?') ? '&' : '?') + 'notes=1', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { notes = Array.isArray(d.notes) ? d.notes : []; render() })
      .catch(() => { board.innerHTML = '<p class="notes-loading">The notes could not load right now. Please try again later.</p>' })
  } else {
    board.innerHTML = '<p class="notes-loading">The notes wall is coming soon.</p>'
    document.querySelectorAll('[data-bs-target="#noteModal"]').forEach(b => { b.hidden = true })
  }
  more.addEventListener('click', () => { shown += PAGE; render() })

  // Live preview of the note while typing ------------------------------------------
  const field = name => form.elements[name]
  function current() {
    return {
      name: field('name').value.trim(),
      message: field('message').value.trim(),
      type: (form.querySelector('[name=type]:checked') || {}).value,
      public: field('public').checked,
      website: field('website').value
    }
  }
  function updatePreview() {
    const n = current()
    preview.innerHTML = card({ name: n.name || 'Your name', message: n.message || 'Your note will look like this…', type: n.type })
    counter.textContent = `${field('message').value.length} / 300`
  }
  form.addEventListener('input', () => { updatePreview(); if (status.classList.contains('err')) say('') })
  updatePreview()

  // Sending ----------------------------------------------------------------------------
  form.addEventListener('submit', ev => {
    ev.preventDefault()
    const n = current()
    status.className = 'form-status'
    if (n.message.length < 3) return say('Please write a short note first.', 'err')
    if (hasLink(n.name + ' ' + n.message)) return say('Links can’t be posted in notes. Please remove the link and try again.', 'err')
    if (hasBadWord(n.name + ' ' + n.message)) return say('Please keep it kind 💛 Your note has words we can’t post. Please change them and try again.', 'err')

    const btn = form.querySelector('button[type=submit]')
    btn.disabled = true
    say('Sending your note…')
    // Sent as plain text so the browser does not need an extra permission check with Google.
    fetch(url, { method: 'POST', body: JSON.stringify(n) })
      .then(r => r.json())
      .then(res => {
        if (!res.ok) throw new Error(res.error || 'failed')
        if (res.status === 'shown') {
          notes.unshift({ name: n.name || 'A friend of CFH', message: n.message, type: n.type, date: new Date().toISOString() })
          render()
          const first = board.querySelector('.note'); if (first) first.classList.add('note-new')
          say('Thank you! Your note is on the wall 🎉', 'ok')
        } else if (res.status === 'private') {
          say('Thank you! Your note was sent to the team.', 'ok')
        } else {
          say('Thank you! The team will read your note before it goes on the wall.', 'ok')
        }
        form.reset(); updatePreview()
        setTimeout(() => { const m = window.bootstrap && bootstrap.Modal.getInstance(document.getElementById('noteModal')); if (m) m.hide() }, 2200)
      })
      .catch(err => {
        const msg = { busy: 'Lots of notes are coming in right now. Please try again in a few minutes.', duplicate: 'It looks like this note was already sent. Thank you!' }[err.message]
        say(msg || 'Sorry, your note could not be sent. Please try again, or use the Contact page.', 'err')
      })
      .finally(() => { btn.disabled = false })
  })
  document.getElementById('noteModal').addEventListener('hidden.bs.modal', () => { status.textContent = ''; status.className = 'form-status' })

  function say(text, kind) { status.textContent = text; status.className = 'form-status' + (kind ? ' ' + kind : '') }

  // Bad-word check (the same check runs again on Google's side, in _setup/Notes.gs) -----
  const BAD_STEMS = ['fuck', 'fck', 'motherfuck', 'shit', 'bullshit', 'bitch', 'cunt', 'asshole', 'arsehole',
    'bastard', 'whore', 'slut', 'wank', 'twat', 'pussy', 'cocksuck', 'dickhead', 'nigger', 'nigga', 'faggot',
    'retard', 'piss', 'dumbass', 'jackass', 'porn', 'dildo', 'rapist', 'tranny', 'kike', 'chink', 'spastic']
  const BAD_WORDS = ['fuk', 'paki', 'ass', 'arse', 'dick', 'cock', 'fag', 'tit', 'boob', 'cum', 'hoe', 'rape',
    'stfu', 'wtf', 'fml', 'milf', 'kys', 'killyourself', 'coon', 'spic', 'wetback', 'nazi', 'hitler']
  function hasBadWord(text) {
    const leet = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '@': 'a', '$': 's', '!': 'i', '|': 'i' }
    let t = String(text).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    // Ordinary words that contain a blocked word
    t = t.replace(/shiitake|cocktail|cockpit|cockroach|peacock|hancock|dickens|scunthorpe/g, ' ')
    t = t.replace(/[0134578@$!|]/g, ch => leet[ch])
    t = t.replace(/\b(?:[a-z][\s._\-*]+){2,}[a-z]\b/g, m => m.replace(/[^a-z]/g, ''))
    const sep = '[^a-z\\s]*'
    const pattern = w => w.split('').map(ch => ch + '+').join(sep)
    return BAD_STEMS.some(w => new RegExp('(^|[^a-z])' + pattern(w)).test(t)) ||
      BAD_WORDS.some(w => new RegExp('(^|[^a-z])' + pattern(w) + 's?($|[^a-z])').test(t))
  }
  function hasLink(text) { return /https?:\/\/|www\.|\.(com|net|org|ru|xyz|info|co)\b/i.test(text) }
  window.CFHNotes = { hasBadWord }
})()
