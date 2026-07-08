export interface WeeklyDeliveryRow {
  id: string;
  teacherId: string;
  weekStartDate: string;
  accountName: string;
  deliveryTime: string;
  articleTitle: string;
  spendAmount: number;
  adReadCount: number;
  wechatAdds: number;
  dealCount: number;
  dealAmount: number;
}

export interface WeeklyDeliveryViewRow extends WeeklyDeliveryRow {
  wechatAddCost: number;
  wechatAddRate: number;
  readCost: number;
  roi: number;
}
