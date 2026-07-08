export type {
  NextWeekPlan,
  PaymentStatus,
  WeeklyDeliveryView as AccountHistoryRecord,
} from './shared';

import type { PaymentStatus } from './shared';

export interface PlanPayload {
  accountName: string;
  plannedTime: string;
  articleTitle: string;
  plannedAmount: number;
  paymentStatus: PaymentStatus;
}
