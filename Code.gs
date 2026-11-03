/**
 * DIETA – zaplecze w Google Sheets (dla aplikacji na telefon i MINDE)
 * 1) Zmień TOKEN poniżej na własne hasło.
 * 2) Uruchom raz funkcję setup().
 * 3) Wdróż jako aplikację internetową (Wykonaj jako: Ja, Dostęp: Każdy).
 */
const TOKEN = 'ZMIEN-NA-SWOJE-HASLO';

const SCHEMA = {
  Produkty: {
    cols: ['id', 'kod', 'nazwa', 'marka', 'kcal', 'bialko', 'tluszcz', 'nasycone', 'wegle', 'cukry', 'blonnik', 'sol', 'zrodlo', 'dodano', 'porcja_g', 'porcja_nazwa', 'odpowiednik',
      'wit_d_ug', 'b12_ug', 'zelazo_mg', 'wapn_mg', 'magnez_mg', 'cynk_mg', 'potas_mg', 'foliany_ug', 'epa_dha_mg', 'jod_ug', 'napoj', 'alkohol_g'],
    text: ['id', 'kod', 'nazwa', 'marka', 'zrodlo', 'dodano', 'porcja_nazwa', 'odpowiednik', 'napoj']
  },
  Dania: {
    cols: ['id', 'nazwa', 'porcje', 'waga_g', 'dodano'],
    text: ['id', 'nazwa', 'dodano']
  },
  Skladniki_dan: {
    cols: ['danie_id', 'produkt_id', 'gramy'],
    text: ['danie_id', 'produkt_id']
  },
  Dziennik: {
    cols: ['id', 'data', 'godzina', 'pora', 'typ', 'ref_id', 'nazwa', 'ilosc_g', 'kcal', 'bialko', 'tluszcz', 'wegle', 'dodano', 'zmieniono',
      'nasycone', 'cukry', 'blonnik', 'sol',
      'wit_d_ug', 'b12_ug', 'zelazo_mg', 'wapn_mg', 'magnez_mg', 'cynk_mg', 'potas_mg', 'foliany_ug', 'epa_dha_mg', 'mikro_zrodlo', 'jod_ug', 'woda_g', 'plyn_ml', 'alkohol_g'],
    text: ['id', 'data', 'godzina', 'pora', 'typ', 'ref_id', 'nazwa', 'dodano', 'zmieniono', 'mikro_zrodlo']
  },
  /* jeden wiersz na dzień: zamkniety = TAK, gdy wszystkie posiłki są wpisane */
  Dni: {
    cols: ['data', 'zamkniety', 'zamknieto'],
    text: ['data', 'zamkniety', 'zamknieto']
  },
  /* cele dzienne – wpisuje trener (Claude); aplikacja tylko czyta */
  Cele: {
    cols: ['data', 'kcal', 'bialko', 'tluszcz', 'wegle', 'typ_dnia', 'uwaga', 'ustalono', 'woda_ml'],
    text: ['data', 'typ_dnia', 'uwaga', 'ustalono']
  }
};

/** Uruchom raz – tworzy zakładki i nagłówki. */
function setup() {
  const ss = SpreadsheetApp.getActive();
  Object.keys(SCHEMA).forEach(function (name) {
    const s = SCHEMA[name];
    const sh = ss.getSheetByName(name) || ss.insertSheet(name);
    sh.getRange(1, 1, 1, s.cols.length).setValues([s.cols]).setFontWeight('bold');
    sh.setFrozenRows(1);
    s.text.forEach(function (c) {
      sh.getRange(1, s.cols.indexOf(c) + 1, sh.getMaxRows(), 1).setNumberFormat('@');
    });
  });
  ['Arkusz1', 'Sheet1'].forEach(function (n) {
    const def = ss.getSheetByName(n);
    if (def && ss.getSheets().length > 1) ss.deleteSheet(def);
  });
}

function doGet(e) {
  return handle_(function () {
    const p = e.parameter || {};
    auth_(p.token);
    if (p.action === 'init') {
      return { produkty: rows_('Produkty'), dania: rows_('Dania'), skladniki: rows_('Skladniki_dan'), cele: cele_() };
    }
    if (p.action === 'day') {
      const dz = rows_('Dni').filter(function (r) { return r.data === p.date; })[0] || null;
      const cel = rows_('Cele').filter(function (r) { return r.data === p.date; })[0] || null;
      return { v: 3, entries: rows_('Dziennik').filter(function (r) { return r.data === p.date; }), dzien: dz, cel: cel, cele: cele_() };
    }
    throw new Error('Nieznana akcja');
  });
}

function doPost(e) {
  return handle_(function () {
    const b = JSON.parse(e.postData.contents);
    auth_(b.token);
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      const d = b.data;
      switch (b.action) {
        case 'addProduct': upsert_('Produkty', d); break;
        case 'addDish':
          if (findRow_('Dania', d.danie.id) < 0) {
            append_('Dania', d.danie);
            d.skladniki.forEach(function (s) { append_('Skladniki_dan', s); });
          }
          break;
        case 'addEntry':
        case 'updateEntry': upsert_('Dziennik', d); break;
        case 'setDay': {
          const r = findRow_('Dni', d.data);
          if (r > 0) writeRow_('Dni', r, d); else append_('Dni', d);
          break;
        }
        case 'deleteEntry': {
          const r = findRow_('Dziennik', d.id);
          if (r > 0) sheet_('Dziennik').deleteRow(r);
          break;
        }
        default: throw new Error('Nieznana akcja');
      }
      return { ok: true };
    } finally {
      lock.releaseLock();
    }
  });
}

/* ---------- pomocnicze ---------- */
/** Cele od 7 dni wstecz do 21 dni naprzód – aplikacja trzyma je w pamięci telefonu (praca offline). */
function cele_() {
  const tz = Session.getScriptTimeZone(), d = new Date();
  const od = Utilities.formatDate(new Date(d.getTime() - 7 * 864e5), tz, 'yyyy-MM-dd');
  const doo = Utilities.formatDate(new Date(d.getTime() + 21 * 864e5), tz, 'yyyy-MM-dd');
  return rows_('Cele').filter(function (r) { return r.data && r.data >= od && r.data <= doo; });
}

/** Dopisuje brakujące kolumny (np. po aktualizacji skryptu) bez ruszania danych. */
function ensureSchema_() {
  const ss = SpreadsheetApp.getActive();
  Object.keys(SCHEMA).forEach(function (name) {
    const s = SCHEMA[name];
    let sh = ss.getSheetByName(name);
    if (!sh) {
      try { sh = ss.insertSheet(name); }
      catch (e) { SpreadsheetApp.flush(); sh = ss.getSheetByName(name); }  /* równoległe zapytanie już utworzyło zakładkę */
    }
    const cur = sh.getRange(1, 1, 1, s.cols.length).getValues()[0];
    if (cur.join('|') !== s.cols.join('|')) {
      sh.getRange(1, 1, 1, s.cols.length).setValues([s.cols]).setFontWeight('bold');
      sh.setFrozenRows(1);
      s.text.forEach(function (c) {
        sh.getRange(1, s.cols.indexOf(c) + 1, sh.getMaxRows(), 1).setNumberFormat('@');
      });
    }
  });
}

function handle_(fn) {
  let out;
  try { ensureSchema_(); out = fn(); } catch (err) { out = { error: String(err && err.message || err) }; }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}
function auth_(t) { if (t !== TOKEN) throw new Error('Zły token'); }
function sheet_(name) { return SpreadsheetApp.getActive().getSheetByName(name); }

function clean_(v) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), v.getFullYear() < 1900 ? 'HH:mm' : 'yyyy-MM-dd');
  }
  return v;
}

function rows_(name) {
  const sh = sheet_(name), n = sh.getLastRow(), cols = SCHEMA[name].cols;
  if (n < 2) return [];
  return sh.getRange(2, 1, n - 1, cols.length).getValues().map(function (r) {
    const o = {};
    cols.forEach(function (c, i) { o[c] = clean_(r[i]); });
    return o;
  });
}

function findRow_(name, id) {
  const sh = sheet_(name), n = sh.getLastRow();
  if (n < 2) return -1;
  const ids = sh.getRange(2, 1, n - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(id)) return i + 2;
  return -1;
}

function rowValues_(name, obj) {
  const s = SCHEMA[name];
  return s.cols.map(function (c) {
    const v = obj[c];
    if (s.text.indexOf(c) >= 0) return v == null ? '' : String(v);
    return (v === '' || v == null) ? '' : Number(v);
  });
}

function writeRow_(name, row, obj) {
  const s = SCHEMA[name], sh = sheet_(name);
  s.text.forEach(function (c) { sh.getRange(row, s.cols.indexOf(c) + 1).setNumberFormat('@'); });
  sh.getRange(row, 1, 1, s.cols.length).setValues([rowValues_(name, obj)]);
}

function append_(name, obj) { writeRow_(name, sheet_(name).getLastRow() + 1, obj); }

function upsert_(name, obj) {
  const r = findRow_(name, obj.id);
  if (r > 0) writeRow_(name, r, obj); else append_(name, obj);
}
