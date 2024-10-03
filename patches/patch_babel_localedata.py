import os
import pickle

import babel.localedata as babel_localedata

_jmonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
_jmonths_dict_wide = {i + 1: v for i, v in enumerate(_jmonths)}
_jmonths_dict_abbr = {i + 1: v[:2] for i, v in enumerate(_jmonths)}
_jmonths_dict_narrow = {i + 1: v[0] for i, v in enumerate(_jmonths)}
_months = {
    'format': {
        'abbreviated': (babel_localedata.Alias(['months', 'format', 'wide']), _jmonths_dict_abbr),
        'narrow': (babel_localedata.Alias(['months', 'stand-alone', 'narrow']), _jmonths_dict_narrow),
        'wide': _jmonths_dict_wide,
    },
    'stand-alone': {
        'abbreviated': (babel_localedata.Alias(['months', 'format', 'abbreviated']), _jmonths_dict_abbr),
        'narrow': _jmonths_dict_narrow,
        'wide': (babel_localedata.Alias(['months', 'format', 'wide']), _jmonths_dict_wide),
    },
}


def load(name, merge_inherited=True):
    """
     Load locale data for the given locale name.

     Args:
         name (str): The name of the locale.
         merge_inherited (bool, optional): Whether to merge inherited data. Defaults to True.

     Returns:
         dict: The loaded locale data.
    """

    name = os.path.basename(name)
    babel_localedata._cache_lock.acquire()
    try:
        data = babel_localedata._cache.get(name)
        if not data:
            # Load inherited data
            if name == 'root' or not merge_inherited:
                data = {}
            else:
                from babel.core import get_global

                parent = get_global('parent_exceptions').get(name)
                if not parent:
                    parts = name.split('_')
                    if len(parts) == 1:
                        parent = 'root'
                    else:
                        parent = '_'.join(parts[:-1])
                data = load(parent).copy()
            filename = babel_localedata.resolve_locale_filename(name)
            with open(filename, 'rb') as fileobj:
                if name != 'root' and merge_inherited:
                    babel_localedata.merge(data, pickle.load(fileobj))
                else:
                    data = pickle.load(fileobj)
            babel_localedata._cache[name] = data

        if name.startswith('fa'):
            data['months'] = _months

        return data
    finally:
        babel_localedata._cache_lock.release()
