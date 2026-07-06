import { useMemo, useState } from 'react';
import { MeasureGrid } from '../src';
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
  const [selectionLabel, setSelectionLabel] = useState('');

  const columns = useMemo<ColumnDef[] | undefined>(
    () =>
      useColumns
        ? [
            { title: '商品コード', width: 110, readOnly: true },
            { title: '商品名', width: 160 },
            { title: 'カテゴリ', width: 110, type: 'select', options: CATEGORY_MASTER },
            { title: '単価', width: 80, type: 'number' },
            { title: '数量', width: 80, type: 'number' },
            { title: '状態', width: 120, type: 'select', options: STATUSES },
            { title: '入荷日', width: 120, type: 'date' },
            { title: 'メモ', width: 200 },
          ]
        : undefined,
    [useColumns],
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
      <h1>MeasureGrid デモ</h1>
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
        <span className="demo-selection">{selectionLabel}</span>
      </div>
      <MeasureGrid
        data={data}
        columns={columns}
        onChange={setData}
        onSelectionChange={handleSelectionChange}
        showRowNumbers={showRowNumbers}
        showHeader={showHeader}
        readOnly={readOnly}
        resizableColumns={resizable}
        onColumnResize={(col, width) => console.log(`column ${col} resized to ${width}px`)}
        style={{ height: 480 }}
      />
      <p className="demo-note">
        300行 × 8列（行は仮想化描画）。「商品コード」列は readOnly、
        「カテゴリ」「状態」は選択肢型（カテゴリはコード保存・ラベル表示）、
        「単価」「数量」は数値型（全角・カンマ入り入力も正規化）、「入荷日」は日付型。
        ヘッダーの境界をドラッグすると列幅を変更できます。
      </p>
    </div>
  );
}
