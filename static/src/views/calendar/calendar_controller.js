/** @odoo-module **/

import {CalendarController} from "@web/views/calendar/calendar_controller";
import {patch} from "@web/core/utils/patch";

class CalendarControllerJalali extends CalendarController {
    get today() {
        return DateTime.now().jalaliDate.dayFa;
    }

    get currentYear() {
        return this.date.jalaliDate.yearFa;
    }

    get dayHeader() {
        return `${this.date.jalaliDate.dayFa} ${this.date.jalaliDate.monthLong} ${this.date.jalaliDate.yearFa}`;
    }

    get weekHeader() {
        const { rangeStart, rangeEnd } = this.model;
        if (rangeStart.year != rangeEnd.year) {
            return `${rangeStart.jalaliDate.monthLong} ${rangeStart.jalaliDate.yearFa} - ${rangeEnd.jalaliDate.monthLong} ${rangeEnd.jalaliDate.yearFa}`;
        } else if (rangeStart.month != rangeEnd.month) {
            return `${rangeStart.jalaliDate.monthLong} - ${rangeEnd.jalaliDate.monthLong} ${rangeStart.jalaliDate.yearFa}`;
        }
        return `${rangeStart.jalaliDate.monthLong} ${rangeStart.jalaliDate.yearFa}`;
    }

    get currentMonth() {
        return `${this.date.jalaliDate.monthLong} ${this.date.jalaliDate.yearFa}`;
    }

    get currentWeek() {
        return this.date.jalaliDate.weekNumberFa;
    }

}

patch(CalendarController.prototype, CalendarControllerJalali.prototype)
