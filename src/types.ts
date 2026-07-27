import type { CSSProperties, ReactNode } from 'react';

/** Cell values are plain strings. Formatting/parsing is up to the consumer. */
export type CellValue = string;

/**
 * Cell type of a column. Values are always stored as strings; the type
 * controls the editor UI, input normalization and display.
 *
 * - `text`   — free text (default)
 * - `number` — right-aligned; input is normalized (full-width digits,
 *              commas) and non-numeric input is rejected
 * - `select` — dropdown backed by `options`; stores the option `value`
 *              and displays its `label`
 * - `date`   — native date picker; stored as `YYYY-MM-DD`; pasted text in
 *              common formats (2024/1/5, 2024年1月5日, 20240105) is normalized
 * - `checkbox` — centered checkbox; stores `'true'` when checked and `''`
 *              when unchecked; toggled by click or Space; pasted text such
 *              as TRUE/FALSE, 1/0, yes/no is normalized
 * - `template` — cell content is rendered by the column's `template`
 *              function; no text editor (copy/paste/delete still act on the
 *              underlying value)
 */
export type ColumnType = 'text' | 'number' | 'select' | 'date' | 'checkbox' | 'template';

export interface SelectOption {
  /** Stored in the data. */
  value: string;
  /** Shown in cells and in the dropdown. Defaults to `value`. */
  label?: string;
}

/** Argument passed to a 'template' column's `template` function. */
export interface TemplateCellContext {
  /** Row index in the `data` array (the data-source index). */
  row: number;
  /** Column index. */
  col: number;
  /** The cell's stored value. */
  value: CellValue;
}

export interface ColumnDef {
  /** Cell type. Default: 'text'. */
  type?: ColumnType;
  /** Choices for a 'select' column (e.g. master data). */
  options?: Array<string | SelectOption>;
  /**
   * For 'select' columns: reject values that are not in `options`.
   * Default: true. Set false to allow free input alongside the dropdown.
   */
  strict?: boolean;
  /**
   * For 'select' columns: narrow the dropdown to matching options as the
   * user types. Default: true. Set false to always show the full option
   * list (typing then jumps the highlight to the first prefix match).
   */
  filterable?: boolean;
  /**
   * For 'template' columns: renders the cell content. Receives the data
   * row index, column index and stored value. Interactive elements inside
   * (buttons, links, …) receive clicks natively.
   */
  template?: (ctx: TemplateCellContext) => ReactNode;
  /**
   * Display-only formatter for 'text', 'number' and 'date' columns: the
   * stored value is passed in and the returned string is shown in the cell.
   * The stored data, the editor and copy/paste always use the raw value.
   * Ignored for 'select' (shows labels), 'checkbox' and 'template' columns,
   * and never called for empty cells. See the exported `formatThousands`
   * helper for thousands separators on number columns.
   */
  format?: (value: CellValue) => string;
  /** Header caption. Defaults to spreadsheet-style letters (A, B, C, …). */
  title?: string;
  /** Column width in pixels. Defaults to `defaultColumnWidth`. */
  width?: number;
  /** Disallow editing cells in this column. */
  readOnly?: boolean;
  /**
   * Allow resizing this column by dragging its header edge.
   * Overrides the grid-level `resizableColumns`.
   */
  resizable?: boolean;
}

/** Per-cell overrides returned by `MasumeGridProps.getCellProps`. */
export interface CellProps {
  /** Disallow editing this cell (in addition to grid/column `readOnly`). */
  readOnly?: boolean;
  /** Extra class name(s) appended to the cell element. */
  className?: string;
  /**
   * Extra inline styles merged into the cell element (the grid-managed
   * `width`/`height` cannot be overridden).
   */
  style?: CSSProperties;
}

export interface CellPos {
  row: number;
  col: number;
}

/** Inclusive, normalized rectangular range (top <= bottom, left <= right). */
export interface NormalizedRange {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

export interface MasumeGridProps {
  /** Grid contents as a 2D array of strings. Rows may be ragged. */
  data: CellValue[][];
  /**
   * Column definitions. When omitted, the column count is derived from the
   * longest row in `data` and headers show A, B, C, …
   */
  columns?: ColumnDef[];
  /** Called with a new 2D array whenever cells change (edit / paste / delete). */
  onChange?: (next: CellValue[][]) => void;
  /** Called once per changed cell. Can be used instead of (or with) `onChange`. */
  onCellChange?: (row: number, col: number, value: CellValue) => void;
  /** Called whenever the selection changes, with normalized ranges. */
  onSelectionChange?: (ranges: NormalizedRange[]) => void;
  /** Called when a column resize drag finishes, with the final width in pixels. */
  onColumnResize?: (col: number, width: number) => void;
  /**
   * Per-cell overrides: return `readOnly`, `className` and/or `style` for a
   * cell (e.g. validation-error highlighting, locking individual cells).
   * Called for visible cells on every render — keep it cheap. `readOnly`
   * applies to edits, paste and delete alike. With `appendBlankRow`, it is
   * also called for the trailing blank row (`row === data.length`), where
   * every value is `''`.
   */
  getCellProps?: (row: number, col: number, value: CellValue) => CellProps | null | undefined;
  /**
   * Append one blank row below the data (spreadsheet-style "new record"
   * row). `data` itself is left untouched: the row only exists in the
   * rendering, and committing a value in it calls `onChange` with an array
   * one row longer (and `onCellChange` with `row === data.length`), after
   * which a fresh blank row appears again. Ignored when the grid is
   * `readOnly`. Default: false.
   */
  appendBlankRow?: boolean;
  /** Show the row-number column. Default: true. */
  showRowNumbers?: boolean;
  /** Show the column header row. Default: true. */
  showHeader?: boolean;
  /** Disallow all editing (selection & copy still work). Default: false. */
  readOnly?: boolean;
  /**
   * Allow column resizing by dragging header edges. Default: true.
   * Requires `showHeader` (handles live in the header row).
   */
  resizableColumns?: boolean;
  /** Row height in pixels. Default: 28. */
  rowHeight?: number;
  /** Header row height in pixels. Default: 28. */
  headerHeight?: number;
  /** Width of columns without an explicit width. Default: 120. */
  defaultColumnWidth?: number;
  /** Width of the row-number column. Default: 48. */
  rowNumberWidth?: number;
  className?: string;
  style?: CSSProperties;
}
