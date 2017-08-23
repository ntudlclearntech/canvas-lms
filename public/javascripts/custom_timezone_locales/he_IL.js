module.exports = { // eslint-disable-line import/no-commonjs
  name: 'he_IL',
  day: {
    abbrev: ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"],
    full: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
  },
  month: {
    abbrev: [
      'ינו׳',
      'פבר׳',
      'מרץ',
      'אפר׳',
      'מאי',
      'יונ',
      'יול',
      'אוג׳',
      'ספט׳',
      'אוק׳',
      'נוב׳',
      'דצמ׳'
    ],
    full: [
      'ינואר',
      'פברואר',
      'מרץ',
      'אפריל',
      'מאי',
      'יוני',
      'יולי',
      'אוגוסט',
      'ספטמבר',
      'אוקטובר',
      'נובמבר',
      'דצמבר'
    ]
  },
  meridiem: ['AM', 'PM'],
  date: '%d/%m/%y',
  time24: '%H:%M:%S',
  dateTime: '%Z %H:%M:%S %Y %b %d %a',
  time12: '%I:%M:%S %P',
  full: '%a %b %e %H:%M:%S %Z %Y'
}
