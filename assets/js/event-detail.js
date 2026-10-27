/**
 * Single event page (event.html?id=...): photos, about, date, location map,
 * contact, hours and calendar / sign-up buttons.
 */
(function() {
  "use strict";
  const E = window.CFHEvents
  if (!E) return
  const esc = E.esc
  const id = new URLSearchParams(location.search).get('id')
  const hero = document.getElementById('ev-hero')
  const root = document.getElementById('ev-root')

  const paras = t => String(t || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
    .map(p => '<p>' + esc(p).replace(/\n/g, '<br>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') + '</p>').join('')

  E.load().then(events => {
    const e = events.find(x => x.id === id)
    if (!e) {
      hero.querySelector('h1').textContent = 'Event not found'
      hero.querySelector('p').textContent = 'It may have been moved or removed.'
      root.innerHTML = `<div class="ev-empty"><i class="bx bx-calendar-x"></i><h4>We couldn't find that event</h4>
        <p>Have a look at everything that's coming up instead.</p><a class="btn-orange d-inline-block" href="timelines.html#all-events">See all events</a></div>`
      return
    }
    document.title = e.title + ' | Care For Humanity'
    const meta = document.querySelector('meta[name=description]'); if (meta) meta.content = e.summary || e.title
    if (e.image) hero.style.backgroundImage = `url('${e.image.replace(/'/g, "%27")}')`
    hero.querySelector('h1').textContent = e.title
    hero.querySelector('p').innerHTML = `<i class="bx ${E.catIcon(e.category)}"></i> ${esc(e.category)} · ${esc(E.shortRange(e))}`

    const photos = [e.image].concat(e.gallery).filter(Boolean)
    const past = E.isPast(e)
    const isNews = e.category === 'News'
    const hasPlace = !e.online && (e.location || e.address || !isNaN(e.lat))
    const contact = [e.address ? esc(e.address) : '', e.phone ? `<a href="tel:${esc(e.phone.replace(/[^\d+]/g, ''))}">${esc(e.phone)}</a>` : '', e.email ? `<a href="mailto:${esc(e.email)}">${esc(e.email)}</a>` : ''].filter(Boolean)
    const more = events.filter(x => x.id !== e.id && !E.isPast(x)).slice(0, 3)
    const moreList = more.length ? more : events.filter(x => x.id !== e.id).slice(-3).reverse()

    root.innerHTML = `
      <nav class="ev-crumbs" aria-label="Breadcrumb"><a href="timelines.html">News &amp; Events</a> <i class="bx bx-chevron-right"></i> <span>${esc(e.title)}</span></nav>
      <div class="row">
        <div class="col-lg-7 mb-5">
          <h2 class="ev-h">About</h2>
          <p class="ev-presented">Presented by: ${esc(e.organizer)}</p>
          ${e.summary && e.description && !e.description.startsWith(e.summary) ? `<p class="ev-lead">${esc(e.summary)}</p>` : ''}
          <div class="ev-desc">${paras(e.description || e.summary)}</div>
          ${photos.length ? `<h2 class="ev-h mt-5">Photos</h2>
          <div class="ev-photos ev-photos-${Math.min(photos.length, 4)}">
            ${photos.map((p, i) => `<a href="${esc(p)}" class="glightbox" data-gallery="event" aria-label="Open photo ${i + 1}"><img src="${esc(p)}" alt="${esc(e.title)} photo ${i + 1}" loading="lazy"></a>`).join('')}
          </div>` : ''}
          ${e.instagram ? `<a class="ev-btn mt-4" href="${esc(e.instagram)}" target="_blank" rel="noopener"><i class="bx bxl-instagram"></i> See the post on Instagram</a>` : ''}
        </div>
        <aside class="col-lg-5">
          <div class="ev-pill">${esc(E.pillRange(e))}</div>
          ${past && !isNews ? '<p class="ev-pastnote"><i class="bx bx-history"></i> This event has already happened.</p>' : ''}
          ${e.online ? `<h3 class="ev-side-h">Location</h3><p class="ev-side-strong"><i class="bx bx-globe"></i> Online event${e.link ? ` · <a href="${esc(e.link)}" target="_blank" rel="noopener">join or give here</a>` : ''}</p>` : ''}
          ${hasPlace ? `
          <h3 class="ev-side-h">Location</h3>
          ${e.location ? `<p class="ev-side-strong">${esc(e.location)}</p>` : ''}
          <div class="ev-mapbox">
            <a class="ev-open-map" href="${E.mapsLink(e)}" target="_blank" rel="noopener">Open in Maps <i class="bx bx-link-external"></i></a>
            <iframe src="${E.mapsEmbed(e)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Map of ${esc(e.location || e.address)}"></iframe>
          </div>` : ''}
          <div class="row mt-4">
            ${contact.length ? `<div class="col-12 mb-3"><h3 class="ev-side-h">Contact</h3><p class="ev-side-strong">${contact.join('<br>')}</p></div>` : ''}
            ${isNews && !e.time ? `<div class="col-12 mb-3"><h3 class="ev-side-h">Posted</h3><p class="ev-side-strong">${esc(E.dateRange(e))}</p></div>` : `<div class="col-12 mb-3"><h3 class="ev-side-h">Hours</h3><p class="ev-side-strong">${esc(E.hoursLabel(e))}<br><br>${esc(E.dateRange(e))}</p></div>`}
          </div>
          ${past ? '' : `<div class="ev-actions-col">
            ${e.signup ? `<a class="btn-orange text-center ev-signup" href="contact.html?topic=Volunteer&event=${encodeURIComponent(e.title)}" data-bs-toggle="modal" data-bs-target="#signupModal"><i class="bx bx-user-plus"></i> Sign up</a>` : ''}
            ${e.link ? `<a class="btn-outline-sage text-center" href="${esc(e.link)}" target="_blank" rel="noopener">${esc(e.linkLabel || 'More information')} <i class="bx bx-link-external"></i></a>` : ''}
            <button type="button" class="ev-btn ev-ics"><i class="bx bx-calendar-plus"></i> Add to my calendar</button>
            <a class="ev-btn" href="${E.googleCal(e)}" target="_blank" rel="noopener"><i class="bx bxl-google"></i> Add to Google Calendar</a>
          </div>`}
          <button type="button" class="ev-btn ev-share mt-2"><i class="bx bx-share-alt"></i> Share this event</button>
        </aside>
      </div>
      ${moreList.length ? `<div class="ev-more-wrap"><h2 class="ev-h text-center mb-4">${more.length ? 'More Upcoming Events' : 'More From Care for Humanity'}</h2>
        <div class="row">${moreList.map(x => `<div class="col-md-6 col-lg-4 mb-4">${E.card(x)}</div>`).join('')}</div>
        <div class="text-center"><a class="btn-outline-sage" href="timelines.html#all-events">See all events</a></div></div>` : ''}`

    if (e.signup && !past) addSignupModal(e)
    const ics = root.querySelector('.ev-ics'); if (ics) ics.addEventListener('click', () => E.downloadIcs(e))
    root.querySelector('.ev-share').addEventListener('click', ev => {
      const data = { title: e.title, text: e.summary || e.title, url: location.href }
      if (navigator.share) navigator.share(data).catch(() => {})
      else if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(() => { ev.currentTarget.innerHTML = '<i class="bx bx-check"></i> Link copied' })
    })
    if (window.GLightbox) GLightbox({ selector: '.glightbox' })
  })

  // Sign-up popup: the same message form as the Contact page, filled in for this event.
  function addSignupModal(e) {
    const when = E.dateRange(e) + (E.timeLabel(e) ? ', ' + E.timeLabel(e) : '')
    const wrap = document.createElement('div')
    wrap.innerHTML = `
      <div class="modal fade" id="signupModal" tabindex="-1" aria-labelledby="signupTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content signup-modal">
            <div class="modal-header">
              <div>
                <span class="kicker">Sign up</span>
                <h3 class="modal-title" id="signupTitle">${esc(e.title)}</h3>
                <p class="signup-when"><i class="bx bx-calendar"></i> ${esc(when)}${e.location ? ` · <i class="bx bx-map"></i> ${esc(e.online ? 'Online' : e.location)}` : ''}</p>
              </div>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form id="signup-form" class="contact-form" novalidate>
                <div class="row g-3">
                  <div class="col-md-6"><label for="su-name" class="form-label">Your name</label><input id="su-name" name="name" type="text" class="form-control" required autocomplete="name"></div>
                  <div class="col-md-6"><label for="su-email" class="form-label">Your email</label><input id="su-email" name="email" type="email" class="form-control" required autocomplete="email"></div>
                  <div class="col-md-6"><label for="su-topic" class="form-label">Topic</label>
                    <select id="su-topic" name="topic" class="form-select">
                      <option selected>Volunteering / joining the team</option><option>General question</option><option>Donation</option><option>Partnership</option>
                    </select></div>
                  <div class="col-md-6"><label for="su-subject" class="form-label">Subject</label><input id="su-subject" name="subject" type="text" class="form-control" value="Sign up: ${esc(e.title)}"></div>
                  <div class="col-12"><label for="su-message" class="form-label">Message</label><textarea id="su-message" name="message" rows="4" class="form-control" required>Hello! I would like to sign up for ${esc(e.title)} (${esc(when)}).</textarea></div>
                  <div class="col-12 text-center">
                    <button type="submit" class="btn-orange">Send sign-up</button>
                    <p id="signup-status" class="form-status" role="status" aria-live="polite"></p>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>`
    document.body.appendChild(wrap.firstElementChild)
    const form = document.getElementById('signup-form')
    if (window.CFHForms) window.CFHForms.attach(form, document.getElementById('signup-status'))
    // Without Bootstrap, fall back to the Contact page link.
    if (!window.bootstrap) document.querySelectorAll('.ev-signup').forEach(a => { a.removeAttribute('data-bs-toggle') })
    document.getElementById('signupModal').addEventListener('shown.bs.modal', () => document.getElementById('su-name').focus())
  }
})()
