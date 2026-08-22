# MasumeGrid

[![npm version](https://img.shields.io/npm/v/react-masume-grid.svg)](https://www.npmjs.com/package/react-masume-grid)
[![gzip size](https://deno.bundlejs.com/badge?q=react-masume-grid)](https://bundlejs.com/?q=react-masume-grid)
[![types](https://img.shields.io/npm/types/react-masume-grid.svg)](https://www.npmjs.com/package/react-masume-grid)
[![license](https://img.shields.io/npm/l/react-masume-grid.svg)](https://github.com/t92345era/react-masume-grid/blob/main/LICENSE)

[English README is here](https://github.com/t92345era/react-masume-grid/blob/main/README.md)

軽量・汎用の React スプレッドシートコンポーネント。依存は React のみ（gzip で JS 約 12.5KB + CSS 約 1.8KB）。

- **グリッド表示** — 行番号・ヘッダーの表示/非表示切り替え、列幅指定、ドラッグでの列幅リサイズ、ヘッダクリックによるソート、Excel 風のヘッダフィルタ、末尾の入力用空行、行の仮想化描画（数万行でも軽快）
- **セル型** — 文字列 / 数値（全角・カンマ正規化）/ 選択肢（マスタデータのプルダウン、コード保存・ラベル表示）/ 日付（カレンダー入力、和式表記の貼り付け正規化）/ チェックボックス（クリック / Space でトグル）/ テンプレート（任意のコンポーネントをセルに描画）。ヘッダーも `headerTemplate` でテンプレート化できます
- **セル編集** — ダブルクリック / F2 / キー入力で編集開始。**日本語 IME 完全対応**（IMEオンで「A」を打つとセルが編集状態になり「あ」が入力される）
- **範囲選択** — マウスドラッグ、Shift+クリック/矢印キーで拡張、Ctrl(⌘)+クリックで複数範囲追加。行・列ヘッダークリックで行/列選択、左上コーナーで全選択
- **コピー＆ペースト** — Ctrl(⌘)+C / X / V。Excel・Google スプレッドシートと相互運用できる TSV 形式（改行・タブ・引用符を含むセルにも対応、単一セルのタイル貼り付けも可。`appendBlankRow` 有効時は最終行を超えるペーストで行が増えます）
- **アクセシビリティ** — ARIA グリッドセマンティクス（`grid` / `row` / `gridcell` ロール、行仮想化でも維持される 1 始まりの行・列インデックス、選択・読み取り専用状態）でスクリーンリーダーに対応

## デモ

https://t92345era.github.io/react-masume-grid/

## インストール

```sh
npm install react-masume-grid
```

## 使い方

```tsx
import { useState } from 'react';
import { MasumeGrid } from 'react-masume-grid';
import 'react-masume-grid/styles.css'; // 必須。CSS はパッケージに別ファイルで入っています

function App() {
  const [data, setData] = useState<string[][]>([
    ['りんご', '100', '果物'],
    ['にんじん', '80', '野菜'],
  ]);

  return (
    <MasumeGrid
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
| `columns` | `ColumnDef[]` | — | `{ title?, width?, readOnly?, resizable?, sortable?, compare?, filter?, filterLabel?, filterMatch?, type?, options?, strict?, searchable?, template?, headerTemplate?, format? }` の配列。省略時は data から列数を導出 |
| `onChange` | `(next: string[][]) => void` | — | 編集・貼り付け・削除のたびに新しい 2 次元配列で呼ばれる |
| `onCellChange` | `(row, col, value) => void` | — | 変更セルごとに呼ばれる。`onChange` の代わり/併用可 |
| `onSelectionChange` | `(ranges, viewToData) => void` | — | 選択変更時（`{top,left,bottom,right}` の配列）。行は**表示行**で、ソート・フィルタ中は `viewToData` でデータ行に変換できる（どちらでもない場合は `null`） |
| `onColumnResize` | `(col, width) => void` | — | 列幅ドラッグの確定時（最終幅 px） |
| `onSortChange` | `(sort: SortState \| null) => void` | — | ヘッダクリックによるソート変更時（`null` は解除） |
| `onFilterChange` | `(filters: FilterState) => void` | — | フィルタ変更時。全列分の状態が渡される（`{}` は絞り込みなし） |
| `getCellProps` | `(row, col, value) => CellProps` | — | セル単位の上書き: `{ readOnly?, className?, style? }`。[セル単位の上書き](#セル単位の上書き)を参照 |
| `appendBlankRow` | `boolean` | `false` | 末尾に新規入力用の空行を1行表示し、最終行を超えるペーストで行を増やす。[末尾の空行](#末尾の空行)を参照 |
| `showRowNumbers` | `boolean` | `true` | 行番号列の表示 |
| `showHeader` | `boolean` | `true` | ヘッダー行の表示 |
| `readOnly` | `boolean` | `false` | 編集禁止（選択・コピーは可能） |
| `resizableColumns` | `boolean` | `true` | ヘッダー境界のドラッグで列幅を変更可能に。列単位は `ColumnDef.resizable` で上書き（要 `showHeader`） |
| `sortable` | `boolean` | `false` | ヘッダクリックでソート。[ソート](#ソート)を参照 |
| `defaultSort` | `SortState \| null` | `null` | 初期ソート状態。例: `{ col: 2, direction: 'asc' }` |
| `filterable` | `boolean` | `false` | ヘッダから列ごとに絞り込み。[フィルタ](#フィルタ)を参照 |
| `defaultFilters` | `FilterState \| null` | `null` | 初期フィルタ。例: `{ 2: { type: 'values', values: ['C01'] } }` |
| `filterTexts` | `Partial<FilterTexts>` | 英語 | フィルタパネルの文言 |
| `rowHeight` | `number` | `28` | 行の高さ(px) |
| `headerHeight` | `number` | `28` | ヘッダーの高さ(px) |
| `defaultColumnWidth` | `number` | `120` | 幅未指定の列の幅(px) |
| `rowNumberWidth` | `number` | `48` | 行番号列の幅(px) |
| `className` / `style` | — | — | ルート要素に適用。高さは `style` や CSS で指定（既定 420px） |

データは**制御コンポーネント**方式です。`onChange` を実装しない限りグリッドは変化しません。

列幅のみ例外的に非制御で、ドラッグした幅はコンポーネント内部に保持されます（`ColumnDef.width` より優先）。幅を永続化したい場合は `onColumnResize` で保存してください。

### セル単位の上書き

`getCellProps(row, col, value)` で個々のセルを上書きできます。編集ロックや、バリデーションエラーのハイライトなどに使えます:

```tsx
<MasumeGrid
  data={data}
  onChange={setData}
  getCellProps={(row, col, value) => {
    if (errors.has(`${row}:${col}`)) return { className: 'cell-error' };
    if (data[row]?.[0] === 'LOCKED') return { readOnly: true, style: { color: '#999' } };
  }}
/>
```

- `readOnly` は編集・貼り付け・Delete のすべてに適用されます（グリッド全体・列単位の `readOnly` に追加する形）。
- `className` はセル要素に追記され、`style` はマージされます（グリッドが管理する `width` / `height` は上書きできません）。
- `.cell-error` のようにクラス1つで書くと、ライブラリ側の `.masume-grid-cell` と詳細度が並び、後から読み込まれた CSS が勝ちます。グリッドが既に指定しているプロパティ（`background` / `color` など）は効かないことがあるため、`.masume-grid-cell.cell-error` のように書くか、確実に効く `style` を使ってください。
- 描画のたびに画面内の全セルで呼ばれるため、軽い処理（ルックアップ程度）にしてください。

### 末尾の空行

`appendBlankRow` を指定すると、Excel や Access の「新規入力行」と同じように、データの下に空行が1行表示されます。「行追加」ボタンなしで入力を続けられます:

```tsx
<MasumeGrid data={data} onChange={setData} appendBlankRow />
```

- 空行のために `data` が書き換えられることは**ありません**（描画上だけの行です）。その行で値を確定した時点で、1行増えた配列で `onChange` が呼ばれ、`onCellChange` は `row === data.length` で呼ばれます。state が更新されると、その下にまた新しい空行が現れます。
- 空行は常に1行だけです。埋まるまで増えず、Delete や空文字の確定では行は作られません。
- 空行で Enter / Tab を押すと、追加された行の次（新しい空行）にカーソルが移るため、連続入力できます。
- **最終行を超えるペーストは切り捨てずに行を増やします**。3行のグリッドに200行ぶんを貼り付ければ `onChange` には200行が渡り、その下にまた空行が現れます。増えた行は必ず `data` の**末尾**に追加されます（ソート中・フィルタ中も同様）。すべて空の行はセルが作られないため、末尾に空行が続くブロックを貼っても余計な行は増えません。
- **列**方向も、`columns` を指定していないとき（列数が最長行から決まるとき）は同様に増えます。`columns` を指定している場合は、はみ出したセルに対応する列定義（型・幅・ヘッダ）が存在しないため、従来どおり最終列で切り捨てます。
- `readOnly` のときは無視されます。全選択（Ctrl(⌘)+A）は空行を含めません（コピー結果に余計な空行が入らないようにするため）。空行だけを個別に選択・コピーすることは可能です。
- `template` 列は空行では描画されません（行アクションや派生表示が参照するデータ行がまだ存在しないため）。`getCellProps` は空行に対しても `row === data.length` / `value === ''` で呼ばれるので、列のロックやスタイルはそのまま効きます。
- 空行の行番号セルと行要素には `masume-grid-rownum--blank` / `masume-grid-row--blank` クラスが付くので、独自のスタイルを当てられます。

### ソート

`sortable` を指定すると、列ヘッダのクリックで**昇順 → 降順 → 解除**（3回目のクリックで元の順序に戻る）とソートできます。

```tsx
<MasumeGrid
  data={data}
  onChange={setData}
  columns={[
    { title: '商品名' },
    { title: '数量', type: 'number' },
    { title: 'メモ', sortable: false },                        // この列はソート対象外
    { title: 'コード', compare: (a, b) => a.length - b.length }, // 独自の並び順
  ]}
  sortable
  defaultSort={{ col: 1, direction: 'desc' }}
  onSortChange={(sort) => saveSort(sort)}
/>
```

- **`data` は並べ替わりません** — 変わるのは表示順だけです。`onChange` / `onCellChange` / `getCellProps` / `template` には常に**データ行**のインデックスが渡されるため、ソート中に編集しても正しいレコードに書き込まれます。例外は `onSelectionChange` で、範囲は表示行、第2引数の `viewToData` でデータ行に変換できます。
- ヘッダの通常クリックは**ソートと列選択を同時に**行います。Shift+クリック / Ctrl(⌘)+クリックは従来どおり選択のみ（複数範囲選択はそのまま使えます）。
- ソートは**クリック時点のスナップショット**です。セルを編集しても並べ替え直さないので、入力中の行が飛んでいきません（Excel / Sheets と同じ挙動）。並べ直したいときはヘッダを再クリックしてください。`appendBlankRow` で追加された行は末尾に加わり、入力用の空行は常に最下部に固定されます。
- 型ごとの既定の並び順: `number` は数値順、`date` は日付順、`checkbox` は未チェック → チェック、`select` は `options` の定義順、その他はロケール考慮の文字列比較（「項目2」が「項目10」より前）。**空セルは昇順・降順いずれでも常に末尾**です。
- `ColumnDef.compare(a, b)` を指定すると、その列の並び順（空セルの扱いを含む）を完全に置き換えます。降順では結果が反転されます。
- `ColumnDef.sortable` でグリッド全体の設定を列単位に上書きできます。`template` 列は保存値と表示内容が一致しないことが多いため、明示的に指定しない限りソート対象外です。
- ソート可能な列のヘッダには**右端に常にインジケータ**が表示されます。未ソート時は淡い `⇅`（クリックできることが一目で分かります）、ソート中はアクセントカラーの `▲` / `▼` です。ヘッダには `aria-sort` と `masume-grid-hcell--sortable` / `--sorted` が付き、グリフは `masume-grid-sort-arrow`（未ソート時は `--none` 付き）なのでスタイルを当てられます。
- ソート状態はコンポーネント内部に保持されます（ドラッグした列幅と同じ扱い）。永続化したい場合は `onSortChange` で保存し、`defaultSort` で復元してください。

### フィルタ

`filterable` を指定すると、各列のヘッダにじょうご（ファネル）ボタンが付きます。クリックすると Excel のオートフィルタと同様に、**列の値のチェックリスト＋検索ボックス**のパネルが開き、チェックを操作した時点で即座に絞り込まれます。

```tsx
<MasumeGrid
  data={data}
  onChange={setData}
  columns={[
    { title: '商品コード', filter: 'text' },                     // チェックリストではなくキーワード検索
    { title: 'カテゴリ', type: 'select', options: CATEGORY_MASTER }, // 一覧にはラベルが並ぶ
    { title: '単価', type: 'number', format: formatThousands },
    { title: '検品済', type: 'checkbox' },                       // 設定不要でオン / オフの2択
    { title: 'メモ', filter: false },                            // この列は絞り込み対象外
  ]}
  filterable
  filterTexts={{
    all: '(すべて)', blanks: '(空白)', search: '検索', clear: 'クリア', close: '閉じる',
    checked: '(チェックあり)', unchecked: '(チェックなし)',
  }}
  defaultFilters={{ 1: { type: 'values', values: ['C01', 'C02'] } }}
  onFilterChange={(filters) => saveFilters(filters)}
/>
```

- **`data` から行は削られません** — 絞り込まれるのは表示だけで、非表示の行も `onChange` で返る配列にはそのまま残ります。ソートと同様に `onChange` / `onCellChange` / `getCellProps` / `template` には**データ行**のインデックスが渡され、`onSelectionChange` の範囲だけが表示行（`viewToData` で変換できます）。
- 行番号は表示中の行に対して `1, 2, 3, …` と振り直されます（ソート時と同じ挙動で、飛び番にはなりません）。
- フィルタもソートと同じく**スナップショット**です。行の再判定はフィルタを変更したときだけ行われるので、絞り込み中に編集して条件から外れた行が入力中に消えることはありません。`appendBlankRow` で追加された行は末尾に加わり、空行は常に最下部に固定されます。
- `ColumnDef.filter` で列単位に上書きできます。`false` で対象外、`'text'` でチェックリストの代わりにキーワード検索（部分一致・大文字小文字と全角半角を区別しない）、`'values'` / `true` でチェックリストです。`template` 列は明示指定しない限り対象外です。
- チェックリストに並ぶのは**表示上のテキスト**です（select のラベル、`format` の結果、`ColumnDef.filterLabel(value)`）。同じ表示になる値はまとめて 1 項目として扱われ、空セルは `(空白)`（既定では `(Blanks)`）として並びます。`FilterState` が保持するのはラベルではなく**保存値**です。異なる値が 1,000 種類を超えると一覧は打ち切られ、検索での絞り込みを促すメッセージが表示されます。
- **`checkbox` 列は設定不要で「チェック状態」による絞り込み**になります。一覧には `(Checked)` / `(Unchecked)`（既定は英語。上の例のように `filterTexts` で変更可能）の2項目だけが並び、`isCheckboxChecked` が真と判定する表記はすべて同じ項目にまとまります。
- `ColumnDef.filterMatch(value, filter, row)` を指定すると、その列の判定を完全に置き換えられます（数値の範囲指定や、他の列と突き合わせる条件など）。
- `(すべて)` は**検索で絞り込まれている項目だけ**をまとめてオン / オフします。「検索してヒットしたものだけ残す」が2クリックで済みます。
- パネルは Escape / Enter / `閉じる` / 外側のクリックで閉じ、`クリア` でその列のフィルタを解除します。ヘッダのボタンには `aria-haspopup` / `aria-expanded`、パネルには `role="dialog"` が付き、絞り込み中はじょうごが白抜きから塗りに変わります（クラス `masume-grid-filter-btn--on`）。じょうごはライブラリ内で描いているインライン SVG で（アイコンフォントも外部アイコンセットも使っていません）、色は `currentColor` 由来なのでアクセントカラーの変数でテーマに追随します。
- フィルタ状態はコンポーネント内部に保持されます。永続化したい場合は `onFilterChange` で保存し、`defaultFilters` で復元してください。パネルの文言は既定が英語なので、`filterTexts`（`all` / `blanks` / `checked` / `unchecked` / `search` / `clear` / `close` / `more` / `button`）で差し替えます。

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
  { title: '検品済', type: 'checkbox' },
  { title: '操作', type: 'template', readOnly: true,
    template: ({ row, value }) => <button onClick={() => openDetail(row)}>詳細</button> },
];
```

| 型 | 編集UI | 動作 |
| --- | --- | --- |
| `text` | テキスト（IME対応） | 既定。自由入力 |
| `number` | テキスト（IME対応） | 右寄せ表示。確定時に全角数字→半角、カンマ除去を正規化。数値でない入力は**拒否**（元の値を保持） |
| `select` | 絞り込み付きプルダウン | ↑↓で候補移動、Enter/クリックで確定、文字入力で絞り込み。Alt+↓でも開く。`options` は `string` または `{value, label}`（value を保存し label を表示）。既定では options 外の値を拒否（`strict: false` で自由入力許可）。`searchable: false` で候補の絞り込みを無効化（常に全候補を表示し、文字入力は先頭一致の候補へハイライトを移動） |
| `date` | ネイティブの日付ピッカー | `YYYY-MM-DD` で保存。貼り付け時は `2026/7/6`・`2026年7月6日`・`20260706`・全角も正規化。無効な日付は拒否。Alt+↓でカレンダーを開く |
| `checkbox` | トグル（テキスト編集なし） | チェック時 `'true'`・未チェック時 `''` を保存。チェックボックスのクリックまたは Space でトグル（Space は選択中のチェックボックスセルすべてをトグル）。貼り付け時は `TRUE`/`FALSE`・`1`/`0`・`yes`/`no` などを正規化し、それ以外は**拒否** |
| `template` | なし（カスタム描画） | 列定義の `template` 関数がセル内容を描画。引数は `{ row, col, value }`（`row` は `data` 上のデータ行インデックス）。テンプレート内のボタンや入力欄などはネイティブにクリック・操作可能。コピーは元の値を出力し、貼り付け・Delete も元の値に作用（防ぎたい場合は `readOnly: true`） |

正規化・検証は**編集確定と貼り付けの両方**に適用されます。無効な値のセルは変更されずスキップされます。正規化関数は `normalizeNumberInput` / `normalizeDateInput` / `normalizeCheckboxInput`（および `isCheckboxChecked`）としてエクスポートしているので、アプリ側のバリデーションにも再利用できます。

### 表示フォーマット

`ColumnDef.format` は**表示だけ**をフォーマットします。保存データ・編集エディタ・コピー＆ペーストは常に元の文字列値を使うため、Excel とのクリップボード互換性は保たれます。対象は `text` / `number` / `date` 列で、空セルでは呼ばれません。桁区切り用の `formatThousands`（全角対応）を同梱しています:

```tsx
import { formatThousands, type ColumnDef } from 'react-masume-grid';

const columns: ColumnDef[] = [
  { title: '単価', type: 'number', format: formatThousands },     // 1234567 → 1,234,567
  { title: '入荷日', type: 'date', format: (v) => v.replaceAll('-', '/') }, // 2026-07-06 → 2026/07/06
];
```

### テンプレート型セル

`type: 'template'` を指定すると、セルの描画を任意のコンポーネントに委ねられます。列定義の `template` 関数は描画対象のセルごとに呼ばれ（行は仮想化されるため画面内のセルのみ）、引数として `TemplateCellContext` を受け取ります:

| フィールド | 意味 |
| --- | --- |
| `row` | `data` 配列上の行インデックス（データソース上のインデックス） |
| `col` | 列インデックス |
| `value` | セルに保存されている文字列値 |

```tsx
import type { ColumnDef } from 'react-masume-grid';

const [data, setData] = useState<string[][]>(initialData); // [商品名, 単価, 数量]

const columns = useMemo<ColumnDef[]>(
  () => [
    { title: '商品名' },
    { title: '単価', type: 'number' },
    { title: '数量', type: 'number' },

    // 派生表示: `row` を使って data から同じ行の他セルを参照。
    // `columns` は data に依存するため、data の変更時に再計算する。
    {
      title: '金額', width: 100, type: 'template', readOnly: true,
      template: ({ row }) => {
        const total = Number(data[row]?.[1] || 0) * Number(data[row]?.[2] || 0);
        return <span style={{ marginLeft: 'auto', padding: '0 6px' }}>¥{total.toLocaleString()}</span>;
      },
    },

    // 行アクション: テンプレート内のボタンはネイティブにクリックできる。
    {
      title: '操作', width: 90, type: 'template', readOnly: true,
      template: ({ row }) => (
        <button type="button" onClick={() => openDetail(row)}>詳細</button>
      ),
    },
  ],
  [data],
);
```

補足:

- テンプレート型セルに**テキストエディタはありません** — 文字キー・F2・ダブルクリックで編集は始まりません。キーボード移動・範囲選択・コピーは通常どおり動作します。
- テンプレートセルのクリックでセル選択は移動します。セル内のインタラクティブ要素（`button`・`a`・`input`・`select`・`textarea`・`label`・`[role="button"]`・`[contenteditable]`）は、グリッドにフォーカスを奪われずネイティブに操作できます。
- コピーされるのは描画結果ではなく**保存値**（`data[row][col]`）です。貼り付け・Delete も保存値に作用するため、上の例のような表示専用列には `readOnly: true` を指定してください。
- セルは `padding: 0` の flex コンテナ（`align-items: center`）として描画され、コンポーネントがセル全域を制御できます。高さが足りない場合は `rowHeight` を調整してください。

### ヘッダーのテンプレート化

`ColumnDef.headerTemplate` で列見出しを自由に描画できます。`template` と違い `type: 'template'` は不要で、**どのセル型の列でも**使えます。引数は `HeaderCellContext`（`{ col, title }`。`title` 未指定時は A, B, C… が入ります）です:

```tsx
const columns = useMemo<ColumnDef[]>(
  () => [
    // 単位を副題にした2段見出し（さらに増やす場合は headerHeight を上げる）
    {
      title: '単価', type: 'number',
      headerTemplate: ({ title }) => (
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {title}
          <small style={{ fontSize: 10, color: '#8a93a0' }}>税抜 / 円</small>
        </span>
      ),
    },

    // データから算出したバッジ（この場合 columns は data に依存させる）
    {
      title: '検品済', type: 'checkbox',
      headerTemplate: ({ title }) => <span>{title}（{data.filter((r) => r[2]).length}）</span>,
    },

    // ヘッダー内のコントロール: クリックしてもソートや列選択は起きない
    {
      title: '操作', type: 'template', readOnly: true,
      headerTemplate: () => <button type="button" onClick={resetAll}>一括解除</button>,
      template: ({ row }) => <button type="button" onClick={() => openDetail(row)}>詳細</button>,
    },
  ],
  [data],
);
```

補足:

- 差し替わるのは見出し部分だけです。**ソートインジケータ・フィルタボタン・列幅ハンドルはそのまま残る**ため、ヘッダクリックによるソート、フィルタ、幅のドラッグはすべて機能します（見出し部分のクリックでもソートされます）。
- 内部のインタラクティブ要素（テンプレート型セルと同じ一覧）はネイティブに操作でき、テンプレート型セルと違って**列のソートも列選択も行いません**（ヘッダー内のコントロール操作は列クリックとは別のジェスチャだからです）。
- `title` は併せて指定してください。見出しのフォールバックと、フィルタボタンのアクセシブルネームに使われます。
- 見出しの領域はヘッダーの高さでクリップされます（`masume-grid-hcell-label--template` が付き、1行省略のルールが外れます）。複数行の見出しにする場合は `headerHeight` を上げてください。

## キーボード操作

| キー | 動作 |
| --- | --- |
| 矢印 / Tab / Enter | セル移動（Shift で逆方向・範囲拡張） |
| PageUp / PageDown | ページ単位移動 |
| Home / End | 行頭 / 行末（Ctrl+Home/End で先頭 / 末尾セル） |
| 任意の文字キー | その文字で編集開始（IME 対応） |
| F2 / ダブルクリック | 既存値を保持したまま編集開始 |
| Enter / Tab | 編集確定して移動、Esc で取り消し、Alt+Enter でセル内改行 |
| Space | 選択中のチェックボックスセルをトグル |
| Delete / Backspace | 選択セルをクリア |
| Ctrl(⌘)+A | 全選択 |
| Ctrl(⌘)+C / X / V | コピー / 切り取り / 貼り付け |

## スタイルのカスタマイズ

CSS 変数を上書きするだけでテーマを変更できます。

```css
/* .masume-grid を併記しています。.my-grid だけではライブラリ側の指定と
   詳細度が並び、2つの CSS の読み込み順で勝ち負けが決まってしまいます。 */
.masume-grid.my-grid {
  --masume-grid-accent: #0f9d58;
  --masume-grid-sel-bg: rgba(15, 157, 88, 0.12);
  --masume-grid-header-bg: #f0f4f1;
}
```

利用可能な変数は [src/masume-grid.css](https://github.com/t92345era/react-masume-grid/blob/main/src/masume-grid.css) 冒頭を参照してください。

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

- 内部データは常に文字列（数値・日付も文字列で保持。桁区切り等の表示書式は `ColumnDef.format` で対応可能）
- 列は仮想化していないため、数百列を超える場合は性能に注意
- アンドゥ / リドゥは未実装（`onChange` ベースなので利用側で履歴管理が可能）
- セル結合、数式、列幅ダブルクリックでの自動フィットは未対応
- フィルタパネルはマウス操作のみ（グリッドのキーボード操作はセル単位のため、ボタンはタブ順から外しています）

## 更新履歴

[CHANGELOG.ja.md](https://github.com/t92345era/react-masume-grid/blob/main/CHANGELOG.ja.md) を参照してください。同じ内容をタグごとに [リリース](https://github.com/t92345era/react-masume-grid/releases) にも掲載しています。

## License

MIT
