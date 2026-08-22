import { useState } from 'react';
import { MasumeGrid } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: 'セル単位の上書き（getCellProps）',
  description:
    '(row, col, value) を受け取り、そのセルの readOnly / className / style を返します。'
    + 'readOnly は編集・貼り付け・削除のすべてに効き、グリッド全体や列の readOnly に上乗せされます。'
    + 'className は追加され、style は併合されます（グリッドが管理する width / height は上書きできません）。'
    + '表示中のセルごとに毎回呼ばれるので、重い計算は入れないでください。'
    + 'なお className で背景色などを変えるときは .masume-grid-cell.my-class のように書いてください —'
    + 'クラス1つだけではライブラリ側のセル指定と詳細度が並び、CSS の読み込み順で負けることがあります'
    + '（style で渡せばこの問題は起きません）。',
  order: 11,
  docs: 'セル単位の上書き',
};

export default function GetCellProps() {
  const [data, setData] = useState<string[][]>([
    ['ノート', '120', ''],
    ['ボールペン', '0', 'true'],
    ['クリアファイル', '80', ''],
  ]);

  return (
    <>
      <MasumeGrid
        data={data}
        onChange={setData}
        columns={[
          { title: '品名', width: 180 },
          { title: '単価', width: 100, type: 'number' },
          { title: '締め', width: 80, type: 'checkbox' },
        ]}
        getCellProps={(row, col, value) => {
          // 締め済みの行は「締め」列以外を編集ロック
          if (data[row]?.[2] === 'true' && col !== 2)
            return { readOnly: true, className: 'ex-locked' };
          // 単価が 0 のセルを警告表示
          if (col === 1 && value !== '' && Number(value) === 0)
            return { className: 'ex-invalid' };
        }}
        showRowNumbers
        style={{ height: 220 }}
      />
      <p className="ex-note">
        2行目の「締め」にチェックを入れると、その行の他のセルがロックされます。
      </p>
    </>
  );
}
