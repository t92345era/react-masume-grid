# Changelog

Every released version of [react-masume-grid](https://www.npmjs.com/package/react-masume-grid). Links in the entries point at the matching [README](https://github.com/t92345era/react-masume-grid#readme) section.

[日本語版はこちら](https://github.com/t92345era/react-masume-grid/blob/main/CHANGELOG.ja.md)

## 0.8.2 — 2026-08-22

- Documentation only — no change to the library. The usage snippet now imports `react-masume-grid/styles.css` outright: the built package never references its own stylesheet, so "CSS loads automatically" was wrong in every bundler rather than only some. The `getCellProps` and theming examples are also corrected — a single class name such as `.cell-error` ties with the library's own `.masume-grid-cell` / `.masume-grid`, leaving stylesheet order to decide whether the rule applies at all

## 0.8.1 — 2026-08-21

- Documentation and package metadata only — no change to the library. The README gained badges and a corrected bundle size (12.5KB of JS plus 1.8KB of CSS, gzipped; the previous "~5KB" dated from 0.1.0), links that survive being read on the npm page, and a sharper npm description and keyword list

## 0.8.0 — 2026-08-05

- **A paste that runs past the last row now grows the data** when `appendBlankRow` is on, instead of being clipped at the trailing blank row: paste 200 rows into a 3-row grid and `onChange` receives 200 rows, with a fresh blank row below them. The rows the paste adds always land at the *end* of `data`, including while the grid is sorted or filtered. Rows widen the same way when `columns` is omitted (the column count then follows the longest row); with an explicit `columns` array there is no definition — type, width, header — for the extra cells, so a paste still clips at the last column. See [Trailing blank row](https://github.com/t92345era/react-masume-grid#trailing-blank-row)
- ⚠️ **Breaking**: with `appendBlankRow`, a paste no longer stops at the last row. Grids that relied on that clipping to bound their data need to bound it themselves. Without `appendBlankRow` nothing changes

## 0.7.1 — 2026-07-30

- The header filter button now shows a **funnel** (outline, filled while filtering) instead of `▽` / `▼`, which read as another sort control next to the sort arrows. Drawn as an inline SVG in the library, so nothing is added to the dependencies or to the license file

## 0.7.0 — 2026-07-30

- **Header templates** (`ColumnDef.headerTemplate`): render a column caption with your own component, on any column type, while the sort indicator, filter button and resize handle keep working. See [Header templates](https://github.com/t92345era/react-masume-grid#header-templates)
- ⚠️ **Breaking**: `ColumnDef.filterable` is renamed to **`ColumnDef.searchable`**. It only ever controlled the type-to-narrow behavior of a select column's dropdown, which read as row filtering next to the `filter` options added in 0.6.0. Rename the property; the behavior and default (`true`) are unchanged

## 0.6.0 — 2026-07-29

- **Header filtering** (`filterable`, `defaultFilters`, `onFilterChange`, `filterTexts`, `ColumnDef.filter` / `filterLabel` / `filterMatch`): an Excel-style value checklist with a search box, or a keyword box per column, narrowing the view without touching `data`. See [Filtering](https://github.com/t92345era/react-masume-grid#filtering)
- `onSelectionChange`'s `viewToData` argument is now non-`null` while filtered as well as while sorted

## 0.5.0 — 2026-07-27

- **Header-click sorting** (`sortable`, `defaultSort`, `onSortChange`, `ColumnDef.sortable`, `ColumnDef.compare`): ascending → descending → unsorted per click, sorting the view without reordering `data`. Type-aware default ordering, empty cells last, always-visible right-edge indicator, `aria-sort`. See [Sorting](https://github.com/t92345era/react-masume-grid#sorting)
- **Trailing blank row** (`appendBlankRow`): a spreadsheet-style "new record" row that turns into a real row once a value is committed, and pasting past the last row grows the data. See [Trailing blank row](https://github.com/t92345era/react-masume-grid#trailing-blank-row)
- `onSelectionChange` now receives a second `viewToData` argument mapping display rows to data rows while sorted (`null` when unsorted)

## 0.4.0 — 2026-07-25

- ARIA grid semantics: `grid` / `row` / `gridcell` / `columnheader` / `rowheader` / `rowgroup` roles, 1-based row/column indices that survive row virtualization, `aria-multiselectable` / `aria-readonly` / `aria-activedescendant`
- `getCellProps(row, col, value)` for per-cell `readOnly` / `className` / `style` overrides. See [Per-cell overrides](https://github.com/t92345era/react-masume-grid#per-cell-overrides)
- `ColumnDef.format` for display-only formatting, plus the exported `formatThousands` helper. See [Display formatting](https://github.com/t92345era/react-masume-grid#display-formatting)

## 0.3.0 — 2026-07-20

- `template` cell type: render any React component in a cell, with interactive elements receiving clicks natively. See [Template cells](https://github.com/t92345era/react-masume-grid#template-cells)
- Marching-ants outline on the copied/cut range, cleared by Escape, paste or the next edit

## 0.2.0 — 2026-07-12

- `checkbox` cell type: click or Space to toggle (Space toggles every selected checkbox cell), with Excel-compatible paste normalization (`TRUE`/`FALSE`, `1`/`0`, `yes`/`no`)
- `ColumnDef.filterable` for select columns (`false` keeps the full option list and jumps the highlight to the first prefix match) — renamed to `searchable` in 0.7.0
- Exported `normalizeCheckboxInput` / `isCheckboxChecked`

## 0.1.0 — 2026-07-06

- Initial release: virtualized grid, IME-friendly cell editing, `text` / `number` / `select` / `date` cell types, range selection (drag, Shift, Ctrl(⌘) multi-range, row/column headers), Excel-compatible TSV copy & paste, drag-to-resize columns
