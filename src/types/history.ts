export interface HistoryKpi {
  totalSpendAmount: number;
  totalLeads: number;
  totalDeals: number;
  overallRoi: number;
  averageLeadCost: number;
}

export interface AccountPerformance {
  id: string;
  teacherId: string;
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

export interface HistoryDetail {
  id: string;
  teacherId: string;
  accountName: string;
  deliveryTime: string;
  articleTitle: string;
  spendAmount: number;
  readCount: number;
  leads: number;
  deals: number;
  dealAmount: number;
  roi: number;
}

export interface HistorySummary {
  kpi: HistoryKpi;
  accountPerformance: AccountPerformance[];
  roiTrend: TrendPoint[];
  leadCostTrend: TrendPoint[];
}
