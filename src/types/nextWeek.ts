export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface NextWeekPlan {
  id: string;
  teacherId: string;
  accountName: string;
  plannedTime: string;
  articleTitle: string;
  plannedAmount: number;
  paymentStatus: PaymentStatus;
  sortOrder: number;
}

export interface AccountHistoryRecord {
  id: string;
  teacherId: string;
  accountName: string;
  deliveryTime: string;
  articleTitle: string;
  spendAmount: number;
  adReadCount: number;
  roi: number;
}

export interface PlanPayload {
  teacherId: string;
  accountName: string;
  plannedTime: string;
  articleTitle: string;
  plannedAmount: number;
  paymentStatus: PaymentStatus;
}
