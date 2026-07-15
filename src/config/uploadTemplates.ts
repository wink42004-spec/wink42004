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

export const uploadTemplates: Record<StandardTemplateKind, TemplateConfig> = {
  weekly: {
    kind: 'weekly',
    name: '本期投放模板',
    version: 'v1.0',
    versionDate: '2026-07-15',
    sheetName: '上传数据',
    fileName: 'current-period-upload-template.xlsx',
    fields: [
      '所属老师',
      '投放周期',
      '公众号名称',
      '投放位置',
      '发文日期',
      '文章标题',
      '文章链接',
      '投放金额',
      '阅读量',
      '加微量',
      '成交量',
      '成交金额',
      '备注',
    ],
    detectFields: ['发文日期', '阅读量', '成交量'],
    requiredFields: [
      '所属老师',
      '投放周期',
      '公众号名称',
      '发文日期',
      '文章标题',
      '投放金额',
      '阅读量',
      '加微量',
      '成交量',
      '成交金额',
    ],
  },
  next: {
    kind: 'next',
    name: '下期排期模板',
    version: 'v1.0',
    versionDate: '2026-07-15',
    sheetName: '上传数据',
    fileName: 'next-period-upload-template.xlsx',
    fields: [
      '所属老师',
      '投放周期',
      '公众号名称',
      '计划投放日期',
      '文章标题',
      '计划金额',
      '付款状态',
      '发布状态',
      '对接人',
      '备注',
    ],
    detectFields: ['计划投放日期', '付款状态', '发布状态'],
    requiredFields: [
      '所属老师',
      '投放周期',
      '公众号名称',
      '计划投放日期',
      '文章标题',
      '计划金额',
      '付款状态',
      '发布状态',
    ],
  },
};

export const standardTemplateList = [uploadTemplates.weekly, uploadTemplates.next];
