import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { CellPos, CellValue, MasumeGridProps, NormalizedRange } from './types';
import type { SelRange } from './utils';
import {
  clamp,
  colName,
  columnOffsets,
  isCheckboxChecked,
  matrixToTSV,
  normalizeCheckboxInput,
  normalizeDateInput,
  normalizeNumberInput,
  normalizeRange,
  parseClipboardText,
} from './utils';
import './masume-grid.css';

const OVERSCAN = 4;
const MIN_COL_WIDTH = 24;

interface EditState {
  row: number;
  col: number;
  /** 'replace': started by typing — arrow keys commit and move.
   *  'edit': started by F2/double-click — arrow keys move the caret. */
  mode: 'replace' | 'edit';
}

interface CellChange {
  row: number;
  col: number;
  value: CellValue;
}

export function MasumeGrid({
  data,
  columns,
  onChange,
  onCellChange,
  onSelectionChange,
  onColumnResize,
  getCellProps,
  showRowNumbers = true,
  showHeader = true,
  readOnly = false,
  resizableColumns = true,
  rowHeight = 28,
  headerHeight = 28,
  defaultColumnWidth = 120,
  rowNumberWidth = 48,
  className,
  style,
}: MasumeGridProps) {
  const rowCount = data.length;
  const colCount = useMemo(
    () => (columns ? columns.length : data.reduce((m, r) => Math.max(m, r.length), 0)),
    [columns, data],
  );

  // Widths set by drag-resizing take precedence over column definitions.
  const [widthOverrides, setWidthOverrides] = useState<Record<number, number>>({});
  const [resizingCol, setResizingCol] = useState<number | null>(null);

  const widths = useMemo(
    () =>
      Array.from(
        { length: colCount },
        (_, i) => widthOverrides[i] ?? columns?.[i]?.width ?? defaultColumnWidth,
      ),
    [columns, colCount, defaultColumnWidth, widthOverrides],
  );
  const offsets = useMemo(() => columnOffsets(widths), [widths]);
  const rowNumW = showRowNumbers ? rowNumberWidth : 0;
  const headerH = showHeader ? headerHeight : 0;
  const totalW = rowNumW + (offsets[colCount] ?? 0);
  const totalH = rowCount * rowHeight;

  const [selection, setSelection] = useState<SelRange[]>([
    { anchor: { row: 0, col: 0 }, focus: { row: 0, col: 0 } },
  ]);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [editValue, setEditValue] = useState('');
  // Source range of the last copy/cut, outlined with "marching ants"
  // (Excel/Sheets-style) until Escape, paste, or the next edit.
  const [copyRect, setCopyRect] = useState<NormalizedRange | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(0);

  // Select-column dropdown state: optionFilter is the text typed since the
  // edit started (null = nothing typed); it only narrows the list when the
  // column is filterable.
  const [optionFilter, setOptionFilter] = useState<string | null>(null);
  const [dropdownIndex, setDropdownIndex] = useState(0);
  // Whether the user moved the dropdown highlight with arrow keys.
  const dropdownNavRef = useRef(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const composingRef = useRef(false);
  const compositionEndAtRef = useRef(-1);
  const editingRef = useRef(editing);
  editingRef.current = editing;
  const editValueRef = useRef(editValue);
  editValueRef.current = editValue;

  const lastRange = selection[selection.length - 1];
  const active: CellPos = {
    row: clamp(lastRange.anchor.row, 0, Math.max(0, rowCount - 1)),
    col: clamp(lastRange.anchor.col, 0, Math.max(0, colCount - 1)),
  };

  const normRanges = useMemo(
    () => selection.map((r) => normalizeRange(r, rowCount, colCount)),
    [selection, rowCount, colCount],
  );

  useEffect(() => {
    onSelectionChange?.(normRanges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normRanges]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setViewportH(el.clientHeight);
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setViewportH(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const canEditCell = useCallback(
    (row: number, col: number) =>
      !readOnly &&
      !columns?.[col]?.readOnly &&
      !getCellProps?.(row, col, data[row]?.[col] ?? '')?.readOnly,
    [readOnly, columns, getCellProps, data],
  );

  // ----- cell types -----------------------------------------------------

  const colType = useCallback(
    (col: number) => columns?.[col]?.type ?? 'text',
    [columns],
  );

  const isFilterable = useCallback(
    (col: number) => columns?.[col]?.filterable ?? true,
    [columns],
  );

  /** Normalized options per select column. */
  const selectOptions = useMemo(() => {
    const map = new Map<number, { value: string; label: string }[]>();
    columns?.forEach((def, i) => {
      if (def.type === 'select') {
        map.set(
          i,
          (def.options ?? []).map((o) =>
            typeof o === 'string' ? { value: o, label: o } : { value: o.value, label: o.label ?? o.value },
          ),
        );
      }
    });
    return map;
  }, [columns]);

  const optionLabelByValue = useMemo(() => {
    const map = new Map<number, Map<string, string>>();
    for (const [col, opts] of selectOptions) {
      map.set(col, new Map(opts.map((o) => [o.value, o.label])));
    }
    return map;
  }, [selectOptions]);

  /**
   * Normalize a value for the column's type.
   * Returns the value to store, or null when the input is invalid
   * (the change is then dropped and the cell keeps its old value).
   */
  const coerceValue = useCallback(
    (col: number, value: CellValue): CellValue | null => {
      switch (colType(col)) {
        case 'number':
          return normalizeNumberInput(value);
        case 'date':
          return normalizeDateInput(value);
        case 'checkbox':
          return normalizeCheckboxInput(value);
        case 'select': {
          if (value === '') return '';
          const opts = selectOptions.get(col);
          if (opts?.some((o) => o.value === value)) return value;
          const byLabel = opts?.find((o) => o.label === value);
          if (byLabel) return byLabel.value;
          return columns?.[col]?.strict === false ? value : null;
        }
        default:
          return value;
      }
    },
    [colType, selectOptions, columns],
  );

  // ----- data mutation -------------------------------------------------

  const applyCellValues = useCallback(
    (changes: CellChange[]) => {
      const applicable: CellChange[] = [];
      for (const ch of changes) {
        if (!canEditCell(ch.row, ch.col)) continue;
        const value = coerceValue(ch.col, ch.value);
        if (value === null) continue; // invalid for the column type
        if ((data[ch.row]?.[ch.col] ?? '') === value) continue; // no-op write
        applicable.push(value === ch.value ? ch : { ...ch, value });
      }
      if (applicable.length === 0) return;
      if (onCellChange) {
        for (const ch of applicable) onCellChange(ch.row, ch.col, ch.value);
      }
      if (onChange) {
        const next = data.slice();
        const copiedRows = new Set<number>();
        for (const ch of applicable) {
          if (!copiedRows.has(ch.row)) {
            next[ch.row] = (next[ch.row] ?? []).slice();
            copiedRows.add(ch.row);
          }
          const row = next[ch.row];
          while (row.length < ch.col) row.push('');
          row[ch.col] = ch.value;
        }
        onChange(next);
      }
    },
    [canEditCell, coerceValue, data, onChange, onCellChange],
  );

  const toggleCheckbox = useCallback(
    (pos: CellPos) => {
      const raw = data[pos.row]?.[pos.col] ?? '';
      applyCellValues([{ row: pos.row, col: pos.col, value: isCheckboxChecked(raw) ? '' : 'true' }]);
    },
    [data, applyCellValues],
  );

  /** Space on a checkbox cell: toggle every selected checkbox cell. */
  const toggleSelectedCheckboxes = () => {
    const changes: CellChange[] = [];
    const seen = new Set<number>();
    for (const nr of normRanges) {
      for (let r = nr.top; r <= nr.bottom; r++) {
        for (let c = nr.left; c <= nr.right; c++) {
          if (colType(c) !== 'checkbox') continue;
          const key = r * Math.max(1, colCount) + c;
          if (seen.has(key)) continue;
          seen.add(key);
          const raw = data[r]?.[c] ?? '';
          changes.push({ row: r, col: c, value: isCheckboxChecked(raw) ? '' : 'true' });
        }
      }
    }
    applyCellValues(changes);
  };

  // ----- editing --------------------------------------------------------

  const commitEdit = useCallback(
    (commit = true, overrideValue?: string) => {
      const ed = editingRef.current;
      if (!ed) return;
      if (commit) {
        // A date input reports '' both for "cleared" and for "unparsable
        // text left in the control" — only the former may clear the cell.
        const dateBadInput =
          colType(ed.col) === 'date' && dateRef.current?.validity.badInput === true;
        if (!dateBadInput) {
          const value = overrideValue ?? editValueRef.current;
          const current = data[ed.row]?.[ed.col] ?? '';
          if (value !== current) {
            applyCellValues([{ row: ed.row, col: ed.col, value }]);
          }
        }
      }
      setEditing(null);
      setEditValue('');
      setOptionFilter(null);
      composingRef.current = false;
    },
    [colType, data, applyCellValues],
  );

  const scrollCellIntoView = useCallback(
    (pos: CellPos) => {
      const el = containerRef.current;
      if (!el || colCount === 0) return;
      const cellTop = headerH + pos.row * rowHeight;
      const cellBottom = cellTop + rowHeight;
      const cellLeft = rowNumW + offsets[pos.col];
      const cellRight = cellLeft + widths[pos.col];
      if (cellTop - headerH < el.scrollTop) el.scrollTop = cellTop - headerH;
      else if (cellBottom > el.scrollTop + el.clientHeight) el.scrollTop = cellBottom - el.clientHeight;
      if (cellLeft - rowNumW < el.scrollLeft) el.scrollLeft = cellLeft - rowNumW;
      else if (cellRight > el.scrollLeft + el.clientWidth) el.scrollLeft = cellRight - el.clientWidth;
    },
    [colCount, headerH, rowHeight, rowNumW, offsets, widths],
  );

  const startEdit = useCallback(
    (mode: EditState['mode'], pos?: CellPos) => {
      const target = pos ?? active;
      if (rowCount === 0 || colCount === 0) return;
      if (!canEditCell(target.row, target.col)) return;
      const type = colType(target.col);
      if (type === 'checkbox') return; // toggled by click/Space, never text-edited
      if (type === 'template') return; // rendered by the column's component
      let initial = mode === 'edit' ? (data[target.row]?.[target.col] ?? '') : '';
      // The native date input only accepts ISO values.
      if (type === 'date') initial = normalizeDateInput(initial) ?? '';
      // Select cells display labels, so editing must start from the label
      // too (commit maps labels back to option values).
      if (type === 'select') initial = optionLabelByValue.get(target.col)?.get(initial) ?? initial;
      setCopyRect(null); // starting an edit dismisses the marching ants
      setEditing({ row: target.row, col: target.col, mode });
      setEditValue(initial);
      setOptionFilter(null); // dropdown starts unfiltered
      dropdownNavRef.current = false;
      scrollCellIntoView(target);
      if (mode === 'edit' && type !== 'date') {
        requestAnimationFrame(() => {
          taRef.current?.setSelectionRange(initial.length, initial.length);
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [active.row, active.col, rowCount, colCount, canEditCell, colType, optionLabelByValue, data, scrollCellIntoView],
  );

  // When the sticky overlays change size (row numbers / header toggled),
  // the browser clamps scrollLeft/scrollTop to the transiently smaller
  // content, which leaves the view drifted once the overlay comes back —
  // the first column then sits partially under the sticky row numbers.
  // Excel-style recovery: keep the active cell in view across such changes.
  const activeRef = useRef(active);
  activeRef.current = active;
  const overlaySizeRef = useRef({ rowNumW, headerH });
  useLayoutEffect(() => {
    const prev = overlaySizeRef.current;
    if (prev.rowNumW === rowNumW && prev.headerH === headerH) return;
    overlaySizeRef.current = { rowNumW, headerH };
    scrollCellIntoView(activeRef.current);
  }, [rowNumW, headerH, scrollCellIntoView]);

  // ----- select dropdown / date editor ------------------------------------

  const editingType = editing ? colType(editing.col) : null;

  /** Options shown in the dropdown while editing a select cell. */
  const dropdownOptions = useMemo(() => {
    if (!editing || editingType !== 'select') return null;
    const opts = selectOptions.get(editing.col) ?? [];
    if (optionFilter === null || !isFilterable(editing.col)) return opts;
    const q = optionFilter.trim().toLowerCase();
    if (q === '') return opts;
    return opts.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
  }, [editing, editingType, selectOptions, optionFilter, isFilterable]);

  // Keep the highlight on an exact match (or the current cell value) when possible.
  useEffect(() => {
    if (!editing || !dropdownOptions) return;
    let idx = dropdownOptions.findIndex((o) => o.value === editValue || o.label === editValue);
    if (idx < 0 && optionFilter === null) {
      const raw = data[editing.row]?.[editing.col] ?? '';
      idx = dropdownOptions.findIndex((o) => o.value === raw);
    }
    // Non-filterable dropdown: typing jumps the highlight to the first
    // prefix match (native-select-style type-ahead) and otherwise stays put.
    if (idx < 0 && optionFilter !== null && !isFilterable(editing.col)) {
      const q = optionFilter.trim().toLowerCase();
      if (q !== '') idx = dropdownOptions.findIndex((o) => o.label.toLowerCase().startsWith(q));
      if (idx < 0) return;
    }
    setDropdownIndex(Math.max(0, idx));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropdownOptions, editValue]);

  useEffect(() => {
    const el = dropdownRef.current?.children[dropdownIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [dropdownIndex]);

  // The date editor is a separate native input; move focus onto it.
  useEffect(() => {
    if (editing && editingType === 'date') dateRef.current?.focus({ preventScroll: true });
  }, [editing, editingType]);

  // ----- selection ------------------------------------------------------

  const setLastFocus = (sel: SelRange[], pos: CellPos): SelRange[] => {
    const next = sel.slice();
    const last = next[next.length - 1];
    next[next.length - 1] = { anchor: last.anchor, focus: pos };
    return next;
  };

  const moveActive = (row: number, col: number, opts?: { extend?: boolean }) => {
    if (rowCount === 0 || colCount === 0) return;
    const pos = { row: clamp(row, 0, rowCount - 1), col: clamp(col, 0, colCount - 1) };
    if (opts?.extend) setSelection((sel) => setLastFocus(sel, pos));
    else setSelection([{ anchor: pos, focus: pos }]);
    scrollCellIntoView(pos);
  };

  const selectAll = () => {
    if (rowCount === 0 || colCount === 0) return;
    setSelection([
      { anchor: { row: 0, col: 0 }, focus: { row: rowCount - 1, col: colCount - 1 } },
    ]);
  };

  // ----- clipboard ------------------------------------------------------

  const selectionToTSV = () => {
    const nr = normRanges[normRanges.length - 1];
    const matrix: string[][] = [];
    for (let r = nr.top; r <= nr.bottom; r++) {
      const row: string[] = [];
      for (let c = nr.left; c <= nr.right; c++) row.push(data[r]?.[c] ?? '');
      matrix.push(row);
    }
    return matrixToTSV(matrix);
  };

  const markCopied = () => setCopyRect(normRanges[normRanges.length - 1]);

  const copySelection = async () => {
    if (rowCount === 0 || colCount === 0) return;
    const text = selectionToTSV();
    markCopied();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older browsers / denied clipboard permission.
      const tmp = document.createElement('textarea');
      tmp.value = text;
      tmp.style.position = 'fixed';
      tmp.style.opacity = '0';
      document.body.appendChild(tmp);
      tmp.select();
      try {
        document.execCommand('copy');
      } finally {
        tmp.remove();
        taRef.current?.focus({ preventScroll: true });
      }
    }
  };

  const clearSelectedCells = () => {
    const changes: CellChange[] = [];
    const seen = new Set<number>();
    for (const nr of normRanges) {
      for (let r = nr.top; r <= nr.bottom; r++) {
        for (let c = nr.left; c <= nr.right; c++) {
          const key = r * Math.max(1, colCount) + c;
          if (seen.has(key)) continue;
          seen.add(key);
          if ((data[r]?.[c] ?? '') !== '') changes.push({ row: r, col: c, value: '' });
        }
      }
    }
    applyCellValues(changes);
  };

  const pasteText = (text: string) => {
    if (readOnly || rowCount === 0 || colCount === 0) return;
    const matrix = parseClipboardText(text);
    if (matrix.length === 0) return;
    setCopyRect(null); // pasting dismisses the marching ants
    const nr = normRanges[normRanges.length - 1];
    const srcH = matrix.length;
    const srcW = Math.max(...matrix.map((r) => r.length));
    if (srcW === 0) return;
    const selH = nr.bottom - nr.top + 1;
    const selW = nr.right - nr.left + 1;
    // Excel-style tiling: repeat the source when the selection is an exact multiple.
    let outH = srcH;
    let outW = srcW;
    if ((selH > srcH || selW > srcW) && selH % srcH === 0 && selW % srcW === 0) {
      outH = selH;
      outW = selW;
    }
    outH = Math.min(outH, rowCount - nr.top);
    outW = Math.min(outW, colCount - nr.left);
    const changes: CellChange[] = [];
    for (let dr = 0; dr < outH; dr++) {
      for (let dc = 0; dc < outW; dc++) {
        changes.push({
          row: nr.top + dr,
          col: nr.left + dc,
          value: matrix[dr % srcH][dc % srcW] ?? '',
        });
      }
    }
    applyCellValues(changes);
    setSelection([
      {
        anchor: { row: nr.top, col: nr.left },
        focus: { row: nr.top + outH - 1, col: nr.left + outW - 1 },
      },
    ]);
  };

  // ----- keyboard -------------------------------------------------------

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Never interfere while an IME composition is in progress.
    if (composingRef.current || e.nativeEvent.isComposing || e.keyCode === 229) return;

    const shift = e.shiftKey;
    const mod = e.ctrlKey || e.metaKey;
    const ed = editing;

    if (ed) {
      // Safari fires compositionend *before* the keydown of the Enter that
      // confirmed the composition; ignore control keys right after it.
      if (
        (e.key === 'Enter' || e.key === 'Tab' || e.key === 'Escape') &&
        e.timeStamp - compositionEndAtRef.current < 80
      ) {
        return;
      }
      if (e.key === 'Enter' && e.altKey) return; // newline inside the cell

      // Select cells: arrows drive the dropdown, Enter/Tab commit the
      // highlighted option (falling back to the typed text).
      if (colType(ed.col) === 'select' && dropdownOptions) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          dropdownNavRef.current = true;
          setDropdownIndex((i) => Math.min(i + 1, Math.max(0, dropdownOptions.length - 1)));
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          dropdownNavRef.current = true;
          setDropdownIndex((i) => Math.max(i - 1, 0));
          return;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          const opt = dropdownOptions[dropdownIndex];
          // When filtering, the highlight tracks what was typed, so it wins.
          // Without filtering, typed free text (strict: false) wins unless
          // the user explicitly picked an option with the arrow keys.
          const useOpt =
            isFilterable(ed.col) ||
            optionFilter === null ||
            dropdownNavRef.current ||
            columns?.[ed.col]?.strict !== false;
          commitEdit(true, useOpt ? opt?.value : undefined);
          if (e.key === 'Enter') moveActive(active.row + (shift ? -1 : 1), active.col);
          else moveActive(active.row, active.col + (shift ? -1 : 1));
          return;
        }
      }

      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          commitEdit();
          moveActive(active.row + (shift ? -1 : 1), active.col);
          return;
        case 'Tab':
          e.preventDefault();
          commitEdit();
          moveActive(active.row, active.col + (shift ? -1 : 1));
          return;
        case 'Escape':
          e.preventDefault();
          commitEdit(false);
          return;
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight': {
          if (ed.mode !== 'replace') return; // let the caret move inside the editor
          e.preventDefault();
          commitEdit();
          const dr = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0;
          const dc = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
          moveActive(active.row + dr, active.col + dc);
          return;
        }
        default:
          return; // everything else is normal text editing
      }
    }

    const navigate = (dr: number, dc: number) => {
      e.preventDefault();
      if (shift) {
        const f = {
          row: clamp(lastRange.focus.row, 0, Math.max(0, rowCount - 1)),
          col: clamp(lastRange.focus.col, 0, Math.max(0, colCount - 1)),
        };
        moveActive(f.row + dr, f.col + dc, { extend: true });
      } else {
        moveActive(active.row + dr, active.col + dc);
      }
    };

    // Alt+ArrowDown opens the dropdown / date picker (Excel-style).
    if (e.altKey && !mod && e.key === 'ArrowDown') {
      const type = colType(active.col);
      if (type === 'select' || type === 'date') {
        e.preventDefault();
        startEdit('edit');
        if (type === 'date') {
          requestAnimationFrame(() => {
            try {
              dateRef.current?.showPicker?.();
            } catch {
              // showPicker needs a user gesture in some browsers; focus is enough
            }
          });
        }
        return;
      }
    }

    if (mod && !e.altKey) {
      const k = e.key.toLowerCase();
      if (k === 'a') {
        e.preventDefault();
        selectAll();
        return;
      }
      if (k === 'c') {
        e.preventDefault();
        void copySelection();
        return;
      }
      if (k === 'x') {
        e.preventDefault();
        void copySelection();
        clearSelectedCells();
        return;
      }
      if (k === 'v') return; // handled by the native paste event
      if (e.key === 'Home') {
        e.preventDefault();
        moveActive(0, 0, { extend: shift });
        return;
      }
      if (e.key === 'End') {
        e.preventDefault();
        moveActive(rowCount - 1, colCount - 1, { extend: shift });
        return;
      }
      return;
    }

    const pageRows = Math.max(1, Math.floor(Math.max(0, viewportH - headerH) / rowHeight) - 1);

    switch (e.key) {
      case 'ArrowUp':
        navigate(-1, 0);
        return;
      case 'ArrowDown':
        navigate(1, 0);
        return;
      case 'ArrowLeft':
        navigate(0, -1);
        return;
      case 'ArrowRight':
        navigate(0, 1);
        return;
      case 'PageUp':
        navigate(-pageRows, 0);
        return;
      case 'PageDown':
        navigate(pageRows, 0);
        return;
      case 'Tab':
        e.preventDefault();
        moveActive(active.row, active.col + (shift ? -1 : 1));
        return;
      case 'Enter':
        e.preventDefault();
        moveActive(active.row + (shift ? -1 : 1), active.col);
        return;
      case 'F2':
        e.preventDefault();
        startEdit('edit');
        return;
      case 'Escape':
        e.preventDefault();
        setCopyRect(null);
        return;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        clearSelectedCells();
        return;
      case 'Home':
        e.preventDefault();
        moveActive(active.row, 0, { extend: shift });
        return;
      case 'End':
        e.preventDefault();
        moveActive(active.row, colCount - 1, { extend: shift });
        return;
    }

    // Space toggles checkbox cells (Excel-style) instead of starting an edit.
    if (e.key === ' ' && !mod && !e.altKey && colType(active.col) === 'checkbox') {
      e.preventDefault();
      toggleSelectedCheckboxes();
      return;
    }

    // A printable key on a non-editing cell starts a "replace" edit.
    // No preventDefault: the character lands in the textarea natively,
    // which also makes this work for dead keys and unusual layouts.
    if (e.key.length === 1 && !mod && !e.altKey) {
      const type = colType(active.col);
      // Date cells edit through the native picker; checkbox cells only
      // toggle and template cells have no text editor — the typed
      // character must not land in the textarea.
      if (type === 'date' || type === 'checkbox' || type === 'template') e.preventDefault();
      if (type === 'checkbox' || type === 'template') return;
      startEdit('replace');
    }
  };

  const handleDateEditorKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        commitEdit();
        taRef.current?.focus({ preventScroll: true });
        moveActive(active.row + (e.shiftKey ? -1 : 1), active.col);
        return;
      case 'Tab':
        e.preventDefault();
        commitEdit();
        taRef.current?.focus({ preventScroll: true });
        moveActive(active.row, active.col + (e.shiftKey ? -1 : 1));
        return;
      case 'Escape':
        e.preventDefault();
        commitEdit(false);
        taRef.current?.focus({ preventScroll: true });
        return;
    }
  };

  // ----- editor (hidden textarea) events ---------------------------------

  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const ed = editingRef.current;
    if (ed && colType(ed.col) === 'date') return; // date cells use the date input
    if (!ed) {
      // Input arrived before the keydown-triggered state flush (or via a
      // path we did not see, e.g. some IMEs): start editing now.
      const type = colType(active.col);
      if (
        !canEditCell(active.row, active.col) ||
        type === 'date' ||
        type === 'checkbox' ||
        type === 'template'
      )
        return;
      setEditing({ row: active.row, col: active.col, mode: 'replace' });
    }
    setEditValue(e.target.value);
    setOptionFilter(e.target.value); // user typed (narrows filterable dropdowns)
    dropdownNavRef.current = false;
  };

  /** Shared by the textarea and the date editor: commit unless focus stays inside the grid. */
  const handleEditorBlur = (e: React.FocusEvent) => {
    if (containerRef.current?.contains(e.relatedTarget as Node | null)) return;
    commitEdit(true);
  };

  const handleCompositionStart = () => {
    composingRef.current = true;
    // Typing "a" in Japanese IME mode must open the editor and show 「あ」.
    if (!editingRef.current) startEdit('replace');
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLTextAreaElement>) => {
    composingRef.current = false;
    compositionEndAtRef.current = e.timeStamp;
  };

  const handleCopy = (e: React.ClipboardEvent) => {
    if (editingRef.current) return; // native copy inside the editor
    e.preventDefault();
    e.clipboardData.setData('text/plain', selectionToTSV());
    markCopied();
  };

  const handleCut = (e: React.ClipboardEvent) => {
    if (editingRef.current) return;
    e.preventDefault();
    e.clipboardData.setData('text/plain', selectionToTSV());
    markCopied();
    clearSelectedCells();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (editingRef.current) return; // native paste inside the editor
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    if (text) pasteText(text);
  };

  // ----- mouse ------------------------------------------------------------

  const cellFromPoint = (clientX: number, clientY: number): CellPos => {
    const el = containerRef.current!;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left + el.scrollLeft - rowNumW;
    const y = clientY - rect.top + el.scrollTop - headerH;
    const row = clamp(Math.floor(y / rowHeight), 0, Math.max(0, rowCount - 1));
    let col = colCount - 1;
    for (let i = 0; i < colCount; i++) {
      if (x < offsets[i + 1]) {
        col = i;
        break;
      }
    }
    return { row, col: clamp(col, 0, Math.max(0, colCount - 1)) };
  };

  const beginDrag = () => {
    const onMove = (ev: MouseEvent) => {
      if (!containerRef.current) return;
      const pos = cellFromPoint(ev.clientX, ev.clientY);
      setSelection((sel) => setLastFocus(sel, pos));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const applyRangeSelection = (range: SelRange, shiftKey: boolean, mod: boolean) => {
    if (shiftKey) setSelection((sel) => setLastFocus(sel, range.focus));
    else if (mod) setSelection((sel) => [...sel, range]);
    else setSelection([range]);
  };

  const handleRootMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target === taRef.current) return; // clicks inside the active editor
    // Clicks inside the date editor (incl. its calendar icon) or the select
    // dropdown (e.g. its scrollbar) must not end the edit.
    if (dateRef.current && dateRef.current.contains(target)) return;
    if (dropdownRef.current && dropdownRef.current.contains(target)) return;
    if (target === containerRef.current) return; // scrollbar area

    // Interactive elements inside a template cell keep their native
    // behavior (focus, caret, click). The cell still becomes the
    // selection, but the grid must not steal focus or start a drag.
    const interactiveEl = target.closest(
      'button, a, input, select, textarea, label, [role="button"], [contenteditable]',
    );
    if (interactiveEl) {
      const tplCell = target.closest('[data-row]') as HTMLElement | null;
      if (tplCell && colType(Number(tplCell.dataset.col)) === 'template') {
        commitEdit();
        const pos = { row: Number(tplCell.dataset.row), col: Number(tplCell.dataset.col) };
        setSelection([{ anchor: pos, focus: pos }]);
        return;
      }
    }

    e.preventDefault(); // keep focus on the hidden textarea
    taRef.current?.focus({ preventScroll: true });
    if (rowCount === 0 || colCount === 0) return;
    commitEdit();

    const mod = e.ctrlKey || e.metaKey;
    const cornerEl = target.closest('[data-corner]');
    const hcolEl = target.closest('[data-hcol]') as HTMLElement | null;
    const rnumEl = target.closest('[data-rownum]') as HTMLElement | null;
    const cellEl = target.closest('[data-row]') as HTMLElement | null;

    if (cornerEl) {
      selectAll();
      return;
    }
    if (hcolEl) {
      const c = Number(hcolEl.dataset.hcol);
      applyRangeSelection(
        { anchor: { row: 0, col: c }, focus: { row: rowCount - 1, col: c } },
        e.shiftKey,
        mod,
      );
      return;
    }
    if (rnumEl) {
      const r = Number(rnumEl.dataset.rownum);
      applyRangeSelection(
        { anchor: { row: r, col: 0 }, focus: { row: r, col: colCount - 1 } },
        e.shiftKey,
        mod,
      );
      return;
    }
    if (cellEl) {
      const pos = { row: Number(cellEl.dataset.row), col: Number(cellEl.dataset.col) };
      if (e.shiftKey) setSelection((sel) => setLastFocus(sel, pos));
      else if (mod) setSelection((sel) => [...sel, { anchor: pos, focus: pos }]);
      else setSelection([{ anchor: pos, focus: pos }]);
      beginDrag();
      // A plain click on the checkbox glyph itself toggles it (clicks
      // elsewhere in the cell, and Shift/Ctrl selection gestures, don't).
      if (!e.shiftKey && !mod && target.closest('[data-checkbox]')) toggleCheckbox(pos);
    }
  };

  // ----- column resizing --------------------------------------------------

  const canResizeCol = (col: number) => columns?.[col]?.resizable ?? resizableColumns;

  const beginColumnResize = (e: React.MouseEvent, col: number) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation(); // don't let the header cell select the column
    taRef.current?.focus({ preventScroll: true });
    const startX = e.clientX;
    const startW = widths[col];
    const widthAt = (clientX: number) => Math.max(MIN_COL_WIDTH, startW + (clientX - startX));
    setResizingCol(col);
    const prevCursor = document.body.style.cursor;
    document.body.style.cursor = 'col-resize';
    const onMove = (ev: MouseEvent) => {
      const w = widthAt(ev.clientX);
      setWidthOverrides((prev) => (prev[col] === w ? prev : { ...prev, [col]: w }));
    };
    const onUp = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.cursor = prevCursor;
      setResizingCol(null);
      const w = widthAt(ev.clientX);
      setWidthOverrides((prev) => (prev[col] === w ? prev : { ...prev, [col]: w }));
      onColumnResize?.(col, w);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const cellEl = (e.target as HTMLElement).closest('[data-row]') as HTMLElement | null;
    if (!cellEl) return;
    startEdit('edit', { row: Number(cellEl.dataset.row), col: Number(cellEl.dataset.col) });
  };

  // ----- rendering --------------------------------------------------------

  // ARIA row/column indices are 1-based and include the header row and the
  // row-number column, so assistive tech announces positions that match
  // what a sighted user sees.
  const gridId = useId();
  const activeCellId = `${gridId}active-cell`;
  const ariaRowBase = showHeader ? 2 : 1;
  const ariaColBase = showRowNumbers ? 2 : 1;

  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN);
  const endRow = Math.min(
    rowCount,
    Math.ceil((scrollTop + Math.max(0, viewportH - headerH)) / rowHeight) + OVERSCAN,
  );

  // The active cell can be virtualized away; only reference its id while
  // it is actually in the DOM.
  const activeCellRendered =
    rowCount > 0 && colCount > 0 && active.row >= startRow && active.row < endRow;

  const isColSelected = (c: number) => normRanges.some((r) => c >= r.left && c <= r.right);
  const isRowSelected = (r: number) => normRanges.some((nr) => r >= nr.top && r <= nr.bottom);

  const rows: React.ReactNode[] = [];
  for (let r = startRow; r < endRow; r++) {
    const cells: React.ReactNode[] = [];
    if (showRowNumbers) {
      cells.push(
        <div
          key="rownum"
          data-rownum={r}
          role="rowheader"
          aria-colindex={1}
          className={'masume-grid-rownum' + (isRowSelected(r) ? ' masume-grid-rownum--sel' : '')}
          style={{ width: rowNumW, height: rowHeight }}
        >
          {r + 1}
        </div>,
      );
    }
    for (let c = 0; c < colCount; c++) {
      const selected = normRanges.some(
        (nr) => r >= nr.top && r <= nr.bottom && c >= nr.left && c <= nr.right,
      );
      const isActive = r === active.row && c === active.col;
      const type = colType(c);
      const raw = data[r]?.[c] ?? '';
      const extra = getCellProps?.(r, c, raw) ?? undefined;
      const editable = !readOnly && !columns?.[c]?.readOnly && !extra?.readOnly;
      const format = columns?.[c]?.format;
      const display =
        type === 'select'
          ? (optionLabelByValue.get(c)?.get(raw) ?? raw)
          : format && raw !== '' && type !== 'checkbox' && type !== 'template'
            ? format(raw)
            : raw;
      const checked = type === 'checkbox' && isCheckboxChecked(raw);
      cells.push(
        <div
          key={c}
          data-row={r}
          data-col={c}
          id={isActive ? activeCellId : undefined}
          role="gridcell"
          aria-selected={selected}
          aria-colindex={c + ariaColBase}
          aria-readonly={editable ? undefined : true}
          className={
            'masume-grid-cell' +
            (selected ? ' masume-grid-cell--sel' : '') +
            (isActive ? ' masume-grid-cell--active' : '') +
            (!editable ? ' masume-grid-cell--readonly' : '') +
            (type === 'number' ? ' masume-grid-cell--num' : '') +
            (type === 'select' ? ' masume-grid-cell--select' : '') +
            (type === 'checkbox' ? ' masume-grid-cell--checkbox' : '') +
            (type === 'template' ? ' masume-grid-cell--template' : '') +
            (extra?.className ? ' ' + extra.className : '')
          }
          style={{ ...extra?.style, width: widths[c], height: rowHeight }}
        >
          {type === 'checkbox' ? (
            <span
              data-checkbox
              role="checkbox"
              aria-checked={checked}
              className={'masume-grid-checkbox' + (checked ? ' masume-grid-checkbox--on' : '')}
            />
          ) : type === 'template' ? (
            (columns?.[c]?.template?.({ row: r, col: c, value: raw }) ?? display)
          ) : (
            display
          )}
          {type === 'select' && <span className="masume-grid-cell-arrow">▾</span>}
        </div>,
      );
    }
    rows.push(
      <div
        key={r}
        role="row"
        aria-rowindex={r + ariaRowBase}
        className="masume-grid-row"
        style={{ top: r * rowHeight, width: totalW, height: rowHeight }}
      >
        {cells}
      </div>,
    );
  }

  // Geometry of the marching-ants overlay; clamped so it stays valid when
  // rows/columns shrink after the copy. Recomputed from current offsets so
  // it tracks column resizes.
  const antsRect = useMemo(() => {
    if (!copyRect || rowCount === 0 || colCount === 0) return null;
    if (copyRect.top >= rowCount || copyRect.left >= colCount) return null;
    const bottom = Math.min(copyRect.bottom, rowCount - 1);
    const right = Math.min(copyRect.right, colCount - 1);
    return {
      top: copyRect.top * rowHeight,
      left: rowNumW + offsets[copyRect.left],
      width: offsets[right + 1] - offsets[copyRect.left],
      height: (bottom - copyRect.top + 1) * rowHeight,
    };
  }, [copyRect, rowCount, colCount, rowHeight, rowNumW, offsets]);

  const editorPos = editing ?? active;
  const showEditor = rowCount > 0 && colCount > 0;
  const editingIsDate = editing !== null && editingType === 'date';
  const textareaVisible = editing !== null && !editingIsDate;

  return (
    <div
      ref={containerRef}
      role="grid"
      aria-rowcount={rowCount + (showHeader ? 1 : 0)}
      aria-colcount={colCount + (showRowNumbers ? 1 : 0)}
      aria-multiselectable={true}
      aria-readonly={readOnly ? true : undefined}
      className={
        'masume-grid' +
        (resizingCol !== null ? ' masume-grid--resizing' : '') +
        (className ? ' ' + className : '')
      }
      style={style}
      onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}
      onMouseDown={handleRootMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {showHeader && (
        <div
          role="row"
          aria-rowindex={1}
          className="masume-grid-head"
          style={{ width: totalW, height: headerH }}
        >
          {showRowNumbers && (
            <div
              data-corner
              role="columnheader"
              aria-colindex={1}
              className="masume-grid-corner"
              style={{ width: rowNumW, height: headerH }}
            />
          )}
          {Array.from({ length: colCount }, (_, c) => (
            <div
              key={c}
              data-hcol={c}
              role="columnheader"
              aria-colindex={c + ariaColBase}
              className={'masume-grid-hcell' + (isColSelected(c) ? ' masume-grid-hcell--sel' : '')}
              style={{ width: widths[c], height: headerH }}
            >
              <span className="masume-grid-hcell-label">{columns?.[c]?.title ?? colName(c)}</span>
              {canResizeCol(c) && (
                <div
                  className={
                    'masume-grid-resize-handle' +
                    (resizingCol === c ? ' masume-grid-resize-handle--active' : '')
                  }
                  onMouseDown={(e) => beginColumnResize(e, c)}
                  onDoubleClick={(e) => e.stopPropagation()}
                />
              )}
            </div>
          ))}
        </div>
      )}
      <div role="rowgroup" className="masume-grid-body" style={{ width: totalW, height: totalH }}>
        {rows}
        {antsRect && <div className="masume-grid-copy-ants" style={antsRect} />}
        {showEditor && (
          <textarea
            ref={taRef}
            className={'masume-grid-editor' + (textareaVisible ? '' : ' masume-grid-editor--hidden')}
            style={{
              top: editorPos.row * rowHeight,
              left: rowNumW + offsets[editorPos.col],
              width: widths[editorPos.col],
              height: rowHeight,
            }}
            value={textareaVisible ? editValue : ''}
            onChange={handleEditorChange}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onCopy={handleCopy}
            onCut={handleCut}
            onPaste={handlePaste}
            onBlur={handleEditorBlur}
            readOnly={!editing && !canEditCell(active.row, active.col)}
            inputMode={colType(editorPos.col) === 'number' ? 'decimal' : undefined}
            wrap="off"
            rows={1}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-label="cell editor"
            aria-activedescendant={activeCellRendered ? activeCellId : undefined}
          />
        )}
        {editing && editingIsDate && (
          <input
            ref={dateRef}
            type="date"
            className="masume-grid-editor masume-grid-editor--date"
            style={{
              top: editing.row * rowHeight,
              left: rowNumW + offsets[editing.col],
              width: Math.max(widths[editing.col], 150),
              height: rowHeight,
            }}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleDateEditorKeyDown}
            onBlur={handleEditorBlur}
            aria-label="date editor"
          />
        )}
        {editing && dropdownOptions && dropdownOptions.length > 0 && (
          <div
            ref={dropdownRef}
            className="masume-grid-dropdown"
            role="listbox"
            style={{
              top: (editing.row + 1) * rowHeight,
              left: rowNumW + offsets[editing.col],
              minWidth: widths[editing.col],
            }}
          >
            {dropdownOptions.map((o, i) => (
              <div
                key={`${o.value} ${i}`}
                role="option"
                aria-selected={i === dropdownIndex}
                className={'masume-grid-option' + (i === dropdownIndex ? ' masume-grid-option--hi' : '')}
                onMouseDown={(e) => {
                  // Keep focus on the textarea and don't let the grid's own
                  // mousedown handler treat this as a cell click.
                  e.preventDefault();
                  e.stopPropagation();
                  commitEdit(true, o.value);
                }}
                onMouseEnter={() => setDropdownIndex(i)}
              >
                {o.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
