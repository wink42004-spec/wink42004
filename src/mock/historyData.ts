import type {
  AccountPerformance,
  HistoryDetail,
  HistorySummary,
  TrendPoint,
} from '../types/history';

const accountPerformance: AccountPerformance[] = [
  {
    id: 'perf-chen-01',
    teacherId: 'teacher-chen',
    accountName: '职场增长实验室',
    accountLevel: 'A',
    cooperationCount: 12,
    totalReadCount: 682000,
    averageReadCount: 56833,
    totalLeads: 8240,
    leadCost: 18.6,
    addWechatRate: 0.0121,
    conversionRate: 0.087,
    roi: 2.73,
    totalDeals: 718,
    totalSpendAmount: 153200,
  },
  {
    id: 'perf-chen-02',
    teacherId: 'teacher-chen',
    accountName: '认知跃迁笔记',
    accountLevel: 'B',
    cooperationCount: 8,
    totalReadCount: 394000,
    averageReadCount: 49250,
    totalLeads: 4860,
    leadCost: 21.4,
    addWechatRate: 0.0123,
    conversionRate: 0.068,
    roi: 1.84,
    totalDeals: 330,
    totalSpendAmount: 104000,
  },
  {
    id: 'perf-li-01',
    teacherId: 'teacher-li',
    accountName: '升学情报站',
    accountLevel: 'A',
    cooperationCount: 10,
    totalReadCount: 451000,
    averageReadCount: 45100,
    totalLeads: 5120,
    leadCost: 19.2,
    addWechatRate: 0.0114,
    conversionRate: 0.074,
    roi: 2.11,
    totalDeals: 379,
    totalSpendAmount: 98300,
  },
  {
    id: 'perf-li-02',
    teacherId: 'teacher-li',
    accountName: '教育观察员',
    accountLevel: 'B',
    cooperationCount: 7,
    totalReadCount: 218000,
    averageReadCount: 31143,
    totalLeads: 2040,
    leadCost: 27.1,
    addWechatRate: 0.0094,
    conversionRate: 0.052,
    roi: 1.28,
    totalDeals: 106,
    totalSpendAmount: 55280,
  },
  {
    id: 'perf-wang-01',
    teacherId: 'teacher-wang',
    accountName: '家庭教育每日谈',
    accountLevel: 'A',
    cooperationCount: 11,
    totalReadCount: 593000,
    averageReadCount: 53909,
    totalLeads: 7110,
    leadCost: 17.8,
    addWechatRate: 0.012,
    conversionRate: 0.082,
    roi: 2.58,
    totalDeals: 583,
    totalSpendAmount: 126600,
  },
  {
    id: 'perf-wang-02',
    teacherId: 'teacher-wang',
    accountName: '学业规划研究所',
    accountLevel: 'B',
    cooperationCount: 6,
    totalReadCount: 247000,
    averageReadCount: 41167,
    totalLeads: 2490,
    leadCost: 23.9,
    addWechatRate: 0.0101,
    conversionRate: 0.059,
    roi: 1.46,
    totalDeals: 147,
    totalSpendAmount: 59500,
  },
];

const historyDetails: HistoryDetail[] = [
  {
    id: 'detail-chen-01',
    teacherId: 'teacher-chen',
    accountName: '职场增长实验室',
    deliveryTime: '2026-06-15 10:30',
    articleTitle: '30 天建立高质量学习闭环',
    spendAmount: 12800,
    readCount: 86400,
    leads: 1260,
    deals: 94,
    dealAmount: 34200,
    roi: 2.67,
  },
  {
    id: 'detail-chen-02',
    teacherId: 'teacher-chen',
    accountName: '认知跃迁笔记',
    deliveryTime: '2026-06-22 19:45',
    articleTitle: '升学规划变化里的信息差',
    spendAmount: 9600,
    readCount: 52100,
    leads: 790,
    deals: 53,
    dealAmount: 16500,
    roi: 1.72,
  },
  {
    id: 'detail-li-01',
    teacherId: 'teacher-li',
    accountName: '升学情报站',
    deliveryTime: '2026-06-18 08:50',
    articleTitle: '中考后家长最容易踩的坑',
    spendAmount: 7400,
    readCount: 38600,
    leads: 530,
    deals: 31,
    dealAmount: 9800,
    roi: 1.32,
  },
  {
    id: 'detail-li-02',
    teacherId: 'teacher-li',
    accountName: '教育观察员',
    deliveryTime: '2026-06-26 15:20',
    articleTitle: '新高一选科长期方向',
    spendAmount: 6200,
    readCount: 24800,
    leads: 210,
    deals: 9,
    dealAmount: 4200,
    roi: 0.68,
  },
  {
    id: 'detail-wang-01',
    teacherId: 'teacher-wang',
    accountName: '家庭教育每日谈',
    deliveryTime: '2026-06-20 09:15',
    articleTitle: '孩子拖延背后的真实原因',
    spendAmount: 11200,
    readCount: 62300,
    leads: 970,
    deals: 86,
    dealAmount: 29200,
    roi: 2.61,
  },
  {
    id: 'detail-wang-02',
    teacherId: 'teacher-wang',
    accountName: '学业规划研究所',
    deliveryTime: '2026-06-28 20:00',
    articleTitle: '初二开始规划要看什么',
    spendAmount: 8800,
    readCount: 40700,
    leads: 480,
    deals: 22,
    dealAmount: 8200,
    roi: 0.93,
  },
];

const roiTrendByTeacher: Record<string, TrendPoint[]> = {
  'teacher-chen': [
    { date: '06-10', value: 1.72 },
    { date: '06-17', value: 1.96 },
    { date: '06-24', value: 2.18 },
    { date: '07-01', value: 2.31 },
    { date: '07-08', value: 2.42 },
  ],
  'teacher-li': [
    { date: '06-10', value: 1.18 },
    { date: '06-17', value: 1.36 },
    { date: '06-24', value: 1.54 },
    { date: '07-01', value: 1.69 },
    { date: '07-08', value: 1.82 },
  ],
  'teacher-wang': [
    { date: '06-10', value: 1.51 },
    { date: '06-17', value: 1.83 },
    { date: '06-24', value: 2.12 },
    { date: '07-01', value: 2.21 },
    { date: '07-08', value: 2.36 },
  ],
};

const leadCostTrendByTeacher: Record<string, TrendPoint[]> = {
  'teacher-chen': [
    { date: '06-10', value: 25.4 },
    { date: '06-17', value: 23.8 },
    { date: '06-24', value: 21.9 },
    { date: '07-01', value: 20.7 },
    { date: '07-08', value: 19.6 },
  ],
  'teacher-li': [
    { date: '06-10', value: 30.2 },
    { date: '06-17', value: 28.6 },
    { date: '06-24', value: 26.8 },
    { date: '07-01', value: 24.9 },
    { date: '07-08', value: 22.4 },
  ],
  'teacher-wang': [
    { date: '06-10', value: 26.8 },
    { date: '06-17', value: 24.1 },
    { date: '06-24', value: 22.5 },
    { date: '07-01', value: 21.2 },
    { date: '07-08', value: 19.8 },
  ],
};

function buildKpi(rows: AccountPerformance[]) {
  const totalSpendAmount = rows.reduce(
    (sum, row) => sum + row.totalSpendAmount,
    0,
  );
  const totalLeads = rows.reduce((sum, row) => sum + row.totalLeads, 0);
  const totalDeals = rows.reduce((sum, row) => sum + row.totalDeals, 0);
  const weightedRoi =
    rows.reduce((sum, row) => sum + row.totalSpendAmount * row.roi, 0) /
    Math.max(totalSpendAmount, 1);

  return {
    totalSpendAmount,
    totalLeads,
    totalDeals,
    overallRoi: weightedRoi,
    averageLeadCost: totalSpendAmount / Math.max(totalLeads, 1),
  };
}

export function getMockHistorySummary(teacherId: string): HistorySummary {
  const rows = accountPerformance.filter((row) => row.teacherId === teacherId);

  return {
    kpi: buildKpi(rows),
    accountPerformance: rows,
    roiTrend: roiTrendByTeacher[teacherId] ?? [],
    leadCostTrend: leadCostTrendByTeacher[teacherId] ?? [],
  };
}

export function getMockHistoryDetails(
  teacherId: string,
  accountName: string,
): HistoryDetail[] {
  return historyDetails.filter(
    (detail) =>
      detail.teacherId === teacherId && detail.accountName === accountName,
  );
}
