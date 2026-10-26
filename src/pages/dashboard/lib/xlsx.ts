/* Real Excel (.xlsx) writer for the dashboard exports. Each table becomes its
   own worksheet with a header row, sensible column widths and an auto filter,
   so the buyer opens the file and immediately gets three clean tabs instead of
   titled blocks stacked inside one CSV sheet. */

import * as XLSX from 'xlsx';

export interface SheetSpec {
  name: string;
  headers: string[];
  rows: (string | number)[][];
}

const MAX_COL_WIDTH = 52;

function columnWidths(sheet: SheetSpec): { wch: number }[] {
  return sheet.headers.map((header, index) => {
    const longest = sheet.rows.reduce((widest, row) => {
      const cell = row[index];
      const text = cell === null || cell === undefined ? '' : String(cell);
      return Math.max(widest, text.length);
    }, String(header).length);
    return { wch: Math.min(MAX_COL_WIDTH, Math.max(10, longest + 2)) };
  });
}

function toWorksheet(sheet: SheetSpec): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet([sheet.headers, ...sheet.rows]);
  ws['!cols'] = columnWidths(sheet);
  if (sheet.rows.length > 0) {
    ws['!autofilter'] = {
      ref: XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: sheet.rows.length, c: sheet.headers.length - 1 },
      }),
    };
  }
  return ws;
}

/* Excel caps worksheet names at 31 characters and forbids []:*?/\ */
function safeSheetName(name: string, fallback: string): string {
  const cleaned = name.replace(/[[\]:*?/\\]/g, ' ').trim().slice(0, 31);
  return cleaned || fallback;
}

export function downloadWorkbook(filename: string, sheets: SheetSpec[], rtl = true): void {
  const wb = XLSX.utils.book_new();

  sheets.forEach((sheet, index) => {
    XLSX.utils.book_append_sheet(wb, toWorksheet(sheet), safeSheetName(sheet.name, `Sheet${index + 1}`));
  });

  /* Excel opens the workbook right-to-left so Arabic headers line up the way
     the buyer reads them. */
  if (rtl) {
    wb.Workbook = { Views: [{ RTL: true }] };
  }

  const data = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  const blob = new Blob([data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}