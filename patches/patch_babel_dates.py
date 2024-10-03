from datetime import date, datetime, time

import babel.dates as babel_dates
import khayyam

from .numeral import arabic_to_farsi

LC_FA = babel_dates.Locale.parse('fa')


class JalaliDateTimeFormat(babel_dates.DateTimeFormat):
    """
    Custom DateTimeFormat subclass to handle Jalali (Persian) date and time formatting.
    """

    def __init__(self, value, locale):
        """
        Initialize JalaliDateTimeFormat.

        Args:
            value: Value to format.
            locale: Locale for formatting.
        """

        super().__init__(value, locale)
        if locale.language.startswith('fa'):
            if isinstance(value, datetime):
                self.value = khayyam.JalaliDatetime(value)
            elif isinstance(value, date):
                self.value = khayyam.JalaliDate(value)
            elif isinstance(value, time):
                self.value = value
            else:
                raise ValueError(f'invalid value type: {type(value)}, value={value}')


def format_date(date=None, format='medium', locale=None):
    """
    Format a date string according to the specified format and locale.

    Args:
        date: Date to format.
        format (str): Format string for the date.
        locale (str): Locale for formatting.

    Returns:
        str: Formatted date string.
    """

    if format == 'MM/dd/yyyy':
        format = 'yyyy/MM/dd'

    locale = LC_FA
    if date is None:
        date = babel_dates.date_.today()
    elif isinstance(date, datetime):
        date = date.date()

    if format in ('full', 'long', 'medium', 'short'):
        format = babel_dates.get_date_format(format, locale=locale)
    pattern = babel_dates.parse_pattern(format)
    return arabic_to_farsi(pattern.apply(date, locale))


def format_datetime(datetime=None, format='medium', tzinfo=None, locale=None):
    """
    Format a datetime string according to the specified format, timezone, and locale.

    Args:
        datetime: Datetime to format.
        format (str): Format string for the datetime.
        tzinfo: Timezone information.
        locale (str): Locale for formatting.

    Returns:
        str: Formatted datetime string.
    """

    locale = LC_FA
    datetime = babel_dates._ensure_datetime_tzinfo(babel_dates._get_datetime(datetime), tzinfo)

    locale = babel_dates.Locale.parse(locale)
    if format in ('full', 'long', 'medium', 'short'):
        return arabic_to_farsi(
            babel_dates.get_datetime_format(format, locale=locale)
            .replace("'", '')
            .replace('{0}', babel_dates.format_time(datetime, format, tzinfo=None, locale=locale))
            .replace('{1}', format_date(datetime, format, locale=locale))
        )
    else:
        try:
            return arabic_to_farsi(babel_dates.parse_pattern(format).apply(datetime, locale))
        except TypeError as e:
            if 'subtract' in str(e):
                return arabic_to_farsi(babel_dates.parse_pattern(format).apply(datetime.replace(tzinfo=None), locale))
            raise
