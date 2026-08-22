import { useState } from 'react';
import { MasumeGrid, isCheckboxChecked } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: 'セル型: チェックボックス',
  description:
    'クリックまたは Space でトグルします（複数セルを選んで Space を押すと、選択範囲のチェックが一括で切り替わります）。'
    + '保存値はオンが "true"、オフが空文字です。Excel から貼り付けた TRUE/FALSE、1/0、yes/no も正規化されます。'
    + '値の判定には、エクスポートしている isCheckboxChecked が使えます。',
  order: 5,
  docs: 'セル型',
};

export default function CellCheckbox() {
  const [data, setData] = useState<string[][]>([
    ['山田 太郎', 'true'],
    ['鈴木 花子', ''],
    ['佐藤 次郎', 'true'],
  ]);

  const done = data.filter((row) => isCheckboxChecked(row[1] ?? '')).length;

  return (
    <>
      <MasumeGrid
        data={data}
        onChange={setData}
        columns={[
          { title: '氏名', width: 160 },
          { title: '出席', width: 90, type: 'checkbox' },
        ]}
        showRowNumbers
        style={{ height: 200 }}
      />
      <p className="ex-note">
        出席 {done} / {data.length} 名 — data: {JSON.stringify(data)}
      </p>
    </>
  );
}
