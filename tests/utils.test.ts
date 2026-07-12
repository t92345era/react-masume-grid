import { describe, expect, it } from 'vitest';
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
  toHalfWidth,
} from '../src/utils';

describe('colName', () => {
  it('produces spreadsheet-style column names', () => {
    expect(colName(0)).toBe('A');
    expect(colName(25)).toBe('Z');
    expect(colName(26)).toBe('AA');
    expect(colName(27)).toBe('AB');
    expect(colName(51)).toBe('AZ');
    expect(colName(52)).toBe('BA');
    expect(colName(701)).toBe('ZZ');
    expect(colName(702)).toBe('AAA');
  });
});

describe('clamp / columnOffsets', () => {
  it('clamps into range', () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
    expect(clamp(2, 0, 3)).toBe(2);
  });

  it('builds prefix sums', () => {
    expect(columnOffsets([10, 20, 30])).toEqual([0, 10, 30, 60]);
    expect(columnOffsets([])).toEqual([0]);
  });
});

describe('normalizeRange', () => {
  it('orders and clamps coordinates', () => {
    expect(
      normalizeRange(
        { anchor: { row: 5, col: 4 }, focus: { row: 1, col: 9 } },
        10,
        6,
      ),
    ).toEqual({ top: 1, bottom: 5, left: 4, right: 5 });
  });
});

describe('parseClipboardText', () => {
  it('parses plain TSV', () => {
    expect(parseClipboardText('a\tb\nc\td')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it('strips a single trailing newline (Excel copy style)', () => {
    expect(parseClipboardText('a\tb\r\n')).toEqual([['a', 'b']]);
    expect(parseClipboardText('a\n')).toEqual([['a']]);
  });

  it('handles CRLF row separators', () => {
    expect(parseClipboardText('a\r\nb')).toEqual([['a'], ['b']]);
  });

  it('handles quoted cells with newlines, tabs and doubled quotes', () => {
    expect(parseClipboardText('"a\nb"\tc')).toEqual([['a\nb', 'c']]);
    expect(parseClipboardText('"x\ty"')).toEqual([['x\ty']]);
    expect(parseClipboardText('"a""b"')).toEqual([['a"b']]);
  });

  it('keeps empty cells', () => {
    expect(parseClipboardText('a\t\tb\n\t')).toEqual([
      ['a', '', 'b'],
      ['', ''],
    ]);
  });
});

describe('toHalfWidth', () => {
  it('converts full-width characters', () => {
    expect(toHalfWidth('１２３４５')).toBe('12345');
    expect(toHalfWidth('－１．５')).toBe('-1.5');
    expect(toHalfWidth('２０２６／７／６')).toBe('2026/7/6');
    expect(toHalfWidth('ＡＢｃ')).toBe('ABc');
  });
});

describe('normalizeNumberInput', () => {
  it('accepts and normalizes numeric input', () => {
    expect(normalizeNumberInput('1234')).toBe('1234');
    expect(normalizeNumberInput('1,234,567')).toBe('1234567');
    expect(normalizeNumberInput('１２３')).toBe('123');
    expect(normalizeNumberInput(' -1.5e3 ')).toBe('-1.5e3');
    expect(normalizeNumberInput('.5')).toBe('.5');
    expect(normalizeNumberInput('')).toBe('');
  });

  it('rejects non-numeric input', () => {
    expect(normalizeNumberInput('abc')).toBeNull();
    expect(normalizeNumberInput('1.2.3')).toBeNull();
    expect(normalizeNumberInput('12円')).toBeNull();
  });
});

describe('normalizeDateInput', () => {
  it('normalizes common formats to ISO', () => {
    expect(normalizeDateInput('2026-07-06')).toBe('2026-07-06');
    expect(normalizeDateInput('2026/7/6')).toBe('2026-07-06');
    expect(normalizeDateInput('2026.7.6')).toBe('2026-07-06');
    expect(normalizeDateInput('2026年7月6日')).toBe('2026-07-06');
    expect(normalizeDateInput('20260706')).toBe('2026-07-06');
    expect(normalizeDateInput('２０２６／７／６')).toBe('2026-07-06');
    expect(normalizeDateInput('')).toBe('');
  });

  it('rejects invalid dates', () => {
    expect(normalizeDateInput('2026-02-30')).toBeNull();
    expect(normalizeDateInput('2026-13-01')).toBeNull();
    expect(normalizeDateInput('hello')).toBeNull();
    expect(normalizeDateInput('7/6')).toBeNull();
  });
});

describe('normalizeCheckboxInput / isCheckboxChecked', () => {
  it('normalizes truthy spellings to "true"', () => {
    expect(normalizeCheckboxInput('true')).toBe('true');
    expect(normalizeCheckboxInput('TRUE')).toBe('true');
    expect(normalizeCheckboxInput('1')).toBe('true');
    expect(normalizeCheckboxInput('yes')).toBe('true');
    expect(normalizeCheckboxInput('on')).toBe('true');
    expect(normalizeCheckboxInput('✓')).toBe('true');
    expect(normalizeCheckboxInput('ＴＲＵＥ')).toBe('true');
  });

  it('normalizes falsy spellings to ""', () => {
    expect(normalizeCheckboxInput('')).toBe('');
    expect(normalizeCheckboxInput('false')).toBe('');
    expect(normalizeCheckboxInput('FALSE')).toBe('');
    expect(normalizeCheckboxInput('0')).toBe('');
    expect(normalizeCheckboxInput('no')).toBe('');
    expect(normalizeCheckboxInput('off')).toBe('');
  });

  it('rejects anything else', () => {
    expect(normalizeCheckboxInput('maybe')).toBeNull();
    expect(normalizeCheckboxInput('2')).toBeNull();
  });

  it('isCheckboxChecked treats only truthy spellings as checked', () => {
    expect(isCheckboxChecked('true')).toBe(true);
    expect(isCheckboxChecked('1')).toBe(true);
    expect(isCheckboxChecked('')).toBe(false);
    expect(isCheckboxChecked('garbage')).toBe(false);
  });
});

describe('matrixToTSV', () => {
  it('serializes plain values', () => {
    expect(matrixToTSV([['a', 'b'], ['c', 'd']])).toBe('a\tb\nc\td');
  });

  it('quotes cells containing tabs, newlines or quotes', () => {
    expect(matrixToTSV([['a"b', 'c\nd']])).toBe('"a""b"\t"c\nd"');
  });

  it('round-trips through parseClipboardText', () => {
    const matrix = [
      ['plain', 'with\ttab', 'with\nnewline'],
      ['with"quote', '', '日本語'],
    ];
    expect(parseClipboardText(matrixToTSV(matrix))).toEqual(matrix);
  });
});
