/*
 * ============================================================
 *  CARE FOR HUMANITY: EVENTS & NEWS
 * ============================================================
 *
 *  Events and news come from two places, shown together on the website:
 *
 *  1) THE GOOGLE FORM (how the team posts)
 *     The team fills in the "CFH: Post an event or news" Google Form. Answers land
 *     in the "Events" tab of the CFH Website Events Google Sheet, which is
 *     published as CSV. Paste that published CSV link between the quotes below.
 *     One-time setup: _setup/HOW-TO-SET-UP-EVENTS.txt
 */
window.CFH_EVENTS_SHEET = 'https://script.google.com/macros/s/AKfycbwjDGB8yGcQXyjgUgnCh3udUzxFjtVd4R9BhzRLeqJNVIh1X0ZKcD0atrQktV5S1apLbQ/exec'

/*
 *  2) THIS FILE (for developers)
 *     Copy the example, remove the // at the start of each line, fill it in.
 *
 *  Fields (the same names are the column headings of the Events tab)
 *    title        Name of the event (required)
 *    date         Start date, written 2026-11-14 (required)
 *    endDate      Last date, for events lasting several days or weeks
 *    days         For repeating events, e.g. "Fri, Sat" (with date and endDate)
 *    time         Start time, e.g. 09:00 or 9am
 *    endTime      End time
 *    hours        Free text if the hours are complicated, e.g. "Saturdays 9am to noon"
 *    category     Volunteering, Fundraiser, Education, Wildlife, Health,
 *                 Community, Celebration or News
 *    organizer    Who is running it (shows as "Presented by"). Default: Care for Humanity
 *    location     A place in Botswana, e.g. "Mokolodi Nature Reserve", or "Online"
 *                 for virtual events and online fundraisers (even if the money
 *                 raised goes to people in another country)
 *    online       yes = an online event (you can also just write Online as the location)
 *    address      Street, area or town, used for the map
 *    lat, lng     Optional map coordinates (right-click a spot in Google Maps to copy them)
 *    phone, email Contact details for this event (default contact: admin@careforhumanity.co.bw)
 *    summary      One sentence for the event cards
 *    description  The full write-up. Leave an empty line between paragraphs.
 *    image        Main photo: a file in assets/img/events/ or a link (Google Drive links work
 *                 if the file is shared as "Anyone with the link")
 *    gallery      More photos, separated by commas
 *    instagram    Link to the Instagram post about it
 *    link         A website link for tickets or more information
 *    signup       yes = show a "Sign up" button that opens the contact form
 *    featured     yes = show in "Featured Events"; spotlight = show in the big banner
 *    hidden       yes = keep it saved but hide it from the website
 *
 *  Example
 *  {
 *    title: "Project Warmth: blanket packing day",
 *    date: "2027-05-15",
 *    time: "09:00",
 *    endTime: "13:00",
 *    category: "Volunteering",
 *    location: "Community hall",
 *    address: "Gaborone, Botswana",
 *    summary: "Help us pack blankets for families ahead of winter.",
 *    description: "Every winter we pack and deliver blankets by hand.\n\nEveryone is welcome. Bring a friend!",
 *    image: "assets/img/photos/project-warmth.webp",
 *    gallery: "assets/img/photos/blankets.webp, assets/img/photos/donation-delivery.webp",
 *    signup: "yes",
 *    featured: "yes"
 *  },
 */

window.CFH_EVENTS = [

  // ---- Add new events above this line ----

  {
    title: "Opening of Dr. Claude's clinic",
    date: "2023-12-08",
    category: "News",
    location: "Gaborone",
    summary: "An honor to attend the opening of the clinic of a partner we have worked with all year.",
    description: "Absolutely grateful to have met Dr. Claude. We have over the past year worked very well together through a couple of different initiatives. It was an honor to attend the opening of his clinic and we pray for future medical partnerships with him.\n\nThank you to our Secretary for attending the function.",
    image: "assets/img/photos/clinic-opening-2023.webp",
    instagram: "https://www.instagram.com/care4humanity_/"
  },
  {
    title: "Thank you for our Annual Gala Dinner 2023",
    date: "2023-11-30",
    category: "News",
    location: "Gaborone",
    summary: "Thank you for all the support leading up to and at our Gala Dinner.",
    description: "On behalf of all of us at Care for Humanity, thank you for all the support leading up to and at our Gala Dinner. We are excited to see everyone and create better partnerships in 2024.\n\nThank you to our most special friend for doing us the honors and doing our award presentation, and to Simply Balloons for the amazing backdrop.",
    image: "assets/img/photos/gala-2023-team.webp",
    gallery: "assets/img/photos/gala-2023-award.webp, assets/img/photos/gala-2023-backdrop.webp, assets/img/photos/gala-2023-vp-treasurer.webp, assets/img/photos/gala-night.webp",
    instagram: "https://www.instagram.com/care4humanity_/"
  },
  {
    title: "Care for Humanity is officially registered",
    date: "2023-10-04",
    category: "News",
    summary: "CFH is incorporated as a registered non-profit organization.",
    description: "Pleased to announce that CFH is a Registered Non-Profit Organization. We thank you all for your support and cannot wait to continue providing assistance and relief everywhere!\n\nA special thank you to Akheel Jinabhai & Associates and to Push Outsourcing for their services and support.",
    image: "assets/img/photos/registration-announcement.webp"
  },
  {
    title: "Our borehole donation in the Daily News",
    date: "2023-05-24",
    category: "News",
    location: "Nthwalang Junior Secondary School",
    address: "Digawana, Botswana",
    summary: "The Daily News covers the borehole we handed over at Nthwalang Junior Secondary School in Digawana.",
    description: "Care for Humanity Trust founding director, Ms Afreen Dhansay, handed over a borehole to the Southern region education representative, Ms Lydia Makgoma, at Nthwalang Junior Secondary School in Digawana.\n\nThe school and the Digawana community have embraced the noble gesture, saying it would alleviate the decades-long lack of reliable water.\n\nFrom the Daily News, Wednesday 24 May 2023. Photo: Naomi Leepile.",
    image: "assets/img/photos/daily-news-borehole-2023.webp",
    gallery: "assets/img/photos/borehole-ceremony.webp, assets/img/photos/borehole-handover.webp, assets/img/gallery/student4.webp"
  },
  {
    title: "Celebrating the work of Care for Humanity with Ditshwanelo",
    date: "2022-11-19",
    category: "News",
    location: "Gaborone",
    summary: "Our founder with Ms Alice Mogwe, Director of Ditshwanelo, at a celebration of CFH's work.",
    description: "At the celebration of the work of Care for Humanity in Gaborone, our founder Ms Afreen Dhansay was joined by Ms Alice Mogwe, the Director of DITSHWANELO, The Botswana Centre for Human Rights.",
    image: "assets/img/photos/founder-ditshwanelo-2022.webp"
  },
  {
    title: "Gimhani Mohau Perera represents Africa at Miss Teen International 2022",
    date: "2022-07-30",
    category: "News",
    summary: "Our volunteer places in the Top 10 and wins the People's Choice Award.",
    description: "CFH volunteer Gimhani Mohau Perera, Miss Teen International Botswana 2021, represented Africa at Miss Teen International 2022. She placed in the Top 10 and won the People's Choice Award.",
    image: "assets/img/photos/gimhani-africa-stage.webp",
    gallery: "assets/img/photos/gimhani-finalists.webp, assets/img/photos/gimhani-flag.webp, assets/img/photos/gimhani-airport.webp"
  }

];
