/** @odoo-module **/

import {
    onMounted, onPatched,
    onWillStart, onWillUnmount,
    onWillUpdateProps,
    useComponent,
    useRef
} from "@odoo/owl";

import { loadCSS, loadJS } from "@web/core/assets";


function useFullCalendar(refName, params) {
    const component = useComponent();
    const ref = useRef(refName);
    let instance = null;

    function boundParams() {
        const newParams = {};
        for (const key in params) {
            const value = params[key];
            newParams[key] = typeof value === "function" ? value.bind(component) : value;
        }
        return newParams;
    }

    async function loadJsFiles() {
        const files = [
            "/l10n_ir_calendar/static/lib/fullcalendar/core/main.js",
            "/web/static/lib/fullcalendar/interaction/main.js",
            "/web/static/lib/fullcalendar/daygrid/main.js",
            "/web/static/lib/fullcalendar/luxon/main.js",
            "/web/static/lib/fullcalendar/timegrid/main.js",
            "/web/static/lib/fullcalendar/list/main.js",
        ];
        for (const file of files) {
            await loadJS(file);
        }
    }
    async function loadCssFiles() {
        await Promise.all(
            [
                "/web/static/lib/fullcalendar/core/main.css",
                "/web/static/lib/fullcalendar/daygrid/main.css",
                "/web/static/lib/fullcalendar/timegrid/main.css",
                "/web/static/lib/fullcalendar/list/main.css",
                "/l10n_ir_calendar/static/lib/fullcalendar/rtl.css",
            ].map((file) => loadCSS(file))
        );
    }

    onWillStart(() => Promise.all([loadJsFiles(), loadCssFiles()]));

    onMounted(() => {
        patchFullCalendar()
        try {
            instance = new FullCalendar.Calendar(ref.el, boundParams());
            instance.render();
        } catch (e) {
            throw new Error(`Cannot instantiate FullCalendar\n${e.message}`);
        }
    });

    let isWeekendVisible = params.isWeekendVisible;
    onWillUpdateProps((np) => {
        isWeekendVisible = np.isWeekendVisible;
    });
    onPatched(() => {
        instance.refetchEvents();
        instance.setOption("weekends", isWeekendVisible);
    });
    onWillUnmount(() => {
        instance.destroy();
    });

    return {
        get api() {
            return instance;
        },
        get el() {
            return ref.el;
        },
    };
}

const patchFullCalendar = function(){
    const {gregorianToJalali, jalaliToGregorian} = odoo.loader.modules.get('@l10n_ir_calendar/helpers/jalali')

    function arrayToUtcDate(a) {
        // according to web standards (and Safari), a month index is required.
        // massage if only given a year.
        if (a.length === 1) {
            a = a.concat([0]);
        }
        return new Date(Date.UTC.apply(Date, a));
    }

    FullCalendar.DateEnv.prototype.startOfYear = function (m) {
        const jd = gregorianToJalali(m.getFullYear(), m.getMonth() + 1, m.getDate())
        const gd = jalaliToGregorian(jd[0], 1, 1)
        return arrayToUtcDate([gd[0], gd[1] - 1, gd[2]]);
    };

    FullCalendar.DateEnv.prototype.startOfMonth = function(m){
        const jd = gregorianToJalali(m.getFullYear(), m.getMonth() + 1, m.getDate())
        const gd = jalaliToGregorian(jd[0], jd[1], 1)
        return arrayToUtcDate([gd[0], gd[1] - 1, gd[2]]);
    }

    FullCalendar.DateEnv.prototype.startOfWeek = function (m) {
        return this.calendarSystem.arrayToMarker([
            this.calendarSystem.getMarkerYear(m),
            this.calendarSystem.getMarkerMonth(m),
            m.getUTCDate() - ((m.getUTCDay() + 1) % 7)
        ]);
    };

    FullCalendar.DateEnv.prototype.add = function (marker, dur) {
        var a = this.calendarSystem.markerToArray(marker);
        const jd = gregorianToJalali(marker.getFullYear(), marker.getMonth() + 1, marker.getDate())

        if(dur.months){
            const targetMonth = jd[1] + dur.months;
            const overflowYears = Math.floor(targetMonth / 12);
            jd[1] = targetMonth % 12
            jd[0] = jd[0] + overflowYears
        }

        var gd = jalaliToGregorian(jd[0], jd[1], jd[2])

        if(dur.days){
            var dt = arrayToUtcDate([gd[0], gd[1] - 1, gd[2]])
            dt = FullCalendar.addDays(dt, dur.days)
            gd = [dt.getFullYear(), dt.getMonth() + 1, dt.getDate()]
        }

        a[0] = gd[0]
        a[1] = gd[1] - 1
        a[2] = gd[2]
        a[6] += dur.milliseconds;

        return this.calendarSystem.arrayToMarker(a);
    };

}


odoo.define('l10n_ir_calendar.views.calendar', [], function (require) {
    const calendar_hooks = require('@web/views/calendar/hooks');
    calendar_hooks.useFullCalendar = useFullCalendar
});
