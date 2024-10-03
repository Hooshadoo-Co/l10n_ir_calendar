/** @odoo-module **/

import {patch} from "@web/core/utils/patch";
import {CalendarYearRenderer} from "@web/views/calendar/calendar_year/calendar_year_renderer";

class CalendarYearRendererJalali extends CalendarYearRenderer {
    getDateWithMonth(month) {
        const { jalaliToGregorian } = odoo.loader.modules.get("@l10n_ir_calendar/helpers/jalali");
        const gd = jalaliToGregorian(this.props.model.date.jalaliDate.year, this.months.indexOf(month) + 1, this.props.model.date.jalaliDate.day)
        return this.props.model.date.set({year:gd[0], month:gd[1], day:gd[2]}).toISO()
    }
}

patch(CalendarYearRenderer.prototype, CalendarYearRendererJalali.prototype)
