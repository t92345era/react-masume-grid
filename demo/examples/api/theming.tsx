import { useState } from 'react';
import { MasumeGrid } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: 'スタイルのカスタマイズ',
  description:
    'className を付けて CSS 変数を上書きすればテーマを変えられます。アクセントカラー'
    + '（--masume-grid-accent）は選択枠だけでなく、コピー範囲の点線・ソート矢印・絞り込み中のじょうごにも使われます。'
    + 'セレクタは .masume-grid.my-theme のように書いてください — .my-theme だけだと'
    + 'ライブラリ側の .masume-grid と詳細度が並び、CSS の読み込み順で勝ち負けが変わってしまいます。',
  order: 14,
  docs: 'スタイルのカスタマイズ',
};

const THEMES = [
  { id: '', label: '既定' },
  { id: 'ex-theme-green', label: 'グリーン' },
  { id: 'ex-theme-dark', label: 'ダーク' },
];

/*
.masume-grid.ex-theme-green {
  --masume-grid-accent: #0f9d58;
  --masume-grid-sel-bg: rgba(15, 157, 88, 0.12);
  --masume-grid-header-bg: #f0f4f1;
  --masume-grid-header-sel-bg: #d9ece1;
}
*/

export default function Theming() {
  const [data, setData] = useState<string[][]>([
    ['ノート', '120'],
    ['ボールペン', '110'],
    ['クリアファイル', '80'],
  ]);
  const [theme, setTheme] = useState('ex-theme-green');

  return (
    <>
      <div className="ex-toolbar">
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            className={'ex-btn' + (t.id === theme ? ' ex-btn--on' : '')}
            onClick={() => setTheme(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <MasumeGrid
        data={data}
        onChange={setData}
        columns={[
          { title: '品名', width: 180 },
          { title: '単価', width: 100, type: 'number' },
        ]}
        className={theme}
        sortable
        showRowNumbers
        style={{ height: 200 }}
      />
    </>
  );
}
