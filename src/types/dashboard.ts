export interface DeliveryMetric {
  id: string;
  title: string;
  value: string;
  trend: string;
}

export type DashboardTabKey = 'weekly' | 'nextWeek' | 'history';
