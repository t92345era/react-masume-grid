import { useState } from 'react';
import { MasumeGrid } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: '入力バリデーション',
  description:
    'getCellProps はセル単位で readOnly / className / style を差し込めるので、'
    + '検証エラーのハイライトに使えます。ここでは必須・数値範囲・日付の未来チェックを行い、'
    + 'エラーのセルを赤く塗っています。確定済みの行は行ごと編集をロックしています。'
    + 'getCellProps は表示中のセルごとに毎回呼ばれるので、中身は「計算」ではなく「参照」に留めるのが原則です。'
    + 'エラー用のクラスは .masume-grid-cell.ex-invalid と書いています（クラス1つでは詳細度が並び、'
    + '読み込み順によっては背景色が効きません）。',
  order: 30,
  docs: 'セル単位の上書き',
};

const TODAY = new Date().toISOString().slice(0, 10);

/** 空文字ならエラーなし扱い。エラーがあればメッセージを返す */
function validate(col: number, value: string): string | null {
  if (col === 0) return value.trim() === '' ? '品名は必須です' : null;
  if (col === 1) {
    if (value === '') return '数量は必須です';
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1 || n > 999) return '数量は 1〜999 の整数です';
  }
  if (col === 2 && value !== '' && value > TODAY) return '納品日に未来の日付は指定できません';
  return null;
}

export default function Validation() {
  const [data, setData] = useState<string[][]>([
    ['複合機トナー', '3', '2026-01-20', ''],
    ['', '0', '2099-12-31', ''],
    ['ボールペン 黒', '50', '2026-02-01', 'true'],
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
          { title: '品名', width: 180 },
          { title: '数量', width: 90, type: 'number' },
          { title: '納品日', width: 130, type: 'date' },
          { title: '確定', width: 80, type: 'checkbox' },
        ]}
        getCellProps={(row, col, value) => {
          // 確定済みの行は編集させない
          if (data[row]?.[3] === 'true' && col !== 3) return { readOnly: true, className: 'ex-locked' };
          if (validate(col, value)) return { className: 'ex-invalid' };
        }}
        showRowNumbers
        style={{ height: 240 }}
      />
      <ul className="ex-errors">
        {errors.length === 0 ? (
          <li className="ex-errors-ok">エラーはありません</li>
        ) : (
          errors.map((e) => (
            <li key={`${e.r}:${e.c}`}>
              {e.r + 1} 行目: {e.message}
            </li>
          ))
        )}
      </ul>
    </>
  );
}
