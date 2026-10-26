/* Client-side CSV export. Builds a properly escaped CSV and triggers a real
   file download — no server needed. A UTF-8 BOM is prepended so Arabic text
   opens correctly in Excel and Google Sheets. */

function escapeCell(value: string | number): string {
  const raw = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
): void {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(','));
  const csv = `\uFEFF${lines.join('\r\n')}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* Exports several tables into a single CSV file. Each table is written as a
   titled block (section title, header row, data rows) separated by a blank
   line, so one file carries every table and still opens cleanly in Excel. */
export type CsvSection = { title: string; headers: string[]; rows: (string | number)[][] };

export function downloadCombinedCsv(filename: string, sections: CsvSection[]): void {
  const lines: string[] = [];
  sections.forEach((section, idx) => {
    if (idx > 0) lines.push('');
    lines.push(escapeCell(section.title));
    lines.push(section.headers.map(escapeCell).join(','));
    section.rows.forEach((row) => lines.push(row.map(escapeCell).join(',')));
  });
  const csv = `\uFEFF${lines.join('\r\n')}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* Parses a CSV text into a 2D array of cells. Handles quoted fields, escaped
   double quotes, commas and newlines inside quotes, and a leading UTF-8 BOM. */
export function parseCsv(text: string): string[][] {
  const src = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  let i = 0;

  const endCell = () => { row.push(cell); cell = ''; };
  const endRow = () => { endCell(); rows.push(row); row = []; };

  while (i < src.length) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { cell += '"'; i += 2; continue; }
        inQuotes = false; i += 1; continue;
      }
      cell += c; i += 1; continue;
    }
    if (c === '"') { inQuotes = true; i += 1; continue; }
    if (c === ',') { endCell(); i += 1; continue; }
    if (c === '\r') { i += 1; continue; }
    if (c === '\n') { endRow(); i += 1; continue; }
    cell += c; i += 1;
  }
  if (cell !== '' || row.length > 0) endRow();

  return rows.filter((r) => r.some((x) => x.trim() !== ''));
}