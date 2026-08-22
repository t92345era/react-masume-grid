import { useState } from 'react';
import { MasumeGrid, formatThousands } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: { ja: '表示フォーマット（format）', en: 'Display formatting' },
  description: {
    ja:
      'format は表示だけを整える関数です。保存値・編集中の値・コピーの内容はいずれも生の値のままなので、'
      + '桁区切りを付けても Excel に貼れば数値として渡ります。空のセルには呼ばれません。'
      + '桁区切りには formatThousands をエクスポートしています。select / checkbox / template 型では無視されます。',
    en:
      'format only changes what is shown. The stored value, the editor and the clipboard all keep the '
      + 'raw value, so a thousands separator still pastes into Excel as a number. It is never called '
      + 'for empty cells. formatThousands is exported for the common case; format is ignored on '
      + 'select, checkbox and template columns.',
  },
  order: 12,
  docs: { ja: '表示フォーマット', en: 'Display formatting' },
};

// Demo-site language switch — not needed when you use the library
const TEXT = {
  ja: {
    columns: ['品名', '単価', '利益率'],
    rows: [['ノート', '1200', '0.185'], ['ファイルボックス', '12500', '0.06']],
    note: 'セルをダブルクリックすると、編集中は生の値（1200 / 0.185）が出ます。',
  },
  en: {
    columns: ['Item', 'Price', 'Margin'],
    rows: [['Notebook', '1200', '0.185'], ['File box', '12500', '0.06']],
    note: 'Double-click a cell: the editor shows the raw value (1200 / 0.185).',
  },
};

export default function Format() {
  const t = TEXT[document.documentElement.lang === 'en' ? 'en' : 'ja'];
  const [data, setData] = useState<string[][]>(t.rows);

  return (
    <>
      <MasumeGrid
        data={data}
        onChange={setData}
        columns={[
          { title: t.columns[0], width: 180 },
          // 1200 → 1,200 (the stored value stays 1200)
          { title: t.columns[1], width: 110, type: 'number', format: formatThousands },
          // 0.185 → 18.5%
          {
            title: t.columns[2],
            width: 110,
            type: 'number',
            format: (v) => `${(Number(v) * 100).toFixed(1)}%`,
          },
        ]}
        showRowNumbers
        style={{ height: 200 }}
      />
      <p className="ex-note">
        {t.note} data: {JSON.stringify(data)}
      </p>
    </>
  );
}
