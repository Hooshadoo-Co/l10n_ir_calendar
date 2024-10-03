/** @odoo-module **/

const webSearchUtilsDatesModule = {};
const webCoreL10NDatesModule = {}
const webCoreDomainModule = {}
const webCoreL10NLocalizationModule = {}

function constructDateRangeCustom(params) {
  const {referenceMoment, fieldName, fieldType, granularity, setParam, plusParam} = params;
  if ("quarter" in setParam) {
    // Luxon does not consider quarter key in setParam (like moment did)
    setParam.month = webSearchUtilsDatesModule.QUARTERS[setParam.quarter].coveredMonths[0];
    delete setParam.quarter;
  }
  const date = referenceMoment.set(setParam).plus(plusParam || {});
  // compute domain
  let leftDate, rightDate;
  if (granularity === 'month') {
    leftDate = date.jalaliStartOfMonth();
    rightDate = date.jalaliEndOfMonth();
  } else if (granularity === 'year') {
    leftDate = date.jalaliStartOfYear();
    rightDate = date.jalaliEndOfYear();
  } else if (granularity === 'quarter') {
    const season = Math.floor((setParam.month - 1) / 3) + 1
    const dt = date.jalaliAddMonths(3)
    leftDate = dt.jalaliStartOfSeason(season);
    rightDate = dt.jalaliEndOfSeason(season);
  } else {
    console.warn('l10n_ir_calendar > search > utils > dates > constructDateRangeCustom(): Invalid granularity:', granularity)
    leftDate = date.startOf(granularity);
    rightDate = date.endOf(granularity);
  }
  let leftBound;
  let rightBound;
  if (fieldType === "date") {
    leftBound = webCoreL10NDatesModule.serializeDate(leftDate);
    rightBound = webCoreL10NDatesModule.serializeDate(rightDate);
  } else {
    leftBound = webCoreL10NDatesModule.serializeDateTime(leftDate);
    rightBound = webCoreL10NDatesModule.serializeDateTime(rightDate);
  }
  const domain = new webCoreDomainModule.Domain(["&", [fieldName, ">=", leftBound], [fieldName, "<=", rightBound]]);
  // compute description
  const descriptions = [date.jalaliDate.yearFa];
  // const method = webCoreL10NLocalizationModule.localization.direction === "rtl" ? "push" : "unshift";
  const method = 'unshift'
  if (granularity === "month") {
    descriptions[method](date.toFormat("MMMM"));
  } else if (granularity === "quarter") {
    const quarter = date.quarter;
    descriptions[method](webSearchUtilsDatesModule.QUARTERS[quarter].description.toString());
  }
  const description = descriptions.join(" ");
  return {domain, description};
}

function constructDateDomainCustom(
  referenceMoment,
  fieldName,
  fieldType,
  selectedOptionIds,
  comparisonOptionId
) {
  let plusParam;
  let selectedOptions;
  if (comparisonOptionId) {
    [plusParam, selectedOptions] = webSearchUtilsDatesModule.getComparisonParams(
      referenceMoment,
      selectedOptionIds,
      comparisonOptionId
    );
  } else {
    selectedOptions = webSearchUtilsDatesModule.getSelectedOptions(referenceMoment, selectedOptionIds);
  }
  const yearOptions = selectedOptions.year;
  const otherOptions = [...(selectedOptions.quarter || []), ...(selectedOptions.month || [])];
  webSearchUtilsDatesModule.sortPeriodOptions(yearOptions);
  webSearchUtilsDatesModule.sortPeriodOptions(otherOptions);
  const ranges = [];
  for (const yearOption of yearOptions) {
    const constructRangeParams = {
      referenceMoment,
      fieldName,
      fieldType,
      plusParam,
    };
    if (otherOptions.length) {
      for (const option of otherOptions) {
        const setParam = Object.assign(
          {},
          yearOption.setParam,
          option ? option.setParam : {}
        );
        const {granularity} = option;
        const range = constructDateRangeCustom(
          Object.assign({granularity, setParam}, constructRangeParams)
        );
        ranges.push(range);
      }
    } else {
      const {granularity, setParam} = yearOption;
      const range = constructDateRangeCustom(
        Object.assign({granularity, setParam}, constructRangeParams)
      );
      ranges.push(range);
    }
  }
  const domain = webCoreDomainModule.Domain.combine(
    ranges.map((range) => range.domain),
    "OR"
  );
  const description = ranges.map((range) => range.description).join("/");
  return {domain, description};
}

function getPeriodOptionsCustom(referenceMoment) {
  // adapt when solution for moment is found...
  const options = [];
  const originalOptions = Object.values(webSearchUtilsDatesModule.PERIOD_OPTIONS);
  for (const option of originalOptions) {
    const {id, groupNumber} = option;
    let description;
    let defaultYear;
    switch (option.granularity) {
      case "quarter":
        switch (option.id) {
          case "first_quarter":
            description = 'بهار';
            break;
          case "second_quarter":
            description = 'تابستان';
            break;
          case "third_quarter":
            description = 'پاییز';
            break;
          case "fourth_quarter":
            description = 'زمستان';
            break;
          default:
            description = option.description.toString();
        }
        defaultYear = referenceMoment.set(option.setParam).year;
        break;
      case "month":
      case "year": {
        const date = referenceMoment.plus(option.plusParam);
        if (option.format === 'MMMM') {
          description = date.jalaliDate.monthLong;
        } else if (option.format === 'yyyy') {
          description = date.jalaliDate.yearFa;
        } else {
          console.warn('l10n_ir_calendar > search > utils > dates: Unknown format:', option.format)
          description = date.toFormat(option.format);
        }
        defaultYear = date.year;
        break;
      }
    }
    const setParam = webSearchUtilsDatesModule.getSetParam(option, referenceMoment);
    options.push({id, groupNumber, description, defaultYear, setParam});
  }
  const periodOptions = [];
  for (const option of options) {
    const {id, groupNumber, description, defaultYear} = option;
    const yearOption = options.find((o) => o.setParam && o.setParam.year === defaultYear);
    periodOptions.push({
      id,
      groupNumber,
      description,
      defaultYearId: yearOption.id,
    });
  }
  return periodOptions;
}


odoo.define('l10n_ir_calendar.search.utils.dates', [], function (require) {
  const web_search_utils_dates = require('@web/search/utils/dates');
  const web_core_l10n_dates = require('@web/core/l10n/dates');
  const web_core_domain = require("@web/core/domain");
  const web_core_l10n_localization = require('@web/core/l10n/localization');

  webSearchUtilsDatesModule.PERIOD_OPTIONS = web_search_utils_dates.PERIOD_OPTIONS;
  webSearchUtilsDatesModule.getSetParam = web_search_utils_dates.getSetParam;
  webSearchUtilsDatesModule.getComparisonParams = web_search_utils_dates.getComparisonParams;
  webSearchUtilsDatesModule.getSelectedOptions = web_search_utils_dates.getSelectedOptions;
  webSearchUtilsDatesModule.sortPeriodOptions = web_search_utils_dates.sortPeriodOptions;
  webSearchUtilsDatesModule.QUARTERS = web_search_utils_dates.QUARTERS
  web_search_utils_dates.QUARTERS["1"].description = 'بهار'
  web_search_utils_dates.QUARTERS["2"].description = 'تابستان'
  web_search_utils_dates.QUARTERS["3"].description = 'پاییز'
  web_search_utils_dates.QUARTERS["4"].description = 'زمستان'

  webSearchUtilsDatesModule.INTERVAL_OPTIONS = web_search_utils_dates.INTERVAL_OPTIONS;
  web_search_utils_dates.INTERVAL_OPTIONS.quarter.description = 'فصل'

  webCoreL10NDatesModule.serializeDate = web_core_l10n_dates.serializeDate;
  webCoreL10NDatesModule.serializeDateTime = web_core_l10n_dates.serializeDateTime;

  webCoreDomainModule.Domain = web_core_domain.Domain;
  webCoreL10NLocalizationModule.localization = web_core_l10n_localization.localization;

  web_search_utils_dates.constructDateRange = constructDateRangeCustom;
  web_search_utils_dates.getPeriodOptions = getPeriodOptionsCustom;
  web_search_utils_dates.constructDateDomain = constructDateDomainCustom;
  return web_search_utils_dates;
});
