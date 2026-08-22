import { useState } from 'react';
import { MasumeGrid } from '../../../src';
import type { ColumnDef, FilterTexts } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: 'マスタメンテナンス',
  description:
    '一覧を直接編集するタイプの管理画面です。ヘッダクリックのソートとヘッダのフィルタで目的の行を探し、'
    + 'コード列は readOnly で保護、行末のボタンはテンプレート型の列で描画しています。'
    + 'ソートもフィルタも表示を変えるだけで data は並べ替わらないため、編集処理は素直に書けます。',
  order: 20,
  docs: 'フィルタ',
};

const FILTER_TEXTS: Partial<FilterTexts> = {
  all: '(すべて)',
  blanks: '(空白)',
  search: '検索',
  clear: 'クリア',
  close: '閉じる',
  button: 'フィルタ',
};

const DEPARTMENTS = [
  { value: 'D1', label: '営業部' },
  { value: 'D2', label: '開発部' },
  { value: 'D3', label: '総務部' },
];

export default function Master() {
  const [data, setData] = useState<string[][]>([
    ['E-001', '山田 太郎', 'D1', '2021-04-01', 'true'],
    ['E-002', '鈴木 花子', 'D2', '2019-10-01', 'true'],
    ['E-003', '佐藤 次郎', 'D2', '2023-04-01', ''],
    ['E-004', '田中 三郎', 'D3', '2018-04-01', 'true'],
    ['E-005', '高橋 良子', 'D1', '2024-04-01', ''],
  ]);

  const columns: ColumnDef[] = [
    { title: '社員コード', width: 110, readOnly: true, filter: 'text' },
    { title: '氏名', width: 140, filter: 'text' },
    { title: '部署', width: 120, type: 'select', options: DEPARTMENTS },
    { title: '入社日', width: 120, type: 'date' },
    { title: '在籍', width: 80, type: 'checkbox' },
    {
      title: '操作',
      width: 90,
      type: 'template',
      readOnly: true,
      template: ({ row }) => (
        <button
          type="button"
          className="ex-btn"
          onClick={() => window.alert(`${data[row]?.[1]} を編集（データ行 ${row + 1}）`)}
        >
          編集
        </button>
      ),
    },
  ];

  return (
    <MasumeGrid
      data={data}
      onChange={setData}
      columns={columns}
      sortable
      filterable
      filterTexts={FILTER_TEXTS}
      showRowNumbers
      style={{ height: 300 }}
    />
  );
}
