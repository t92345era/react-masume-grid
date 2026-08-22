import { useState } from 'react';
import { MasumeGrid } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: { ja: '入力バリデーション', en: 'Input validation' },
  description: {
    ja:
      'getCellProps はセル単位で readOnly / className / style を差し込めるので、'
      + '検証エラーのハイライトに使えます。ここでは必須・数値範囲・日付の未来チェックを行い、'
      + 'エラーのセルを赤く塗っています。確定済みの行は行ごと編集をロックしています。'
      + 'getCellProps は表示中のセルごとに毎回呼ばれるので、中身は「計算」ではなく「参照」に留めるのが原則です。'
      + 'エラー用のクラスは .masume-grid-cell.ex-invalid と書いています（クラス1つでは詳細度が並び、'
      + '読み込み順によっては背景色が効きません）。',
    en:
      'getCellProps injects readOnly / className / style per cell, which makes it the place for '
      + 'validation highlighting. This sample checks required values, a numeric range and future dates, '
      + 'painting the offending cells red, and locks every cell of a confirmed row. getCellProps runs '
      + 'for each visible cell on every render, so keep it a lookup rather than a computation. Note the '
      + 'selector: .masume-grid-cell.ex-invalid, because a single class ties with the library\'s own '
      + 'rule and the background would depend on stylesheet order.',
  },
  order: 30,
  docs: { ja: 'セル単位の上書き', en: 'Per-cell overrides' },
};

// Demo-site language switch — not needed when you use the library
const TEXT = {
  ja: {
    columns: ['品名', '数量', '納品日', '確定'],
    required: '品名は必須です',
    qtyRequired: '数量は必須です',
    qtyRange: '数量は 1〜999 の整数です',
    future: '納品日に未来の日付は指定できません',
    ok: 'エラーはありません',
    at: (row: number, message: string) => `${row} 行目: ${message}`,
    items: ['複合機トナー', '', 'ボールペン 黒'],
  },
  en: {
    columns: ['Item', 'Qty', 'Delivery date', 'Confirmed'],
    required: 'Item is required',
    qtyRequired: 'Qty is required',
    qtyRange: 'Qty must be an integer from 1 to 999',
    future: 'Delivery date cannot be in the future',
    ok: 'No errors',
    at: (row: number, message: string) => `Row ${row}: ${message}`,
    items: ['Toner cartridge', '', 'Ballpoint pen'],
  },
};

const TODAY = new Date().toISOString().slice(0, 10);

export default function Validation() {
  const t = TEXT[document.documentElement.lang === 'en' ? 'en' : 'ja'];

  /** Empty counts as no error; returns a message when the value is invalid. */
  const validate = (col: number, value: string): string | null => {
    if (col === 0) return value.trim() === '' ? t.required : null;
    if (col === 1) {
      if (value === '') return t.qtyRequired;
      const n = Number(value);
      if (!Number.isInteger(n) || n < 1 || n > 999) return t.qtyRange;
    }
    if (col === 2 && value !== '' && value > TODAY) return t.future;
    return null;
  };

  const [data, setData] = useState<string[][]>([
    [t.items[0], '3', '2026-01-20', ''],
    ['', '0', '2099-12-31', ''],
    [t.items[2], '50', '2026-02-01', 'true'],
  ]);

  const errors = data.flatMap((row, r) =>
    row.map((v, c) => ({ r, c, message: validate(c, v) })).filter((e) => e.message),
  );

  return (
    <>
      <MasumeGrid
        data={data}
        onChange={setData}
        columns={[
          { title: t.columns[0], width: 180 },
          { title: t.columns[1], width: 90, type: 'number' },
          { title: t.columns[2], width: 140, type: 'date' },
          { title: t.columns[3], width: 110, type: 'checkbox' },
        ]}
        getCellProps={(row, col, value) => {
          // A confirmed row is not editable
          if (data[row]?.[3] === 'true' && col !== 3) return { readOnly: true, className: 'ex-locked' };
          if (validate(col, value)) return { className: 'ex-invalid' };
        }}
        showRowNumbers
        style={{ height: 240 }}
      />
      <ul className="ex-errors">
        {errors.length === 0 ? (
          <li className="ex-errors-ok">{t.ok}</li>
        ) : (
          errors.map((e) => <li key={`${e.r}:${e.c}`}>{t.at(e.r + 1, e.message as string)}</li>)
        )}
      </ul>
    </>
  );
}
