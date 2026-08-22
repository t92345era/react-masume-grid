import { useState } from 'react';
import { MasumeGrid } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: '列定義（columns）',
  description:
    'columns は列ごとの { title, width, readOnly, resizable, ... } の配列です。省略すると列数が data の'
    + '最長行から決まり、ヘッダーは A, B, C… になります。下のボタンで切り替えられます。'
    + '列幅はヘッダーの境界をドラッグして変更でき、ドラッグで決めた幅はコンポーネント内部に保持されます'
    + '（保存したい場合は onColumnResize で受け取ります）。',
  order: 1,
  docs: 'Props',
};

export default function Columns() {
  const [data, setData] = useState<string[][]>([
    ['りんご', '100', '果物'],
    ['にんじん', '80', '野菜'],
  ]);
  const [useColumns, setUseColumns] = useState(true);

  return (
    <>
      <div className="ex-toolbar">
        <button
          type="button"
          className={'ex-btn' + (useColumns ? ' ex-btn--on' : '')}
          onClick={() => setUseColumns((v) => !v)}
        >
          {useColumns ? 'columns あり' : 'columns なし（A, B, C…）'}
        </button>
      </div>
      <MasumeGrid
        data={data}
        onChange={setData}
        columns={
          useColumns
            ? [
                { title: '商品名', width: 160 },
                { title: '単価', width: 90, type: 'number' },
                // この列だけ編集も幅変更も不可
                { title: '分類', width: 120, readOnly: true, resizable: false },
              ]
            : undefined
        }
        style={{ height: 200 }}
      />
    </>
  );
}
