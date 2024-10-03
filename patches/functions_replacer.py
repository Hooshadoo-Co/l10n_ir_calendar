import importlib.util
import logging
import os
import sys
from importlib.abc import Loader, MetaPathFinder

from .patch_babel_dates import JalaliDateTimeFormat, format_date, format_datetime
from .patch_babel_localedata import load

_logger = logging.getLogger(__name__)


class L10nIrMetaPathFinder(MetaPathFinder):
    """MetaPathFinder subclass to find and patch babel.dates and babel.localedata modules."""

    def find_spec(self, fullname, path=None, target=None):
        """
        Find and return the module spec for babel.dates and babel.localedata.

        Args:
            fullname (str): Full name of the module to find.
            path (str): Path to the module.
            target: Target for the module.

        Returns:
            spec: Module specification or None if the module is not found.
        """

        if fullname == 'babel.dates' and target:
            _logger.info(f'Patching {fullname}')
            return importlib.util.spec_from_loader(fullname, BabelDatesReplaceLoader())
        elif fullname == 'babel.localedata' and target:
            _logger.info(f'Patching {fullname}')
            return importlib.util.spec_from_loader(fullname, BabelLocaleDataReplaceLoader())

        return None


class BabelDatesReplaceLoader(Loader):
    """
    Loader subclass to replace babel.dates module attributes.
    """

    def exec_module(self, module):
        """
        Execute the module with the replaced attributes.

        Args:
            module: Module to execute.
        """

        module.DateTimeFormat = JalaliDateTimeFormat
        module.format_date = format_date
        module.format_datetime = format_datetime


class BabelLocaleDataReplaceLoader(Loader):
    """
    Loader subclass to replace babel.localedata module attribute.
    """

    def exec_module(self, module):
        """
        Execute the module with the replaced attribute.

        Args:
            module: Module to execute.
        """

        module.load = load


def monkey_patches():
    """
    Apply monkey patches to replace certain modules and attributes.
    """

    os.environ['LANG'] = 'fa_IR.UTF-8'
    _logger.info('Starting monkey patching...')
    sys.meta_path.insert(0, L10nIrMetaPathFinder())
    importlib.reload(importlib.import_module('babel.dates'))
    importlib.reload(importlib.import_module('babel.localedata'))
    _logger.info('Monkey patches applied!')
