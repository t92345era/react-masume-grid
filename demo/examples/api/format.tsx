import { useState } from 'react';
import { MasumeGrid, formatThousands } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: '表示フォーマット（format）',
  description:
    'format は表示だけを整える関数です。保存値・編集中の値・コピーの内容はいずれも生の値のままなので、'
    + '桁区切りを付けても Excel に貼れば数値として渡ります。空のセルには呼ばれません。'
    + '桁区切りには formatThousands をエクスポートしています。select / checkbox / template 型では無視されます。',
  order: 12,
  docs: '表示フォーマット',
};

export default function Format() {
  const [data, setData] = useState<string[][]>([
    ['ノート', '1200', '0.185'],
    ['ファイルボックス', '12500', '0.06'],
  ]);

  return (
    <>
      <MasumeGrid
        data={data}
        onChange={setData}
        columns={[
          { title: '品名', width: 180 },
          // 1200 → 1,200（保存値は 1200 のまま）
          { title: '単価', width: 110, type: 'number', format: formatThousands },
          // 0.185 → 18.5%
          {
            title: '利益率',
            width: 110,
            type: 'number',
            format: (v) => `${(Number(v) * 100).toFixed(1)}%`,
          },
        ]}
        showRowNumbers
        style={{ height: 200 }}
      />
      <p className="ex-note">
        セルをダブルクリックすると、編集中は生の値（1200 / 0.185）が出ます。data: {JSON.stringify(data)}
      </p>
    </>
  );
}
