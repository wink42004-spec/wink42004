export type StandardTemplateKind = 'weekly' | 'next';

export interface TemplateConfig {
  kind: StandardTemplateKind;
  name: string;
  version: string;
  versionDate: string;
  sheetName: string;
  fileName: string;
  fields: string[];
  detectFields: string[];
  requiredFields: string[];
}

const text = {
  weeklyTemplate: '\u672c\u671f\u6295\u653e\u6a21\u677f',
  nextTemplate: '\u4e0b\u671f\u6392\u671f\u6a21\u677f',
  sheetName: '\u4e0a\u4f20\u6570\u636e',
  teacher: '\u6240\u5c5e\u8001\u5e08',
  period: '\u6295\u653e\u5468\u671f',
  accountName: '\u516c\u4f17\u53f7\u540d\u79f0',
  placement: '\u6295\u653e\u4f4d\u7f6e',
  publishDate: '\u53d1\u6587\u65e5\u671f',
  articleTitle: '\u6587\u7ae0\u6807\u9898',
  articleUrl: '\u6587\u7ae0\u94fe\u63a5',
  deliveryAmount: '\u6295\u653e\u91d1\u989d',
  readCount: '\u9605\u8bfb\u91cf',
  addWechatCount: '\u52a0\u5fae\u91cf',
  dealCount: '\u6210\u4ea4\u91cf',
  dealAmount: '\u6210\u4ea4\u91d1\u989d',
  remark: '\u5907\u6ce8',
  plannedDate: '\u8ba1\u5212\u6295\u653e\u65e5\u671f',
  plannedAmount: '\u8ba1\u5212\u91d1\u989d',
  paymentStatus: '\u4ed8\u6b3e\u72b6\u6001',
  publishStatus: '\u53d1\u5e03\u72b6\u6001',
  contactPerson: '\u5bf9\u63a5\u4eba',
};

export const uploadTemplates: Record<StandardTemplateKind, TemplateConfig> = {
  weekly: {
    kind: 'weekly',
    name: text.weeklyTemplate,
    version: 'v1.0',
    versionDate: '2026-07-15',
    sheetName: text.sheetName,
    fileName: 'current-period-upload-template.xlsx',
    fields: [
      text.teacher,
      text.period,
      text.accountName,
      text.placement,
      text.publishDate,
      text.articleTitle,
      text.articleUrl,
      text.deliveryAmount,
      text.readCount,
      text.addWechatCount,
      text.dealCount,
      text.dealAmount,
      text.remark,
    ],
    detectFields: [text.publishDate, text.readCount, text.dealCount],
    requiredFields: [
      text.teacher,
      text.period,
      text.accountName,
      text.publishDate,
      text.articleTitle,
      text.deliveryAmount,
      text.readCount,
      text.addWechatCount,
      text.dealCount,
      text.dealAmount,
    ],
  },
  next: {
    kind: 'next',
    name: text.nextTemplate,
    version: 'v1.0',
    versionDate: '2026-07-15',
    sheetName: text.sheetName,
    fileName: 'next-period-upload-template.xlsx',
    fields: [
      text.teacher,
      text.period,
      text.accountName,
      text.plannedDate,
      text.articleTitle,
      text.plannedAmount,
      text.paymentStatus,
      text.publishStatus,
      text.contactPerson,
      text.remark,
    ],
    detectFields: [text.plannedDate, text.paymentStatus, text.publishStatus],
    requiredFields: [
      text.teacher,
      text.period,
      text.accountName,
      text.plannedDate,
      text.articleTitle,
      text.plannedAmount,
      text.paymentStatus,
      text.publishStatus,
    ],
  },
};

export const standardTemplateList = [uploadTemplates.weekly, uploadTemplates.next];
