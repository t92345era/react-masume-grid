import { beforeAll, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MeasureGrid } from '../src';

beforeAll(() => {
  // jsdom lacks ResizeObserver
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

const editor = () => screen.getByLabelText('cell editor') as HTMLTextAreaElement;

describe('MeasureGrid', () => {
  it('renders alphabetical headers, row numbers and cell values', () => {
    render(<MeasureGrid data={[['foo', 'bar']]} />);
    expect(screen.getByText('A')).toBeTruthy();
    expect(screen.getByText('B')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy(); // row number
    expect(screen.getByText('foo')).toBeTruthy();
    expect(screen.getByText('bar')).toBeTruthy();
  });

  it('hides row numbers when showRowNumbers is false', () => {
    render(<MeasureGrid data={[['xyz']]} showRowNumbers={false} />);
    expect(screen.queryByText('1')).toBeNull();
  });

  it('uses column titles when provided', () => {
    render(<MeasureGrid data={[['v']]} columns={[{ title: '商品名' }]} />);
    expect(screen.getByText('商品名')).toBeTruthy();
  });

  it('starts editing with the current value on double-click', () => {
    render(<MeasureGrid data={[['foo', 'bar']]} />);
    const cell = screen.getByText('foo');
    fireEvent.mouseDown(cell);
    fireEvent.doubleClick(cell);
    expect(editor().value).toBe('foo');
    expect(editor().className).not.toContain('measure-grid-editor--hidden');
  });

  it('starts editing on F2 and commits on Enter via onChange', () => {
    const onChange = vi.fn();
    render(<MeasureGrid data={[['foo', 'bar']]} onChange={onChange} />);
    const cell = screen.getByText('foo');
    fireEvent.mouseDown(cell);
    fireEvent.keyDown(editor(), { key: 'F2' });
    fireEvent.change(editor(), { target: { value: 'baz' } });
    fireEvent.keyDown(editor(), { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith([['baz', 'bar']]);
  });

  it('cancels editing on Escape', () => {
    const onChange = vi.fn();
    render(<MeasureGrid data={[['foo']]} onChange={onChange} />);
    const cell = screen.getByText('foo');
    fireEvent.mouseDown(cell);
    fireEvent.doubleClick(cell);
    fireEvent.change(editor(), { target: { value: 'nope' } });
    fireEvent.keyDown(editor(), { key: 'Escape' });
    expect(onChange).not.toHaveBeenCalled();
    expect(editor().className).toContain('measure-grid-editor--hidden');
  });

  it('clears selected cells with Delete', () => {
    const onChange = vi.fn();
    render(<MeasureGrid data={[['foo', 'bar']]} onChange={onChange} />);
    fireEvent.mouseDown(screen.getByText('foo'));
    fireEvent.keyDown(editor(), { key: 'Delete' });
    expect(onChange).toHaveBeenCalledWith([['', 'bar']]);
  });

  it('does not edit when readOnly', () => {
    render(<MeasureGrid data={[['foo']]} readOnly />);
    const cell = screen.getByText('foo');
    fireEvent.mouseDown(cell);
    fireEvent.doubleClick(cell);
    expect(editor().className).toContain('measure-grid-editor--hidden');
  });

  it('resizes a column by dragging its header handle', () => {
    const onColumnResize = vi.fn();
    const { container } = render(
      <MeasureGrid data={[['a', 'b']]} onColumnResize={onColumnResize} />,
    );
    const handle = container.querySelector('[data-hcol="0"] .measure-grid-resize-handle')!;
    fireEvent.mouseDown(handle, { button: 0, clientX: 100 });
    fireEvent.mouseMove(window, { clientX: 140 });
    const hcell = container.querySelector('[data-hcol="0"]') as HTMLElement;
    expect(hcell.style.width).toBe('160px'); // default 120 + 40
    fireEvent.mouseUp(window, { clientX: 140 });
    expect(onColumnResize).toHaveBeenCalledWith(0, 160);
  });

  it('clamps column resizing to the minimum width', () => {
    const { container } = render(<MeasureGrid data={[['a']]} />);
    const handle = container.querySelector('.measure-grid-resize-handle')!;
    fireEvent.mouseDown(handle, { button: 0, clientX: 100 });
    fireEvent.mouseMove(window, { clientX: -500 });
    fireEvent.mouseUp(window, { clientX: -500 });
    const hcell = container.querySelector('[data-hcol="0"]') as HTMLElement;
    expect(hcell.style.width).toBe('24px');
  });

  it('renders no resize handles when resizableColumns is false', () => {
    const { container } = render(
      <MeasureGrid data={[['a', 'b']]} resizableColumns={false} />,
    );
    expect(container.querySelector('.measure-grid-resize-handle')).toBeNull();
  });

  it('honors per-column resizable overrides', () => {
    const { container } = render(
      <MeasureGrid
        data={[['a', 'b']]}
        resizableColumns={false}
        columns={[{ title: 'X' }, { title: 'Y', resizable: true }]}
      />,
    );
    expect(container.querySelector('[data-hcol="0"] .measure-grid-resize-handle')).toBeNull();
    expect(container.querySelector('[data-hcol="1"] .measure-grid-resize-handle')).not.toBeNull();
  });

  it('normalizes number-cell input on commit and rejects invalid values', () => {
    const onChange = vi.fn();
    render(
      <MeasureGrid data={[['100']]} columns={[{ title: 'N', type: 'number' }]} onChange={onChange} />,
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
      <MeasureGrid
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
      <MeasureGrid
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
      <MeasureGrid data={[['2026-07-06']]} columns={[{ title: 'D', type: 'date' }]} onChange={onChange} />,
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
      <MeasureGrid data={[['2026-01-01']]} columns={[{ title: 'D', type: 'date' }]} onChange={onChange} />,
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
      <MeasureGrid data={[['2026-01-01']]} columns={[{ title: 'D', type: 'date' }]} onChange={onChange} />,
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
      <MeasureGrid
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
    render(<MeasureGrid data={[['2026-01-01']]} columns={[{ title: 'D', type: 'date' }]} />);
    const cell = screen.getByText('2026-01-01');
    fireEvent.mouseDown(cell);
    fireEvent.doubleClick(cell);
    const dateInput = screen.getByLabelText('date editor');
    fireEvent.mouseDown(dateInput); // e.g. the calendar icon; bubbles to the grid
    expect(screen.queryByLabelText('date editor')).not.toBeNull(); // still editing
  });

  it('keeps editing when clicking the dropdown container (e.g. its scrollbar)', () => {
    render(
      <MeasureGrid data={[['x']]} columns={[{ title: 'S', type: 'select', options: ['x', 'y'] }]} />,
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
      <MeasureGrid
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

  it('pastes tab-separated text starting at the active cell', () => {
    const onChange = vi.fn();
    render(
      <MeasureGrid
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
});
