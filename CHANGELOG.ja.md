# 更新履歴

[react-masume-grid](https://www.npmjs.com/package/react-masume-grid) のリリース履歴です。各項目のリンクは対応する [README](https://github.com/t92345era/react-masume-grid/blob/main/README.ja.md) の節を指しています。

[English version here](https://github.com/t92345era/react-masume-grid/blob/main/CHANGELOG.md)

## 0.8.2 — 2026-08-22

- ドキュメントのみの変更で、ライブラリの挙動は変わりません。使い方のコード例が `react-masume-grid/styles.css` を明示的に import する形になりました（配布物の JS は自前の CSS を参照していないため、「CSS は自動で読み込まれます」という記述は一部のバンドラーどころか常に誤りでした）。`getCellProps` とテーマの例も修正しています — `.cell-error` のようにクラス1つで書くと、ライブラリ側の `.masume-grid-cell` / `.masume-grid` と詳細度が並び、CSS の読み込み順によってはルールが効きません

## 0.8.1 — 2026-08-21

- ドキュメントとパッケージメタデータのみの変更で、ライブラリの挙動は変わりません。README にバッジを追加し、サイズ表記を実測値（gzip で JS 約 12.5KB + CSS 約 1.8KB。従来の「約 5KB」は 0.1.0 当時のものでした）に修正、npm ページで切れないリンクに変更、npm の description と keywords を整理しました

## 0.8.0 — 2026-08-05

- **最終行を超えるペーストで行が増える**ようになりました（`appendBlankRow` 有効時）。従来は末尾の空行で切り捨てていましたが、3行のグリッドに200行ぶんを貼り付ければ `onChange` に200行が渡り、その下にまた空行が現れます。増えた行は必ず `data` の**末尾**に追加されます（ソート中・フィルタ中も同様）。列方向も、`columns` を指定していないとき（列数が最長行から決まるとき）は同様に増えます。`columns` を指定している場合は、はみ出したセルの列定義（型・幅・ヘッダ）が存在しないため、従来どおり最終列で切り捨てます。[末尾の空行](https://github.com/t92345era/react-masume-grid/blob/main/README.ja.md#末尾の空行)を参照
- ⚠️ **破壊的変更**: `appendBlankRow` 有効時、ペーストが最終行で止まらなくなりました。切り捨てを前提に行数を抑えていた場合は、利用側で件数を制限してください。`appendBlankRow` を使っていない場合は変わりません

## 0.7.1 — 2026-07-30

- ヘッダのフィルタボタンのアイコンを `▽` / `▼` から**じょうご（ファネル）**に変更（絞り込み中は塗り）。ソート矢印の隣では三角形が別のソート操作に見えてしまうためです。ライブラリ内で描くインライン SVG なので、依存やライセンス表記は増えません

## 0.7.0 — 2026-07-30

- **ヘッダーのテンプレート化**（`ColumnDef.headerTemplate`）: 任意のコンポーネントで列見出しを描画。セル型を問わず使え、ソートインジケータ・フィルタボタン・列幅ハンドルはそのまま機能します。[ヘッダーのテンプレート化](https://github.com/t92345era/react-masume-grid/blob/main/README.ja.md#ヘッダーのテンプレート化)を参照
- ⚠️ **破壊的変更**: `ColumnDef.filterable` を **`ColumnDef.searchable`** に改名しました。元々 select 列のプルダウンを入力で絞り込むかの設定でしたが、0.6.0 で追加した `filter` 系（行のフィルタ）と紛らわしいためです。プロパティ名を置き換えてください。挙動と既定値（`true`）は変わりません

## 0.6.0 — 2026-07-29

- **ヘッダからのフィルタ**（`filterable` / `defaultFilters` / `onFilterChange` / `filterTexts` / `ColumnDef.filter` / `filterLabel` / `filterMatch`）: Excel 風の値チェックリスト（検索ボックス付き）またはキーワード検索で、`data` を変更せずに表示行だけを絞り込み。[フィルタ](https://github.com/t92345era/react-masume-grid/blob/main/README.ja.md#フィルタ)を参照
- `onSelectionChange` の `viewToData` 引数が、ソート中だけでなくフィルタ中も渡されるようになりました

## 0.5.0 — 2026-07-27

- **ヘッダクリックによるソート**（`sortable` / `defaultSort` / `onSortChange` / `ColumnDef.sortable` / `ColumnDef.compare`）: クリックごとに昇順 → 降順 → 解除。並べ替わるのは表示だけで `data` は不変。型ごとの既定の並び順、空セルは常に末尾、右端に常時表示されるインジケータ、`aria-sort` 対応。[ソート](https://github.com/t92345era/react-masume-grid/blob/main/README.ja.md#ソート)を参照
- **末尾の空行**（`appendBlankRow`）: スプレッドシート風の「新規入力行」。値を確定した時点で実際の行になり、最終行を超えるペーストでは行が増えます。[末尾の空行](https://github.com/t92345era/react-masume-grid/blob/main/README.ja.md#末尾の空行)を参照
- `onSelectionChange` の第2引数に `viewToData`（ソート中の表示行→データ行の対応。未ソート時は `null`）を追加

## 0.4.0 — 2026-07-25

- ARIA グリッドセマンティクス: `grid` / `row` / `gridcell` / `columnheader` / `rowheader` / `rowgroup` ロール、行仮想化でも維持される 1 始まりの行・列インデックス、`aria-multiselectable` / `aria-readonly` / `aria-activedescendant`
- `getCellProps(row, col, value)` によるセル単位の `readOnly` / `className` / `style` の上書き。[セル単位の上書き](https://github.com/t92345era/react-masume-grid/blob/main/README.ja.md#セル単位の上書き)を参照
- `ColumnDef.format`（表示専用フォーマット）と `formatThousands` ヘルパーの公開。[表示フォーマット](https://github.com/t92345era/react-masume-grid/blob/main/README.ja.md#表示フォーマット)を参照

## 0.3.0 — 2026-07-20

- `template` セル型: 任意の React コンポーネントをセルに描画。内部のボタン等はネイティブにクリック可能。[テンプレート型セル](https://github.com/t92345era/react-masume-grid/blob/main/README.ja.md#テンプレート型セル)を参照
- コピー / 切り取り範囲のマーチングアンツ表示（Escape・貼り付け・編集開始で消える）

## 0.2.0 — 2026-07-12

- `checkbox` セル型: クリックまたは Space でトグル（Space は選択中のチェックボックスセルを一括トグル）。Excel からの貼り付け（`TRUE`/`FALSE`・`1`/`0`・`yes`/`no`）を正規化
- select 列の `ColumnDef.filterable`（`false` で常に全候補を表示し、文字入力は先頭一致の候補へハイライトを移動）— 0.7.0 で `searchable` に改名
- `normalizeCheckboxInput` / `isCheckboxChecked` を公開

## 0.1.0 — 2026-07-06

- 初回リリース: 行の仮想化描画、IME 対応のセル編集、`text` / `number` / `select` / `date` セル型、範囲選択（ドラッグ・Shift・Ctrl(⌘) の複数範囲・行/列ヘッダー）、Excel 互換の TSV コピー＆ペースト、ドラッグでの列幅リサイズ
