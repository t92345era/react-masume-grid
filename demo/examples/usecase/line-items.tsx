import { useState } from 'react';
import { MasumeGrid, formatThousands } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: { ja: '明細入力', en: 'Line-item entry' },
  description: {
    ja:
      '受発注や経費精算のような「行を足しながら入力する」画面です。appendBlankRow で末尾に入力用の空行を'
      + '1行出し、そこに値を確定すると行が増えます。金額はテンプレート型の列で数量×単価から描画しているので、'
      + 'data には持たせていません。合計はグリッドの外で data から計算しています。',
    en:
      'The "keep adding rows as you type" screen behind orders and expense claims. appendBlankRow shows '
      + 'one empty row at the bottom; committing a value there adds a real row. The amount column is a '
      + 'template that renders qty × price, so it never lives in data. The total is computed from data '
      + 'outside the grid.',
  },
  order: 10,
  docs: { ja: '末尾の空行', en: 'Trailing blank row' },
};

// Demo-site language switch — not needed when you use the library
const TEXT = {
  ja: {
    columns: ['品名', '数量', '単価', '金額'],
    items: [
      { value: 'P01', label: '複合機トナー' },
      { value: 'P02', label: 'コピー用紙 A4' },
      { value: 'P03', label: 'ボールペン 黒' },
      { value: 'P04', label: 'クリアファイル' },
    ],
    total: (yen: string, n: number) => `合計 ¥${yen}（${n} 明細）`,
  },
  en: {
    columns: ['Item', 'Qty', 'Unit price', 'Amount'],
    items: [
      { value: 'P01', label: 'Toner cartridge' },
      { value: 'P02', label: 'Copy paper A4' },
      { value: 'P03', label: 'Ballpoint pen' },
      { value: 'P04', label: 'Clear folder' },
    ],
    total: (yen: string, n: number) => `Total ¥${yen} (${n} lines)`,
  },
};

export default function LineItems() {
  const t = TEXT[document.documentElement.lang === 'en' ? 'en' : 'ja'];
  const [data, setData] = useState<string[][]>([
    ['P01', '2', '12000'],
    ['P02', '10', '450'],
  ]);

  const total = data.reduce((sum, row) => sum + Number(row[1] || 0) * Number(row[2] || 0), 0);

  return (
    <>
      <MasumeGrid
        data={data}
        onChange={setData}
        columns={[
          { title: t.columns[0], width: 200, type: 'select', options: t.items },
          { title: t.columns[1], width: 90, type: 'number' },
          { title: t.columns[2], width: 120, type: 'number', format: formatThousands },
          {
            title: t.columns[3],
            width: 120,
            type: 'template',
            readOnly: true,
            template: ({ row }) => (
              <span className="ex-amount">
                ¥{(Number(data[row]?.[1] || 0) * Number(data[row]?.[2] || 0)).toLocaleString()}
              </span>
            ),
          },
        ]}
        appendBlankRow
        showRowNumbers
        style={{ height: 280 }}
      />
      <p className="ex-total">{t.total(total.toLocaleString(), data.length)}</p>
    </>
  );
}
