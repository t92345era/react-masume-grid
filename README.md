# MasumeGrid

[日本語版 README はこちら](README.ja.md)

A lightweight, generic React spreadsheet component. React is the only dependency (~5KB gzipped).

- **Grid display** — toggleable row numbers and header, per-column widths, drag-to-resize columns, header-click sorting, optional trailing blank row for new entries, virtualized rows (smooth with tens of thousands of rows)
- **Cell types** — text / number (normalizes full-width digits and commas) / select (dropdown backed by master data, stores codes while displaying labels) / date (calendar input, normalizes pasted dates in common Japanese formats) / checkbox (click or Space to toggle) / template (render any component per cell)
- **Cell editing** — start editing by double-click, F2, or just typing. **Full IME support**: with a Japanese IME on, pressing "A" opens the editor and types 「あ」 right into the cell
- **Range selection** — mouse drag, extend with Shift+click / Shift+arrows, add multiple ranges with Ctrl(⌘)+click. Click row/column headers to select whole rows/columns, the top-left corner to select all
- **Copy & paste** — Ctrl(⌘)+C / X / V. TSV format interoperable with Excel and Google Sheets (handles cells containing newlines, tabs and quotes; tiles single-cell paste across a selection)
- **Accessible** — ARIA grid semantics (`grid` / `row` / `gridcell` roles, 1-based row/column indices that survive row virtualization, selection and read-only states) so screen readers can follow the grid

## Demo

https://t92345era.github.io/react-masume-grid/

## Installation

```sh
npm install react-masume-grid
```

## Usage

```tsx
import { useState } from 'react';
import { MasumeGrid } from 'react-masume-grid';
// CSS loads automatically when you import the library.
// Depending on your bundler you may need: import 'react-masume-grid/styles.css';

function App() {
  const [data, setData] = useState<string[][]>([
    ['Apple', '100', 'Fruit'],
    ['Carrot', '80', 'Vegetable'],
  ]);

  return (
    <MasumeGrid
      data={data}
      onChange={setData}
      columns={[
        { title: 'Name', width: 160 },
        { title: 'Price', width: 80 },
        { title: 'Category', width: 120, readOnly: true },
      ]}
      showRowNumbers
      style={{ height: 400 }}
    />
  );
}
```

When `columns` is omitted, the column count is derived from `data` and headers show spreadsheet-style letters (A, B, C, …).

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | `string[][]` | (required) | Grid contents. Rows may be ragged |
| `columns` | `ColumnDef[]` | — | Array of `{ title?, width?, readOnly?, resizable?, sortable?, compare?, type?, options?, strict?, filterable?, template?, format? }`. When omitted, the column count is derived from data |
| `onChange` | `(next: string[][]) => void` | — | Called with a new 2D array on every edit / paste / delete |
| `onCellChange` | `(row, col, value) => void` | — | Called once per changed cell. Use instead of (or with) `onChange` |
| `onSelectionChange` | `(ranges, viewToData) => void` | — | Called when the selection changes (array of `{top,left,bottom,right}`). Rows are display rows; `viewToData` maps them to data rows while sorted (`null` when unsorted) |
| `onColumnResize` | `(col, width) => void` | — | Called when a column resize drag finishes (final width in px) |
| `onSortChange` | `(sort: SortState \| null) => void` | — | Called on every header-click sort change (`null` = cleared) |
| `getCellProps` | `(row, col, value) => CellProps` | — | Per-cell overrides: `{ readOnly?, className?, style? }`. See [Per-cell overrides](#per-cell-overrides) |
| `appendBlankRow` | `boolean` | `false` | Show a trailing blank row for entering new rows. See [Trailing blank row](#trailing-blank-row) |
| `showRowNumbers` | `boolean` | `true` | Show the row-number column |
| `showHeader` | `boolean` | `true` | Show the header row |
| `readOnly` | `boolean` | `false` | Disallow editing (selection & copy still work) |
| `resizableColumns` | `boolean` | `true` | Resize columns by dragging header edges. Override per column with `ColumnDef.resizable` (requires `showHeader`) |
| `sortable` | `boolean` | `false` | Sort by clicking a column header. See [Sorting](#sorting) |
| `defaultSort` | `SortState \| null` | `null` | Initial sort, e.g. `{ col: 2, direction: 'asc' }` |
| `rowHeight` | `number` | `28` | Row height (px) |
| `headerHeight` | `number` | `28` | Header height (px) |
| `defaultColumnWidth` | `number` | `120` | Width of columns without an explicit width (px) |
| `rowNumberWidth` | `number` | `48` | Width of the row-number column (px) |
| `className` / `style` | — | — | Applied to the root element. Set the height via `style` or CSS (default 420px) |

The data is fully **controlled**: the grid never changes unless you implement `onChange`.

Column widths are the one uncontrolled exception — widths set by dragging are kept inside the component (taking precedence over `ColumnDef.width`). Persist them via `onColumnResize` if needed.

### Per-cell overrides

`getCellProps(row, col, value)` lets you override individual cells — lock them against editing, or style them (e.g. validation-error highlighting):

```tsx
<MasumeGrid
  data={data}
  onChange={setData}
  getCellProps={(row, col, value) => {
    if (errors.has(`${row}:${col}`)) return { className: 'cell-error' };
    if (data[row]?.[0] === 'LOCKED') return { readOnly: true, style: { color: '#999' } };
  }}
/>
```

- `readOnly` applies to edits, paste and delete alike (on top of the grid-level and column-level `readOnly`).
- `className` is appended to the cell element; `style` is merged in (the grid-managed `width`/`height` cannot be overridden).
- It is called for every visible cell on each render — keep it cheap (a lookup, not a computation).

### Trailing blank row

`appendBlankRow` renders one empty row below the data, like the "new record" row in Excel or Access, so users can keep typing without a separate "add row" button:

```tsx
<MasumeGrid data={data} onChange={setData} appendBlankRow />
```

- `data` is **not** modified to make room for it — the row only exists in the rendering. Committing a value there calls `onChange` with an array one row longer, and `onCellChange` with `row === data.length`. Once your state updates, a fresh blank row appears below it.
- The row is exactly one row: it never grows until it is filled, and clearing it again (Delete, or committing an empty value) does not create a row.
- Enter or Tab on the last cell of the blank row lands on the newly created row's successor, so continuous data entry works.
- Ignored when the grid is `readOnly`. Select-all (Ctrl(⌘)+A) skips the blank row so copying does not emit a stray empty line — it can still be selected and copied on its own.
- `template` columns are not rendered in the blank row (there is no data record yet for a row action or a derived value to refer to). `getCellProps` **is** called for it with `row === data.length` and `value === ''`, so column locking and styling still apply.
- Its row number and row element carry `masume-grid-rownum--blank` / `masume-grid-row--blank` for custom styling.

### Sorting

`sortable` turns column headers into sort controls: each click cycles **ascending → descending → unsorted** (the third click restores the original order).

```tsx
<MasumeGrid
  data={data}
  onChange={setData}
  columns={[
    { title: 'Name' },
    { title: 'Qty', type: 'number' },
    { title: 'Note', sortable: false },                    // opt this column out
    { title: 'Code', compare: (a, b) => a.length - b.length }, // custom order
  ]}
  sortable
  defaultSort={{ col: 1, direction: 'desc' }}
  onSortChange={(sort) => saveSort(sort)}
/>
```

- **`data` is never reordered** — only the display order changes. `onChange`, `onCellChange`, `getCellProps` and `template` keep receiving **data** indices, so editing a sorted row writes to the right record. `onSelectionChange` is the exception: its ranges are display rows, and the `viewToData` argument maps them back.
- A plain header click **sorts and selects the column**; Shift+click and Ctrl(⌘)+click stay pure selection gestures (multi-range selection is unaffected).
- Sorting is a **snapshot**: editing a cell does not re-sort, so the row you are typing in never jumps away (as in Excel/Sheets). Click the header again to re-apply the order. Rows appended via `appendBlankRow` join the end, and that blank row always stays at the bottom.
- Default order per column type: `number` numerically, `date` chronologically, `checkbox` unchecked → checked, `select` by the order of its `options`, everything else by locale-aware text comparison ("item2" before "item10"). **Empty cells always sort last**, in both directions.
- `ColumnDef.compare(a, b)` replaces that ordering for a column (including the empty-cells-last rule); the result is negated for descending.
- `ColumnDef.sortable` overrides the grid-level flag per column. `template` columns are not sortable unless you set it explicitly, since their stored value usually isn't what is rendered.
- Every sortable header shows an indicator at its **right edge** — a quiet `⇅` while unsorted (so the affordance is visible before the first click), then `▲` / `▼` in the accent color. Headers also get `aria-sort` and `masume-grid-hcell--sortable` / `--sorted`; the glyph is `masume-grid-sort-arrow` (`--none` while unsorted).
- The sort state lives inside the component (like drag-resized widths). Use `onSortChange` to persist it and `defaultSort` to restore it.

## Cell types

Set `ColumnDef.type` to choose a cell type per column. **Data stays plain strings**; the type controls the editor UI, input normalization and display (this keeps clipboard interop simple).

```tsx
const columns: ColumnDef[] = [
  { title: 'Product' },                                   // text (default)
  { title: 'Price', type: 'number' },
  { title: 'Category', type: 'select', options: [
    { value: 'C01', label: 'Fruit' },                     // stores the code, displays the label
    { value: 'C02', label: 'Produce' },
  ]},
  { title: 'Status', type: 'select', options: ['In stock', 'Backorder'] }, // plain strings work too
  { title: 'Arrival', type: 'date' },
  { title: 'Inspected', type: 'checkbox' },
  { title: 'Actions', type: 'template', readOnly: true,
    template: ({ row, value }) => <button onClick={() => openDetail(row)}>Detail</button> },
];
```

| Type | Editor | Behavior |
| --- | --- | --- |
| `text` | Text (IME-aware) | Default; free text |
| `number` | Text (IME-aware) | Right-aligned. On commit, full-width digits are converted and thousands separators removed. Non-numeric input is **rejected** (the cell keeps its old value) |
| `select` | Filtering dropdown | ↑↓ to move, Enter/click to commit, type to filter. Alt+↓ also opens it. `options` accepts `string` or `{value, label}` (stores value, displays label). Values outside the options are rejected by default (`strict: false` allows free input). `filterable: false` disables the type-to-filter narrowing: the full list stays visible and typing jumps the highlight to the first prefix match instead |
| `date` | Native date picker | Stored as `YYYY-MM-DD`. Pasted text such as `2026/7/6`, `2026年7月6日`, `20260706` and full-width digits is normalized. Invalid dates are rejected. Alt+↓ opens the calendar |
| `checkbox` | Toggle (no text editor) | Stores `'true'` when checked, `''` when unchecked. Click the checkbox or press Space to toggle (Space toggles every selected checkbox cell). Pasted text such as `TRUE`/`FALSE`, `1`/`0`, `yes`/`no` is normalized; anything else is **rejected** |
| `template` | None (custom rendering) | Cell content is rendered by the column's `template` function, which receives `{ row, col, value }` — `row` is the index into `data`. Interactive elements inside (buttons, inputs, …) receive clicks natively. Copy still emits the underlying value; paste/delete still write it (set `readOnly: true` to prevent that) |

Normalization and validation apply to **both edit commits and paste**. Cells with invalid values are skipped and keep their old value. The normalizers are exported as `normalizeNumberInput` / `normalizeDateInput` / `normalizeCheckboxInput` (plus `isCheckboxChecked`) for reuse in your own validation.

### Display formatting

`ColumnDef.format` formats the **display only** — the stored data, the editor and copy/paste always use the raw string value, so clipboard interop with Excel stays intact. It applies to `text`, `number` and `date` columns and is never called for empty cells. `formatThousands` (thousands separators, full-width aware) ships with the library:

```tsx
import { formatThousands, type ColumnDef } from 'react-masume-grid';

const columns: ColumnDef[] = [
  { title: 'Price', type: 'number', format: formatThousands },     // 1234567 → 1,234,567
  { title: 'Arrival', type: 'date', format: (v) => v.replaceAll('-', '/') }, // 2026-07-06 → 2026/07/06
];
```

### Template cells

`type: 'template'` hands the whole cell box to your own component. The column's `template` function is called for each rendered cell (rows are virtualized, so only visible cells render) with a `TemplateCellContext`:

| Field | Meaning |
| --- | --- |
| `row` | Row index into the `data` array (the data-source index) |
| `col` | Column index |
| `value` | The cell's stored string value |

```tsx
import type { ColumnDef } from 'react-masume-grid';

const [data, setData] = useState<string[][]>(initialData); // [name, price, qty]

const columns = useMemo<ColumnDef[]>(
  () => [
    { title: 'Product' },
    { title: 'Price', type: 'number' },
    { title: 'Qty', type: 'number' },

    // Derived display: use `row` to read the rest of the row from `data`.
    // `columns` depends on `data`, so recompute it when data changes.
    {
      title: 'Amount', width: 100, type: 'template', readOnly: true,
      template: ({ row }) => {
        const total = Number(data[row]?.[1] || 0) * Number(data[row]?.[2] || 0);
        return <span style={{ marginLeft: 'auto', padding: '0 6px' }}>¥{total.toLocaleString()}</span>;
      },
    },

    // Row actions: buttons inside template cells receive clicks natively.
    {
      title: 'Actions', width: 90, type: 'template', readOnly: true,
      template: ({ row }) => (
        <button type="button" onClick={() => openDetail(row)}>Detail</button>
      ),
    },
  ],
  [data],
);
```

Notes:

- Template cells have **no text editor** — typing, F2 and double-click do not start an edit. Keyboard navigation, selection and copy still work as usual.
- Clicking a template cell selects it. Interactive elements inside (`button`, `a`, `input`, `select`, `textarea`, `label`, `[role="button"]`, `[contenteditable]`) keep native focus and click behavior instead of being captured by the grid.
- Copy emits the **stored value** (`data[row][col]`), not the rendered markup. Paste and Delete also write the stored value — set `readOnly: true` for display-only columns like the ones above.
- The cell renders with `padding: 0` and is a flex container with `align-items: center`; your component controls the whole box. Use `rowHeight` if it needs more vertical room.

## Keyboard

| Key | Action |
| --- | --- |
| Arrows / Tab / Enter | Move between cells (Shift reverses / extends the range) |
| PageUp / PageDown | Move by a page |
| Home / End | Start / end of row (Ctrl+Home/End: first / last cell) |
| Any printable key | Start editing with that character (IME-aware) |
| F2 / double-click | Start editing, keeping the current value |
| Enter / Tab | Commit and move; Esc cancels; Alt+Enter inserts a newline in the cell |
| Space | Toggle selected checkbox cells |
| Delete / Backspace | Clear selected cells |
| Ctrl(⌘)+A | Select all |
| Ctrl(⌘)+C / X / V | Copy / cut / paste |

## Styling

Override CSS variables to theme the grid.

```css
.my-grid {
  --masume-grid-accent: #0f9d58;
  --masume-grid-sel-bg: rgba(15, 157, 88, 0.12);
  --masume-grid-header-bg: #f0f4f1;
}
```

See the top of [src/masume-grid.css](src/masume-grid.css) for the full list of variables.

## How IME support works

The grid keeps an invisible, always-focused `<textarea>` positioned over the active cell (the same technique as Google Sheets). Editing starts on `compositionstart`, so the IME candidate window appears at the cell, and the Enter that confirms a composition is never misinterpreted as cell navigation (including Safari's different event ordering).

## Development

```sh
npm install
npm run dev        # demo app (http://localhost:5173)
npm test           # unit tests (vitest)
npm run typecheck  # type check
npm run build      # library build into dist/ (ESM + CJS + d.ts + CSS)
```

## Limitations (current version)

- Internal data is always strings (numbers/dates included; use `ColumnDef.format` for display formatting such as thousands separators)
- Columns are not virtualized — mind performance beyond a few hundred columns
- No undo / redo (the `onChange`-based design lets the host app manage history)
- No merged cells, formulas, or double-click auto-fit for column widths

## License

MIT
