export interface Teacher {
  id: string;
  name: string;
}

export interface DeliveryMetric {
  id: string;
  title: string;
  value: string;
  trend: string;
}

export type DashboardTabKey = 'weekly' | 'nextWeek' | 'history';

export interface AuditFields {
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  uploadedBy?: string;
  uploadedAt?: string;
}

export interface WeeklyDelivery extends AuditFields {
  id: string;
  teacherId?: string;
  weekStartDate: string;
  accountName: string;
  deliveryTime: string;
  articleTitle: string;
  spendAmount: number;
  readCount: number;
  adReadCount?: number;
  wechatAdds: number;
  dealCount: number;
  dealAmount: number;
}

export interface WeeklyDeliveryView extends WeeklyDelivery {
  wechatAddCost: number;
  wechatAddRate: number;
  readCost: number;
  roi: number;
}

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface NextWeekPlan extends AuditFields {
  id: string;
  teacherId?: string;
  accountName: string;
  plannedTime: string;
  articleTitle: string;
  plannedAmount: number;
  paymentStatus: PaymentStatus;
  sortOrder: number;
}

export interface AccountPerformance {
  id: string;
  teacherId?: string;
  accountName: string;
  accountLevel: string;
  cooperationCount: number;
  totalReadCount: number;
  averageReadCount: number;
  totalLeads: number;
  leadCost: number;
  addWechatRate: number;
  conversionRate: number;
  roi: number;
  totalDeals: number;
  totalSpendAmount: number;
}

export interface TrendPoint {
  date: string;
  value: number;
}

export interface HistorySummary {
  kpi: {
    totalSpendAmount: number;
    totalLeads: number;
    totalDeals: number;
    overallRoi: number;
    averageLeadCost: number;
  };
  accountPerformance: AccountPerformance[];
  roiTrend: TrendPoint[];
  leadCostTrend: TrendPoint[];
}

export interface AuditLog {
  id: string;
  time: string;
  operatorName: string;
  actionType: '新增' | '修改' | '上传' | '删除' | '刷新阅读量';
  module: '本周投放' | '下周排期' | '老师管理';
  target: string;
  before: string;
  after: string;
}

export interface DashboardScreenData {
  weeklyKpi: {
    spendAmount: number;
    readCount: number;
    leads: number;
    deals: number;
    dealAmount: number;
    roi: number;
  };
  roiTrend: TrendPoint[];
  leadCostTrend: TrendPoint[];
  accountRanking: AccountPerformance[];
  weeklyDetails: WeeklyDeliveryView[];
}
