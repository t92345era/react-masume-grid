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

/** Argument passed to a column's `headerTemplate` function. */
export interface HeaderCellContext {
  /** Column index. */
  col: number;
  /** The column's `title`, or its spreadsheet letter (A, B, C, …) when unset. */
  title: string;
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
   * Unrelated to `filter`, which filters *rows* from the header.
   */
  searchable?: boolean;
  /**
   * For 'template' columns: renders the cell content. Receives the data
   * row index, column index and stored value. Interactive elements inside
   * (buttons, links, …) receive clicks natively.
   */
  template?: (ctx: TemplateCellContext) => ReactNode;
  /**
   * Renders this column's header caption in place of `title`. The sort
   * indicator, filter button and resize handle stay where they are, so
   * sorting and filtering keep working. Interactive elements inside
   * (buttons, links, …) receive clicks natively and do not sort or select
   * the column. Set `title` as well: it is still used for the filter
   * button's accessible name.
   */
  headerTemplate?: (ctx: HeaderCellContext) => ReactNode;
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
  /**
   * Allow sorting by this column's header. Overrides the grid-level
   * `sortable`. Defaults to `sortable` for every type except 'template',
   * whose rendered content has no meaningful stored value to order by.
   */
  sortable?: boolean;
  /**
   * Custom sort comparator for this column, called with the two stored
   * values. Replaces the type-derived ordering entirely, including the
   * "empty cells last" rule. Return <0, 0 or >0 like `Array#sort`; the
   * result is negated for descending order.
   */
  compare?: (a: CellValue, b: CellValue) => number;
  /**
   * Header filter for this column. Overrides the grid-level `filterable`:
   * `false` turns it off, `true` uses the default panel, and a `FilterMode`
   * picks which panel. Defaults to `filterable` for every type except
   * 'template', whose rendered content has no meaningful stored value.
   */
  filter?: boolean | FilterMode;
  /**
   * Display text of a stored value in the filter panel. Values that share a
   * label are listed — and checked — as a single entry, and 'text' filters
   * match against it. Defaults to the select option label, the checked /
   * unchecked wording for 'checkbox' columns, the `format` output, or the
   * raw value.
   */
  filterLabel?: (value: CellValue) => string;
  /**
   * Custom matcher for this column, called with the stored value, the
   * active condition and the data row index. Replaces the built-in
   * matching entirely; return true to keep the row.
   */
  filterMatch?: (value: CellValue, filter: ColumnFilter, row: number) => boolean;
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

export type SortDirection = 'asc' | 'desc';

/** Which column the view is sorted by, and in which direction. */
export interface SortState {
  /** Column index. */
  col: number;
  direction: SortDirection;
}

/** Which panel a column's header filter shows. */
export type FilterMode =
  /** Checklist of the column's distinct values, with a search box (default). */
  | 'values'
  /** A single text box; rows whose displayed text contains the query pass. */
  | 'text';

/** A column's active filter condition. */
export type ColumnFilter =
  /** Keep rows whose stored value is one of `values` (`[]` keeps none). */
  | { type: 'values'; values: string[] }
  /** Keep rows whose displayed text contains `query` (`''` keeps all). */
  | { type: 'text'; query: string };

/** Active filters keyed by column index. Columns without an entry pass everything. */
export type FilterState = Record<number, ColumnFilter>;

/** UI strings of the filter panel. Override to translate them. */
export interface FilterTexts {
  /** Row that checks/unchecks everything listed. Default: '(All)'. */
  all: string;
  /** Entry for empty values. Default: '(Blanks)'. */
  blanks: string;
  /** Entry for checked cells in a 'checkbox' column. Default: '(Checked)'. */
  checked: string;
  /** Entry for unchecked cells in a 'checkbox' column. Default: '(Unchecked)'. */
  unchecked: string;
  /** Placeholder of the search box. Default: 'Search'. */
  search: string;
  /** Button that removes the column's filter. Default: 'Clear'. */
  clear: string;
  /** Button that closes the panel. Default: 'Close'. */
  close: string;
  /** Shown when the value list was cut off. Default: 'Too many values — search to narrow'. */
  more: string;
  /** Accessible name of the header filter button. Default: 'Filter'. */
  button: string;
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
  /**
   * Called whenever the selection changes, with normalized ranges.
   * Range rows are **display** rows: while the grid is sorted or filtered
   * they differ from the `data` indices, so `viewToData` is passed
   * alongside to map them back (`viewToData[row]`). It is `null` when the
   * grid is neither sorted nor filtered, where display rows and data rows
   * are the same.
   */
  onSelectionChange?: (
    ranges: NormalizedRange[],
    viewToData: readonly number[] | null,
  ) => void;
  /** Called when a column resize drag finishes, with the final width in pixels. */
  onColumnResize?: (col: number, width: number) => void;
  /** Called on every header-click sort change (`null` = sorting cleared). */
  onSortChange?: (sort: SortState | null) => void;
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
   * which a fresh blank row appears again.
   *
   * A paste that runs past the last row grows `data` by as many rows as it
   * needs instead of being cut off, appending them at the end even while the
   * grid is sorted or filtered. It widens rows the same way when `columns` is
   * omitted (the column count then follows the data); with an explicit
   * `columns` array there is no definition for the extra cells, so a paste
   * still clips at the last column.
   *
   * Ignored when the grid is `readOnly`. Default: false.
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
  /**
   * Sort the view by clicking a column header (ascending → descending →
   * unsorted). `data` is never reordered — only the display order changes,
   * so `onChange` / `onCellChange` / `getCellProps` / `template` keep using
   * `data` indices. Override per column with `ColumnDef.sortable` and
   * `ColumnDef.compare`. The sort state lives inside the component (like
   * drag-resized column widths); observe it with `onSortChange`.
   * Requires `showHeader` (sorting is a header gesture). Default: false.
   */
  sortable?: boolean;
  /** Initial sort while `sortable` is on. Default: unsorted. */
  defaultSort?: SortState | null;
  /**
   * Filter rows from the column headers (Excel-style funnel button opening
   * a checklist of the column's values). `data` is never modified — only the
   * displayed rows are narrowed, so `onChange` / `onCellChange` /
   * `getCellProps` / `template` keep using `data` indices and hidden rows
   * are preserved. Rows are re-evaluated when a filter changes, not while
   * cells are edited, so a row never disappears mid-entry. Override per
   * column with `ColumnDef.filter`. The filter state lives inside the
   * component; observe it with `onFilterChange`. Requires `showHeader`
   * (filtering is a header gesture). Default: false.
   */
  filterable?: boolean;
  /** Initial filters while `filterable` is on. Default: none. */
  defaultFilters?: FilterState | null;
  /** Called on every filter change, with the full filter state. */
  onFilterChange?: (filters: FilterState) => void;
  /** UI strings of the filter panel. Default: English (see `FilterTexts`). */
  filterTexts?: Partial<FilterTexts>;
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
