# MasumeGrid

[日本語版 README はこちら](README.ja.md)

A lightweight, generic React spreadsheet component. React is the only dependency (~5KB gzipped).

- **Grid display** — toggleable row numbers and header, per-column widths, drag-to-resize columns, virtualized rows (smooth with tens of thousands of rows)
- **Cell types** — text / number (normalizes full-width digits and commas) / select (dropdown backed by master data, stores codes while displaying labels) / date (calendar input, normalizes pasted dates in common Japanese formats) / checkbox (click or Space to toggle) / template (render any component per cell)
- **Cell editing** — start editing by double-click, F2, or just typing. **Full IME support**: with a Japanese IME on, pressing "A" opens the editor and types 「あ」 right into the cell
- **Range selection** — mouse drag, extend with Shift+click / Shift+arrows, add multiple ranges with Ctrl(⌘)+click. Click row/column headers to select whole rows/columns, the top-left corner to select all
- **Copy & paste** — Ctrl(⌘)+C / X / V. TSV format interoperable with Excel and Google Sheets (handles cells containing newlines, tabs and quotes; tiles single-cell paste across a selection)

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
| `columns` | `ColumnDef[]` | — | Array of `{ title?, width?, readOnly?, resizable?, type?, options?, strict?, filterable?, template? }`. When omitted, the column count is derived from data |
| `onChange` | `(next: string[][]) => void` | — | Called with a new 2D array on every edit / paste / delete |
| `onCellChange` | `(row, col, value) => void` | — | Called once per changed cell. Use instead of (or with) `onChange` |
| `onSelectionChange` | `(ranges: NormalizedRange[]) => void` | — | Called when the selection changes (array of `{top,left,bottom,right}`) |
| `onColumnResize` | `(col, width) => void` | — | Called when a column resize drag finishes (final width in px) |
| `showRowNumbers` | `boolean` | `true` | Show the row-number column |
| `showHeader` | `boolean` | `true` | Show the header row |
| `readOnly` | `boolean` | `false` | Disallow editing (selection & copy still work) |
| `resizableColumns` | `boolean` | `true` | Resize columns by dragging header edges. Override per column with `ColumnDef.resizable` (requires `showHeader`) |
| `rowHeight` | `number` | `28` | Row height (px) |
| `headerHeight` | `number` | `28` | Header height (px) |
| `defaultColumnWidth` | `number` | `120` | Width of columns without an explicit width (px) |
| `rowNumberWidth` | `number` | `48` | Width of the row-number column (px) |
| `className` / `style` | — | — | Applied to the root element. Set the height via `style` or CSS (default 420px) |

The data is fully **controlled**: the grid never changes unless you implement `onChange`.

Column widths are the one uncontrolled exception — widths set by dragging are kept inside the component (taking precedence over `ColumnDef.width`). Persist them via `onColumnResize` if needed.

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

- Internal data is always strings (numbers/dates included; display formatting such as thousands separators is future work)
- Columns are not virtualized — mind performance beyond a few hundred columns
- No undo / redo (the `onChange`-based design lets the host app manage history)
- No merged cells, formulas, or double-click auto-fit for column widths

## License

MIT
