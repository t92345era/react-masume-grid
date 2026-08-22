import { useState } from 'react';
import { MasumeGrid } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: 'Excel とのコピー＆ペースト',
  description:
    'Ctrl(⌘) + C / X / V が Excel・Google スプレッドシートと相互運用できる TSV 形式で動きます。'
    + 'コピーした範囲は Excel と同じ動く点線枠で示され、1セルだけコピーして広い範囲に貼ると全体に敷き詰められます。'
    + 'appendBlankRow が有効なら、最終行を超える貼り付けでも切り捨てずに行が増えます（下の表は3行ですが、'
    + 'Excel から10行貼り付ければ10行になります）。',
  order: 3,
  docs: '使い方',
};

export default function Clipboard() {
  const [data, setData] = useState<string[][]>([
    ['A-001', '複合機トナー', '3', '12000'],
    ['A-002', 'コピー用紙 A4', '20', '450'],
    ['A-003', 'ボールペン 黒', '50', '110'],
  ]);

  return (
    <>
      <p className="ex-hint">
        Excel の表をコピーしてこのグリッドに貼り付けてみてください。逆に、範囲を選んで Ctrl(⌘) + C
        でコピーすると、そのまま Excel に貼り付けられます。
      </p>
      <MasumeGrid
        data={data}
        onChange={setData}
        columns={[
          { title: '品番', width: 100 },
          { title: '品名', width: 200 },
          { title: '数量', width: 80, type: 'number' },
          { title: '単価', width: 100, type: 'number' },
        ]}
        appendBlankRow
        showRowNumbers
        style={{ height: 260 }}
      />
      <p className="ex-note">現在 {data.length} 行</p>
    </>
  );
}
