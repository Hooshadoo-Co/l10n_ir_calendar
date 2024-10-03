import datetime
import khayyam
from odoo.tools import pycompat
from odoo.exceptions import UserError
from odoo.tools.translate import _
from odoo.addons.web.controllers.export import ExportXlsxWriter


def write_cell(self, row, column, cell_value):
    cell_style = self.base_style

    if isinstance(cell_value, bytes):
        try:
            # because xlsx uses raw export, we can get a bytes object
            # here. xlsxwriter does not support bytes values in Python 3 ->
            # assume this is base64 and decode to a string, if this
            # fails note that you can't export
            cell_value = pycompat.to_text(cell_value)
        except UnicodeDecodeError:
            raise UserError(
                _("Binary fields can not be exported to Excel unless their content is base64-encoded. That does not seem to be the case for %s.",
                  self.field_names)[column])
    elif isinstance(cell_value, (list, tuple, dict)):
        cell_value = pycompat.to_text(cell_value)

    if isinstance(cell_value, str):
        if len(cell_value) > self.worksheet.xls_strmax:
            cell_value = _(
                "The content of this cell is too long for an XLSX file (more than %s characters). Please use the CSV format for this export.",
                self.worksheet.xls_strmax)
        else:
            cell_value = cell_value.replace("\r", " ")
    elif isinstance(cell_value, datetime.datetime):
        cell_style = self.datetime_style
        cell_value = khayyam.JalaliDate(cell_value).strftime('%N/%P/%K %h:%r:%s')
    elif isinstance(cell_value, datetime.date):
        cell_style = self.date_style
        cell_value = khayyam.JalaliDate(cell_value).strftime('%N/%P/%K')
    elif isinstance(cell_value, float):
        cell_style.set_num_format(self.float_format)
    self.write(row, column, cell_value, cell_style)


ExportXlsxWriter.write_cell = write_cell
