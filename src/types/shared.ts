export interface Teacher {
  id: string;
  name: string;
}

export type UserStatus = 'guest' | 'pending' | 'approved' | 'rejected';

export interface AppUser {
  id: string;
  username: string;
  companyNote: string;
  status: UserStatus;
  registeredAt: string;
  isAdmin?: boolean;
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
  period?: string;
  weekStartDate: string;
  accountName: string;
  paymentChannel?: string;
  placement?: string;
  deliveryTime: string;
  articleTitle: string;
  courseCode?: string;
  articleUrl?: string;
  previewUrl?: string;
  qrCode?: string;
  screenshot?: string;
  spendAmount: number;
  normalReadCount?: number;
  readCount: number;
  adReadCount?: number;
  wechatAdds: number;
  dealCount: number;
  coursePrice?: number;
  dealAmount: number;
  raw?: Record<string, string | number>;
}

export interface WeeklyDeliveryView extends WeeklyDelivery {
  wechatAddCost: number;
  wechatAddRate: number;
  readCost: number;
  conversionRate: number;
  roi: number;
}

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';
export type LayoutStatus = 'pending' | 'processing' | 'done' | 'published';

export interface NextWeekPlan extends AuditFields {
  id: string;
  teacherId?: string;
  period?: string;
  accountName: string;
  plannedTime: string;
  articleTitle: string;
  courseCode?: string;
  articleUrl?: string;
  plannedAmount: number;
  layoutStatus: LayoutStatus;
  paymentStatus: PaymentStatus;
  contactPerson?: string;
  remark?: string;
  sortOrder: number;
}

export interface AccountPerformance {
  id: string;
  teacherId?: string;
  accountName: string;
  uploadedAt?: string;
  periods: string[];
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
  actionType: string;
  module: string;
  target: string;
  before: string;
  after: string;
}

export interface VersionRecord {
  id: string;
  module: string;
  targetId: string;
  targetName: string;
  versionTime: string;
  operatorName: string;
  before: string;
  after: string;
  uploadedBy?: string;
  uploadedAt?: string;
  sheetName?: string;
  versionNo?: number;
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

export type ExcelSourceType = 'trainingCamp' | 'officialAccount';
export type UploadSourceType = ExcelSourceType | 'csv' | 'document' | 'pdf' | 'image';

export interface ExcelUploadResult {
  sourceType: UploadSourceType;
  fileName: string;
  sheetCount: number;
  rowCount: number;
  versionNo: number;
  structured: boolean;
}

export type StandardUploadKind = 'weekly' | 'next';

export interface UploadRowError {
  rowNumber: number;
  reason: string;
}

export interface StandardUploadPreview {
  fileName: string;
  kind?: StandardUploadKind;
  templateName?: string;
  sheetName?: string;
  headers: string[];
  missingFields: string[];
  totalRows: number;
  validRows: number;
  errors: UploadRowError[];
  rows: Array<Record<string, string | number>>;
}
