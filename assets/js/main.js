/**
* Website Name: Care For Humanity
* Author: Sarah Kayembe
* Based on the Moderna template by BootstrapMade.com (https://bootstrapmade.com/license/)
*/
(function() {
  "use strict";

  /**
   * Easy selector helper function
   */
  const select = (el, all = false) => {
    el = el.trim()
    if (all) {
      return [...document.querySelectorAll(el)]
    } else {
      return document.querySelector(el)
    }
  }

  /**
   * Easy event listener function
   */
  const on = (type, el, listener, all = false) => {
    let selectEl = select(el, all)
    if (selectEl) {
      if (all) {
        selectEl.forEach(e => e.addEventListener(type, listener))
      } else {
        selectEl.addEventListener(type, listener)
      }
    }
  }

  /**
   * Easy on scroll event listener 
   */
  const onscroll = (el, listener) => {
    el.addEventListener('scroll', listener)
  }

  /**
   * Scrolls to an element with header offset
   */
  const scrollto = (el) => {
    let header = select('#header')
    let offset = header.offsetHeight

    if (!header.classList.contains('header-scrolled')) {
      offset -= 20
    }

    let elementPos = select(el).offsetTop
    window.scrollTo({
      top: elementPos - offset,
      behavior: 'smooth'
    })
  }

  /**
   * Toggle .header-scrolled class to #header when page is scrolled
   */
  let selectHeader = select('#header')
  if (selectHeader) {
    const headerScrolled = () => {
      if (window.scrollY > 100) {
        selectHeader.classList.add('header-scrolled')
      } else {
        selectHeader.classList.remove('header-scrolled')
      }
    }
    window.addEventListener('load', headerScrolled)
    onscroll(document, headerScrolled)
  }

  /**
   * Back to top button
   */
  let backtotop = select('.back-to-top')
  if (backtotop) {
    const toggleBacktotop = () => {
      if (window.scrollY > 100) {
        backtotop.classList.add('active')
      } else {
        backtotop.classList.remove('active')
      }
    }
    window.addEventListener('load', toggleBacktotop)
    onscroll(document, toggleBacktotop)
  }

  /**
   * Build one combined menu for phones from the left and right navs,
   * and highlight the link for the current page
   */
  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase()
  select('#navbar-left a, #navbar-right a', true).forEach(a => {
    a.classList.toggle('active', a.getAttribute('href').toLowerCase() === page)
  })
  const headerContainer = select('#header .container')
  if (headerContainer && !select('#navbar')) {
    const mobileNav = document.createElement('nav')
    mobileNav.id = 'navbar'
    mobileNav.className = 'navbar'
    const ul = document.createElement('ul')
    select('#navbar-left li, #navbar-right li', true).forEach(li => ul.appendChild(li.cloneNode(true)))
    mobileNav.appendChild(ul)
    const toggle = select('.mobile-nav-toggle')
    mobileNav.appendChild(toggle)
    toggle.setAttribute('role', 'button')
    toggle.setAttribute('aria-label', 'Open menu')
    headerContainer.appendChild(mobileNav)
  }

  on('click', '.mobile-nav-toggle', function(e) {
    select('#navbar').classList.toggle('navbar-mobile')
    this.classList.toggle('bi-list')
    this.classList.toggle('bi-x')
  })

  /**
   * Testimonials slider
   */
  if (window.Swiper) new Swiper('.testimonials-carousel', {
    speed: 400,
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false
    },
    pagination: {
      el: '.swiper-pagination',
      type: 'bullets',
      clickable: true
    }
  });

  /**
   * Porfolio isotope and filter
   */

  window.addEventListener('load', () => {
    let portfolioContainer = select('.portfolio-container');
    if (portfolioContainer && window.Isotope) {
      let portfolioIsotope = new Isotope(portfolioContainer, {
        itemSelector: '.portfolio-item1',
        layoutMode: 'fitRows'
      });

      // Re-run the layout as each photo finishes loading
      select('.portfolio-container img', true).forEach(im => {
        if (!im.complete) im.addEventListener('load', () => portfolioIsotope.layout())
      })

      let portfolioFilters = select('#portfolio-flters1 li', true);

      on('click', '#portfolio-flters1 li', function(e) {
        e.preventDefault();
        portfolioFilters.forEach(function(el) {
          el.classList.remove('filter-active', 'filter-active1');
        });
        this.classList.add('filter-active1');

        portfolioIsotope.arrange({
          filter: this.getAttribute('data-filter')
        });
        portfolioIsotope.on('arrangeComplete', function() {
          AOS.refresh()
        });
      }, true);
    }

  });

  /**
   * Initiate portfolio lightbox 
   */
  if (window.GLightbox) {
    GLightbox({ selector: '.portfolio-lightbox' });
  }

  /**
   * Portfolio details slider
   */
  if (window.Swiper) new Swiper('.portfolio-details-slider', {
    speed: 400,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false
    },
    pagination: {
      el: '.swiper-pagination',
      type: 'bullets',
      clickable: true
    }
  });

  /**
   * Testimonials slider
   */
  if (window.Swiper) new Swiper('.testimonials-slider', {
    speed: 600,
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false
    },
    slidesPerView: 'auto',
    pagination: {
      el: '.swiper-pagination',
      type: 'bullets',
      clickable: true
    },
    breakpoints: {
      320: {
        slidesPerView: 1,
        spaceBetween: 20
      },

      1200: {
        slidesPerView: 3,
        spaceBetween: 20
      }
    }
  });

  /**
   * Clients Slider
   */
  if (window.Swiper) new Swiper('.clients-slider', {
    speed: 400,
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false
    },
    slidesPerView: 'auto',
    pagination: {
      el: '.swiper-pagination',
      type: 'bullets',
      clickable: true
    },
    breakpoints: {
      320: {
        slidesPerView: 2,
        spaceBetween: 40
      },
      480: {
        slidesPerView: 3,
        spaceBetween: 60
      },
      640: {
        slidesPerView: 4,
        spaceBetween: 80
      },
      992: {
        slidesPerView: 6,
        spaceBetween: 120
      }
    }
  });

  /**
   * Animation on scroll
   */
  window.addEventListener('load', () => {
    AOS.init({
      duration: 1000,
      easing: "ease-in-out",
      once: true,
      mirror: false
    });
  });

  /**
   * Contact and newsletter forms.
   * The site has no server, so submissions are sent through Web3Forms
   * (https://web3forms.com), which forwards them to ORG_EMAIL.
   * If no key is set, or a request fails, the forms fall back to opening
   * the visitor's email app with the message already filled in.
   */
  const ORG_EMAIL = 'admin@careforhumanity.co.bw'

  // Web3Forms access key (tied to ORG_EMAIL and the site's domain).
  const WEB3FORMS_KEY = '5f4e6a34-3ab8-4a41-9017-67b8b1398ea4'
  const FORM_ENDPOINT = 'https://api.web3forms.com/submit'
  const formsEnabled = WEB3FORMS_KEY !== ''

  // Opens the visitor's email app with a pre-filled message (fallback).
  const openMail = (subject, body) => {
    window.location.href = 'mailto:' + ORG_EMAIL +
      '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body)
  }

  // Posts form data to Web3Forms. Resolves on success, rejects on any error.
  const sendForm = (data, subject) => {
    data.append('access_key', WEB3FORMS_KEY)
    data.append('subject', subject)
    data.append('from_name', 'Care for Humanity website')
    return fetch(FORM_ENDPOINT, { method: 'POST', body: data, headers: { 'Accept': 'application/json' } })
      .then(r => r.json())
      .then(res => { if (!res.success) throw new Error(res.message || 'send failed'); return res })
  }

  // Footer newsletter sign-up (on every page).
  select('.footer-newsletter form', true).forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault()
      const email = form.querySelector('input[type=email]').value.trim()
      if (!email) return
      const fallback = () => openMail('Newsletter sign-up', 'Hello Care For Humanity,\n\nPlease add ' + email + ' to the CFH newsletter.\n\nThank you!')
      if (!formsEnabled) return fallback()
      const fd = new FormData()
      fd.append('email', email)
      fd.append('message', 'Please add ' + email + ' to the CFH newsletter.')
      sendForm(fd, 'Newsletter sign-up')
        .then(() => { form.innerHTML = '<p class="form-note">Thank you! You are on the list.</p>' })
        .catch(fallback)
    })
  })

  // Contact page form.
  const attachContactForm = (form, status, onSent) => {
    const showStatus = (text, state) => { if (status) { status.textContent = text; status.className = 'form-status ' + (state || '') } }
    form.addEventListener('submit', e => {
      e.preventDefault()
      if (!form.checkValidity()) { form.reportValidity(); return }
      const v = n => (form.elements[n] ? form.elements[n].value.trim() : '')
      const subject = v('topic') + (v('subject') ? ': ' + v('subject') : '')

      if (!formsEnabled) {
        openMail(subject, v('message') + '\n\n' + v('name') + '\n' + v('email'))
        return
      }
      showStatus('Sending…')
      const fd = new FormData(form)
      fd.delete('subject') // replaced by the combined topic + subject line below
      sendForm(fd, 'Website: ' + subject)
        .then(() => {
          form.reset()
          showStatus('Thank you! Your message has been sent. We will get back to you soon.', 'ok')
          if (onSent) onSent()
        })
        .catch(() => showStatus('Sorry, something went wrong. Please email us at ' + ORG_EMAIL + '.', 'err'))
    })
  }
  window.CFHForms = { attach: attachContactForm }

  // Contact page form.
  const contactForm = select('#contact-form')
  if (contactForm) {
    attachContactForm(contactForm, select('#form-status'))

    // Pre-fill from links such as contact.html?topic=Volunteer&event=Bake%20Sale
    const params = new URLSearchParams(location.search)
    const evName = params.get('event')
    if (evName && contactForm.elements.subject) contactForm.elements.subject.value = 'Sign up: ' + evName
    const topic = params.get('topic')
    if (topic && contactForm.elements.topic) {
      [...contactForm.elements.topic.options].forEach(o => { if (o.value.toLowerCase().startsWith(topic.toLowerCase())) o.selected = true })
    }
  }

  /**
   * Instagram: turn post links into embeds, and only load Instagram's
   * script when the visitor scrolls near a post (keeps the page light)
   */
  const igEmbed = url => {
    const q = document.createElement('blockquote')
    q.className = 'instagram-media'
    q.setAttribute('data-instgrm-permalink', url.trim())
    q.setAttribute('data-instgrm-version', '14')
    q.innerHTML = '<a href="' + url.trim() + '" target="_blank" rel="noopener" class="ig-fallback"><i class="bx bxl-instagram"></i><span>View this post on Instagram</span></a>'
    return q
  }
  select('.ig-slot', true).forEach(slot => {
    const url = slot.getAttribute('data-ig')
    if (url && url.trim()) slot.appendChild(igEmbed(url))
  })
  const feed = select('.ig-feed')
  const moreBtn = select('.ig-more')
  if (feed) {
    const urls = (feed.getAttribute('data-posts') || '').split(',').map(u => u.trim()).filter(Boolean)
    const first = parseInt(feed.getAttribute('data-show') || urls.length, 10)
    const addCards = list => list.forEach(u => {
      const c = document.createElement('div')
      c.className = 'ig-card'
      c.appendChild(igEmbed(u))
      feed.appendChild(c)
    })
    addCards(urls.slice(0, first))
    if (moreBtn && urls.length > first) {
      moreBtn.hidden = false
      moreBtn.addEventListener('click', () => {
        addCards(urls.slice(first))
        moreBtn.hidden = true
        if (window.instgrm && window.instgrm.Embeds) window.instgrm.Embeds.process()
      })
    }
  }
  const igTargets = select('.instagram-media', true)
  if (igTargets.length) {
    let loaded = false
    const loadIg = () => {
      if (loaded) return
      loaded = true
      const sc = document.createElement('script')
      sc.async = true
      sc.src = 'https://www.instagram.com/embed.js'
      document.body.appendChild(sc)
    }
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        if (entries.some(e => e.isIntersecting)) { loadIg(); io.disconnect() }
      }, { rootMargin: '600px' })
      igTargets.forEach(t => io.observe(t))
    } else {
      loadIg()
    }
  }

  /**
   * Copy buttons (bank details)
   */
  on('click', '.copy-btn', function() {
    const text = this.getAttribute('data-copy')
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        const old = this.textContent
        this.textContent = 'Copied'
        setTimeout(() => { this.textContent = old }, 1500)
      })
    }
  }, true)

})()