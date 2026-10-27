/**
 * Care for Humanity: website events form
 * ---------------------------------------
 * Builds a Google Form and a Google Sheet that the Care for Humanity website
 * reads its News & Events from.
 *
 *   Google Form  -->  "Form Responses" tab (raw answers, private)
 *                -->  onFormSubmit() copies each answer into the "Events" tab
 *                -->  doGet() serves the "Events" tab live to the website (Web app)
 *
 * Run setup() once from the Care for Humanity Google account.
 * Step-by-step instructions: _setup/HOW-TO-SET-UP-EVENTS.txt
 */

// ---------------------------------------------------------------------------
// Form definition. Question titles are what the team sees; keys are the
// column names the website understands (see assets/js/events-core.js).
// ---------------------------------------------------------------------------

const FORM_TITLE = 'CFH: Post an event or news';
const SHEET_TITLE = 'CFH Website Events';

const CATEGORIES = ['Volunteering', 'Fundraiser', 'Education', 'Wildlife', 'Health', 'Community', 'Celebration', 'News'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const WHERE = { inPerson: 'In person in Botswana', online: 'Online' };
const FEATURE = {
  no: 'No',
  featured: 'Yes, in Featured Events',
  banner: 'Yes, in the big banner at the top of the page'
};

// File upload questions cannot be created by Apps Script, so they are added
// by hand after setup (see the guide). Matching ignores capitals and spaces,
// so "Main photo", "Main Photo" or "main photo " all work.
const PHOTO_MAIN = 'Main photo';
const PHOTO_MORE = 'More photos';
const sameTitle_ = (a, b) => String(a).trim().toLowerCase().replace(/\s+/g, ' ') === b.toLowerCase();

const QUESTIONS = [
  { type: 'section', title: 'What is it?' },
  { key: 'title', title: 'Event or news title', type: 'text', required: true,
    help: 'Short and clear, e.g. "Project Warmth: blanket packing day".' },
  { key: 'category', title: 'Category', type: 'list', options: CATEGORIES, required: true },
  { key: 'summary', title: 'Short summary', type: 'text', required: true,
    help: 'One sentence shown on the event card.' },
  { key: 'description', title: 'Full description', type: 'paragraph',
    help: 'Everything people should know. Leave an empty line between paragraphs.' },

  { type: 'section', title: 'When?' },
  { key: 'date', title: 'Date', type: 'date', required: true,
    help: 'The day it happens. For news, the day it happened.' },
  { key: 'endDate', title: 'End date', type: 'date',
    help: 'Only if it runs over several days or weeks.' },
  { key: 'days', title: 'Repeats every', type: 'checkbox', options: DAY_NAMES,
    help: 'Only for repeating events, e.g. tutoring every Saturday from the date to the end date.' },
  { key: 'time', title: 'Start time', type: 'time' },
  { key: 'endTime', title: 'End time', type: 'time' },
  { key: 'hours', title: 'Hours in your own words', type: 'text',
    help: 'Optional, if the times are complicated, e.g. "Saturdays 9am to noon".' },

  { type: 'section', title: 'Where?' },
  { key: 'online', title: 'Where is it?', type: 'choice', options: [WHERE.inPerson, WHERE.online], required: true,
    help: 'Choose Online for virtual events and online fundraisers, even if the money goes to another country.' },
  { key: 'location', title: 'Place name', type: 'text',
    help: 'e.g. Mokolodi Nature Reserve. Leave empty for online events.' },
  { key: 'address', title: 'Area or address', type: 'text',
    help: 'Used for the map, e.g. Old Naledi, Gaborone.' },

  { type: 'section', title: 'Contact and links' },
  { key: 'organizer', title: 'Organized by', type: 'text',
    help: 'Leave empty if Care for Humanity is running it.' },
  { key: 'phone', title: 'Contact phone', type: 'text' },
  { key: 'email', title: 'Contact email', type: 'email' },
  { key: 'link', title: 'Website or ticket link', type: 'url' },
  { key: 'instagram', title: 'Instagram post link', type: 'url' },

  { type: 'section', title: 'On the website' },
  { key: 'signup', title: 'Show a "Sign up" button?', type: 'choice', options: ['Yes', 'No'],
    help: 'Yes = people can sign up through the contact form.' },
  { key: 'featured', title: 'Feature it on the page?', type: 'choice',
    options: [FEATURE.no, FEATURE.featured, FEATURE.banner] }
];

// Columns of the "Events" tab, in order. The website ignores "response".
const COLUMNS = ['title', 'date', 'endDate', 'days', 'time', 'endTime', 'hours', 'category', 'organizer',
  'online', 'location', 'address', 'phone', 'email', 'summary', 'description', 'image', 'gallery',
  'instagram', 'link', 'signup', 'featured', 'hidden', 'response'];

// ---------------------------------------------------------------------------
// One-time setup
// ---------------------------------------------------------------------------

function setup() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('FORM_ID')) {
    throw new Error('Setup has already been run. Run showLinks() to see the form and sheet links.');
  }

  const sheetFile = SpreadsheetApp.create(SHEET_TITLE);
  const form = FormApp.create(FORM_TITLE)
    .setDescription('Use this form to post an event or a piece of news on the Care for Humanity website. ' +
      'It appears on the News & Events page as soon as you submit. ' +
      'Only Date, Title, Category, Summary and Where are required.')
    .setCollectEmail(true)
    .setAllowResponseEdits(true)
    .setShowLinkToRespondAgain(true)
    .setConfirmationMessage('Thank you! It is now on the website (refresh the page to see it). ' +
      'To fix a mistake, use "Edit your response" or edit the row in the Events tab of the sheet.');

  QUESTIONS.forEach(q => addQuestion_(form, q));
  // Newer Google Forms must be published before they accept answers.
  try { if (typeof form.setPublished === 'function') form.setPublished(true); } catch (err) { /* publish by hand */ }
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheetFile.getId());

  const book = SpreadsheetApp.openById(sheetFile.getId());
  buildEventsTab_(book);
  buildTeamTab_(book);
  buildHelpTab_(book, form);
  const blank = book.getSheetByName('Sheet1');
  if (blank) book.deleteSheet(blank);

  ScriptApp.newTrigger('onFormSubmit').forForm(form).onFormSubmit().create();
  props.setProperties({ FORM_ID: form.getId(), SHEET_ID: book.getId() });

  showLinks();
}

function addQuestion_(form, q) {
  if (q.type === 'section') {
    form.addSectionHeaderItem().setTitle(q.title);
    return;
  }
  let item;
  switch (q.type) {
    case 'text': item = form.addTextItem(); break;
    case 'email':
      item = form.addTextItem().setValidation(FormApp.createTextValidation().requireTextIsEmail().build());
      break;
    case 'url':
      item = form.addTextItem().setValidation(FormApp.createTextValidation().requireTextIsUrl().build());
      break;
    case 'paragraph': item = form.addParagraphTextItem(); break;
    case 'date': item = form.addDateItem(); break;
    case 'time': item = form.addTimeItem(); break;
    case 'list': item = form.addListItem().setChoiceValues(q.options); break;
    case 'choice': item = form.addMultipleChoiceItem().setChoiceValues(q.options); break;
    case 'checkbox': item = form.addCheckboxItem().setChoiceValues(q.options); break;
    default: throw new Error('Unknown question type: ' + q.type);
  }
  item.setTitle(q.title);
  if (q.help) item.setHelpText(q.help);
  if (q.required) item.setRequired(true);
}

function buildEventsTab_(book) {
  const sheet = book.insertSheet('Events', 0);
  // Plain text everywhere, so dates, times and phone numbers stay exactly as written.
  sheet.getRange(1, 1, sheet.getMaxRows(), COLUMNS.length).setNumberFormat('@');
  sheet.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS])
    .setFontWeight('bold').setBackground('#EEF1E2');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 260);
  sheet.setColumnWidths(15, 2, 320);
}

function buildTeamTab_(book) {
  const sheet = book.insertSheet('Team');
  sheet.getRange('A1').setValue('Google email addresses allowed to post (leave this list empty to allow anyone who has the form link)')
    .setFontWeight('bold').setWrap(true);
  sheet.setColumnWidth(1, 520);
  sheet.setFrozenRows(1);
}

function buildHelpTab_(book, form) {
  const sheet = book.insertSheet('How to use');
  let link = form.getPublishedUrl();
  try { link = form.shortenFormUrl(link); } catch (err) { /* keep the long link */ }
  const lines = [
    ['HOW TO POST ON THE CARE FOR HUMANITY WEBSITE'],
    [''],
    ['POST A NEW EVENT OR NEWS'],
    ['Open the form, fill it in and press Submit. It appears on the News & Events page straight away (refresh the page).'],
    ['Form link: ' + link],
    [''],
    ['FIX A MISTAKE'],
    ['Open the Events tab and change the cell, or use "Edit your response" from the form confirmation.'],
    ['Dates are written like 2027-05-15 and times like 09:00.'],
    [''],
    ['TAKE SOMETHING OFF THE WEBSITE'],
    ['In the Events tab, type yes in the "hidden" column of that row. Delete the yes to show it again.'],
    ['You can also delete the whole row.'],
    [''],
    ['PAST EVENTS'],
    ['No need to delete them. Once the date has passed they move to "Past Events" by themselves.'],
    [''],
    ['FEATURED AND BANNER'],
    ['featured = yes shows it in Featured Events. featured = spotlight shows it in the big banner at the top.'],
    [''],
    ['WHO CAN POST'],
    ['Add Google email addresses to the Team tab. If the list is not empty, posts from anyone else are hidden'],
    ['until someone removes the yes in the "hidden" column. Who sent each post is in the Form Responses tab.'],
    [''],
    ['PLEASE DO NOT'],
    ['Rename the Events tab, change the first row of the Events tab, or delete the "response" column.']
  ];
  sheet.getRange(1, 1, lines.length, 1).setValues(lines);
  sheet.setColumnWidth(1, 900);
  [1, 3, 7, 11, 15, 18, 21, 25].forEach(r => sheet.getRange(r, 1).setFontWeight('bold'));
}

// ---------------------------------------------------------------------------
// Runs every time the form is submitted (or a response is edited)
// ---------------------------------------------------------------------------

function onFormSubmit(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    processResponse_(e.response);
  } finally {
    lock.releaseLock();
  }
}

// Writes one form response into the Events tab (new row, or updates its existing row).
function processResponse_(response) {
    const props = PropertiesService.getScriptProperties();
    const book = SpreadsheetApp.openById(props.getProperty('SHEET_ID'));
    const sheet = book.getSheetByName('Events');

    const row = { response: response.getId() };
    const byTitle = {};
    QUESTIONS.forEach(q => { if (q.key) byTitle[q.title] = q; });

    response.getItemResponses().forEach(answer => {
      const title = answer.getItem().getTitle();
      const value = answer.getResponse();
      if (sameTitle_(title, PHOTO_MAIN)) {
        const ids = [].concat(value || []);
        row.image = ids.length ? sharePhoto_(ids[0]) : '';
      } else if (sameTitle_(title, PHOTO_MORE)) {
        row.gallery = [].concat(value || []).map(sharePhoto_).join(', ');
      } else if (byTitle[title]) {
        row[byTitle[title].key] = convertAnswer_(byTitle[title].key, value);
      }
    });

    // Find the row for this response (edits update the same row).
    const respCol = COLUMNS.indexOf('response') + 1;
    const hiddenCol = COLUMNS.indexOf('hidden') + 1;
    const last = sheet.getLastRow();
    let target = 0;
    if (last > 1) {
      const ids = sheet.getRange(2, respCol, last - 1, 1).getValues();
      ids.forEach((r, i) => { if (r[0] === row.response) target = i + 2; });
    }
    if (target) row.hidden = sheet.getRange(target, hiddenCol).getValue();
    else target = last + 1;

    if (!isAllowed_(book, response.getRespondentEmail())) row.hidden = 'yes';

    const values = COLUMNS.map(c => (row[c] == null ? '' : String(row[c])));
    sheet.getRange(target, 1, 1, values.length).setNumberFormat('@').setValues([values]);
}

function convertAnswer_(key, value) {
  if (Array.isArray(value)) {
    if (key === 'days') return value.map(d => String(d).slice(0, 3)).join(', ');
    return value.join(', ');
  }
  const v = String(value == null ? '' : value).trim();
  if (key === 'online') return v === WHERE.online ? 'yes' : '';
  if (key === 'signup') return v === 'Yes' ? 'yes' : '';
  if (key === 'featured') return v === FEATURE.banner ? 'spotlight' : v === FEATURE.featured ? 'yes' : '';
  return v;
}

// Makes an uploaded photo viewable by anyone with the link, so the website can show it.
function sharePhoto_(fileId) {
  try {
    DriveApp.getFileById(fileId).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (err) {
    console.warn('Could not share photo ' + fileId + ': ' + err);
  }
  return 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1600';
}

function isAllowed_(book, email) {
  const sheet = book.getSheetByName('Team');
  if (!sheet || sheet.getLastRow() < 2) return true;
  const allowed = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues()
    .map(r => String(r[0]).trim().toLowerCase()).filter(Boolean);
  return allowed.length === 0 || allowed.includes(String(email || '').trim().toLowerCase());
}

// ---------------------------------------------------------------------------
// Helpers you can run from the editor
// ---------------------------------------------------------------------------

// Prints the form, sheet and editing links to the log.
function showLinks() {
  const props = PropertiesService.getScriptProperties();
  const form = FormApp.openById(props.getProperty('FORM_ID'));
  const book = SpreadsheetApp.openById(props.getProperty('SHEET_ID'));
  console.log('Form for the team (share this):  ' + form.getPublishedUrl());
  console.log('Edit the form questions:          ' + form.getEditUrl());
  console.log('Google Sheet:                     ' + book.getUrl());
}

// Runs every past form response through again, updating its row in the Events tab.
// Use it after fixing a question title (e.g. the photo questions) so old posts pick up the fix.
// Manual edits made in the Events tab to those rows are replaced by the form answers.
function reprocessAllResponses() {
  const form = FormApp.openById(PropertiesService.getScriptProperties().getProperty('FORM_ID'));
  const responses = form.getResponses();
  responses.forEach(processResponse_);
  console.log('Reprocessed ' + responses.length + ' response(s).');
}

// Lists the form's question titles, to check the photo questions are named as expected.
function checkQuestionTitles() {
  const form = FormApp.openById(PropertiesService.getScriptProperties().getProperty('FORM_ID'));
  form.getItems().forEach(item => {
    const t = item.getTitle();
    const note = sameTitle_(t, PHOTO_MAIN) ? '  <- main photo OK' : sameTitle_(t, PHOTO_MORE) ? '  <- more photos OK' : '';
    console.log(item.getType() + ': "' + t + '"' + note);
  });
}

// Re-shares every Google Drive photo listed in the Events tab.
// Run it if photos added by hand (pasted Drive links) do not show on the website.
function sharePhotosInSheet() {
  const props = PropertiesService.getScriptProperties();
  const sheet = SpreadsheetApp.openById(props.getProperty('SHEET_ID')).getSheetByName('Events');
  if (sheet.getLastRow() < 2) return;
  const imgCol = COLUMNS.indexOf('image') + 1;
  const cells = sheet.getRange(2, imgCol, sheet.getLastRow() - 1, 2).getValues();
  const idPattern = /(?:id=|\/d\/)([\w-]{20,})/g;
  let count = 0;
  cells.forEach(r => r.join(' ').replace(idPattern, (m, id) => { sharePhoto_(id); count++; return m; }));
  console.log('Shared ' + count + ' photo(s).');
}

// ---------------------------------------------------------------------------
// Live feed for the website (deploy this script as a Web app, see the guide)
// ---------------------------------------------------------------------------

// Returns the Events tab as JSON, read live from the sheet, so new posts,
// edits and deleted rows show on the website the next time a page loads.
// Only the Events tab is shared; the form answers and Team list stay private.
function doGet() {
  const sheet = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID'))
    .getSheetByName('Events');
  const values = sheet.getDataRange().getDisplayValues();
  const head = values.shift().map(h => String(h).trim());
  const events = values
    .filter(r => r.some(c => String(c).trim() !== ''))
    .map(r => {
      const row = {};
      head.forEach((h, i) => { if (h && h !== 'response') row[h] = r[i]; });
      return row;
    });
  return ContentService.createTextOutput(JSON.stringify({ events: events, updated: new Date().toISOString() }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---------------------------------------------------------------------------
// One-time import of the news that was first written into the website code
// ---------------------------------------------------------------------------

// Adds the starter news items to the Events tab, so the team can edit, hide or
// delete them like any other post. Skips any that are already in the sheet.
// Run once, then empty the list in assets/js/events-data.js (see the guide).
function importStarterNews() {
  const STARTER = [
    {
      "title": "Opening of Dr. Claude's clinic",
      "date": "2023-12-08",
      "category": "News",
      "location": "Gaborone",
      "summary": "An honor to attend the opening of the clinic of a partner we have worked with all year.",
      "description": "Absolutely grateful to have met Dr. Claude. We have over the past year worked very well together through a couple of different initiatives. It was an honor to attend the opening of his clinic and we pray for future medical partnerships with him.\n\nThank you to our Secretary for attending the function.",
      "image": "assets/img/photos/clinic-opening-2023.webp",
      "instagram": "https://www.instagram.com/care4humanity_/"
    },
    {
      "title": "Thank you for our Annual Gala Dinner 2023",
      "date": "2023-11-30",
      "category": "News",
      "location": "Gaborone",
      "summary": "Thank you for all the support leading up to and at our Gala Dinner.",
      "description": "On behalf of all of us at Care for Humanity, thank you for all the support leading up to and at our Gala Dinner. We are excited to see everyone and create better partnerships in 2024.\n\nThank you to our most special friend for doing us the honors and doing our award presentation, and to Simply Balloons for the amazing backdrop.",
      "image": "assets/img/photos/gala-2023-team.webp",
      "gallery": "assets/img/photos/gala-2023-award.webp, assets/img/photos/gala-2023-backdrop.webp, assets/img/photos/gala-2023-vp-treasurer.webp, assets/img/photos/gala-night.webp",
      "instagram": "https://www.instagram.com/care4humanity_/"
    },
    {
      "title": "Care for Humanity is officially registered",
      "date": "2023-10-04",
      "category": "News",
      "summary": "CFH is incorporated as a registered non-profit organization.",
      "description": "Pleased to announce that CFH is a Registered Non-Profit Organization. We thank you all for your support and cannot wait to continue providing assistance and relief everywhere!\n\nA special thank you to Akheel Jinabhai & Associates and to Push Outsourcing for their services and support.",
      "image": "assets/img/photos/registration-announcement.webp"
    },
    {
      "title": "Our borehole donation in the Daily News",
      "date": "2023-05-24",
      "category": "News",
      "location": "Nthwalang Junior Secondary School",
      "address": "Digawana, Botswana",
      "summary": "The Daily News covers the borehole we handed over at Nthwalang Junior Secondary School in Digawana.",
      "description": "Care for Humanity Trust founding director, Ms Afreen Dhansay, handed over a borehole to the Southern region education representative, Ms Lydia Makgoma, at Nthwalang Junior Secondary School in Digawana.\n\nThe school and the Digawana community have embraced the noble gesture, saying it would alleviate the decades-long lack of reliable water.\n\nFrom the Daily News, Wednesday 24 May 2023. Photo: Naomi Leepile.",
      "image": "assets/img/photos/daily-news-borehole-2023.webp",
      "gallery": "assets/img/photos/borehole-ceremony.webp, assets/img/photos/borehole-handover.webp, assets/img/gallery/student4.webp"
    },
    {
      "title": "Celebrating the work of Care for Humanity with Ditshwanelo",
      "date": "2022-11-19",
      "category": "News",
      "location": "Gaborone",
      "summary": "Our founder with Ms Alice Mogwe, Director of Ditshwanelo, at a celebration of CFH's work.",
      "description": "At the celebration of the work of Care for Humanity in Gaborone, our founder Ms Afreen Dhansay was joined by Ms Alice Mogwe, the Director of DITSHWANELO, The Botswana Centre for Human Rights.",
      "image": "assets/img/photos/founder-ditshwanelo-2022.webp"
    },
    {
      "title": "Gimhani Mohau Perera represents Africa at Miss Teen International 2022",
      "date": "2022-07-30",
      "category": "News",
      "summary": "Our volunteer places in the Top 10 and wins the People's Choice Award.",
      "description": "CFH volunteer Gimhani Mohau Perera, Miss Teen International Botswana 2021, represented Africa at Miss Teen International 2022. She placed in the Top 10 and won the People's Choice Award.",
      "image": "assets/img/photos/gimhani-africa-stage.webp",
      "gallery": "assets/img/photos/gimhani-finalists.webp, assets/img/photos/gimhani-flag.webp, assets/img/photos/gimhani-airport.webp"
    }
  ];
  const sheet = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("SHEET_ID")).getSheetByName("Events");
  const head = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
  const existing = sheet.getLastRow() > 1
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, head.length).getDisplayValues()
        .map(r => r[head.indexOf("title")] + "|" + r[head.indexOf("date")])
    : [];
  const rows = STARTER
    .filter(e => !existing.includes(e.title + "|" + e.date))
    .map(e => head.map(h => (h === "response" ? "starter" : (e[h] || ""))));
  if (rows.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, head.length).setNumberFormat("@").setValues(rows);
  }
  console.log("Added " + rows.length + " starter news item(s) to the Events tab.");
}
