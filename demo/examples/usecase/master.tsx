import { useState } from 'react';
import { MasumeGrid } from '../../../src';
import type { ColumnDef, FilterTexts } from '../../../src';
import type { ExampleMeta } from '../../registry';

export const meta: ExampleMeta = {
  title: { ja: 'マスタメンテナンス', en: 'Master data editing' },
  description: {
    ja:
      '一覧を直接編集するタイプの管理画面です。ヘッダクリックのソートとヘッダのフィルタで目的の行を探し、'
      + 'コード列は readOnly で保護、行末のボタンはテンプレート型の列で描画しています。'
      + 'ソートもフィルタも表示を変えるだけで data は並べ替わらないため、編集処理は素直に書けます。',
    en:
      'The admin screen where the list itself is the editor. Header-click sorting and header filters '
      + 'find the row, the code column is protected with readOnly, and the button at the end of each '
      + 'row is a template column. Sorting and filtering only change the view — data is never reordered '
      + '— so the edit handling stays straightforward.',
  },
  order: 20,
  docs: { ja: 'フィルタ', en: 'Filtering' },
};

// Demo-site language switch — not needed when you use the library
const TEXT = {
  ja: {
    columns: ['社員コード', '氏名', '部署', '入社日', '在籍', '操作'],
    edit: '編集',
    editing: (name: string, row: number) => `${name} を編集（データ行 ${row}）`,
    departments: [
      { value: 'D1', label: '営業部' },
      { value: 'D2', label: '開発部' },
      { value: 'D3', label: '総務部' },
    ],
    names: ['山田 太郎', '鈴木 花子', '佐藤 次郎', '田中 三郎', '高橋 良子'],
    // Filter panel wording (the library's default is English)
    filterTexts: {
      all: '(すべて)',
      blanks: '(空白)',
      search: '検索',
      clear: 'クリア',
      close: '閉じる',
      button: 'フィルタ',
    } as Partial<FilterTexts>,
  },
  en: {
    columns: ['Employee ID', 'Name', 'Department', 'Joined', 'Active', 'Actions'],
    edit: 'Edit',
    editing: (name: string, row: number) => `Editing ${name} (data row ${row})`,
    departments: [
      { value: 'D1', label: 'Sales' },
      { value: 'D2', label: 'Engineering' },
      { value: 'D3', label: 'Admin' },
    ],
    names: ['Alex Turner', 'Priya Nair', 'Sam Okafor', 'Mia Rossi', 'Jun Park'],
    filterTexts: {} as Partial<FilterTexts>,
  },
};

export default function Master() {
  const t = TEXT[document.documentElement.lang === 'en' ? 'en' : 'ja'];
  const [data, setData] = useState<string[][]>([
    ['E-001', t.names[0], 'D1', '2021-04-01', 'true'],
    ['E-002', t.names[1], 'D2', '2019-10-01', 'true'],
    ['E-003', t.names[2], 'D2', '2023-04-01', ''],
    ['E-004', t.names[3], 'D3', '2018-04-01', 'true'],
    ['E-005', t.names[4], 'D1', '2024-04-01', ''],
  ]);

  const columns: ColumnDef[] = [
    { title: t.columns[0], width: 120, readOnly: true, filter: 'text' },
    { title: t.columns[1], width: 150, filter: 'text' },
    { title: t.columns[2], width: 130, type: 'select', options: t.departments },
    { title: t.columns[3], width: 120, type: 'date' },
    { title: t.columns[4], width: 80, type: 'checkbox' },
    {
      title: t.columns[5],
      width: 90,
      type: 'template',
      readOnly: true,
      template: ({ row }) => (
        <button
          type="button"
          className="ex-btn"
          onClick={() => window.alert(t.editing(data[row]?.[1] ?? '', row + 1))}
        >
          {t.edit}
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
      filterTexts={t.filterTexts}
      showRowNumbers
      style={{ height: 300 }}
    />
  );
}
