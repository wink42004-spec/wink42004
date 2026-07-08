import type { DashboardTabKey, DeliveryMetric } from '../types/dashboard';

type DashboardMockData = Record<string, Record<DashboardTabKey, DeliveryMetric[]>>;

export const dashboardMockData: DashboardMockData = {
  'teacher-chen': {
    weekly: [
      { id: 'read', title: '阅读量', value: '128,400', trend: '+18.6%' },
      { id: 'fans', title: '新增关注', value: '3,260', trend: '+9.2%' },
      { id: 'cost', title: '投放消耗', value: '¥42,800', trend: '-3.1%' },
    ],
    nextWeek: [
      { id: 'articles', title: '计划文章', value: '12 篇', trend: '+2 篇' },
      { id: 'budget', title: '计划预算', value: '¥58,000', trend: '+15.4%' },
      { id: 'accounts', title: '投放账号', value: '8 个', trend: '稳定' },
    ],
    history: [
      { id: 'total-read', title: '累计阅读', value: '1,826,000', trend: '+24.8%' },
      { id: 'total-fans', title: '累计关注', value: '48,900', trend: '+12.5%' },
      { id: 'roi', title: '平均 ROI', value: '2.7', trend: '+0.4' },
    ],
  },
  'teacher-li': {
    weekly: [
      { id: 'read', title: '阅读量', value: '76,300', trend: '+6.4%' },
      { id: 'fans', title: '新增关注', value: '1,840', trend: '+3.8%' },
      { id: 'cost', title: '投放消耗', value: '¥28,600', trend: '+1.2%' },
    ],
    nextWeek: [],
    history: [
      { id: 'total-read', title: '累计阅读', value: '935,000', trend: '+16.1%' },
      { id: 'total-fans', title: '累计关注', value: '22,700', trend: '+8.6%' },
      { id: 'roi', title: '平均 ROI', value: '2.2', trend: '+0.2' },
    ],
  },
  'teacher-wang': {
    weekly: [
      { id: 'read', title: '阅读量', value: '94,900', trend: '+11.7%' },
      { id: 'fans', title: '新增关注', value: '2,430', trend: '+7.3%' },
      { id: 'cost', title: '投放消耗', value: '¥35,200', trend: '-1.9%' },
    ],
    nextWeek: [
      { id: 'articles', title: '计划文章', value: '9 篇', trend: '+1 篇' },
      { id: 'budget', title: '计划预算', value: '¥39,500', trend: '+8.3%' },
      { id: 'accounts', title: '投放账号', value: '6 个', trend: '稳定' },
    ],
    history: [
      { id: 'total-read', title: '累计阅读', value: '1,204,000', trend: '+19.7%' },
      { id: 'total-fans', title: '累计关注', value: '31,600', trend: '+10.9%' },
      { id: 'roi', title: '平均 ROI', value: '2.5', trend: '+0.3' },
    ],
  },
};
