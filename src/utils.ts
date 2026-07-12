import type { CellPos, NormalizedRange } from './types';

/** A selection range as the user built it: anchor (active cell) + focus (drag end). */
export interface SelRange {
  anchor: CellPos;
  focus: CellPos;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

/** 0 -> A, 25 -> Z, 26 -> AA, 701 -> ZZ, 702 -> AAA */
export function colName(index: number): string {
  let name = '';
  let n = index;
  for (;;) {
    name = String.fromCharCode(65 + (n % 26)) + name;
    n = Math.floor(n / 26) - 1;
    if (n < 0) break;
  }
  return name;
}

/** Prefix sums of column widths; result[i] is the x offset of column i, result[length] the total. */
export function columnOffsets(widths: number[]): number[] {
  const offsets = new Array<number>(widths.length + 1);
  offsets[0] = 0;
  for (let i = 0; i < widths.length; i++) offsets[i + 1] = offsets[i] + widths[i];
  return offsets;
}

export function normalizeRange(range: SelRange, rowCount: number, colCount: number): NormalizedRange {
  const maxRow = Math.max(0, rowCount - 1);
  const maxCol = Math.max(0, colCount - 1);
  const a = range.anchor;
  const f = range.focus;
  return {
    top: clamp(Math.min(a.row, f.row), 0, maxRow),
    bottom: clamp(Math.max(a.row, f.row), 0, maxRow),
    left: clamp(Math.min(a.col, f.col), 0, maxCol),
    right: clamp(Math.max(a.col, f.col), 0, maxCol),
  };
}

/** Convert full-width digits/signs/separators to their ASCII equivalents. */
export function toHalfWidth(text: string): string {
  return text
    .replace(/[０-９ａ-ｚＡ-Ｚ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/．/g, '.')
    .replace(/[－ー−]/g, '-')
    .replace(/＋/g, '+')
    .replace(/，/g, ',')
    .replace(/／/g, '/')
    .replace(/　/g, ' ');
}

/**
 * Normalize input for a number cell: full-width chars are converted and
 * thousands separators removed. Returns the normalized string, '' for empty
 * input, or null when the input is not a valid number.
 */
export function normalizeNumberInput(value: string): string | null {
  const s = toHalfWidth(value).trim().replace(/,/g, '');
  if (s === '') return '';
  return /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s) ? s : null;
}

/**
 * Normalize input for a date cell to ISO `YYYY-MM-DD`. Accepts
 * YYYY-MM-DD, YYYY/M/D, YYYY.M.D, YYYY年M月D日 and YYYYMMDD (full-width ok).
 * Returns '' for empty input, or null when the input is not a valid date.
 */
export function normalizeDateInput(value: string): string | null {
  const s = toHalfWidth(value).trim();
  if (s === '') return '';
  const m =
    /^(\d{4})[/\-.年](\d{1,2})[/\-.月](\d{1,2})日?$/.exec(s) ??
    /^(\d{4})(\d{2})(\d{2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${y}-${pad(mo)}-${pad(d)}`;
}

/**
 * Normalize input for a checkbox cell. Checked is stored as `'true'`,
 * unchecked as `''`. Accepts common truthy/falsy spellings (TRUE/FALSE,
 * 1/0, yes/no, on/off, ✓; full-width ok). Returns null for anything else.
 */
export function normalizeCheckboxInput(value: string): string | null {
  const s = toHalfWidth(value).trim().toLowerCase();
  if (s === '' || s === 'false' || s === '0' || s === 'no' || s === 'off') return '';
  if (s === 'true' || s === '1' || s === 'yes' || s === 'on' || s === '✓' || s === '☑') return 'true';
  return null;
}

/** Whether a stored cell value counts as checked for a checkbox cell. */
export function isCheckboxChecked(value: string): boolean {
  return normalizeCheckboxInput(value) === 'true';
}

function escapeTSVCell(value: string): string {
  return /[\t\n\r"]/.test(value) ? '"' + value.replace(/"/g, '""') + '"' : value;
}

/** Serialize a matrix to Excel-compatible TSV (cells with tabs/newlines/quotes get quoted). */
export function matrixToTSV(matrix: string[][]): string {
  return matrix.map((row) => row.map(escapeTSVCell).join('\t')).join('\n');
}

/**
 * Parse clipboard text (TSV, Excel-compatible) into a matrix.
 * Handles quoted cells containing tabs/newlines, doubled quotes, CRLF,
 * and strips a single trailing newline (Excel appends one on copy).
 */
export function parseClipboardText(text: string): string[][] {
  if (text.endsWith('\r\n')) text = text.slice(0, -2);
  else if (text.endsWith('\n') || text.endsWith('\r')) text = text.slice(0, -1);

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"' && cell === '') {
      inQuotes = true;
    } else if (ch === '\t') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  row.push(cell);
  rows.push(row);
  return rows;
}
