import type { CSSProperties } from 'react';

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
 */
export type ColumnType = 'text' | 'number' | 'select' | 'date';

export interface SelectOption {
  /** Stored in the data. */
  value: string;
  /** Shown in cells and in the dropdown. Defaults to `value`. */
  label?: string;
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

export interface MeasureGridProps {
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
