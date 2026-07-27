import { useMemo, useState } from 'react';
import { MasumeGrid, formatThousands, isCheckboxChecked } from '../src';
import type { ColumnDef, NormalizedRange } from '../src';
import './demo.css';

const PRODUCTS = ['りんご', 'みかん', 'バナナ', 'ぶどう', '桃', '梨', 'いちご', 'メロン'];
// マスタデータ想定: コードを保存し、ラベルを表示する
const CATEGORY_MASTER = [
  { value: 'C01', label: '果物' },
  { value: 'C02', label: '青果' },
  { value: 'C03', label: '特売' },
  { value: 'C04', label: '定番' },
];
const STATUSES = ['在庫あり', '残りわずか', '取り寄せ'];

function makeData(rows: number): string[][] {
  return Array.from({ length: rows }, (_, r) => {
    const date = new Date(2026, 0, 1 + (r % 180));
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate(),
    ).padStart(2, '0')}`;
    return [
      `PRD-${String(r + 1).padStart(4, '0')}`,
      `${PRODUCTS[r % PRODUCTS.length]} ${Math.floor(r / PRODUCTS.length) + 1}`,
      CATEGORY_MASTER[r % CATEGORY_MASTER.length].value,
      String((r % 20) * 50 + 100),
      String((r * 7) % 100),
      STATUSES[r % STATUSES.length],
      iso,
      r % 3 === 0 ? 'true' : '',
      '',
    ];
  });
}

export default function App() {
  const [data, setData] = useState<string[][]>(() => makeData(300));
  const [showRowNumbers, setShowRowNumbers] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [readOnly, setReadOnly] = useState(false);
  const [useColumns, setUseColumns] = useState(true);
  const [resizable, setResizable] = useState(true);
  const [appendBlankRow, setAppendBlankRow] = useState(true);
  const [sortable, setSortable] = useState(true);
  const [selectionLabel, setSelectionLabel] = useState('');

  const columns = useMemo<ColumnDef[] | undefined>(
    () =>
      useColumns
        ? [
            { title: '商品コード', width: 110, readOnly: true },
            { title: '商品名', width: 160 },
            { title: 'カテゴリ', width: 110, type: 'select', options: CATEGORY_MASTER },
            { title: '単価', width: 80, type: 'number', format: formatThousands },
            { title: '数量', width: 80, type: 'number' },
            { title: '状態', width: 120, type: 'select', options: STATUSES, filterable: false },
            { title: '入荷日', width: 120, type: 'date' },
            { title: '検品済', width: 70, type: 'checkbox' },
            { title: 'メモ', width: 200 },
            {
              // テンプレート型(派生表示): row でデータ行を参照し 単価×数量 を表示
              title: '金額',
              width: 100,
              type: 'template',
              readOnly: true,
              template: ({ row }) => {
                const total = Number(data[row]?.[3] || 0) * Number(data[row]?.[4] || 0);
                return (
                  <span className={'demo-amount' + (total >= 3000 ? ' demo-amount--high' : '')}>
                    ¥{total.toLocaleString()}
                  </span>
                );
              },
            },
            {
              // テンプレート型(行アクション): ボタンはネイティブにクリック可能
              title: '操作',
              width: 90,
              type: 'template',
              readOnly: true,
              template: ({ row }) => (
                <button
                  type="button"
                  className="demo-row-btn"
                  onClick={() =>
                    window.alert(`「${data[row]?.[1] ?? ''}」の詳細を表示（データ行 ${row + 1}）`)
                  }
                >
                  詳細
                </button>
              ),
            },
          ]
        : undefined,
    // 「金額」「操作」のテンプレートが data を参照するため data にも依存させる
    [useColumns, data],
  );

  const handleSelectionChange = (ranges: NormalizedRange[]) => {
    const last = ranges[ranges.length - 1];
    if (!last) return;
    const cells = ranges.reduce(
      (sum, r) => sum + (r.bottom - r.top + 1) * (r.right - r.left + 1),
      0,
    );
    setSelectionLabel(
      `R${last.top + 1}C${last.left + 1} : R${last.bottom + 1}C${last.right + 1}` +
        (ranges.length > 1 ? ` (${ranges.length}範囲)` : '') +
        ` — ${cells}セル`,
    );
  };

  return (
    <div className="demo">
      <h1>MasumeGrid デモ</h1>
      <p className="demo-hint">
        ダブルクリック / F2 / キー入力で編集（日本語入力対応）。ドラッグ・Shift・Ctrl(⌘)で範囲選択。
        Ctrl+C / X / V でコピー・切り取り・貼り付け（Excelと相互運用可）。Delete でクリア。
      </p>
      <div className="demo-toolbar">
        <label>
          <input
            type="checkbox"
            checked={showRowNumbers}
            onChange={(e) => setShowRowNumbers(e.target.checked)}
          />
          行番号を表示
        </label>
        <label>
          <input
            type="checkbox"
            checked={showHeader}
            onChange={(e) => setShowHeader(e.target.checked)}
          />
          ヘッダーを表示
        </label>
        <label>
          <input
            type="checkbox"
            checked={useColumns}
            onChange={(e) => setUseColumns(e.target.checked)}
          />
          列定義を使用（オフで A, B, C…）
        </label>
        <label>
          <input
            type="checkbox"
            checked={readOnly}
            onChange={(e) => setReadOnly(e.target.checked)}
          />
          読み取り専用
        </label>
        <label>
          <input
            type="checkbox"
            checked={resizable}
            onChange={(e) => setResizable(e.target.checked)}
          />
          列幅リサイズ
        </label>
        <label>
          <input
            type="checkbox"
            checked={appendBlankRow}
            onChange={(e) => setAppendBlankRow(e.target.checked)}
          />
          末尾に空行を追加
        </label>
        <label>
          <input
            type="checkbox"
            checked={sortable}
            onChange={(e) => setSortable(e.target.checked)}
          />
          ヘッダクリックでソート
        </label>
        <span className="demo-selection">{selectionLabel}</span>
      </div>
      <MasumeGrid
        data={data}
        columns={columns}
        onChange={setData}
        onSelectionChange={handleSelectionChange}
        // セル単位の上書き: 検品済の行は単価・数量をロック、数量0は警告ハイライト
        getCellProps={(row, col, value) => {
          if (!useColumns) return;
          if (col === 4 && value !== '' && Number(value) === 0)
            return { className: 'demo-cell-warn' };
          if ((col === 3 || col === 4) && isCheckboxChecked(data[row]?.[7] ?? ''))
            return { readOnly: true, className: 'demo-cell-locked' };
        }}
        appendBlankRow={appendBlankRow}
        sortable={sortable}
        onSortChange={(sort) => console.log('sort', sort)}
        showRowNumbers={showRowNumbers}
        showHeader={showHeader}
        readOnly={readOnly}
        resizableColumns={resizable}
        onColumnResize={(col, width) => console.log(`column ${col} resized to ${width}px`)}
        style={{ height: 480 }}
      />
      <p className="demo-note">
        300行 × 11列（行は仮想化描画）。「商品コード」列は readOnly、
        「カテゴリ」「状態」は選択肢型（カテゴリはコード保存・ラベル表示、状態は filterable: false で常に全候補表示）、
        「単価」「数量」は数値型（全角・カンマ入り入力も正規化。単価は format: formatThousands で桁区切り表示）、「入荷日」は日付型、
        「検品済」はチェックボックス型（クリック / Space でトグル）、
        「金額」「操作」はテンプレート型（任意のコンポーネントを描画。関数にはデータ行のインデックスが渡されます。
        「金額」は単価×数量の派生表示 — 単価や数量を編集すると連動して更新、「操作」はボタンでその行を参照）。
        ヘッダーの境界をドラッグすると列幅を変更できます。
        getCellProps によるセル単位の上書きも入っています —
        検品済の行は「単価」「数量」が編集ロック（グレー表示）、数量が 0 のセルは警告ハイライトされます。
        appendBlankRow により最終行の下に入力用の空行が1行表示され、そこに値を入力して確定すると行が追加されます
        （末尾までスクロールして試せます）。
        sortable を有効にすると、ヘッダクリックで昇順 → 降順 → 解除の順にソートできます
        （列の選択も同時に行われます。並ぶのは表示だけで data は並べ替わりません。
        「金額」「操作」のテンプレート型列は既定でソート対象外）。
      </p>
    </div>
  );
}
