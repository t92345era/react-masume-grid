import { useState } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MasumeGrid, formatThousands } from '../src';

beforeAll(() => {
  // jsdom lacks ResizeObserver
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  // jsdom lacks scrollIntoView (used to keep the dropdown highlight visible)
  Element.prototype.scrollIntoView = () => {};
});

const editor = () => screen.getByLabelText('cell editor') as HTMLTextAreaElement;

describe('MasumeGrid', () => {
  it('renders alphabetical headers, row numbers and cell values', () => {
    render(<MasumeGrid data={[['foo', 'bar']]} />);
    expect(screen.getByText('A')).toBeTruthy();
    expect(screen.getByText('B')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy(); // row number
    expect(screen.getByText('foo')).toBeTruthy();
    expect(screen.getByText('bar')).toBeTruthy();
  });

  it('hides row numbers when showRowNumbers is false', () => {
    render(<MasumeGrid data={[['xyz']]} showRowNumbers={false} />);
    expect(screen.queryByText('1')).toBeNull();
  });

  it('uses column titles when provided', () => {
    render(<MasumeGrid data={[['v']]} columns={[{ title: '商品名' }]} />);
    expect(screen.getByText('商品名')).toBeTruthy();
  });

  it('starts editing with the current value on double-click', () => {
    render(<MasumeGrid data={[['foo', 'bar']]} />);
    const cell = screen.getByText('foo');
    fireEvent.mouseDown(cell);
    fireEvent.doubleClick(cell);
    expect(editor().value).toBe('foo');
    expect(editor().className).not.toContain('masume-grid-editor--hidden');
  });

  it('starts editing on F2 and commits on Enter via onChange', () => {
    const onChange = vi.fn();
    render(<MasumeGrid data={[['foo', 'bar']]} onChange={onChange} />);
    const cell = screen.getByText('foo');
    fireEvent.mouseDown(cell);
    fireEvent.keyDown(editor(), { key: 'F2' });
    fireEvent.change(editor(), { target: { value: 'baz' } });
    fireEvent.keyDown(editor(), { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith([['baz', 'bar']]);
  });

  it('cancels editing on Escape', () => {
    const onChange = vi.fn();
    render(<MasumeGrid data={[['foo']]} onChange={onChange} />);
    const cell = screen.getByText('foo');
    fireEvent.mouseDown(cell);
    fireEvent.doubleClick(cell);
    fireEvent.change(editor(), { target: { value: 'nope' } });
    fireEvent.keyDown(editor(), { key: 'Escape' });
    expect(onChange).not.toHaveBeenCalled();
    expect(editor().className).toContain('masume-grid-editor--hidden');
  });

  it('clears selected cells with Delete', () => {
    const onChange = vi.fn();
    render(<MasumeGrid data={[['foo', 'bar']]} onChange={onChange} />);
    fireEvent.mouseDown(screen.getByText('foo'));
    fireEvent.keyDown(editor(), { key: 'Delete' });
    expect(onChange).toHaveBeenCalledWith([['', 'bar']]);
  });

  it('does not edit when readOnly', () => {
    render(<MasumeGrid data={[['foo']]} readOnly />);
    const cell = screen.getByText('foo');
    fireEvent.mouseDown(cell);
    fireEvent.doubleClick(cell);
    expect(editor().className).toContain('masume-grid-editor--hidden');
  });

  it('resizes a column by dragging its header handle', () => {
    const onColumnResize = vi.fn();
    const { container } = render(
      <MasumeGrid data={[['a', 'b']]} onColumnResize={onColumnResize} />,
    );
    const handle = container.querySelector('[data-hcol="0"] .masume-grid-resize-handle')!;
    fireEvent.mouseDown(handle, { button: 0, clientX: 100 });
    fireEvent.mouseMove(window, { clientX: 140 });
    const hcell = container.querySelector('[data-hcol="0"]') as HTMLElement;
    expect(hcell.style.width).toBe('160px'); // default 120 + 40
    fireEvent.mouseUp(window, { clientX: 140 });
    expect(onColumnResize).toHaveBeenCalledWith(0, 160);
  });

  it('clamps column resizing to the minimum width', () => {
    const { container } = render(<MasumeGrid data={[['a']]} />);
    const handle = container.querySelector('.masume-grid-resize-handle')!;
    fireEvent.mouseDown(handle, { button: 0, clientX: 100 });
    fireEvent.mouseMove(window, { clientX: -500 });
    fireEvent.mouseUp(window, { clientX: -500 });
    const hcell = container.querySelector('[data-hcol="0"]') as HTMLElement;
    expect(hcell.style.width).toBe('24px');
  });

  it('renders no resize handles when resizableColumns is false', () => {
    const { container } = render(
      <MasumeGrid data={[['a', 'b']]} resizableColumns={false} />,
    );
    expect(container.querySelector('.masume-grid-resize-handle')).toBeNull();
  });

  it('honors per-column resizable overrides', () => {
    const { container } = render(
      <MasumeGrid
        data={[['a', 'b']]}
        resizableColumns={false}
        columns={[{ title: 'X' }, { title: 'Y', resizable: true }]}
      />,
    );
    expect(container.querySelector('[data-hcol="0"] .masume-grid-resize-handle')).toBeNull();
    expect(container.querySelector('[data-hcol="1"] .masume-grid-resize-handle')).not.toBeNull();
  });

  it('normalizes number-cell input on commit and rejects invalid values', () => {
    const onChange = vi.fn();
    render(
      <MasumeGrid data={[['100']]} columns={[{ title: 'N', type: 'number' }]} onChange={onChange} />,
    );
    const cell = screen.getByText('100');
    fireEvent.mouseDown(cell);
    fireEvent.doubleClick(cell);
    fireEvent.change(editor(), { target: { value: '１，２３４' } });
    fireEvent.keyDown(editor(), { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith([['1234']]);

    onChange.mockClear();
    fireEvent.mouseDown(screen.getByText('100')); // data prop unchanged (controlled)
    fireEvent.doubleClick(screen.getByText('100'));
    fireEvent.change(editor(), { target: { value: 'abc' } });
    fireEvent.keyDown(editor(), { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows labels for select values and commits the clicked option value', () => {
    const onChange = vi.fn();
    const options = [
      { value: 'C01', label: '果物' },
      { value: 'C02', label: '青果' },
    ];
    render(
      <MasumeGrid
        data={[['C01']]}
        columns={[{ title: 'カテゴリ', type: 'select', options }]}
        onChange={onChange}
      />,
    );
    const cell = screen.getByText('果物'); // label, not the stored code
    fireEvent.mouseDown(cell);
    fireEvent.doubleClick(cell);
    fireEvent.mouseDown(screen.getByText('青果')); // dropdown option
    expect(onChange).toHaveBeenCalledWith([['C02']]);
  });

  it('rejects values outside the options of a strict select column', () => {
    const onChange = vi.fn();
    render(
      <MasumeGrid
        data={[['a']]}
        columns={[{ title: 'S', type: 'select', options: ['x', 'y'] }]}
        onChange={onChange}
      />,
    );
    fireEvent.mouseDown(screen.getByText('a'));
    fireEvent.paste(editor(), { clipboardData: { getData: () => 'z' } });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.paste(editor(), { clipboardData: { getData: () => 'y' } });
    expect(onChange).toHaveBeenCalledWith([['y']]);
  });

  it('edits date cells with a date input and commits ISO values', () => {
    const onChange = vi.fn();
    render(
      <MasumeGrid data={[['2026-07-06']]} columns={[{ title: 'D', type: 'date' }]} onChange={onChange} />,
    );
    const cell = screen.getByText('2026-07-06');
    fireEvent.mouseDown(cell);
    fireEvent.doubleClick(cell);
    const dateInput = screen.getByLabelText('date editor') as HTMLInputElement;
    expect(dateInput.value).toBe('2026-07-06');
    fireEvent.change(dateInput, { target: { value: '2026-07-07' } });
    fireEvent.keyDown(dateInput, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith([['2026-07-07']]);
  });

  it('keeps the old date when the picker holds unparsable input (bug 1)', () => {
    const onChange = vi.fn();
    render(
      <MasumeGrid data={[['2026-01-01']]} columns={[{ title: 'D', type: 'date' }]} onChange={onChange} />,
    );
    const cell = screen.getByText('2026-01-01');
    fireEvent.mouseDown(cell);
    fireEvent.doubleClick(cell);
    const dateInput = screen.getByLabelText('date editor') as HTMLInputElement;
    // Browsers report value '' with validity.badInput=true while unparsable
    // text sits in the control.
    fireEvent.change(dateInput, { target: { value: '' } });
    Object.defineProperty(dateInput, 'validity', { value: { badInput: true } });
    fireEvent.keyDown(dateInput, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('2026-01-01')).toBeTruthy();
  });

  it('still allows deliberately clearing a date cell', () => {
    const onChange = vi.fn();
    render(
      <MasumeGrid data={[['2026-01-01']]} columns={[{ title: 'D', type: 'date' }]} onChange={onChange} />,
    );
    const cell = screen.getByText('2026-01-01');
    fireEvent.mouseDown(cell);
    fireEvent.doubleClick(cell);
    const dateInput = screen.getByLabelText('date editor') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '' } }); // validity.badInput stays false
    fireEvent.keyDown(dateInput, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith([['']]);
  });

  it('starts select editing from the label, not the stored code (bug 2)', () => {
    const onChange = vi.fn();
    const options = [
      { value: 'C01', label: '果物' },
      { value: 'C02', label: '青果' },
    ];
    render(
      <MasumeGrid
        data={[['C01']]}
        columns={[{ title: 'カテゴリ', type: 'select', options }]}
        onChange={onChange}
      />,
    );
    const cell = screen.getByText('果物');
    fireEvent.mouseDown(cell);
    fireEvent.doubleClick(cell);
    expect(editor().value).toBe('果物'); // label, not 'C01'
    // Committing untouched must be a no-op (label maps back to the same code).
    fireEvent.keyDown(editor(), { key: 'Escape' });
    fireEvent.mouseDown(screen.getByText('果物'));
    fireEvent.doubleClick(screen.getByText('果物'));
    fireEvent.keyDown(editor(), { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps editing when clicking inside the date editor (calendar icon)', () => {
    render(<MasumeGrid data={[['2026-01-01']]} columns={[{ title: 'D', type: 'date' }]} />);
    const cell = screen.getByText('2026-01-01');
    fireEvent.mouseDown(cell);
    fireEvent.doubleClick(cell);
    const dateInput = screen.getByLabelText('date editor');
    fireEvent.mouseDown(dateInput); // e.g. the calendar icon; bubbles to the grid
    expect(screen.queryByLabelText('date editor')).not.toBeNull(); // still editing
  });

  it('keeps editing when clicking the dropdown container (e.g. its scrollbar)', () => {
    render(
      <MasumeGrid data={[['x']]} columns={[{ title: 'S', type: 'select', options: ['x', 'y'] }]} />,
    );
    const cell = screen.getByText('x');
    fireEvent.mouseDown(cell);
    fireEvent.doubleClick(cell);
    fireEvent.mouseDown(screen.getByRole('listbox'));
    expect(screen.queryByRole('listbox')).not.toBeNull(); // dropdown still open
  });

  it('normalizes pasted dates and numbers', () => {
    const onChange = vi.fn();
    render(
      <MasumeGrid
        data={[['x', 'y']]}
        columns={[
          { title: 'N', type: 'number' },
          { title: 'D', type: 'date' },
        ]}
        onChange={onChange}
      />,
    );
    fireEvent.mouseDown(screen.getByText('x'));
    fireEvent.paste(editor(), {
      clipboardData: { getData: () => '1,234\t2026年7月6日' },
    });
    expect(onChange).toHaveBeenCalledWith([['1234', '2026-07-06']]);
  });

  it('filters the select dropdown while typing by default', () => {
    const { container } = render(
      <MasumeGrid
        data={[['']]}
        columns={[{ title: 'S', type: 'select', options: ['りんご', 'みかん', 'メロン'] }]}
      />,
    );
    const cell = container.querySelector('[data-row="0"][data-col="0"]')!;
    fireEvent.mouseDown(cell);
    fireEvent.doubleClick(cell);
    expect(screen.getAllByRole('option').length).toBe(3);
    fireEvent.change(editor(), { target: { value: 'み' } });
    expect(screen.getAllByRole('option').map((el) => el.textContent)).toEqual(['みかん']);
  });

  it('keeps the full option list while typing when searchable is false', () => {
    const onChange = vi.fn();
    const { container } = render(
      <MasumeGrid
        data={[['']]}
        columns={[
          { title: 'S', type: 'select', options: ['りんご', 'みかん', 'メロン'], searchable: false },
        ]}
        onChange={onChange}
      />,
    );
    const cell = container.querySelector('[data-row="0"][data-col="0"]')!;
    fireEvent.mouseDown(cell);
    fireEvent.doubleClick(cell);
    fireEvent.change(editor(), { target: { value: 'み' } });
    const options = screen.getAllByRole('option');
    expect(options.length).toBe(3); // list not narrowed
    // Type-ahead: the highlight jumps to the first prefix match.
    expect(options[1].textContent).toBe('みかん');
    expect(options[1].getAttribute('aria-selected')).toBe('true');
    // Strict column: Enter commits the highlighted option.
    fireEvent.keyDown(editor(), { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith([['みかん']]);
  });

  it('navigates the unfiltered dropdown with arrows when searchable is false', () => {
    const onChange = vi.fn();
    const { container } = render(
      <MasumeGrid
        data={[['']]}
        columns={[{ title: 'S', type: 'select', options: ['x', 'y'], searchable: false }]}
        onChange={onChange}
      />,
    );
    const cell = container.querySelector('[data-row="0"][data-col="0"]')!;
    fireEvent.mouseDown(cell);
    fireEvent.doubleClick(cell);
    fireEvent.keyDown(editor(), { key: 'ArrowDown' });
    fireEvent.keyDown(editor(), { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith([['y']]);
  });

  it('commits typed free text when searchable is false and strict is false', () => {
    const onChange = vi.fn();
    const { container } = render(
      <MasumeGrid
        data={[['']]}
        columns={[
          { title: 'S', type: 'select', options: ['x', 'y'], strict: false, searchable: false },
        ]}
        onChange={onChange}
      />,
    );
    const cell = container.querySelector('[data-row="0"][data-col="0"]')!;
    fireEvent.mouseDown(cell);
    fireEvent.doubleClick(cell);
    fireEvent.change(editor(), { target: { value: 'z' } });
    fireEvent.keyDown(editor(), { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith([['z']]);
  });

  it('renders checkbox cells and toggles on glyph click', () => {
    const onChange = vi.fn();
    const { container } = render(
      <MasumeGrid data={[['true'], ['']]} columns={[{ title: '✓', type: 'checkbox' }]} onChange={onChange} />,
    );
    const boxes = container.querySelectorAll('[data-checkbox]');
    expect(boxes.length).toBe(2);
    expect(boxes[0].getAttribute('aria-checked')).toBe('true');
    expect(boxes[1].getAttribute('aria-checked')).toBe('false');
    fireEvent.mouseDown(boxes[0]);
    expect(onChange).toHaveBeenCalledWith([[''], ['']]);
    onChange.mockClear();
    fireEvent.mouseDown(boxes[1]);
    expect(onChange).toHaveBeenCalledWith([['true'], ['true']]);
  });

  it('does not toggle when clicking the cell outside the glyph', () => {
    const onChange = vi.fn();
    const { container } = render(
      <MasumeGrid data={[['true']]} columns={[{ title: '✓', type: 'checkbox' }]} onChange={onChange} />,
    );
    fireEvent.mouseDown(container.querySelector('[data-row="0"][data-col="0"]')!);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('toggles all selected checkbox cells with Space', () => {
    const onChange = vi.fn();
    const { container } = render(
      <MasumeGrid
        data={[['true'], ['']]}
        columns={[{ title: '✓', type: 'checkbox' }]}
        onChange={onChange}
      />,
    );
    fireEvent.mouseDown(container.querySelector('[data-row="0"][data-col="0"]')!);
    fireEvent.mouseDown(container.querySelector('[data-row="1"][data-col="0"]')!, { shiftKey: true });
    fireEvent.keyDown(editor(), { key: ' ' });
    expect(onChange).toHaveBeenCalledWith([[''], ['true']]);
  });

  it('never opens the text editor on a checkbox cell', () => {
    const { container } = render(
      <MasumeGrid data={[['true']]} columns={[{ title: '✓', type: 'checkbox' }]} />,
    );
    const cell = container.querySelector('[data-row="0"][data-col="0"]')!;
    fireEvent.mouseDown(cell);
    fireEvent.doubleClick(cell);
    expect(editor().className).toContain('masume-grid-editor--hidden');
    fireEvent.keyDown(editor(), { key: 'F2' });
    expect(editor().className).toContain('masume-grid-editor--hidden');
  });

  it('normalizes pasted checkbox values and rejects invalid ones', () => {
    const onChange = vi.fn();
    const { container } = render(
      <MasumeGrid data={[['']]} columns={[{ title: '✓', type: 'checkbox' }]} onChange={onChange} />,
    );
    fireEvent.mouseDown(container.querySelector('[data-row="0"][data-col="0"]')!);
    fireEvent.paste(editor(), { clipboardData: { getData: () => 'maybe' } });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.paste(editor(), { clipboardData: { getData: () => 'TRUE' } });
    expect(onChange).toHaveBeenCalledWith([['true']]);
  });

  it('does not toggle read-only checkbox cells', () => {
    const onChange = vi.fn();
    const { container } = render(
      <MasumeGrid
        data={[['true']]}
        columns={[{ title: '✓', type: 'checkbox', readOnly: true }]}
        onChange={onChange}
      />,
    );
    fireEvent.mouseDown(container.querySelector('[data-checkbox]')!);
    fireEvent.keyDown(editor(), { key: ' ' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('pastes tab-separated text starting at the active cell', () => {
    const onChange = vi.fn();
    render(
      <MasumeGrid
        data={[
          ['a', 'b'],
          ['c', 'd'],
        ]}
        onChange={onChange}
      />,
    );
    fireEvent.mouseDown(screen.getByText('a'));
    fireEvent.paste(editor(), {
      clipboardData: { getData: () => 'X\tY\nZ\tW' },
    });
    expect(onChange).toHaveBeenCalledWith([
      ['X', 'Y'],
      ['Z', 'W'],
    ]);
  });

  it('renders template cells with the data row index', () => {
    render(
      <MasumeGrid
        data={[['a'], ['b']]}
        columns={[
          {
            type: 'template',
            template: ({ row, value }) => <button type="button">{`${row}:${value}`}</button>,
          },
        ]}
      />,
    );
    expect(screen.getByText('0:a')).toBeTruthy();
    expect(screen.getByText('1:b')).toBeTruthy();
  });

  it('does not open the text editor for template cells', () => {
    render(
      <MasumeGrid
        data={[['x']]}
        columns={[{ type: 'template', template: ({ value }) => <span>T-{value}</span> }]}
      />,
    );
    const cell = screen.getByText('T-x');
    fireEvent.mouseDown(cell);
    fireEvent.doubleClick(cell);
    expect(editor().className).toContain('masume-grid-editor--hidden');
    fireEvent.keyDown(editor(), { key: 'F2' });
    expect(editor().className).toContain('masume-grid-editor--hidden');
  });

  it('lets buttons inside template cells receive clicks and selects the cell', () => {
    const onClick = vi.fn();
    const onSelectionChange = vi.fn();
    render(
      <MasumeGrid
        data={[['a', 'b']]}
        columns={[
          {},
          {
            type: 'template',
            template: ({ row }) => (
              <button type="button" onClick={() => onClick(row)}>
                Go
              </button>
            ),
          },
        ]}
        onSelectionChange={onSelectionChange}
      />,
    );
    const btn = screen.getByText('Go');
    fireEvent.mouseDown(btn);
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledWith(0);
    expect(onSelectionChange).toHaveBeenLastCalledWith(
      [{ top: 0, bottom: 0, left: 1, right: 1 }],
      null, // unsorted: display rows are data rows
    );
  });

  it('outlines the copied range with marching ants and clears it on Escape', () => {
    const { container } = render(
      <MasumeGrid
        data={[
          ['a', 'b'],
          ['c', 'd'],
        ]}
      />,
    );
    const ants = () => container.querySelector('.masume-grid-copy-ants') as HTMLElement | null;
    expect(ants()).toBeNull();
    fireEvent.mouseDown(screen.getByText('a'));
    fireEvent.keyDown(editor(), { key: 'ArrowRight', shiftKey: true }); // A1:B1
    fireEvent.copy(editor(), { clipboardData: { setData: vi.fn() } });
    const el = ants()!;
    expect(el).toBeTruthy();
    // rowNumberWidth 48 + two 120px columns, one 28px row
    expect(el.style.top).toBe('0px');
    expect(el.style.left).toBe('48px');
    expect(el.style.width).toBe('240px');
    expect(el.style.height).toBe('28px');
    fireEvent.keyDown(editor(), { key: 'Escape' });
    expect(ants()).toBeNull();
  });

  it('clears the marching-ants outline after paste', () => {
    const { container } = render(<MasumeGrid data={[['a', 'b']]} onChange={vi.fn()} />);
    const ants = () => container.querySelector('.masume-grid-copy-ants');
    fireEvent.mouseDown(screen.getByText('a'));
    fireEvent.copy(editor(), { clipboardData: { setData: vi.fn() } });
    expect(ants()).toBeTruthy();
    fireEvent.paste(editor(), { clipboardData: { getData: () => 'X' } });
    expect(ants()).toBeNull();
  });

  it('clears the marching-ants outline when an edit starts', () => {
    const { container } = render(<MasumeGrid data={[['a', 'b']]} />);
    const ants = () => container.querySelector('.masume-grid-copy-ants');
    fireEvent.mouseDown(screen.getByText('a'));
    fireEvent.copy(editor(), { clipboardData: { setData: vi.fn() } });
    expect(ants()).toBeTruthy();
    fireEvent.doubleClick(screen.getByText('b'));
    expect(ants()).toBeNull();
  });

  it('blocks editing, delete and paste on cells locked via getCellProps', () => {
    const onChange = vi.fn();
    render(
      <MasumeGrid
        data={[['a', 'b']]}
        onChange={onChange}
        getCellProps={(_row, col) => (col === 0 ? { readOnly: true } : undefined)}
      />,
    );
    const cell = screen.getByText('a');
    fireEvent.mouseDown(cell);
    fireEvent.doubleClick(cell);
    expect(editor().className).toContain('masume-grid-editor--hidden');
    fireEvent.keyDown(editor(), { key: 'Delete' });
    expect(onChange).not.toHaveBeenCalled();
    // Paste starting at the locked cell skips it but writes the rest.
    fireEvent.paste(editor(), { clipboardData: { getData: () => 'X\tY' } });
    expect(onChange).toHaveBeenCalledWith([['a', 'Y']]);
  });

  it('applies className and style from getCellProps to the cell', () => {
    render(
      <MasumeGrid
        data={[['a']]}
        getCellProps={() => ({ className: 'cell-error', style: { background: 'red' } })}
      />,
    );
    const cell = screen.getByText('a');
    expect(cell.className).toContain('masume-grid-cell');
    expect(cell.className).toContain('cell-error');
    expect(cell.style.background).toBe('red');
    expect(cell.style.width).toBe('120px'); // grid geometry still wins
  });

  it('formats the display via ColumnDef.format while edit and copy use the raw value', () => {
    render(
      <MasumeGrid
        data={[['1234567']]}
        columns={[{ type: 'number', format: formatThousands }]}
        onChange={vi.fn()}
      />,
    );
    const cell = screen.getByText('1,234,567');
    fireEvent.mouseDown(cell);
    fireEvent.doubleClick(cell);
    expect(editor().value).toBe('1234567'); // editor gets the stored value
    fireEvent.keyDown(editor(), { key: 'Escape' });
    const setData = vi.fn();
    fireEvent.copy(editor(), { clipboardData: { setData } });
    expect(setData).toHaveBeenCalledWith('text/plain', '1234567'); // copy too
  });

  it('does not call format for empty cells', () => {
    const format = vi.fn((v: string) => `<${v}>`);
    render(<MasumeGrid data={[['', 'x']]} columns={[{ format }, { format }]} />);
    expect(screen.getByText('<x>')).toBeTruthy();
    expect(format).toHaveBeenCalledTimes(1);
  });

  it('exposes ARIA grid semantics with 1-based indices including header and row numbers', () => {
    const { container } = render(
      <MasumeGrid
        data={[
          ['a', 'b'],
          ['c', 'd'],
        ]}
        columns={[{ title: 'X' }, { title: 'Y', readOnly: true }]}
      />,
    );
    const grid = container.querySelector('.masume-grid')!;
    expect(grid.getAttribute('role')).toBe('grid');
    expect(grid.getAttribute('aria-rowcount')).toBe('3'); // header + 2 data rows
    expect(grid.getAttribute('aria-colcount')).toBe('3'); // row numbers + 2 columns
    expect(grid.getAttribute('aria-multiselectable')).toBe('true');

    const head = container.querySelector('.masume-grid-head')!;
    expect(head.getAttribute('role')).toBe('row');
    expect(head.getAttribute('aria-rowindex')).toBe('1');
    const hcell = container.querySelector('[data-hcol="0"]')!;
    expect(hcell.getAttribute('role')).toBe('columnheader');
    expect(hcell.getAttribute('aria-colindex')).toBe('2');

    expect(container.querySelector('.masume-grid-body')!.getAttribute('role')).toBe('rowgroup');
    const rownum = container.querySelector('[data-rownum="0"]')!;
    expect(rownum.getAttribute('role')).toBe('rowheader');
    expect(rownum.getAttribute('aria-colindex')).toBe('1');

    const cellD = screen.getByText('d');
    expect(cellD.getAttribute('role')).toBe('gridcell');
    expect(cellD.getAttribute('aria-colindex')).toBe('3');
    expect(cellD.closest('.masume-grid-row')!.getAttribute('aria-rowindex')).toBe('3');
    expect(screen.getByText('b').getAttribute('aria-readonly')).toBe('true'); // readOnly column

    // The hidden editor references the active cell.
    fireEvent.mouseDown(screen.getByText('a'));
    const activeId = screen.getByText('a').getAttribute('id');
    expect(activeId).toBeTruthy();
    expect(editor().getAttribute('aria-activedescendant')).toBe(activeId);
  });

  it('omits the header row and row-number column from ARIA counts when hidden', () => {
    const { container } = render(
      <MasumeGrid data={[['a']]} showHeader={false} showRowNumbers={false} />,
    );
    const grid = container.querySelector('.masume-grid')!;
    expect(grid.getAttribute('aria-rowcount')).toBe('1');
    expect(grid.getAttribute('aria-colcount')).toBe('1');
    const cell = screen.getByText('a');
    expect(cell.getAttribute('aria-colindex')).toBe('1');
    expect(cell.closest('.masume-grid-row')!.getAttribute('aria-rowindex')).toBe('1');
  });

  it('marks the grid aria-readonly when readOnly', () => {
    const { container } = render(<MasumeGrid data={[['a']]} readOnly />);
    expect(container.querySelector('.masume-grid')!.getAttribute('aria-readonly')).toBe('true');
  });

  // ----- appendBlankRow ---------------------------------------------------

  const rowCountOf = (container: HTMLElement) =>
    container.querySelectorAll('.masume-grid-row').length;

  it('renders one extra blank row only when appendBlankRow is set', () => {
    const data = [['a', 'b']];
    const { container, rerender } = render(<MasumeGrid data={data} />);
    expect(rowCountOf(container)).toBe(1);
    rerender(<MasumeGrid data={data} appendBlankRow />);
    expect(rowCountOf(container)).toBe(2);
    const blank = container.querySelector('.masume-grid-row--blank')!;
    expect(blank.getAttribute('aria-rowindex')).toBe('3'); // header + 1 data row
    expect(container.querySelector('[data-rownum="1"]')!.textContent).toBe('2');
  });

  it('appends a row to the data when the blank row is committed', () => {
    const onChange = vi.fn();
    const onCellChange = vi.fn();
    const { container } = render(
      <MasumeGrid data={[['a', 'b']]} onChange={onChange} onCellChange={onCellChange} appendBlankRow />,
    );
    fireEvent.mouseDown(container.querySelector('[data-row="1"][data-col="1"]')!);
    fireEvent.change(editor(), { target: { value: 'new' } });
    fireEvent.keyDown(editor(), { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith([
      ['a', 'b'],
      ['', 'new'],
    ]);
    expect(onCellChange).toHaveBeenCalledWith(1, 1, 'new');
  });

  it('moves onto the freshly added blank row after committing with Enter', () => {
    function Controlled() {
      const [data, setData] = useState<string[][]>([['a']]);
      return <MasumeGrid data={data} onChange={setData} appendBlankRow />;
    }
    const { container } = render(<Controlled />);
    fireEvent.mouseDown(container.querySelector('[data-row="1"][data-col="0"]')!);
    fireEvent.change(editor(), { target: { value: 'b' } });
    fireEvent.keyDown(editor(), { key: 'Enter' });
    expect(rowCountOf(container)).toBe(3); // 2 data rows + the next blank row
    const active = container.querySelector('.masume-grid-cell--active')!;
    expect(active.getAttribute('data-row')).toBe('2');
    expect(container.querySelector('.masume-grid-row--blank')!.getAttribute('aria-rowindex')).toBe(
      '4',
    );
  });

  it('does not grow the data when the blank row is left empty', () => {
    const onChange = vi.fn();
    const { container } = render(
      <MasumeGrid data={[['a']]} onChange={onChange} appendBlankRow />,
    );
    const blankCell = container.querySelector('[data-row="1"][data-col="0"]')!;
    fireEvent.mouseDown(blankCell);
    fireEvent.keyDown(editor(), { key: 'Delete' });
    fireEvent.doubleClick(blankCell);
    fireEvent.keyDown(editor(), { key: 'Enter' }); // commit without typing
    expect(onChange).not.toHaveBeenCalled();
  });

  it('ignores appendBlankRow on a read-only grid', () => {
    const { container } = render(<MasumeGrid data={[['a']]} appendBlankRow readOnly />);
    expect(rowCountOf(container)).toBe(1);
    expect(container.querySelector('.masume-grid-row--blank')).toBeNull();
  });

  it('lets the blank row start an empty grid', () => {
    const onChange = vi.fn();
    const { container } = render(
      <MasumeGrid data={[]} columns={[{ title: 'A' }]} onChange={onChange} appendBlankRow />,
    );
    expect(rowCountOf(container)).toBe(1);
    fireEvent.mouseDown(container.querySelector('[data-row="0"][data-col="0"]')!);
    fireEvent.change(editor(), { target: { value: 'first' } });
    fireEvent.keyDown(editor(), { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith([['first']]);
  });

  it('leaves the blank row out of select-all', () => {
    const setData = vi.fn();
    const { container } = render(<MasumeGrid data={[['a', 'b']]} appendBlankRow />);
    fireEvent.mouseDown(container.querySelector('[data-row="0"][data-col="0"]')!);
    fireEvent.keyDown(editor(), { key: 'a', ctrlKey: true });
    fireEvent.copy(editor(), { clipboardData: { setData } });
    expect(setData).toHaveBeenCalledWith('text/plain', 'a\tb');
  });

  // ----- sorting ----------------------------------------------------------

  const colValues = (container: HTMLElement, col: number) =>
    Array.from(container.querySelectorAll(`[data-col="${col}"]`)).map((el) => el.textContent);

  const header = (title: string) => screen.getByText(title).closest('[data-hcol]')!;

  it('cycles ascending → descending → unsorted on header clicks', () => {
    const onSortChange = vi.fn();
    const { container } = render(
      <MasumeGrid
        data={[['b'], ['c'], ['a']]}
        columns={[{ title: 'Name' }]}
        sortable
        onSortChange={onSortChange}
      />,
    );
    expect(colValues(container, 0)).toEqual(['b', 'c', 'a']);

    fireEvent.mouseDown(header('Name'));
    expect(colValues(container, 0)).toEqual(['a', 'b', 'c']);
    expect(onSortChange).toHaveBeenLastCalledWith({ col: 0, direction: 'asc' });
    expect(header('Name').getAttribute('aria-sort')).toBe('ascending');

    fireEvent.mouseDown(header('Name'));
    expect(colValues(container, 0)).toEqual(['c', 'b', 'a']);
    expect(header('Name').getAttribute('aria-sort')).toBe('descending');

    fireEvent.mouseDown(header('Name'));
    expect(colValues(container, 0)).toEqual(['b', 'c', 'a']); // original order
    expect(onSortChange).toHaveBeenLastCalledWith(null);
    expect(header('Name').getAttribute('aria-sort')).toBe('none');
  });

  it('shows a neutral indicator on every sortable header before sorting', () => {
    render(
      <MasumeGrid
        data={[['b', 'y']]}
        columns={[{ title: 'Name' }, { title: 'Locked', sortable: false }]}
        sortable
      />,
    );
    const arrow = (title: string) => header(title).querySelector('.masume-grid-sort-arrow');
    expect(arrow('Name')!.textContent).toBe('⇅');
    expect(arrow('Name')!.className).toContain('masume-grid-sort-arrow--none');
    expect(arrow('Locked')).toBeNull();

    fireEvent.mouseDown(header('Name'));
    expect(arrow('Name')!.textContent).toBe('▲');
    expect(arrow('Name')!.className).not.toContain('--none');
    fireEvent.mouseDown(header('Name'));
    expect(arrow('Name')!.textContent).toBe('▼');
    fireEvent.mouseDown(header('Name'));
    expect(arrow('Name')!.textContent).toBe('⇅'); // back to unsorted
  });

  it('selects the column as well as sorting it', () => {
    const onSelectionChange = vi.fn();
    render(
      <MasumeGrid
        data={[['b'], ['a']]}
        columns={[{ title: 'Name' }]}
        sortable
        onSelectionChange={onSelectionChange}
      />,
    );
    fireEvent.mouseDown(header('Name'));
    expect(onSelectionChange).toHaveBeenLastCalledWith(
      [{ top: 0, bottom: 1, left: 0, right: 0 }],
      [1, 0], // display row → data row
    );
  });

  it('does not sort on Shift/Ctrl header clicks (selection gestures)', () => {
    const { container } = render(
      <MasumeGrid data={[['b'], ['a']]} columns={[{ title: 'Name' }]} sortable />,
    );
    fireEvent.mouseDown(header('Name'), { ctrlKey: true });
    expect(colValues(container, 0)).toEqual(['b', 'a']);
    fireEvent.mouseDown(header('Name'), { shiftKey: true });
    expect(colValues(container, 0)).toEqual(['b', 'a']);
  });

  it('ignores clicks on headers that are not sortable', () => {
    const { container } = render(
      <MasumeGrid
        data={[['b', 'y'], ['a', 'x']]}
        columns={[{ title: 'Name' }, { title: 'Locked', sortable: false }]}
        sortable
      />,
    );
    fireEvent.mouseDown(header('Locked'));
    expect(colValues(container, 0)).toEqual(['b', 'a']);
    expect(header('Locked').getAttribute('aria-sort')).toBeNull();
    expect(header('Name').getAttribute('aria-sort')).toBe('none');
  });

  it('sorts number columns numerically and puts empty cells last', () => {
    const { container } = render(
      <MasumeGrid
        data={[['10'], [''], ['9'], ['100']]}
        columns={[{ title: 'Qty', type: 'number' }]}
        sortable
      />,
    );
    fireEvent.mouseDown(header('Qty'));
    expect(colValues(container, 0)).toEqual(['9', '10', '100', '']);
    fireEvent.mouseDown(header('Qty'));
    expect(colValues(container, 0)).toEqual(['100', '10', '9', '']); // blanks stay last
  });

  it('sorts select columns by option order and checkbox columns by state', () => {
    const { container } = render(
      <MasumeGrid
        data={[
          ['C02', ''],
          ['C01', 'true'],
        ]}
        columns={[
          { title: 'Cat', type: 'select', options: [{ value: 'C01', label: 'Fruit' }, { value: 'C02', label: 'Veg' }] },
          { title: 'Done', type: 'checkbox' },
        ]}
        sortable
      />,
    );
    // Select cells render their label plus the dropdown arrow glyph.
    fireEvent.mouseDown(header('Cat'));
    expect(colValues(container, 0)).toEqual(['Fruit▾', 'Veg▾']);
    fireEvent.mouseDown(header('Done'));
    expect(colValues(container, 0)).toEqual(['Veg▾', 'Fruit▾']); // unchecked row first
  });

  it('uses ColumnDef.compare when provided', () => {
    const { container } = render(
      <MasumeGrid
        data={[['bbb'], ['a'], ['cc']]}
        columns={[{ title: 'Name', compare: (a, b) => a.length - b.length }]}
        sortable
      />,
    );
    fireEvent.mouseDown(header('Name'));
    expect(colValues(container, 0)).toEqual(['a', 'cc', 'bbb']);
  });

  it('applies defaultSort on mount', () => {
    const { container } = render(
      <MasumeGrid
        data={[['b'], ['a']]}
        columns={[{ title: 'Name' }]}
        sortable
        defaultSort={{ col: 0, direction: 'desc' }}
      />,
    );
    expect(colValues(container, 0)).toEqual(['b', 'a']);
    expect(header('Name').getAttribute('aria-sort')).toBe('descending');
  });

  it('writes edits and deletes to the underlying data row while sorted', () => {
    const onChange = vi.fn();
    const onCellChange = vi.fn();
    const { container } = render(
      <MasumeGrid
        data={[
          ['b', '1'],
          ['a', '2'],
        ]}
        columns={[{ title: 'Name' }, { title: 'Qty' }]}
        sortable
        onChange={onChange}
        onCellChange={onCellChange}
      />,
    );
    fireEvent.mouseDown(header('Name')); // ascending: data row 1 is displayed first
    fireEvent.mouseDown(container.querySelector('[data-row="0"][data-col="1"]')!);
    fireEvent.keyDown(editor(), { key: 'F2' });
    fireEvent.change(editor(), { target: { value: '99' } });
    fireEvent.keyDown(editor(), { key: 'Enter' });
    expect(onCellChange).toHaveBeenCalledWith(1, 1, '99');
    expect(onChange).toHaveBeenCalledWith([
      ['b', '1'],
      ['a', '99'],
    ]);

    onChange.mockClear();
    fireEvent.mouseDown(container.querySelector('[data-row="1"][data-col="0"]')!);
    fireEvent.keyDown(editor(), { key: 'Delete' });
    expect(onChange).toHaveBeenCalledWith([
      ['', '1'],
      ['a', '2'],
    ]);
  });

  it('passes data row indices to getCellProps and templates while sorted', () => {
    const { container } = render(
      <MasumeGrid
        data={[['b'], ['a']]}
        columns={[
          { title: 'Name' },
          { type: 'template', sortable: false, template: ({ row }) => <span>row{row}</span> },
        ]}
        getCellProps={(row) => ({ className: `data-row-${row}` })}
        sortable
      />,
    );
    fireEvent.mouseDown(header('Name'));
    expect(colValues(container, 1)).toEqual(['row1', 'row0']);
    expect(container.querySelector('[data-row="0"][data-col="0"]')!.className).toContain(
      'data-row-1',
    );
  });

  it('copies the selection in display order while sorted', () => {
    const setData = vi.fn();
    const { container } = render(
      <MasumeGrid data={[['b'], ['a']]} columns={[{ title: 'Name' }]} sortable />,
    );
    fireEvent.mouseDown(header('Name'));
    fireEvent.mouseDown(container.querySelector('[data-row="0"][data-col="0"]')!);
    fireEvent.keyDown(editor(), { key: 'a', ctrlKey: true });
    fireEvent.copy(editor(), { clipboardData: { setData } });
    expect(setData).toHaveBeenCalledWith('text/plain', 'a\nb');
  });

  it('pastes across display rows while sorted, writing to their data rows', () => {
    const onChange = vi.fn();
    const { container } = render(
      <MasumeGrid
        data={[['b'], ['a']]}
        columns={[{ title: 'Name' }]}
        sortable
        onChange={onChange}
      />,
    );
    fireEvent.mouseDown(header('Name')); // display order: data rows [1, 0]
    fireEvent.mouseDown(container.querySelector('[data-row="0"][data-col="0"]')!);
    fireEvent.paste(editor(), { clipboardData: { getData: () => 'x\ny' } });
    expect(onChange).toHaveBeenCalledWith([['y'], ['x']]);
  });

  it('keeps the sorted order stable while cells are edited', () => {
    function Controlled() {
      const [data, setData] = useState<string[][]>([['b'], ['a'], ['c']]);
      return (
        <MasumeGrid data={data} columns={[{ title: 'Name' }]} onChange={setData} sortable />
      );
    }
    const { container } = render(<Controlled />);
    fireEvent.mouseDown(header('Name'));
    expect(colValues(container, 0)).toEqual(['a', 'b', 'c']);
    // Editing the first row to 'z' must not make it jump to the end.
    fireEvent.mouseDown(container.querySelector('[data-row="0"][data-col="0"]')!);
    fireEvent.keyDown(editor(), { key: 'F2' });
    fireEvent.change(editor(), { target: { value: 'z' } });
    fireEvent.keyDown(editor(), { key: 'Enter' });
    expect(colValues(container, 0)).toEqual(['z', 'b', 'c']);
    // Re-sorting picks up the new value.
    fireEvent.mouseDown(header('Name'));
    fireEvent.mouseDown(header('Name'));
    fireEvent.mouseDown(header('Name'));
    expect(colValues(container, 0)).toEqual(['b', 'c', 'z']);
  });

  it('keeps the appendBlankRow row at the bottom while sorted', () => {
    function Controlled() {
      const [data, setData] = useState<string[][]>([['b'], ['a']]);
      return (
        <MasumeGrid
          data={data}
          columns={[{ title: 'Name' }]}
          onChange={setData}
          sortable
          appendBlankRow
        />
      );
    }
    const { container } = render(<Controlled />);
    fireEvent.mouseDown(header('Name'));
    expect(colValues(container, 0)).toEqual(['a', 'b', '']);
    fireEvent.mouseDown(container.querySelector('[data-row="2"][data-col="0"]')!);
    fireEvent.change(editor(), { target: { value: 'zz' } });
    fireEvent.keyDown(editor(), { key: 'Enter' });
    // The committed row joins the end; a fresh blank row follows it.
    expect(colValues(container, 0)).toEqual(['a', 'b', 'zz', '']);
  });

  // ----- header templates -------------------------------------------------

  it('renders a column header with headerTemplate', () => {
    const headerTemplate = vi.fn(({ col, title }: { col: number; title: string }) => (
      <span>
        {title}/{col}
      </span>
    ));
    const { container } = render(
      <MasumeGrid
        data={[['a', 'b']]}
        columns={[{ title: 'Name', headerTemplate }, {}]}
        showRowNumbers={false}
      />,
    );
    expect(container.querySelector('[data-hcol="0"]')!.textContent).toBe('Name/0');
    // Untitled columns fall back to their spreadsheet letter.
    expect(container.querySelector('[data-hcol="1"]')!.textContent).toBe('B');
    expect(
      container.querySelector('[data-hcol="0"] .masume-grid-hcell-label')!.className,
    ).toContain('masume-grid-hcell-label--template');
  });

  it('keeps sorting and filtering usable on a templated header', () => {
    const { container } = render(
      <MasumeGrid
        data={[['b'], ['a']]}
        columns={[{ title: 'Name', headerTemplate: ({ title }) => <em>{title}</em> }]}
        sortable
        filterable
      />,
    );
    const hcell = container.querySelector('[data-hcol="0"]') as HTMLElement;
    expect(hcell.querySelector('.masume-grid-sort-arrow')).toBeTruthy();
    expect(hcell.querySelector('[data-filter-btn]')).toBeTruthy();
    // A click on the caption still sorts.
    fireEvent.mouseDown(hcell.querySelector('em')!);
    expect(colValues(container, 0)).toEqual(['a', 'b']);
  });

  it('lets interactive header content click natively without sorting', () => {
    const onClick = vi.fn();
    const onSelectionChange = vi.fn();
    const { container } = render(
      <MasumeGrid
        data={[['b'], ['a']]}
        columns={[
          {
            title: 'Name',
            headerTemplate: () => (
              <button type="button" onClick={onClick}>
                pick
              </button>
            ),
          },
        ]}
        sortable
        onSelectionChange={onSelectionChange}
      />,
    );
    onSelectionChange.mockClear();
    const button = screen.getByText('pick');
    fireEvent.mouseDown(button);
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(colValues(container, 0)).toEqual(['b', 'a']); // not sorted
    expect(onSelectionChange).not.toHaveBeenCalled(); // column not selected
  });

  // ----- filtering --------------------------------------------------------

  const filterButton = (title: string) =>
    header(title).querySelector('[data-filter-btn]') as HTMLElement;
  const openFilter = (title: string) => fireEvent.mouseDown(filterButton(title));
  const panel = () => screen.getByRole('dialog');
  /** Panel checkboxes: [0] is "(All)", the rest follow the listed values. */
  const panelBoxes = () =>
    Array.from(panel().querySelectorAll('input[type="checkbox"]')) as HTMLInputElement[];
  const choiceLabels = () =>
    Array.from(panel().querySelectorAll('.masume-grid-filter-list .masume-grid-filter-item-label'))
      .map((el) => el.textContent);

  const FRUIT = [['apple'], ['carrot'], ['apple'], ['banana']];

  it('lists the distinct values of a column and filters by the checklist', () => {
    const onFilterChange = vi.fn();
    const { container } = render(
      <MasumeGrid
        data={FRUIT}
        columns={[{ title: 'Item' }]}
        filterable
        onFilterChange={onFilterChange}
      />,
    );
    openFilter('Item');
    expect(choiceLabels()).toEqual(['apple', 'banana', 'carrot']); // sorted, deduped

    fireEvent.click(panelBoxes()[1]); // uncheck 'apple'
    expect(colValues(container, 0)).toEqual(['carrot', 'banana']);
    expect(onFilterChange).toHaveBeenLastCalledWith({
      0: { type: 'values', values: ['banana', 'carrot'] },
    });

    fireEvent.click(panelBoxes()[1]); // check it again -> filter dropped
    expect(colValues(container, 0)).toEqual(['apple', 'carrot', 'apple', 'banana']);
    expect(onFilterChange).toHaveBeenLastCalledWith({});
  });

  it('toggles every listed value with (All), respecting the search box', () => {
    const { container } = render(
      <MasumeGrid data={FRUIT} columns={[{ title: 'Item' }]} filterable />,
    );
    openFilter('Item');
    fireEvent.click(panelBoxes()[0]); // (All) off: nothing passes
    expect(colValues(container, 0)).toEqual([]);

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'an' } });
    expect(choiceLabels()).toEqual(['banana']);
    fireEvent.click(panelBoxes()[0]); // (All) on, but only over the search hits
    expect(colValues(container, 0)).toEqual(['banana']);
  });

  it('renumbers rows sequentially and keeps hidden rows in the data', () => {
    const onChange = vi.fn();
    const { container } = render(
      <MasumeGrid data={FRUIT} columns={[{ title: 'Item' }]} filterable onChange={onChange} />,
    );
    openFilter('Item');
    fireEvent.click(panelBoxes()[1]); // hide 'apple'
    expect(rowCountOf(container)).toBe(2);
    expect(container.querySelector('[data-rownum="1"]')!.textContent).toBe('2');

    // Editing display row 0 ('carrot') writes to data row 1, hidden rows intact.
    fireEvent.mouseDown(container.querySelector('[data-row="0"][data-col="0"]')!);
    fireEvent.keyDown(editor(), { key: 'F2' });
    fireEvent.change(editor(), { target: { value: 'cabbage' } });
    fireEvent.keyDown(editor(), { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith([['apple'], ['cabbage'], ['apple'], ['banana']]);
  });

  it('maps display rows back to data rows for selection and copy', () => {
    const onSelectionChange = vi.fn();
    const setData = vi.fn();
    const { container } = render(
      <MasumeGrid
        data={FRUIT}
        columns={[{ title: 'Item' }]}
        filterable
        onSelectionChange={onSelectionChange}
      />,
    );
    openFilter('Item');
    fireEvent.click(panelBoxes()[1]); // hide 'apple' -> data rows [1, 3]
    fireEvent.mouseDown(container.querySelector('[data-row="0"][data-col="0"]')!);
    expect(onSelectionChange).toHaveBeenLastCalledWith(
      [{ top: 0, bottom: 0, left: 0, right: 0 }],
      [1, 3],
    );
    fireEvent.keyDown(editor(), { key: 'a', ctrlKey: true });
    fireEvent.copy(editor(), { clipboardData: { setData } });
    expect(setData).toHaveBeenCalledWith('text/plain', 'carrot\nbanana');
  });

  it('combines filtering with sorting', () => {
    const { container } = render(
      <MasumeGrid
        data={[['b', 'x'], ['c', 'y'], ['a', 'x']]}
        columns={[{ title: 'Name' }, { title: 'Tag' }]}
        filterable
        sortable
      />,
    );
    openFilter('Tag');
    fireEvent.click(panelBoxes()[2]); // hide 'y'
    expect(colValues(container, 0)).toEqual(['b', 'a']);
    fireEvent.mouseDown(header('Name'));
    expect(colValues(container, 0)).toEqual(['a', 'b']);
  });

  it('keeps a row visible after an edit stops it matching', () => {
    function Controlled() {
      const [data, setData] = useState<string[][]>(FRUIT);
      return (
        <MasumeGrid data={data} columns={[{ title: 'Item' }]} filterable onChange={setData} />
      );
    }
    const { container } = render(<Controlled />);
    openFilter('Item');
    fireEvent.click(panelBoxes()[2]); // hide 'banana'
    expect(colValues(container, 0)).toEqual(['apple', 'carrot', 'apple']);

    fireEvent.mouseDown(container.querySelector('[data-row="1"][data-col="0"]')!);
    fireEvent.keyDown(editor(), { key: 'F2' });
    fireEvent.change(editor(), { target: { value: 'banana' } });
    fireEvent.keyDown(editor(), { key: 'Enter' });
    // The row no longer matches but must not vanish under the caret.
    expect(colValues(container, 0)).toEqual(['apple', 'banana', 'apple']);
  });

  it('keeps the appendBlankRow row at the bottom while filtered', () => {
    function Controlled() {
      const [data, setData] = useState<string[][]>(FRUIT);
      return (
        <MasumeGrid
          data={data}
          columns={[{ title: 'Item' }]}
          filterable
          appendBlankRow
          onChange={setData}
        />
      );
    }
    const { container } = render(<Controlled />);
    openFilter('Item');
    fireEvent.click(panelBoxes()[1]); // hide 'apple'
    expect(colValues(container, 0)).toEqual(['carrot', 'banana', '']);

    fireEvent.mouseDown(container.querySelector('[data-row="2"][data-col="0"]')!);
    fireEvent.change(editor(), { target: { value: 'melon' } });
    fireEvent.keyDown(editor(), { key: 'Enter' });
    // The appended row joins the end of the view, followed by a fresh blank row.
    expect(colValues(container, 0)).toEqual(['carrot', 'banana', 'melon', '']);
  });

  it('filters on typed text when the column uses text mode', () => {
    const { container } = render(
      <MasumeGrid data={FRUIT} columns={[{ title: 'Item', filter: 'text' }]} filterable />,
    );
    openFilter('Item');
    expect(panel().querySelector('.masume-grid-filter-list')).toBeNull();
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'AN' } });
    expect(colValues(container, 0)).toEqual(['banana']); // case-insensitive
  });

  it('matches select labels, formatted text and custom filterLabel', () => {
    const { container } = render(
      <MasumeGrid
        data={[
          ['C01', '1000', 'true'],
          ['C02', '2000', ''],
        ]}
        columns={[
          {
            title: 'Cat',
            type: 'select',
            options: [{ value: 'C01', label: 'Fruit' }, { value: 'C02', label: 'Veg' }],
          },
          { title: 'Price', type: 'number', format: formatThousands },
          { title: 'Done', type: 'checkbox', filterLabel: (v) => (v ? 'yes' : 'no') },
        ]}
        filterable
      />,
    );
    openFilter('Cat');
    expect(choiceLabels()).toEqual(['Fruit', 'Veg']);
    openFilter('Price');
    expect(choiceLabels()).toEqual(['1,000', '2,000']);
    openFilter('Done');
    expect(choiceLabels()).toEqual(['no', 'yes']);
    fireEvent.click(panelBoxes()[1]); // keep the checked rows out
    expect(colValues(container, 0)).toEqual(['Fruit▾']);
  });

  it('filters checkbox columns by checked state out of the box', () => {
    const { container } = render(
      <MasumeGrid
        data={[
          ['a', 'true'],
          ['b', ''],
          ['c', 'TRUE'],
        ]}
        columns={[{ title: 'Name' }, { title: 'Done', type: 'checkbox' }]}
        filterable
      />,
    );
    openFilter('Done');
    expect(choiceLabels()).toEqual(['(Unchecked)', '(Checked)']);
    fireEvent.click(panelBoxes()[1]); // uncheck "(Unchecked)"
    // Every spelling of "checked" belongs to the same entry.
    expect(colValues(container, 0)).toEqual(['a', 'c']);
  });

  it('uses ColumnDef.filterMatch when provided', () => {
    const { container } = render(
      <MasumeGrid
        data={[['aa'], ['b'], ['cccc']]}
        columns={[
          {
            title: 'Name',
            filter: 'text',
            filterMatch: (value, filter) =>
              filter.type === 'text' && value.length >= Number(filter.query),
          },
        ]}
        filterable
      />,
    );
    openFilter('Name');
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: '2' } });
    expect(colValues(container, 0)).toEqual(['aa', 'cccc']);
  });

  it('labels empty values and applies defaultFilters on mount', () => {
    const { container } = render(
      <MasumeGrid
        data={[['a'], [''], ['b']]}
        columns={[{ title: 'Name' }]}
        filterable
        defaultFilters={{ 0: { type: 'values', values: ['a', ''] } }}
      />,
    );
    expect(colValues(container, 0)).toEqual(['a', '']);
    openFilter('Name');
    expect(choiceLabels()).toEqual(['a', 'b', '(Blanks)']); // blanks sort last
    expect(panelBoxes().map((b) => b.checked)).toEqual([false, true, false, true]);
  });

  it('shows no filter button on template columns or when filter is false', () => {
    render(
      <MasumeGrid
        data={[['a', 'b', 'c']]}
        columns={[
          { title: 'Name' },
          { title: 'Locked', filter: false },
          { title: 'Act', type: 'template', template: () => <span>x</span> },
        ]}
        filterable
      />,
    );
    expect(filterButton('Name')).toBeTruthy();
    expect(filterButton('Locked')).toBeNull();
    expect(filterButton('Act')).toBeNull();
  });

  it('clears the column filter from the panel and closes on Escape', () => {
    const { container } = render(
      <MasumeGrid
        data={FRUIT}
        columns={[{ title: 'Item' }]}
        filterable
        filterTexts={{ clear: 'クリア' }}
      />,
    );
    openFilter('Item');
    fireEvent.click(panelBoxes()[1]);
    expect(colValues(container, 0)).toEqual(['carrot', 'banana']);
    // The funnel icon fills in while the column narrows the view.
    expect(filterButton('Item').className).toContain('masume-grid-filter-btn--on');
    expect(filterButton('Item').querySelector('path')!.getAttribute('fill')).toBe('currentColor');

    fireEvent.click(screen.getByText('クリア'));
    expect(colValues(container, 0)).toEqual(['apple', 'carrot', 'apple', 'banana']);
    expect(filterButton('Item').className).not.toContain('masume-grid-filter-btn--on');
    expect(filterButton('Item').querySelector('path')!.getAttribute('fill')).toBe('none');

    fireEvent.keyDown(panel(), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('does not sort or select the column when the filter button is clicked', () => {
    const onSelectionChange = vi.fn();
    const { container } = render(
      <MasumeGrid
        data={[['b'], ['a']]}
        columns={[{ title: 'Name' }]}
        filterable
        sortable
        onSelectionChange={onSelectionChange}
      />,
    );
    onSelectionChange.mockClear();
    openFilter('Name');
    expect(colValues(container, 0)).toEqual(['b', 'a']); // unsorted
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('does not render column templates in the blank row', () => {
    const template = vi.fn(({ row }: { row: number }) => <span>tpl{row}</span>);
    const { container } = render(
      <MasumeGrid data={[['a']]} columns={[{ type: 'template', template }]} appendBlankRow />,
    );
    expect(screen.getByText('tpl0')).toBeTruthy();
    expect(template).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-row="1"][data-col="0"]')!.textContent).toBe('');
  });
});
