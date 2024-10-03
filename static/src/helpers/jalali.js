/** @odoo-module **/

import {convertArabicNumbersToFarsi} from "./numeral";

const {DateTime, Info} = luxon;
export const jalaliMonthsLong = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
export const jalaliMonthsShort = ['فرو', 'ارد', 'خرد', 'تیر', 'مرد', 'شهر', 'مهر', 'آبا', 'آذر', 'دی', 'بهم', 'اسف']
export const jalaliWeekdaysShort = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']
export const jalaliWeekdaysLong = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']
export const jalaliDaysInMonth = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
export const gregorianDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];


export function jalaliToGregorian(j_y, j_m, j_d) {
    j_y = parseInt(j_y);
    j_m = parseInt(j_m);
    j_d = parseInt(j_d);
    var jy = j_y - 979;
    var jm = j_m - 1;
    var jd = j_d - 1;

    var j_day_no = 365 * jy + parseInt(jy / 33) * 8 + parseInt((jy % 33 + 3) / 4);
    for (var i = 0; i < jm; ++i) j_day_no += jalaliDaysInMonth[i];

    j_day_no += jd;

    var g_day_no = j_day_no + 79;

    var gy = 1600 + 400 * parseInt(g_day_no / 146097); /* 146097 = 365*400 + 400/4 - 400/100 + 400/400 */
    g_day_no = g_day_no % 146097;

    var leap = true;
    if (g_day_no >= 36525) /* 36525 = 365*100 + 100/4 */
    {
        g_day_no--;
        gy += 100 * parseInt(g_day_no / 36524); /* 36524 = 365*100 + 100/4 - 100/100 */
        g_day_no = g_day_no % 36524;

        if (g_day_no >= 365)
            g_day_no++;
        else
            leap = false;
    }

    gy += 4 * parseInt(g_day_no / 1461); /* 1461 = 365*4 + 4/4 */
    g_day_no %= 1461;

    if (g_day_no >= 366) {
        leap = false;

        g_day_no--;
        gy += parseInt(g_day_no / 365);
        g_day_no = g_day_no % 365;
    }

    for (var i = 0; g_day_no >= gregorianDaysInMonth[i] + (i == 1 && leap); i++)
        g_day_no -= gregorianDaysInMonth[i] + (i == 1 && leap);
    var gm = i + 1;
    var gd = g_day_no + 1;

    return [gy, gm, gd];
}

export function checkJalaliDate(j_y, j_m, j_d) {
    return !(j_y < 0 || j_y > 32767 || j_m < 1 || j_m > 12 || j_d < 1 || j_d >
        (jalaliDaysInMonth[j_m - 1] + (j_m == 12 && !((j_y - 979) % 33 % 4))));
}

export function isLeapYear(j_y) {
    const array = j_y > 1342 ? [1, 5, 9, 13, 17, 22, 26, 30] : [1, 5, 9, 13, 17, 21, 26, 30];
    const remainder = j_y % 33;
    return array.includes(remainder);
}

export function gregorianToJalali(g_y, g_m, g_d) {
    g_y = parseInt(g_y);
    g_m = parseInt(g_m);
    g_d = parseInt(g_d);
    var gy = g_y - 1600;
    var gm = g_m - 1;
    var gd = g_d - 1;

    var g_day_no = 365 * gy + parseInt((gy + 3) / 4) - parseInt((gy + 99) / 100) + parseInt((gy + 399) / 400);

    for (var i = 0; i < gm; ++i)
        g_day_no += gregorianDaysInMonth[i];
    if (gm > 1 && ((gy % 4 == 0 && gy % 100 != 0) || (gy % 400 == 0)))
        /* leap and after Feb */
        ++g_day_no;
    g_day_no += gd;

    var j_day_no = g_day_no - 79;

    var j_np = parseInt(j_day_no / 12053);
    j_day_no %= 12053;

    var jy = 979 + 33 * j_np + 4 * parseInt(j_day_no / 1461);

    j_day_no %= 1461;

    if (j_day_no >= 366) {
        jy += parseInt((j_day_no - 1) / 365);
        j_day_no = (j_day_no - 1) % 365;
    }

    for (var i = 0; i < 11 && j_day_no >= jalaliDaysInMonth[i]; ++i) {
        j_day_no -= jalaliDaysInMonth[i];
    }
    var jm = i + 1;
    var jd = j_day_no + 1;


    return [jy, jm, jd];
}

DateTime.prototype.jalaliAddMonths = function (months) {
    if (!this.isValid) return this;
    const jd = {...this.jalaliDate}
    const targetMonth = jd.month + months;
    const overflowYears = Math.floor(targetMonth / 12);
    jd.month = targetMonth % 12
    jd.year = jd.year + overflowYears
    const gd = jalaliToGregorian(jd.year, jd.month, jd.day)
    return this.set({year: gd[0], month: gd[1], day: gd[2]})
}

DateTime.prototype.jalaliRemoveMonths = function (months) {
    if (!this.isValid) return this;
    const jd = {...this.jalaliDate}
    const targetMonth = jd.month - months;
    const underflowYears = Math.floor(targetMonth / 12);
    jd.month = targetMonth % 12
    jd.year = jd.year - underflowYears
    const gd = jalaliToGregorian(jd.year, jd.month, jd.day)
    return this.set({year: gd[0], month: gd[1], day: gd[2]})
}

DateTime.prototype.jalaliStartOfMonth = function () {
    if (!this.isValid) return this;
    const jd = {...this.jalaliDate}
    jd.day = 1
    const gd = jalaliToGregorian(jd.year, jd.month, jd.day)
    return this.set({year: gd[0], month: gd[1], day: gd[2]})
}

DateTime.prototype.jalaliEndOfMonth = function () {
    if (!this.isValid) return this;
    const jd = {...this.jalaliDate}
    if (jd.month >= 1 && jd.month <= 6) {
        jd.day = 31
    } else if ((jd.month >= 7 && jd.month <= 11) || isLeapYear(jd.year)) {
        jd.day = 30
    } else {
        jd.day = 29
    }
    const gd = jalaliToGregorian(jd.year, jd.month, jd.day)
    return this.set({year: gd[0], month: gd[1], day: gd[2]})
}

DateTime.prototype.jalaliStartOfYear = function () {
    if (!this.isValid) return this;
    const jd = {...this.jalaliDate}
    jd.day = 1
    jd.month = 1
    const gd = jalaliToGregorian(jd.year, jd.month, jd.day)
    return this.set({year: gd[0], month: gd[1], day: gd[2]})
}

DateTime.prototype.jalaliEndOfYear = function () {
    if (!this.isValid) return this;
    const jd = {...this.jalaliDate}
    jd.month = 12
    jd.day = isLeapYear(jd.year) ? 30 : 29;
    const gd = jalaliToGregorian(jd.year, jd.month, jd.day)
    return this.set({year: gd[0], month: gd[1], day: gd[2]})
}

DateTime.prototype.jalaliStartOfSeason = function (season) {
    if (!this.isValid) return this;
    const jd = {...this.jalaliDate}
    jd.day = 1
    if(season === 1) {
        jd.month = 1
    } else if(season === 2) {
        jd.month = 4
    } else if(season === 3) {
        jd.month = 7
    } else if(season === 4) {
        jd.month = 10
    } else {
        throw new Error('season should be between 1 and 4, '+season+' is wrong')
    }
    const gd = jalaliToGregorian(jd.year, jd.month, jd.day)
    return this.set({year: gd[0], month: gd[1], day: gd[2]})
}

DateTime.prototype.jalaliEndOfSeason = function (season) {
    if (!this.isValid) return this;
    const jd = {...this.jalaliDate}
    if(season === 1) {
        jd.month = 3
        jd.day = 31
    } else if(season === 2) {
        jd.month = 6
        jd.day = 31
    } else if(season === 3) {
        jd.month = 9
        jd.day = 30
    } else if(season === 4) {
        jd.month = 12
        jd.day = isLeapYear(jd.year) ? 30 : 29
    } else {
        throw new Error('season should be between 1 and 4, '+season+' is wrong')
    }
    const gd = jalaliToGregorian(jd.year, jd.month, jd.day)
    return this.set({year: gd[0], month: gd[1], day: gd[2]})
}

export function dateDiffInDays(a, b) {
  const _MS_PER_DAY = 1000 * 60 * 60 * 24;
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}

Object.defineProperty(DateTime.prototype, 'jalaliDate', {
    get() {
        const jd = gregorianToJalali(this.year, this.month, this.day);
        const weekday = (this.weekday + 1) % 7;
        const gdfd = jalaliToGregorian(jd[0], 1, 1)
        const fd = new Date(gdfd[0], gdfd[1], gdfd[2])
        const diffDays = dateDiffInDays(fd, this.toJSDate())
        const jalaliWeekNumber = Math.ceil(diffDays / 7) + 4

        return {
            year: jd[0],
            month: jd[1],
            day: jd[2],
            yearFa: convertArabicNumbersToFarsi(jd[0]),
            monthFa: convertArabicNumbersToFarsi(jd[1]),
            dayFa: convertArabicNumbersToFarsi(jd[2]),
            monthLong: jalaliMonthsLong[jd[1] - 1],
            monthShort: jalaliMonthsShort[jd[1] - 1],
            weekday: weekday,
            weekdayNameShort: jalaliWeekdaysShort[weekday],
            weekdayNameLong: jalaliWeekdaysLong[weekday],
            weekNumber: jalaliWeekNumber,
            weekNumberFa: convertArabicNumbersToFarsi(jalaliWeekNumber),
        }
    }
})
