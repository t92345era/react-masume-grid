import { useState } from 'react';
import { MasumeGrid } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: '末尾の空行（appendBlankRow）',
  description:
    'Excel や Access の「新規行」のように、末尾に空行を1行だけ表示します。data 自体は増えないので、'
    + 'そこに値を確定した時点で onChange に1行長い配列が渡り、あらためて下に空行が現れます。'
    + '最終行を超える貼り付けも切り捨てず、必要なだけ行が増えます（増えた行は必ず data の末尾に付きます）。',
  order: 10,
  docs: '末尾の空行',
};

export default function AppendBlankRow() {
  const [data, setData] = useState<string[][]>([['ノート', '120']]);
  const [log, setLog] = useState<string[]>([]);

  return (
    <>
      <MasumeGrid
        data={data}
        onChange={setData}
        onCellChange={(row, col, value) =>
          setLog((prev) =>
            [
              `onCellChange(${row}, ${col}, ${JSON.stringify(value)})`
                + (row === data.length ? '  ← 空行に入力 = 行が増える' : ''),
              ...prev,
            ].slice(0, 6),
          )
        }
        columns={[
          { title: '品名', width: 180 },
          { title: '単価', width: 100, type: 'number' },
        ]}
        appendBlankRow
        showRowNumbers
        style={{ height: 220 }}
      />
      <p className="ex-note">data は {data.length} 行（表示されている空行は含みません）</p>
      <ol className="ex-log">
        {log.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ol>
    </>
  );
}
