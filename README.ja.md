# MeasureGrid

[English README is here](README.md)

軽量・汎用の React スプレッドシートコンポーネント。依存は React のみ（gzip 約 5KB）。

- **グリッド表示** — 行番号・ヘッダーの表示/非表示切り替え、列幅指定、ドラッグでの列幅リサイズ、行の仮想化描画（数万行でも軽快）
- **セル型** — 文字列 / 数値（全角・カンマ正規化）/ 選択肢（マスタデータのプルダウン、コード保存・ラベル表示）/ 日付（カレンダー入力、和式表記の貼り付け正規化）
- **セル編集** — ダブルクリック / F2 / キー入力で編集開始。**日本語 IME 完全対応**（IMEオンで「A」を打つとセルが編集状態になり「あ」が入力される）
- **範囲選択** — マウスドラッグ、Shift+クリック/矢印キーで拡張、Ctrl(⌘)+クリックで複数範囲追加。行・列ヘッダークリックで行/列選択、左上コーナーで全選択
- **コピー＆ペースト** — Ctrl(⌘)+C / X / V。Excel・Google スプレッドシートと相互運用できる TSV 形式（改行・タブ・引用符を含むセルにも対応、単一セルのタイル貼り付けも可）

## インストール

```sh
npm install react-measure-grid
```

## 使い方

```tsx
import { useState } from 'react';
import { MeasureGrid } from 'react-measure-grid';
// ライブラリを直接 import した場合、CSS は自動で読み込まれます。
// バンドラー設定によっては明示的に: import 'react-measure-grid/styles.css';

function App() {
  const [data, setData] = useState<string[][]>([
    ['りんご', '100', '果物'],
    ['にんじん', '80', '野菜'],
  ]);

  return (
    <MeasureGrid
      data={data}
      onChange={setData}
      columns={[
        { title: '品名', width: 160 },
        { title: '単価', width: 80 },
        { title: 'カテゴリ', width: 120, readOnly: true },
      ]}
      showRowNumbers
      style={{ height: 400 }}
    />
  );
}
```

`columns` を省略すると列数は `data` から導出され、ヘッダーは A, B, C… 表記になります。

## Props

| Prop | 型 | 既定値 | 説明 |
| --- | --- | --- | --- |
| `data` | `string[][]` | （必須） | グリッドの内容。行の長さは不揃いでも可 |
| `columns` | `ColumnDef[]` | — | `{ title?, width?, readOnly?, resizable?, type?, options?, strict? }` の配列。省略時は data から列数を導出 |
| `onChange` | `(next: string[][]) => void` | — | 編集・貼り付け・削除のたびに新しい 2 次元配列で呼ばれる |
| `onCellChange` | `(row, col, value) => void` | — | 変更セルごとに呼ばれる。`onChange` の代わり/併用可 |
| `onSelectionChange` | `(ranges: NormalizedRange[]) => void` | — | 選択変更時（`{top,left,bottom,right}` の配列） |
| `onColumnResize` | `(col, width) => void` | — | 列幅ドラッグの確定時（最終幅 px） |
| `showRowNumbers` | `boolean` | `true` | 行番号列の表示 |
| `showHeader` | `boolean` | `true` | ヘッダー行の表示 |
| `readOnly` | `boolean` | `false` | 編集禁止（選択・コピーは可能） |
| `resizableColumns` | `boolean` | `true` | ヘッダー境界のドラッグで列幅を変更可能に。列単位は `ColumnDef.resizable` で上書き（要 `showHeader`） |
| `rowHeight` | `number` | `28` | 行の高さ(px) |
| `headerHeight` | `number` | `28` | ヘッダーの高さ(px) |
| `defaultColumnWidth` | `number` | `120` | 幅未指定の列の幅(px) |
| `rowNumberWidth` | `number` | `48` | 行番号列の幅(px) |
| `className` / `style` | — | — | ルート要素に適用。高さは `style` や CSS で指定（既定 420px） |

データは**制御コンポーネント**方式です。`onChange` を実装しない限りグリッドは変化しません。

列幅のみ例外的に非制御で、ドラッグした幅はコンポーネント内部に保持されます（`ColumnDef.width` より優先）。幅を永続化したい場合は `onColumnResize` で保存してください。

## セル型

`ColumnDef.type` で列ごとのセル型を指定できます。**データはすべて文字列のまま**で、型は編集UI・入力の正規化・表示を制御します（クリップボード互換性のため）。

```tsx
const columns: ColumnDef[] = [
  { title: '商品名' },                                        // text（既定）
  { title: '単価', type: 'number' },
  { title: 'カテゴリ', type: 'select', options: [
    { value: 'C01', label: '果物' },                          // コードを保存、ラベルを表示
    { value: 'C02', label: '青果' },
  ]},
  { title: '状態', type: 'select', options: ['在庫あり', '取り寄せ'] }, // 文字列だけでも可
  { title: '入荷日', type: 'date' },
];
```

| 型 | 編集UI | 動作 |
| --- | --- | --- |
| `text` | テキスト（IME対応） | 既定。自由入力 |
| `number` | テキスト（IME対応） | 右寄せ表示。確定時に全角数字→半角、カンマ除去を正規化。数値でない入力は**拒否**（元の値を保持） |
| `select` | 絞り込み付きプルダウン | ↑↓で候補移動、Enter/クリックで確定、文字入力で絞り込み。Alt+↓でも開く。`options` は `string` または `{value, label}`（value を保存し label を表示）。既定では options 外の値を拒否（`strict: false` で自由入力許可） |
| `date` | ネイティブの日付ピッカー | `YYYY-MM-DD` で保存。貼り付け時は `2026/7/6`・`2026年7月6日`・`20260706`・全角も正規化。無効な日付は拒否。Alt+↓でカレンダーを開く |

正規化・検証は**編集確定と貼り付けの両方**に適用されます。無効な値のセルは変更されずスキップされます。正規化関数は `normalizeNumberInput` / `normalizeDateInput` としてエクスポートしているので、アプリ側のバリデーションにも再利用できます。

## キーボード操作

| キー | 動作 |
| --- | --- |
| 矢印 / Tab / Enter | セル移動（Shift で逆方向・範囲拡張） |
| PageUp / PageDown | ページ単位移動 |
| Home / End | 行頭 / 行末（Ctrl+Home/End で先頭 / 末尾セル） |
| 任意の文字キー | その文字で編集開始（IME 対応） |
| F2 / ダブルクリック | 既存値を保持したまま編集開始 |
| Enter / Tab | 編集確定して移動、Esc で取り消し、Alt+Enter でセル内改行 |
| Delete / Backspace | 選択セルをクリア |
| Ctrl(⌘)+A | 全選択 |
| Ctrl(⌘)+C / X / V | コピー / 切り取り / 貼り付け |

## スタイルのカスタマイズ

CSS 変数を上書きするだけでテーマを変更できます。

```css
.my-grid {
  --measure-grid-accent: #0f9d58;
  --measure-grid-sel-bg: rgba(15, 157, 88, 0.12);
  --measure-grid-header-bg: #f0f4f1;
}
```

利用可能な変数は [src/measure-grid.css](src/measure-grid.css) 冒頭を参照してください。

## IME（日本語入力）対応の仕組み

グリッドは常にフォーカスされた不可視の `<textarea>` をアクティブセル上に重ねています（Google スプレッドシート等と同じ方式）。`compositionstart` を検知して編集モードへ移行するため、IME の変換候補ウィンドウはセルの位置に表示され、確定の Enter がセル移動として誤処理されることもありません（Safari のイベント順序の差異にも対応済み）。

## 開発

```sh
npm install
npm run dev        # デモアプリ (http://localhost:5173)
npm test           # ユニットテスト (vitest)
npm run typecheck  # 型チェック
npm run build      # dist/ へライブラリビルド (ESM + CJS + d.ts + CSS)
```

## 制限事項（現バージョン）

- 内部データは常に文字列（数値・日付も文字列で保持。表示用の書式付け（桁区切り等）は今後の課題）
- 列は仮想化していないため、数百列を超える場合は性能に注意
- アンドゥ / リドゥは未実装（`onChange` ベースなので利用側で履歴管理が可能）
- セル結合、数式、列幅ダブルクリックでの自動フィットは未対応

## License

MIT
