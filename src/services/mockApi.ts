import { dashboardMockData } from '../mock/dashboardData';
import {
  getMockHistoryDetails,
  getMockHistorySummary,
} from '../mock/historyData';
import { mockAccountHistory, mockNextWeekPlans } from '../mock/nextWeekPlans';
import { mockWeeklyData } from '../mock/weeklyData';
import type { DashboardTabKey, DeliveryMetric } from '../types/dashboard';
import type {
  AccountPerformance,
  HistoryDetail,
  HistorySummary,
} from '../types/history';
import type {
  AccountHistoryRecord,
  NextWeekPlan,
  PaymentStatus,
  PlanPayload,
} from '../types/nextWeek';
import type { WeeklyDeliveryRow, WeeklyDeliveryViewRow } from '../types/weekly';

let weeklyRows = [...mockWeeklyData];
let plans = [...mockNextWeekPlans];

function delay(ms = 320) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function toWeeklyViewRow(row: WeeklyDeliveryRow): WeeklyDeliveryViewRow {
  return {
    ...row,
    wechatAddCost: row.wechatAdds > 0 ? row.spendAmount / row.wechatAdds : 0,
    wechatAddRate:
      row.adReadCount > 0 ? row.wechatAdds / row.adReadCount : 0,
    readCost: row.adReadCount > 0 ? row.spendAmount / row.adReadCount : 0,
    roi: row.spendAmount > 0 ? row.dealAmount / row.spendAmount : 0,
  };
}

function sortPlans(rows: NextWeekPlan[]) {
  return [...rows].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }

    return new Date(a.plannedTime).getTime() - new Date(b.plannedTime).getTime();
  });
}

export async function mockGetDashboardTabData(
  teacherId: string,
  tabKey: DashboardTabKey,
): Promise<DeliveryMetric[]> {
  await delay(420);

  return dashboardMockData[teacherId]?.[tabKey] ?? [];
}

export async function mockGetWeeklyData(
  teacherId: string,
  weekStartDate: string,
): Promise<WeeklyDeliveryViewRow[]> {
  await delay(360);

  return weeklyRows
    .filter(
      (row) =>
        row.teacherId === teacherId && row.weekStartDate === weekStartDate,
    )
    .map(toWeeklyViewRow);
}

export async function mockRefreshReadCount(
  rowId: string,
): Promise<WeeklyDeliveryViewRow> {
  await delay(280);

  const targetRow = weeklyRows.find((row) => row.id === rowId);

  if (!targetRow) {
    throw new Error('未找到当前投放记录，无法刷新阅读量。');
  }

  const increment = Math.floor(targetRow.adReadCount * 0.04) + 320;
  const nextRow: WeeklyDeliveryRow = {
    ...targetRow,
    adReadCount: targetRow.adReadCount + increment,
  };

  weeklyRows = weeklyRows.map((row) => (row.id === rowId ? nextRow : row));

  return toWeeklyViewRow(nextRow);
}

export async function mockGetNextWeekPlan(
  teacherId: string,
): Promise<NextWeekPlan[]> {
  await delay();

  return sortPlans(plans.filter((plan) => plan.teacherId === teacherId));
}

export async function mockCreatePlan(
  payload: PlanPayload,
): Promise<NextWeekPlan> {
  await delay();

  const teacherPlans = plans.filter(
    (plan) => plan.teacherId === payload.teacherId,
  );
  const nextPlan: NextWeekPlan = {
    ...payload,
    id: `plan-${Date.now()}`,
    sortOrder: teacherPlans.length + 1,
  };

  plans = [...plans, nextPlan];

  return nextPlan;
}

export async function mockUpdatePlan(
  planId: string,
  patch: Partial<Omit<NextWeekPlan, 'id'>>,
): Promise<NextWeekPlan> {
  await delay();

  const currentPlan = plans.find((plan) => plan.id === planId);

  if (!currentPlan) {
    throw new Error('未找到当前排期，无法更新。');
  }

  const nextPlan = {
    ...currentPlan,
    ...patch,
  };

  plans = plans.map((plan) => (plan.id === planId ? nextPlan : plan));

  return nextPlan;
}

export async function mockDeletePlan(planId: string): Promise<void> {
  await delay(260);

  plans = plans.filter((plan) => plan.id !== planId);
}

export async function mockGetAccountHistory(
  teacherId: string,
  accountName: string,
): Promise<AccountHistoryRecord[]> {
  await delay();

  return mockAccountHistory.filter(
    (record) =>
      record.teacherId === teacherId && record.accountName === accountName,
  );
}

export async function mockUpdatePlanPaymentStatus(
  planId: string,
  paymentStatus: PaymentStatus,
): Promise<NextWeekPlan> {
  return mockUpdatePlan(planId, { paymentStatus });
}

export async function mockGetHistorySummary(
  teacherId: string,
): Promise<HistorySummary> {
  await delay(420);

  return getMockHistorySummary(teacherId);
}

export async function mockGetHistoryDetails(
  teacherId: string,
  accountName: AccountPerformance['accountName'],
): Promise<HistoryDetail[]> {
  await delay(340);

  return getMockHistoryDetails(teacherId, accountName);
}
