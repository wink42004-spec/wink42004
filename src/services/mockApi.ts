import dayjs from 'dayjs';
import { getCurrentUserSync } from './mockAuthApi';
import type {
  AuditLog,
  DashboardScreenData,
  DashboardTabKey,
  DeliveryMetric,
  HistorySummary,
  NextWeekPlan,
  PaymentStatus,
  Teacher,
  WeeklyDelivery,
  WeeklyDeliveryView,
} from '../types/shared';

const now = '2026-07-08 10:00';
const auditBase = {
  createdBy: '张老师',
  createdAt: now,
  updatedBy: '张老师',
  updatedAt: now,
};

let teachers: Teacher[] = [
  { id: 'teacher-zhang', name: '张老师' },
  { id: 'teacher-li', name: '李老师' },
  { id: 'teacher-wang', name: '王老师' },
];

const mockGuestWeeklyRows: WeeklyDelivery[] = [
  {
    ...auditBase,
    id: 'guest-weekly-1',
    weekStartDate: '2026-07-06',
    accountName: '模拟账号 A',
    deliveryTime: '2026-07-06 10:30',
    articleTitle: '模拟投放：暑期学习规划指南',
    articleUrl: 'https://example.com/mock-a',
    spendAmount: 6800,
    readCount: 42800,
    wechatAdds: 520,
    dealCount: 31,
    dealAmount: 13800,
  },
  {
    ...auditBase,
    id: 'guest-weekly-2',
    weekStartDate: '2026-07-06',
    accountName: '模拟账号 B',
    deliveryTime: '2026-07-07 19:45',
    articleTitle: '模拟投放：家长决策链路拆解',
    articleUrl: 'https://example.com/mock-b',
    spendAmount: 5200,
    readCount: 26600,
    wechatAdds: 310,
    dealCount: 12,
    dealAmount: 5200,
  },
];

const realCompanyWeeklyRows: WeeklyDelivery[] = [
  {
    ...auditBase,
    id: 'real-weekly-1',
    weekStartDate: '2026-07-06',
    accountName: '职场增长实验室',
    deliveryTime: '2026-07-06 10:30',
    articleTitle: '30 天建立高质量学习闭环',
    articleUrl: 'https://example.com/real-growth',
    spendAmount: 12800,
    readCount: 86400,
    wechatAdds: 1260,
    dealCount: 94,
    dealAmount: 34200,
  },
  {
    ...auditBase,
    id: 'real-weekly-2',
    weekStartDate: '2026-07-06',
    accountName: '认知跃迁笔记',
    deliveryTime: '2026-07-07 19:45',
    articleTitle: '升学规划变化里的信息差',
    articleUrl: 'https://example.com/real-note',
    spendAmount: 9600,
    readCount: 52100,
    wechatAdds: 790,
    dealCount: 53,
    dealAmount: 16500,
  },
  {
    ...auditBase,
    id: 'real-weekly-3',
    weekStartDate: '2026-07-06',
    accountName: '家庭教育每日谈',
    deliveryTime: '2026-07-08 09:15',
    articleTitle: '孩子拖延背后的真实原因',
    articleUrl: 'https://example.com/real-family',
    spendAmount: 11200,
    readCount: 62300,
    wechatAdds: 970,
    dealCount: 86,
    dealAmount: 29200,
  },
  {
    ...auditBase,
    id: 'real-weekly-4',
    weekStartDate: '2026-06-29',
    accountName: '教育观察员',
    deliveryTime: '2026-07-02 15:20',
    articleTitle: '新高一选科长期方向',
    articleUrl: 'https://example.com/real-education',
    spendAmount: 6200,
    readCount: 24800,
    wechatAdds: 210,
    dealCount: 9,
    dealAmount: 4200,
  },
];

const mockGuestPlans: NextWeekPlan[] = [
  {
    ...auditBase,
    id: 'guest-plan-1',
    accountName: '模拟账号 A',
    plannedTime: '2026-07-13 10:30',
    articleTitle: '模拟排期：学习状态重建',
    articleUrl: 'https://example.com/mock-plan-a',
    plannedAmount: 7000,
    layoutStatus: 'processing',
    paymentStatus: 'partial',
    sortOrder: 1,
  },
];

const realCompanyPlans: NextWeekPlan[] = [
  {
    ...auditBase,
    id: 'real-plan-1',
    accountName: '职场增长实验室',
    plannedTime: '2026-07-13 10:30',
    articleTitle: '暑期后半程学习状态重建',
    articleUrl: 'https://example.com/plan-growth',
    plannedAmount: 15800,
    layoutStatus: 'done',
    paymentStatus: 'partial',
    sortOrder: 1,
  },
  {
    ...auditBase,
    id: 'real-plan-2',
    accountName: '升学情报站',
    plannedTime: '2026-07-14 08:50',
    articleTitle: '新初三关键节点',
    articleUrl: 'https://example.com/plan-school',
    plannedAmount: 8600,
    layoutStatus: 'published',
    paymentStatus: 'paid',
    sortOrder: 2,
  },
];

let guestWeeklyRows = [...mockGuestWeeklyRows];
let realWeeklyRows = [...realCompanyWeeklyRows];
let guestPlans = [...mockGuestPlans];
let realPlans = [...realCompanyPlans];

let auditLogs: AuditLog[] = [
  {
    id: 'audit-1',
    time: now,
    operatorName: '张老师',
    actionType: '新增',
    module: '本周投放',
    target: '职场增长实验室',
    before: '-',
    after: '初始化投放数据',
  },
];

function delay(ms = 260) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function timestamp() {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}

function canReadRealData() {
  const user = getCurrentUserSync();
  return user.status === 'approved' || user.isAdmin;
}

function canReadAnyData() {
  const user = getCurrentUserSync();
  return user.status === 'guest' || canReadRealData();
}

function weeklyStore() {
  return canReadRealData() ? realWeeklyRows : guestWeeklyRows;
}

function setWeeklyStore(rows: WeeklyDelivery[]) {
  if (canReadRealData()) {
    realWeeklyRows = rows;
  } else {
    guestWeeklyRows = rows;
  }
}

function planStore() {
  return canReadRealData() ? realPlans : guestPlans;
}

function setPlanStore(rows: NextWeekPlan[]) {
  if (canReadRealData()) {
    realPlans = rows;
  } else {
    guestPlans = rows;
  }
}

function writeAudit(
  operatorName: string,
  actionType: AuditLog['actionType'],
  module: AuditLog['module'],
  target: string,
  before: unknown,
  after: unknown,
) {
  auditLogs = [
    {
      id: `audit-${Date.now()}-${Math.random()}`,
      time: timestamp(),
      operatorName,
      actionType,
      module,
      target,
      before: typeof before === 'string' ? before : JSON.stringify(before),
      after: typeof after === 'string' ? after : JSON.stringify(after),
    },
    ...auditLogs,
  ];
}

function withUpdate<T extends { updatedBy: string; updatedAt: string }>(
  row: T,
  operatorName: string,
) {
  return {
    ...row,
    updatedBy: operatorName,
    updatedAt: timestamp(),
  };
}

function toWeeklyView(row: WeeklyDelivery): WeeklyDeliveryView {
  return {
    ...row,
    wechatAddCost: row.wechatAdds > 0 ? row.spendAmount / row.wechatAdds : 0,
    wechatAddRate: row.readCount > 0 ? row.wechatAdds / row.readCount : 0,
    readCost: row.readCount > 0 ? row.spendAmount / row.readCount : 0,
    roi: row.spendAmount > 0 ? row.dealAmount / row.spendAmount : 0,
  };
}

function getAllWeeklyViews() {
  if (!canReadAnyData()) return [];
  return weeklyStore().map(toWeeklyView);
}

export async function getTeachers() {
  await delay(120);
  return [...teachers];
}

export async function addTeacher(name: string, operatorName: string) {
  await delay();
  const teacher = { id: `teacher-${Date.now()}`, name };
  teachers = [...teachers, teacher];
  writeAudit(operatorName, '新增', '老师管理', name, '-', teacher);
  return [...teachers];
}

export async function renameTeacher(
  teacherId: string,
  name: string,
  operatorName: string,
) {
  await delay();
  const before = teachers.find((teacher) => teacher.id === teacherId);
  teachers = teachers.map((teacher) =>
    teacher.id === teacherId ? { ...teacher, name } : teacher,
  );
  writeAudit(operatorName, '修改', '老师管理', name, before ?? '-', name);
  return [...teachers];
}

export async function getWeeklyData(weekStartDate: string) {
  await delay();
  return getAllWeeklyViews().filter((row) => row.weekStartDate === weekStartDate);
}

export async function createWeeklyData(
  payload: Omit<WeeklyDelivery, 'id' | keyof typeof auditBase>,
  operatorName: string,
) {
  await delay();
  const row: WeeklyDelivery = {
    ...payload,
    id: `weekly-${Date.now()}`,
    createdBy: operatorName,
    createdAt: timestamp(),
    updatedBy: operatorName,
    updatedAt: timestamp(),
  };
  setWeeklyStore([row, ...weeklyStore()]);
  writeAudit(operatorName, '新增', '本周投放', row.accountName, '-', row);
  return toWeeklyView(row);
}

export async function updateWeeklyData(
  rowId: string,
  patch: Partial<WeeklyDelivery>,
  operatorName: string,
) {
  await delay();
  const rows = weeklyStore();
  const before = rows.find((row) => row.id === rowId);
  if (!before) throw new Error('未找到投放记录');
  const after = withUpdate({ ...before, ...patch }, operatorName);
  setWeeklyStore(rows.map((row) => (row.id === rowId ? after : row)));
  writeAudit(operatorName, '修改', '本周投放', after.accountName, before, after);
  return toWeeklyView(after);
}

export async function deleteWeeklyData(rowId: string, operatorName: string) {
  await delay();
  const rows = weeklyStore();
  const before = rows.find((row) => row.id === rowId);
  setWeeklyStore(rows.filter((row) => row.id !== rowId));
  writeAudit(
    operatorName,
    '删除',
    '本周投放',
    before?.accountName ?? rowId,
    before ?? '-',
    '-',
  );
}

export async function refreshReadCount(rowId: string, operatorName: string) {
  await delay();
  const rows = weeklyStore();
  const before = rows.find((row) => row.id === rowId);
  if (!before) throw new Error('未找到投放记录');
  const after = withUpdate(
    {
      ...before,
      readCount: before.readCount + Math.floor(before.readCount * 0.04) + 300,
    },
    operatorName,
  );
  setWeeklyStore(rows.map((row) => (row.id === rowId ? after : row)));
  writeAudit(
    operatorName,
    '刷新阅读量',
    '本周投放',
    after.accountName,
    before.readCount,
    after.readCount,
  );
  return toWeeklyView(after);
}

export async function uploadWeeklyCsv(text: string, operatorName: string) {
  await delay();
  const rows = parseCsv(text).map((cols, index): WeeklyDelivery => ({
    id: `weekly-upload-${Date.now()}-${index}`,
    weekStartDate: cols[0] || dayjs().startOf('week').add(1, 'day').format('YYYY-MM-DD'),
    accountName: cols[1] || '未命名账号',
    deliveryTime: cols[2] || timestamp(),
    articleTitle: cols[3] || '未命名标题',
    articleUrl: cols[4] || undefined,
    spendAmount: Number(cols[5]) || 0,
    readCount: Number(cols[6]) || 0,
    wechatAdds: Number(cols[7]) || 0,
    dealCount: Number(cols[8]) || 0,
    dealAmount: Number(cols[9]) || 0,
    createdBy: operatorName,
    createdAt: timestamp(),
    updatedBy: operatorName,
    updatedAt: timestamp(),
    uploadedBy: operatorName,
    uploadedAt: timestamp(),
  }));
  setWeeklyStore([...rows, ...weeklyStore()]);
  writeAudit(operatorName, '上传', '本周投放', 'CSV', '-', `导入 ${rows.length} 条`);
}

export async function getNextWeekPlan() {
  await delay();
  if (!canReadAnyData()) return [];
  return [...planStore()].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createPlan(
  payload: Omit<NextWeekPlan, 'id' | 'sortOrder' | keyof typeof auditBase>,
  operatorName: string,
) {
  await delay();
  const row: NextWeekPlan = {
    ...payload,
    id: `plan-${Date.now()}`,
    sortOrder: planStore().length + 1,
    createdBy: operatorName,
    createdAt: timestamp(),
    updatedBy: operatorName,
    updatedAt: timestamp(),
  };
  setPlanStore([...planStore(), row]);
  writeAudit(operatorName, '新增', '下周排期', row.accountName, '-', row);
  return row;
}

export async function updatePlan(
  planId: string,
  patch: Partial<NextWeekPlan>,
  operatorName: string,
) {
  await delay();
  const rows = planStore();
  const before = rows.find((row) => row.id === planId);
  if (!before) throw new Error('未找到排期');
  const after = withUpdate({ ...before, ...patch }, operatorName);
  setPlanStore(rows.map((row) => (row.id === planId ? after : row)));
  writeAudit(operatorName, '修改', '下周排期', after.accountName, before, after);
  return after;
}

export async function deletePlan(planId: string, operatorName: string) {
  await delay();
  const rows = planStore();
  const before = rows.find((row) => row.id === planId);
  setPlanStore(rows.filter((row) => row.id !== planId));
  writeAudit(operatorName, '删除', '下周排期', before?.accountName ?? planId, before ?? '-', '-');
}

export async function uploadPlanCsv(text: string, operatorName: string) {
  await delay();
  const rows = parseCsv(text).map((cols, index): NextWeekPlan => ({
    id: `plan-upload-${Date.now()}-${index}`,
    accountName: cols[0] || '未命名账号',
    plannedTime: cols[1] || timestamp(),
    articleTitle: cols[2] || '未命名标题',
    articleUrl: cols[3] || undefined,
    plannedAmount: Number(cols[4]) || 0,
    layoutStatus: (cols[5] as NextWeekPlan['layoutStatus']) || 'pending',
    paymentStatus: (cols[6] as PaymentStatus) || 'unpaid',
    sortOrder: planStore().length + index + 1,
    createdBy: operatorName,
    createdAt: timestamp(),
    updatedBy: operatorName,
    updatedAt: timestamp(),
    uploadedBy: operatorName,
    uploadedAt: timestamp(),
  }));
  setPlanStore([...planStore(), ...rows]);
  writeAudit(operatorName, '上传', '下周排期', 'CSV', '-', `导入 ${rows.length} 条`);
}

export async function getAccountHistory(accountName: string) {
  await delay();
  return getAllWeeklyViews().filter((row) => row.accountName === accountName);
}

export async function getHistorySummary(): Promise<HistorySummary> {
  await delay();
  const rows = getAllWeeklyViews();
  const accountMap = new Map<string, WeeklyDeliveryView[]>();
  rows.forEach((row) => {
    accountMap.set(row.accountName, [...(accountMap.get(row.accountName) ?? []), row]);
  });
  const accountPerformance = [...accountMap.entries()].map(([accountName, list], index) => {
    const totalSpendAmount = sum(list, 'spendAmount');
    const totalReadCount = sum(list, 'readCount');
    const totalLeads = sum(list, 'wechatAdds');
    const totalDeals = sum(list, 'dealCount');
    const dealAmount = sum(list, 'dealAmount');
    return {
      id: `perf-${index}`,
      accountName,
      accountLevel: index === 0 ? 'A' : 'B',
      cooperationCount: list.length,
      totalReadCount,
      averageReadCount: totalReadCount / Math.max(list.length, 1),
      totalLeads,
      leadCost: totalSpendAmount / Math.max(totalLeads, 1),
      addWechatRate: totalLeads / Math.max(totalReadCount, 1),
      conversionRate: totalDeals / Math.max(totalLeads, 1),
      roi: dealAmount / Math.max(totalSpendAmount, 1),
      totalDeals,
      totalSpendAmount,
    };
  });
  const totalSpendAmount = sum(rows, 'spendAmount');
  const totalLeads = sum(rows, 'wechatAdds');
  const totalDeals = sum(rows, 'dealCount');
  const dealAmount = sum(rows, 'dealAmount');
  return {
    kpi: {
      totalSpendAmount,
      totalLeads,
      totalDeals,
      overallRoi: dealAmount / Math.max(totalSpendAmount, 1),
      averageLeadCost: totalSpendAmount / Math.max(totalLeads, 1),
    },
    accountPerformance,
    roiTrend: buildTrend(rows, 'roi'),
    leadCostTrend: buildLeadCostTrend(rows),
  };
}

export async function getAuditLogs() {
  await delay();
  return canReadAnyData() ? [...auditLogs] : [];
}

export async function mockGetDashboardTabData(
  _teacherId: string,
  _tabKey: DashboardTabKey,
): Promise<DeliveryMetric[]> {
  await delay();
  return [];
}

export async function getDashboardScreenData(): Promise<DashboardScreenData> {
  const summary = await getHistorySummary();
  const weeklyDetails = getAllWeeklyViews().filter((row) => row.weekStartDate === '2026-07-06');
  const spendAmount = sum(weeklyDetails, 'spendAmount');
  const dealAmount = sum(weeklyDetails, 'dealAmount');
  return {
    weeklyKpi: {
      spendAmount,
      readCount: sum(weeklyDetails, 'readCount'),
      leads: sum(weeklyDetails, 'wechatAdds'),
      deals: sum(weeklyDetails, 'dealCount'),
      dealAmount,
      roi: dealAmount / Math.max(spendAmount, 1),
    },
    roiTrend: summary.roiTrend,
    leadCostTrend: summary.leadCostTrend,
    accountRanking: summary.accountPerformance,
    weeklyDetails,
  };
}

function parseCsv(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(1)
    .map((line) => line.split(',').map((cell) => cell.replace(/^"|"$/g, '').trim()));
}

function sum<T>(rows: T[], key: keyof T) {
  return rows.reduce((total, row) => total + Number(row[key] ?? 0), 0);
}

function buildTrend(rows: WeeklyDeliveryView[], key: 'roi') {
  return rows.slice(-6).map((row) => ({
    date: dayjs(row.deliveryTime).format('MM-DD'),
    value: row[key],
  }));
}

function buildLeadCostTrend(rows: WeeklyDeliveryView[]) {
  return rows.slice(-6).map((row) => ({
    date: dayjs(row.deliveryTime).format('MM-DD'),
    value: row.wechatAddCost,
  }));
}
