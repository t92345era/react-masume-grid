import { useState } from 'react';
import { MasumeGrid } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: 'セル型: 文字列・数値',
  description:
    'type を省略すると文字列型です。number 型は右寄せになり、入力は正規化されます —'
    + '全角数字「１２３」は 123 に、カンマ入りの「1,234」は 1234 になり、数値にならない入力は受け付けません。'
    + '内部データは常に文字列なので、数値も "1234" として保持されます。',
  order: 2,
  docs: 'セル型',
};

export default function CellTextNumber() {
  const [data, setData] = useState<string[][]>([
    ['ノート', '120'],
    ['ボールペン', '110'],
    ['', ''],
  ]);

  return (
    <>
      <p className="ex-hint">
        「単価」の列に全角で「１２３４」やカンマ付きで「1,234」と入力すると、確定時に 1234 になります。
      </p>
      <MasumeGrid
        data={data}
        onChange={setData}
        columns={[
          { title: '品名', width: 180 },
          { title: '単価', width: 110, type: 'number' },
        ]}
        showRowNumbers
        style={{ height: 200 }}
      />
      <p className="ex-note">data: {JSON.stringify(data)}</p>
    </>
  );
}
