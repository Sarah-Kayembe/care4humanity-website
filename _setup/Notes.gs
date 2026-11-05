/**
 * Care for Humanity: "Leave a note" wall
 * --------------------------------------
 * Visitors leave a short note on the home page (encouragement, feedback, or a
 * message for the team). Notes are saved in the "Notes" tab of the
 * CFH Website Events sheet, and the clean ones show on the website.
 *
 *   website form  -->  doPost()       checks the note and saves it in the "Notes" tab
 *   website wall  -->  doGet(?notes)  returns the notes marked "shown"
 *
 * Bad-word check: notes with bad words, links or spam are saved as "held" and
 * never shown. The team can add more blocked words (for example in Setswana)
 * in the "Blocked words" tab, one word per row.
 *
 * Team controls, in the "Notes" tab, "status" column:
 *   shown  = on the website
 *   held   = waiting for the team (type  shown  to approve it)
 *   hidden = removed from the website
 *   private = the visitor asked for it to be for the team only (never shown)
 */

// Settings ------------------------------------------------------------------

// true  = clean notes appear on the website straight away
// false = every note waits until the team types "shown" in the status column
const NOTES_AUTO_SHOW = true;

// Email the CFH account when a note is held for review.
const NOTES_EMAIL_WHEN_HELD = true;

// How many notes the website shows (newest first).
const NOTES_LIMIT = 60;

const NOTE_TYPES = ['Encouragement', 'Feedback on the website', 'Message for the team'];
const NOTE_COLUMNS = ['date', 'name', 'type', 'message', 'status', 'reason'];

// Bad-word list ----------------------------------------------------------------
// STEMS also block longer words that start with them (fuck -> fucking).
// WORDS only block the whole word (plus a plural "s"), so "class", "assess" or "Pakistan" pass.
const BAD_STEMS = ['fuck', 'fck', 'motherfuck', 'shit', 'bullshit', 'bitch', 'cunt', 'asshole', 'arsehole',
  'bastard', 'whore', 'slut', 'wank', 'twat', 'pussy', 'cocksuck', 'dickhead', 'nigger', 'nigga', 'faggot',
  'retard', 'piss', 'dumbass', 'jackass', 'porn', 'dildo', 'rapist', 'tranny', 'kike', 'chink', 'spastic'];
const BAD_WORDS = ['fuk', 'paki', 'ass', 'arse', 'dick', 'cock', 'fag', 'tit', 'boob', 'cum', 'hoe', 'rape',
  'stfu', 'wtf', 'fml', 'milf', 'kys', 'killyourself', 'coon', 'spic', 'wetback', 'nazi', 'hitler'];

// Website feed (called from doGet) ---------------------------------------------

function notesFeed_() {
  const sheet = notesSheet_();
  const rows = sheet.getDataRange().getValues();
  const head = rows.shift().map(String);
  const col = name => head.indexOf(name);
  const notes = rows
    .filter(r => String(r[col('status')]).trim().toLowerCase() === 'shown')
    .map(r => ({
      date: r[col('date')] instanceof Date ? r[col('date')].toISOString() : String(r[col('date')]),
      name: String(r[col('name')]),
      type: String(r[col('type')]),
      message: String(r[col('message')])
    }))
    .reverse()
    .slice(0, NOTES_LIMIT);
  return json_({ notes: notes });
}

// Receiving a note from the website ---------------------------------------------

function doPost(e) {
  let data;
  try { data = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'bad-request' }); }

  // Hidden field that people never see. Bots fill it in.
  if (data.website) return json_({ ok: true, status: 'held' });

  const name = clean_(data.name).slice(0, 40) || 'A friend of CFH';
  const message = clean_(data.message).slice(0, 300);
  const type = NOTE_TYPES.indexOf(data.type) > -1 ? data.type : NOTE_TYPES[0];
  if (message.length < 3) return json_({ ok: false, error: 'empty' });

  // Simple flood protection: at most 20 notes in 10 minutes, and no repeats.
  const cache = CacheService.getScriptCache();
  const count = Number(cache.get('notes-count') || 0);
  if (count >= 20) return json_({ ok: false, error: 'busy' });
  cache.put('notes-count', String(count + 1), 600);
  const key = 'note-' + Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, message.toLowerCase()));
  if (cache.get(key)) return json_({ ok: false, error: 'duplicate' });
  cache.put(key, '1', 3600);

  const reason = noteProblem_(name + ' ' + message);
  // Notes the visitor did not want on the website stay private for the team.
  const status = reason ? 'held' : data.public === false ? 'private' : (NOTES_AUTO_SHOW ? 'shown' : 'held');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    notesSheet_().appendRow([new Date(), name, type, message, status, reason || '']);
  } finally {
    lock.releaseLock();
  }

  if (status === 'held' && NOTES_EMAIL_WHEN_HELD) {
    try {
      MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'New website note to check',
        'A note on the website is waiting for the team.\n\nFrom: ' + name + '\nType: ' + type +
        '\n\n' + message + '\n\nReason held: ' + (reason || 'auto-show is off') +
        '\n\nTo show it, type  shown  in its status column in the "Notes" tab of the CFH Website Events sheet.');
    } catch (err) { /* email is optional */ }
  }

  return json_({ ok: true, status: status });
}

// Checks -----------------------------------------------------------------------

// Returns why a note should be held, or '' if it is fine.
function noteProblem_(text) {
  if (/https?:\/\/|www\.|\.(com|net|org|ru|xyz|info|co)\b/i.test(text)) return 'contains a link';
  if (/(.)\1{9,}/.test(text)) return 'looks like spam';
  const extra = extraBlockedWords_();
  if (hasBadWord_(text, extra)) return 'bad language';
  return '';
}

// Same check as assets/js/notes.js on the website.
function hasBadWord_(text, extraWords) {
  const leet = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '@': 'a', '$': 's', '!': 'i', '|': 'i' };
  let t = String(text).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  // Ordinary words that contain a blocked word
  t = t.replace(/shiitake|cocktail|cockpit|cockroach|peacock|hancock|dickens|scunthorpe/g, ' ');
  t = t.replace(/[0134578@$!|]/g, ch => leet[ch]);
  // "f u c k" and "f.u.c.k" -> "fuck"
  t = t.replace(/\b(?:[a-z][\s._\-*]+){2,}[a-z]\b/g, m => m.replace(/[^a-z]/g, ''));
  const sep = '[^a-z\\s]*';
  const pattern = w => w.split('').map(ch => ch.replace(/[^a-z]/g, '') + '+').filter(p => p !== '+').join(sep);
  const stems = BAD_STEMS.concat(extraWords || []);
  for (let i = 0; i < stems.length; i++) {
    if (new RegExp('(^|[^a-z])' + pattern(stems[i])).test(t)) return true;
  }
  for (let i = 0; i < BAD_WORDS.length; i++) {
    if (new RegExp('(^|[^a-z])' + pattern(BAD_WORDS[i]) + 's?($|[^a-z])').test(t)) return true;
  }
  return false;
}

function extraBlockedWords_() {
  const tab = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID'))
    .getSheetByName('Blocked words');
  if (!tab || tab.getLastRow() < 2) return [];
  return tab.getRange(2, 1, tab.getLastRow() - 1, 1).getValues()
    .map(r => String(r[0]).trim().toLowerCase().replace(/[^a-z]/g, ''))
    .filter(w => w.length > 1);
}

// Sheet helpers -------------------------------------------------------------------

// Finds the "Notes" tab, creating it (and the "Blocked words" tab) the first time.
function notesSheet_() {
  const book = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID'));
  let sheet = book.getSheetByName('Notes');
  if (!sheet) {
    sheet = book.insertSheet('Notes');
    sheet.appendRow(NOTE_COLUMNS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, NOTE_COLUMNS.length).setFontWeight('bold').setBackground('#EEF1E2');
    sheet.setColumnWidth(4, 420);
    sheet.getRange('E1').setNote('shown = on the website\nheld = waiting for the team (type shown to approve)\nhidden = removed from the website\nprivate = for the team only');
    const statusRule = SpreadsheetApp.newDataValidation().requireValueInList(['shown', 'held', 'hidden', 'private'], true).build();
    sheet.getRange('E2:E').setDataValidation(statusRule);
  }
  if (!book.getSheetByName('Blocked words')) {
    const words = book.insertSheet('Blocked words');
    words.appendRow(['Extra words to block (one per row, e.g. in Setswana). Any word that starts with these is blocked.']);
    words.getRange('A1').setFontWeight('bold').setBackground('#EEF1E2');
    words.setColumnWidth(1, 520);
  }
  return sheet;
}

// Run once from the editor to create the "Notes" and "Blocked words" tabs.
function setupNotes() {
  notesSheet_();
  Logger.log('The "Notes" and "Blocked words" tabs are ready.');
}

// Run from the editor to try the bad-word check.
function testBadWords() {
  ['Thank you so much team!', 'You are f.u.c.k.i.n.g amazing', 'great class, I will assess', 'sh1t website',
   'Dickens is my favourite author', 'what an a$$', 'Scunthorpe is a town'].forEach(t =>
    Logger.log((hasBadWord_(t, []) ? 'BLOCKED  ' : 'ok       ') + t));
}

function clean_(value) {
  return String(value || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
