import {
  mockCreatePlan,
  mockDeletePlan,
  mockGetAccountHistory,
  mockGetNextWeekPlan,
  mockUpdatePlan,
  mockUpdatePlanPaymentStatus,
} from './mockApi';

export const getNextWeekPlan = mockGetNextWeekPlan;
export const createPlan = mockCreatePlan;
export const updatePlan = mockUpdatePlan;
export const deletePlan = mockDeletePlan;
export const getAccountHistory = mockGetAccountHistory;
export const updatePlanPaymentStatus = mockUpdatePlanPaymentStatus;
