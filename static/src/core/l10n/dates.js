/** @odoo-module **/

import {localization} from "@web/core/l10n/localization";
const origDatesModule = {};

function luxonFormatToIntlOptions(luxonFormatString) {
  const formatMapping = {
    'yyyy': ['year', 'numeric'],
    'MM': ['month', '2-digit'],
    'dd': ['day', '2-digit'],
    'HH': ['hour', '2-digit'],
    'mm': ['minute', '2-digit'],
    'ss': ['second', '2-digit'],
  };

  const luxonTokens = luxonFormatString.match(/y+|M+|d+|H+|m+|s+/g);

  let options = {hour12: false}

  if (luxonTokens) {
    luxonTokens.forEach(token => {
      if (formatMapping[token]) {
        options[formatMapping[token][0]] = formatMapping[token][1];
      } else {
        console.warn(`invalid format mapping for {luxonFormatString}`)
      }
    });
  }

  return options;
}

function formatDateTimeCustom(value, options = {}) {
  if (!value) {
    return "";
  }

  const format = options.format || localization.dateTimeFormat;
  return `‎${Intl.DateTimeFormat('fa', luxonFormatToIntlOptions(format)).format(value.setZone("default"))}`
}

function formatDateCustom(value, options = {}) {
  if (!value) {
    return "";
  }
  const format = options.format || localization.dateFormat;
  return `‎${Intl.DateTimeFormat('fa', luxonFormatToIntlOptions(format)).format(value)}`
}

function parseDateCustom(value, options = {}) {
  // return parseDate(value, options)
  if (value && /[\u06F0-\u06F9]/.test(value)) {
    value = value.replaceAll('‎', '');
    const {jalaliToGregorian} = odoo.loader.modules.get('@l10n_ir_calendar/helpers/jalali')
    const {convertFarsiNumbersToArabic} = odoo.loader.modules.get('@l10n_ir_calendar/helpers/numeral')
    if (!options || !options.hasOwnProperty('format') || options.format === 'yyyy/MM/dd') {
      let dt = convertFarsiNumbersToArabic(value).split('/').map((v) => parseInt(v))
      dt = jalaliToGregorian(dt[0], dt[1], dt[2])
      // value = new Date(dt[0], dt[1], dt[2])
      value = dt[0] + "/" + dt[1] + "/" + dt[2]
    } else {
      console.warn("@ unknown options:", options)
    }
  }
  return origDatesModule.parseDate(value, options)
}

function parseDateTimeCustom(value, options = {}) {
  return origDatesModule.parseDateTime(value, options)
}

odoo.define('l10n_ir_calendar.core.l10n.dates', [], function (require) {
  const l10n_dates = require('@web/core/l10n/dates');
  origDatesModule.parseDate = l10n_dates.parseDate
  origDatesModule.parseDateTime = l10n_dates.parseDateTime
  l10n_dates.formatDate = formatDateCustom;
  l10n_dates.formatDateTime = formatDateTimeCustom;
  l10n_dates.parseDateTime = parseDateTimeCustom;
  l10n_dates.parseDate = parseDateCustom;
});
