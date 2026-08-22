import { useState } from 'react';
import { MasumeGrid, formatThousands } from '../../../src';
import type { ExampleMeta } from '../../registry';

const ITEMS = [
  { value: 'P01', label: '複合機トナー' },
  { value: 'P02', label: 'コピー用紙 A4' },
  { value: 'P03', label: 'ボールペン 黒' },
  { value: 'P04', label: 'クリアファイル' },
];

export const meta: ExampleMeta = {
  title: '明細入力',
  description:
    '受発注や経費精算のような「行を足しながら入力する」画面です。appendBlankRow で末尾に入力用の空行を'
    + '1行出し、そこに値を確定すると行が増えます。金額はテンプレート型の列で数量×単価から描画しているので、'
    + 'data には持たせていません。合計はグリッドの外で data から計算しています。',
  order: 10,
  docs: '末尾の空行',
};

export default function LineItems() {
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
          { title: '品名', width: 200, type: 'select', options: ITEMS },
          { title: '数量', width: 90, type: 'number' },
          { title: '単価', width: 110, type: 'number', format: formatThousands },
          {
            title: '金額',
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
      <p className="ex-total">
        合計 <strong>¥{total.toLocaleString()}</strong>（{data.length} 明細）
      </p>
    </>
  );
}
