import khayyam
from datetime import date
from odoo.addons.account.models.sequence_mixin import SequenceMixin
from odoo.exceptions import ValidationError
from odoo import fields, _

_sequence_year_range_regex = r'^(?:(?P<prefix1>.*?)(?P<year>((?<=\D)|(?<=^))((13|14|19|20|21)\d{2}|(\d{2}(?=\D))))(?P<prefix2>\D)(?P<year_end>((?<=\D)|(?<=^))((13|14|19|20|21)\d{2}|(\d{2}(?=\D))))(?P<prefix3>\D+?))?(?P<seq>\d*)(?P<suffix>\D*?)$'
_sequence_monthly_regex = r'^(?P<prefix1>.*?)(?P<year>((?<=\D)|(?<=^))((13|14|19|20|21)\d{2}|(\d{2}(?=\D))))(?P<prefix2>\D*?)(?P<month>(0[1-9]|1[0-2]))(?P<prefix3>\D+?)(?P<seq>\d*)(?P<suffix>\D*?)$'
_sequence_yearly_regex = r'^(?P<prefix1>.*?)(?P<year>((?<=\D)|(?<=^))((13|14|19|20|21)?\d{2}))(?P<prefix2>\D+?)(?P<seq>\d*)(?P<suffix>\D*?)$'


def _year_match(self, format_value, date):
    if 1300 < format_value < 1500:
        date = khayyam.JalaliDate(date)
    return format_value == self._truncate_year_to_length(date.year, len(str(format_value)))


def _sequence_matches_date(self):
    self.ensure_one()
    date = fields.Date.to_date(self[self._sequence_date_field])
    sequence = self[self._sequence_field]

    if not sequence or not date:
        return True

    format_values = self._get_sequence_format_param(sequence)[1]
    sequence_number_reset = self._deduce_sequence_number_reset(sequence)
    year_start, year_end = self._get_sequence_date_range(sequence_number_reset)
    year_match = (
            (not format_values["year"] or self._year_match(format_values["year"], year_start))
            and (not format_values["year_end"] or self._year_match(format_values["year_end"], year_end))
    )

    if not year_match:
        if date.year - format_values['year'] in [-1, 0, 1]:
            year_match = True
        else:
            jdate = khayyam.JalaliDate(date)
            year_match = not format_values['month'] or format_values['month'] == jdate.month

    month_match = not format_values['month'] or format_values['month'] == date.month

    if not month_match:
        if date.year == format_values['year'] and date.month - format_values['month'] in [-2, -1, 0, 1, 2]:
            month_match = True
        else:
            jdate = khayyam.JalaliDate(date)
            month_match = not format_values['month'] or format_values['month'] == jdate.month

    return year_match and month_match


def _get_sequence_date_range(self, reset):
    ref_date = fields.Date.to_date(self[self._sequence_date_field])
    jdt = khayyam.JalaliDate(ref_date)
    if reset in ('year', 'year_range'):
        return (
            jdt.replace(month=1, day=1).todate(),
            jdt.replace(month=12, day=30 if jdt.isleap else 29).todate(),
        )
    if reset == 'month':
        return (
            jdt.replace(day=1).todate(),
            jdt.replace(day=jdt.daysinmonth).todate(),
        )
    if reset == 'never':
        return (date(1, 1, 1), date(9999, 1, 1))
    raise NotImplementedError(reset)


def _get_last_sequence(self, relaxed=False, with_prefix=None):
    self.ensure_one()
    if self._sequence_field not in self._fields or not self._fields[self._sequence_field].store:
        raise ValidationError(_('%s is not a stored field', self._sequence_field))
    where_string, param = self._get_last_sequence_domain(relaxed)
    if self._origin.id:
        where_string += " AND id != %(id)s "
        param['id'] = self._origin.id
    if with_prefix is not None:
        where_string += " AND sequence_prefix = %(with_prefix)s "
        param['with_prefix'] = with_prefix

    if 'date_start' in param and 'date_end' in param:
        param['date_start'] = param['date_start'].replace(day=1)

    query = f"""
            SELECT {self._sequence_field} FROM {self._table}
            {where_string}
            AND sequence_prefix = (SELECT sequence_prefix FROM {self._table} {where_string} ORDER BY id DESC LIMIT 1)
            ORDER BY sequence_number DESC
            LIMIT 1
    """

    self.flush_model([self._sequence_field, 'sequence_number', 'sequence_prefix'])
    self.env.cr.execute(query, param)
    return (self.env.cr.fetchone() or [None])[0]


SequenceMixin._sequence_year_range_regex = _sequence_year_range_regex
SequenceMixin._sequence_monthly_regex = _sequence_monthly_regex
SequenceMixin._sequence_yearly_regex = _sequence_yearly_regex
SequenceMixin._year_match = _year_match
SequenceMixin._get_sequence_date_range = _get_sequence_date_range
SequenceMixin._sequence_matches_date = _sequence_matches_date
SequenceMixin._get_last_sequence = _get_last_sequence
