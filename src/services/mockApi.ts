import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { uploadTemplates } from '../config/uploadTemplates';
import { getCurrentUserSync } from './mockAuthApi';
import type {
  AccountPerformance,
  AuditLog,
  DashboardScreenData,
  DashboardTabKey,
  DeliveryMetric,
  ExcelSourceType,
  ExcelUploadResult,
  HistorySummary,
  NextWeekPlan,
  PaymentStatus,
  StandardUploadPreview,
  Teacher,
  UploadSourceType,
  VersionRecord,
  WeeklyDelivery,
  WeeklyDeliveryView,
} from '../types/shared';

const ACTION_CREATE = '\u65b0\u589e';
const ACTION_UPDATE = '\u4fee\u6539';
const ACTION_UPLOAD = '\u4e0a\u4f20';
const ACTION_DELETE = '\u5220\u9664';
const ACTION_RECALC = '\u91cd\u7b97\u516c\u5f0f';
const MODULE_WEEKLY = '\u672c\u671f\u6295\u653e';
const MODULE_NEXT = '\u4e0b\u671f\u6295\u653e';
const MODULE_HISTORY = '\u5386\u53f2\u6c47\u603b';
const MODULE_TEACHER = '\u8001\u5e08\u7ba1\u7406';

const now = '2026-07-08 10:00';
const auditBase = {
  createdBy: 'system',
  createdAt: now,
  updatedBy: 'system',
  updatedAt: now,
};

let teachers: Teacher[] = [
  { id: 'teacher-zhang', name: 'Zhang' },
  { id: 'teacher-li', name: 'Li' },
  { id: 'teacher-wang', name: 'Wang' },
];

const mockGuestWeeklyRows: WeeklyDelivery[] = [
  {
    ...auditBase,
    id: 'guest-weekly-1',
    period: '2026-07 P1',
    weekStartDate: '2026-07-06',
    accountName: 'Demo Account A',
    paymentChannel: 'Bank',
    placement: 'Top',
    deliveryTime: '2026-07-06 10:30',
    articleTitle: 'Demo campaign: summer planning',
    courseCode: 'MOCK-101',
    articleUrl: 'https://example.com/mock-a',
    spendAmount: 6800,
    normalReadCount: 42800,
    readCount: 16200,
    adReadCount: 16200,
    wechatAdds: 520,
    dealCount: 31,
    coursePrice: 445,
    dealAmount: 0,
  },
  {
    ...auditBase,
    id: 'guest-weekly-2',
    period: '2026-07 P1',
    weekStartDate: '2026-07-06',
    accountName: 'Demo Account B',
    paymentChannel: 'Wechat',
    placement: 'Second',
    deliveryTime: '2026-07-07 19:45',
    articleTitle: 'Demo campaign: parent decision path',
    courseCode: 'MOCK-202',
    articleUrl: 'https://example.com/mock-b',
    spendAmount: 5200,
    normalReadCount: 26600,
    readCount: 9800,
    adReadCount: 9800,
    wechatAdds: 310,
    dealCount: 12,
    coursePrice: 433,
    dealAmount: 0,
  },
];

const realCompanyWeeklyRows: WeeklyDelivery[] = [
  {
    ...auditBase,
    id: 'real-weekly-1',
    period: '2026-07 P1',
    weekStartDate: '2026-07-06',
    accountName: 'Growth Lab',
    paymentChannel: 'Bank',
    placement: 'Top',
    deliveryTime: '2026-07-06 10:30',
    articleTitle: 'Build a 30-day learning loop',
    courseCode: 'GROW-30',
    articleUrl: 'https://example.com/real-growth',
    spendAmount: 12800,
    normalReadCount: 86400,
    readCount: 32600,
    adReadCount: 32600,
    wechatAdds: 1260,
    dealCount: 94,
    coursePrice: 364,
    dealAmount: 0,
  },
  {
    ...auditBase,
    id: 'real-weekly-2',
    period: '2026-07 P1',
    weekStartDate: '2026-07-06',
    accountName: 'Insight Notes',
    paymentChannel: 'Wechat',
    placement: 'Second',
    deliveryTime: '2026-07-07 19:45',
    articleTitle: 'Information gap in planning',
    courseCode: 'EDU-INFO',
    articleUrl: 'https://example.com/real-note',
    spendAmount: 9600,
    normalReadCount: 52100,
    readCount: 21400,
    adReadCount: 21400,
    wechatAdds: 790,
    dealCount: 53,
    coursePrice: 311,
    dealAmount: 0,
  },
];

const mockGuestPlans: NextWeekPlan[] = [
  {
    ...auditBase,
    id: 'guest-plan-1',
    accountName: 'Demo Account A',
    plannedTime: '2026-07-13 10:30',
    articleTitle: 'Demo schedule',
    courseCode: 'MOCK-303',
    articleUrl: 'https://example.com/mock-plan-a',
    plannedAmount: 7000,
    layoutStatus: 'processing',
    paymentStatus: 'partial',
    sortOrder: 1,
  },
];

const realCompanyPlans: NextWeekPlan[] = [
  {
    ...auditBase,
    id: 'real-plan-1',
    accountName: 'Growth Lab',
    plannedTime: '2026-07-13 10:30',
    articleTitle: 'Summer learning reset',
    courseCode: 'GROW-SUMMER',
    articleUrl: 'https://example.com/plan-growth',
    plannedAmount: 15800,
    layoutStatus: 'done',
    paymentStatus: 'partial',
    sortOrder: 1,
  },
];

let guestWeeklyRows = mockGuestWeeklyRows.map(recalculateWeeklyRow);
let realWeeklyRows = realCompanyWeeklyRows.map(recalculateWeeklyRow);
let guestArchivedWeeklyRows: WeeklyDelivery[] = [];
let realArchivedWeeklyRows: WeeklyDelivery[] = [];
let guestPlans = [...mockGuestPlans];
let realPlans = [...realCompanyPlans];
let versionRecords: VersionRecord[] = [];
let uploadVersionNo = 0;
let accountLevelRules = new Map<string, string>();
let titleRoiTrend: Array<{ title: string; date: string; roi: number }> = [];

let auditLogs: AuditLog[] = [
  {
    id: 'audit-1',
    time: now,
    operatorName: 'system',
    actionType: ACTION_CREATE,
    module: MODULE_WEEKLY,
    target: 'initial data',
    before: '-',
    after: 'initialized',
  },
];

function delay(ms = 260) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function timestamp() {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}

function canReadRealData() {
  const user = getCurrentUserSync();
  return user.status === 'approved' || user.isAdmin;
}

function canReadAnyData() {
  const user = getCurrentUserSync();
  return user.status === 'guest' || canReadRealData();
}

function weeklyStore() {
  return canReadRealData() ? realWeeklyRows : guestWeeklyRows;
}

function setWeeklyStore(rows: WeeklyDelivery[]) {
  if (canReadRealData()) realWeeklyRows = rows;
  else guestWeeklyRows = rows;
}

function archivedWeeklyStore() {
  return canReadRealData() ? realArchivedWeeklyRows : guestArchivedWeeklyRows;
}

function setArchivedWeeklyStore(rows: WeeklyDelivery[]) {
  if (canReadRealData()) realArchivedWeeklyRows = rows;
  else guestArchivedWeeklyRows = rows;
}

function planStore() {
  return canReadRealData() ? realPlans : guestPlans;
}

function setPlanStore(rows: NextWeekPlan[]) {
  if (canReadRealData()) realPlans = rows;
  else guestPlans = rows;
}

function stringifyAudit(value: unknown) {
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function writeAudit(
  operatorName: string,
  actionType: string,
  module: string,
  target: string,
  before: unknown,
  after: unknown,
) {
  auditLogs = [
    {
      id: `audit-${Date.now()}-${Math.random()}`,
      time: timestamp(),
      operatorName,
      actionType,
      module,
      target,
      before: stringifyAudit(before),
      after: stringifyAudit(after),
    },
    ...auditLogs,
  ];
}

function writeVersion(
  module: string,
  targetId: string,
  targetName: string,
  operatorName: string,
  before: unknown,
  after: unknown,
  meta?: Partial<VersionRecord>,
) {
  versionRecords = [
    {
      id: `version-${Date.now()}-${Math.random()}`,
      module,
      targetId,
      targetName,
      versionTime: timestamp(),
      operatorName,
      before: stringifyAudit(before),
      after: stringifyAudit(after),
      ...meta,
    },
    ...versionRecords,
  ];
}

function withUpdate<T extends { updatedBy: string; updatedAt: string }>(
  row: T,
  operatorName: string,
) {
  return { ...row, updatedBy: operatorName, updatedAt: timestamp() };
}

function recalculateWeeklyRow(row: WeeklyDelivery): WeeklyDelivery {
  const adReadCount = Number(row.adReadCount ?? row.readCount ?? 0);
  const coursePrice = Number(row.coursePrice ?? 0);
  const dealAmount =
    coursePrice > 0 ? Number(row.dealCount ?? 0) * coursePrice : Number(row.dealAmount ?? 0);
  return {
    ...row,
    readCount: adReadCount,
    adReadCount,
    spendAmount: Number(row.spendAmount ?? 0),
    wechatAdds: Number(row.wechatAdds ?? 0),
    dealCount: Number(row.dealCount ?? 0),
    coursePrice,
    dealAmount,
  };
}

function toWeeklyView(row: WeeklyDelivery): WeeklyDeliveryView {
  const normalized = recalculateWeeklyRow(row);
  const adReadCount = normalized.adReadCount ?? normalized.readCount;
  return {
    ...normalized,
    wechatAddCost:
      normalized.wechatAdds > 0 ? normalized.spendAmount / normalized.wechatAdds : 0,
    wechatAddRate: adReadCount > 0 ? normalized.wechatAdds / adReadCount : 0,
    readCost: adReadCount > 0 ? normalized.spendAmount / adReadCount : 0,
    conversionRate:
      normalized.wechatAdds > 0 ? normalized.dealCount / normalized.wechatAdds : 0,
    roi: normalized.spendAmount > 0 ? normalized.dealAmount / normalized.spendAmount : 0,
  };
}

function getAllWeeklyViews() {
  if (!canReadAnyData()) return [];
  return weeklyStore().map(toWeeklyView);
}

function getHistoryWeeklyViews() {
  if (!canReadAnyData()) return [];
  return [...archivedWeeklyStore(), ...weeklyStore()].map(toWeeklyView);
}

export async function getTeachers() {
  await delay(120);
  return [...teachers];
}

export async function addTeacher(name: string, operatorName: string) {
  await delay();
  const teacher = { id: `teacher-${Date.now()}`, name };
  teachers = [...teachers, teacher];
  writeAudit(operatorName, ACTION_CREATE, MODULE_TEACHER, name, '-', teacher);
  return [...teachers];
}

export async function renameTeacher(
  teacherId: string,
  name: string,
  operatorName: string,
) {
  await delay();
  const before = teachers.find((teacher) => teacher.id === teacherId);
  teachers = teachers.map((teacher) =>
    teacher.id === teacherId ? { ...teacher, name } : teacher,
  );
  writeAudit(operatorName, ACTION_UPDATE, MODULE_TEACHER, name, before ?? '-', name);
  return [...teachers];
}

export async function getWeeklyData(weekStartDate: string) {
  await delay();
  return getAllWeeklyViews().filter((row) => row.weekStartDate === weekStartDate);
}

export async function createWeeklyData(
  payload: Omit<WeeklyDelivery, 'id' | keyof typeof auditBase>,
  operatorName: string,
) {
  await delay();
  const row = recalculateWeeklyRow({
    ...payload,
    id: `weekly-${Date.now()}`,
    createdBy: operatorName,
    createdAt: timestamp(),
    updatedBy: operatorName,
    updatedAt: timestamp(),
  });
  setWeeklyStore([row, ...weeklyStore()]);
  writeAudit(operatorName, ACTION_CREATE, MODULE_WEEKLY, row.accountName, '-', row);
  return toWeeklyView(row);
}

export async function updateWeeklyData(
  rowId: string,
  patch: Partial<WeeklyDelivery>,
  operatorName: string,
) {
  await delay();
  const rows = weeklyStore();
  const before = rows.find((row) => row.id === rowId);
  if (!before) throw new Error('Record not found');
  const after = recalculateWeeklyRow(withUpdate({ ...before, ...patch }, operatorName));
  setWeeklyStore(rows.map((row) => (row.id === rowId ? after : row)));
  writeAudit(operatorName, ACTION_UPDATE, MODULE_WEEKLY, after.accountName, before, after);
  writeVersion(MODULE_WEEKLY, after.id, after.accountName, operatorName, before, after);
  return toWeeklyView(after);
}

export async function deleteWeeklyData(rowId: string, operatorName: string) {
  await delay();
  const rows = weeklyStore();
  const before = rows.find((row) => row.id === rowId);
  setWeeklyStore(rows.filter((row) => row.id !== rowId));
  writeAudit(operatorName, ACTION_DELETE, MODULE_WEEKLY, before?.accountName ?? rowId, before ?? '-', '-');
}

export async function uploadWeeklyCsv(text: string, operatorName: string) {
  return uploadDataFile('csv', 'weekly.csv', text, operatorName);
}

export async function archiveCurrentWeeklyData(operatorName: string) {
  await delay();
  const archivedAt = timestamp();
  const currentRows = weeklyStore();
  const planRows = planStore();
  const archivedRows = currentRows.map((row) =>
    recalculateWeeklyRow({
      ...row,
      period: row.period || row.weekStartDate,
      updatedBy: operatorName,
      updatedAt: archivedAt,
      uploadedBy: row.uploadedBy ?? operatorName,
      uploadedAt: row.uploadedAt ?? archivedAt,
    }),
  );
  const nextWeeklyRows = planRows.map((plan, index) => {
    const plannedDate = dayjs(plan.plannedTime);
    const weekStartDate = plannedDate.isValid()
      ? plannedDate.startOf('week').add(1, 'day').format('YYYY-MM-DD')
      : dayjs().startOf('week').add(1, 'day').format('YYYY-MM-DD');
    return recalculateWeeklyRow({
      id: `weekly-from-plan-${Date.now()}-${index}`,
      teacherId: plan.teacherId,
      period: plan.period || weekStartDate,
      weekStartDate,
      accountName: plan.accountName,
      placement: undefined,
      deliveryTime: plan.plannedTime,
      articleTitle: plan.articleTitle,
      courseCode: plan.courseCode,
      articleUrl: plan.articleUrl,
      spendAmount: plan.plannedAmount,
      readCount: 0,
      adReadCount: 0,
      wechatAdds: 0,
      dealCount: 0,
      coursePrice: 0,
      dealAmount: 0,
      createdBy: operatorName,
      createdAt: archivedAt,
      updatedBy: operatorName,
      updatedAt: archivedAt,
      uploadedBy: plan.uploadedBy ?? operatorName,
      uploadedAt: plan.uploadedAt ?? archivedAt,
      raw: {
        sourcePlanId: plan.id,
        paymentStatus: plan.paymentStatus,
        layoutStatus: plan.layoutStatus,
        contactPerson: plan.contactPerson ?? '',
        remark: plan.remark ?? '',
      },
    });
  });

  setArchivedWeeklyStore([...archivedRows, ...archivedWeeklyStore()]);
  setWeeklyStore(nextWeeklyRows);
  setPlanStore([]);
  writeAudit(
    operatorName,
    ACTION_UPDATE,
    MODULE_WEEKLY,
    '归档本期投放',
    `Archived ${currentRows.length} current rows`,
    `Promoted ${planRows.length} next rows`,
  );
  writeVersion(
    MODULE_HISTORY,
    `archive-${Date.now()}`,
    '归档本期投放',
    operatorName,
    currentRows,
    nextWeeklyRows,
    {
      uploadedBy: operatorName,
      uploadedAt: archivedAt,
      sheetName: '归档本期投放',
      versionNo: ++uploadVersionNo,
    },
  );
  return {
    archivedCount: archivedRows.length,
    promotedCount: nextWeeklyRows.length,
    archivedAt,
  };
}

export async function previewStandardExcelUpload(
  fileName: string,
  buffer: ArrayBuffer,
): Promise<StandardUploadPreview> {
  await delay(80);
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = uploadTemplates.weekly.sheetName;
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return {
      fileName,
      sheetName,
      headers: [],
      missingFields: [sheetName],
      totalRows: 0,
      validRows: 0,
      errors: [{ rowNumber: 0, reason: '缺少 Sheet：上传数据' }],
      rows: [],
    };
  }

  const matrix = XLSX.utils.sheet_to_json<Array<string | number | Date>>(sheet, {
    header: 1,
    defval: '',
    raw: true,
  });
  const headerIndex = matrix.findIndex((row) => row.some((cell) => String(cell).trim()));
  if (headerIndex < 0) {
    return {
      fileName,
      sheetName,
      headers: [],
      missingFields: [],
      totalRows: 0,
      validRows: 0,
      errors: [{ rowNumber: 0, reason: 'Sheet 为空' }],
      rows: [],
    };
  }

  const headers = matrix[headerIndex].map((cell) => normalizeHeader(String(cell)));
  const kind = detectTemplateKind(headers);
  const config = kind ? uploadTemplates[kind] : undefined;
  const missingFields = config
    ? config.requiredFields.filter((field) => !headers.includes(normalizeHeader(field)))
    : ['无法识别模板字段'];
  const rows: Array<Record<string, string | number>> = [];
  const errors: Array<{ rowNumber: number; reason: string }> = [];

  matrix.slice(headerIndex + 1).forEach((line, index) => {
    const rowNumber = headerIndex + index + 2;
    if (line.every((cell) => String(cell ?? '').trim() === '')) return;
    const row: Record<string, string | number> = {};
    headers.forEach((header, cellIndex) => {
      if (!header) return;
      row[header] = normalizeCellValue(line[cellIndex]);
    });
    if (shouldSkipRow(row, sheetName)) return;
    if (config) {
      const blankFields = config.requiredFields.filter((field) => {
        const value = row[normalizeHeader(field)];
        return value === undefined || String(value).trim() === '';
      });
      if (blankFields.length > 0) {
        errors.push({ rowNumber, reason: `必填字段为空：${blankFields.join('、')}` });
      }
    }
    rows.push(row);
  });

  return {
    fileName,
    kind,
    templateName: config?.name,
    sheetName,
    headers,
    missingFields,
    totalRows: rows.length,
    validRows: missingFields.length === 0 ? rows.length - errors.length : 0,
    errors,
    rows,
  };
}

export async function commitStandardExcelUpload(
  preview: StandardUploadPreview,
  operatorName: string,
): Promise<ExcelUploadResult> {
  await delay();
  if (!preview.kind) throw new Error('无法识别上传模板');
  if (preview.missingFields.length > 0) throw new Error('模板字段不完整');
  if (preview.errors.length > 0) throw new Error('存在错误行，无法导入');

  uploadVersionNo += 1;
  const versionNo = uploadVersionNo;
  const uploadedAt = timestamp();

  if (preview.kind === 'weekly') {
    const weeklyRows = preview.rows.map((row, index) =>
      standardRowToWeekly(row, index, operatorName, uploadedAt),
    );
    setWeeklyStore([...weeklyRows, ...weeklyStore()]);
    writeAudit(operatorName, ACTION_UPLOAD, MODULE_WEEKLY, preview.fileName, '-', `Imported ${weeklyRows.length} rows`);
    writeAudit(operatorName, ACTION_RECALC, MODULE_WEEKLY, preview.fileName, '-', 'Formula fields recalculated');
  } else {
    const planRows = preview.rows.map((row, index) =>
      standardRowToPlan(row, index, operatorName, uploadedAt),
    );
    setPlanStore([...planStore(), ...planRows]);
    writeAudit(operatorName, ACTION_UPLOAD, MODULE_NEXT, preview.fileName, '-', `Imported ${planRows.length} rows`);
  }

  writeVersion(preview.kind === 'weekly' ? MODULE_WEEKLY : MODULE_NEXT, `standard-upload-${versionNo}`, preview.fileName, operatorName, '-', `Imported ${preview.validRows} rows`, {
    uploadedBy: operatorName,
    uploadedAt,
    sheetName: preview.sheetName,
    versionNo,
  });

  return {
    sourceType: preview.kind === 'weekly' ? 'trainingCamp' : 'officialAccount',
    fileName: preview.fileName,
    sheetCount: 1,
    rowCount: preview.validRows,
    versionNo,
    structured: true,
  };
}

export async function uploadExcelDataSource(
  sourceType: ExcelSourceType,
  fileName: string,
  buffer: ArrayBuffer,
  operatorName: string,
): Promise<ExcelUploadResult> {
  const preview = await previewStandardExcelUpload(fileName, buffer);
  const result = await commitStandardExcelUpload(preview, operatorName);
  return { ...result, sourceType };
  await delay();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  uploadVersionNo += 1;
  const versionNo = uploadVersionNo;
  const uploadedAt = timestamp();
  let importedRows = 0;
  const importedWeeklyRows: WeeklyDelivery[] = [];

  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const matrix = XLSX.utils.sheet_to_json<Array<string | number | Date>>(sheet, {
      header: 1,
      defval: '',
      raw: false,
    });
    const rows = rowsFromSheet(matrix, sheetName);
    if (sourceType === 'officialAccount' && sheetName.includes('账号评估模型')) {
      rows.forEach((row) => {
        const accountName = stringValue(row, ['账号', '账号名称', '公众号', '公众号名称', 'account']);
        const accountLevel = stringValue(row, ['账号等级', '等级', '评估等级', 'level']);
        if (accountName && accountLevel) accountLevelRules.set(accountName, accountLevel);
      });
    } else if (sourceType === 'officialAccount' && sheetName.includes('标题ROI波动')) {
      titleRoiTrend = rows.map((row) => ({
        title: stringValue(row, ['标题', '文章标题', '投放标题', 'title']) ?? 'Untitled',
        date: stringValue(row, ['日期', '时间', '发文时间', 'date']) || sheetName,
        roi: numberValue(row, ['ROI', 'roi']),
      }));
    } else {
      const weeklyRows = rows.map((row, index) =>
        excelRowToWeekly(row, sheetName, index, operatorName, uploadedAt),
      );
      importedWeeklyRows.push(...weeklyRows);
      importedRows += weeklyRows.length;
    }

    writeVersion(MODULE_WEEKLY, `upload-${versionNo}-${sheetName}`, `${fileName}/${sheetName}`, operatorName, '-', `Imported ${rows.length} rows`, {
      uploadedBy: operatorName,
      uploadedAt,
      sheetName,
      versionNo,
    });
  });

  if (importedWeeklyRows.length > 0) {
    setWeeklyStore([...importedWeeklyRows, ...weeklyStore()]);
  }
  writeAudit(operatorName, ACTION_UPLOAD, sourceType === 'officialAccount' ? MODULE_HISTORY : MODULE_WEEKLY, fileName, '-', `Parsed ${workbook.SheetNames.length} sheets, imported ${importedRows} rows`);
  writeAudit(operatorName, ACTION_RECALC, MODULE_WEEKLY, fileName, '-', 'Formula fields recalculated');

  return {
    sourceType,
    fileName,
    sheetCount: workbook.SheetNames.length,
    rowCount: importedRows,
    versionNo,
    structured: true,
  };
}

export async function uploadDataFile(
  sourceType: UploadSourceType,
  fileName: string,
  file: ArrayBuffer | string,
  operatorName: string,
): Promise<ExcelUploadResult> {
  if (sourceType === 'trainingCamp' || sourceType === 'officialAccount') {
    if (typeof file === 'string') throw new Error('Excel file content is invalid');
    return uploadExcelDataSource(sourceType, fileName, file, operatorName);
  }

  await delay();
  uploadVersionNo += 1;
  const versionNo = uploadVersionNo;
  const uploadedAt = timestamp();

  if (sourceType === 'csv') {
    const text = typeof file === 'string' ? file : new TextDecoder('utf-8').decode(file);
    const rows = rowsFromSheet(csvToMatrix(text), fileName);
    const weeklyRows = rows.map((row, index) =>
      excelRowToWeekly(row, fileName, index, operatorName, uploadedAt),
    );
    if (weeklyRows.length > 0) setWeeklyStore([...weeklyRows, ...weeklyStore()]);
    writeVersion(MODULE_WEEKLY, `upload-${versionNo}-${fileName}`, fileName, operatorName, '-', `Imported ${weeklyRows.length} rows`, {
      uploadedBy: operatorName,
      uploadedAt,
      sheetName: fileName,
      versionNo,
    });
    writeAudit(operatorName, ACTION_UPLOAD, MODULE_WEEKLY, fileName, '-', `CSV imported ${weeklyRows.length} rows`);
    writeAudit(operatorName, ACTION_RECALC, MODULE_WEEKLY, fileName, '-', 'Formula fields recalculated');
    return {
      sourceType,
      fileName,
      sheetCount: 1,
      rowCount: weeklyRows.length,
      versionNo,
      structured: true,
    };
  }

  const fileSize = typeof file === 'string' ? new Blob([file]).size : file.byteLength;
  writeVersion(MODULE_WEEKLY, `attachment-${versionNo}-${fileName}`, fileName, operatorName, '-', `${sourceType} attachment, ${fileSize} bytes`, {
    uploadedBy: operatorName,
    uploadedAt,
    sheetName: 'attachment',
    versionNo,
  });
  writeAudit(operatorName, ACTION_UPLOAD, MODULE_WEEKLY, fileName, '-', `${sourceType} attachment recorded`);
  return {
    sourceType,
    fileName,
    sheetCount: 0,
    rowCount: 0,
    versionNo,
    structured: false,
  };
}

export async function getNextWeekPlan() {
  await delay();
  if (!canReadAnyData()) return [];
  return [...planStore()].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createPlan(
  payload: Omit<NextWeekPlan, 'id' | 'sortOrder' | keyof typeof auditBase>,
  operatorName: string,
) {
  await delay();
  const row: NextWeekPlan = {
    ...payload,
    id: `plan-${Date.now()}`,
    sortOrder: planStore().length + 1,
    createdBy: operatorName,
    createdAt: timestamp(),
    updatedBy: operatorName,
    updatedAt: timestamp(),
  };
  setPlanStore([...planStore(), row]);
  writeAudit(operatorName, ACTION_CREATE, MODULE_NEXT, row.accountName, '-', row);
  return row;
}

export async function updatePlan(
  planId: string,
  patch: Partial<NextWeekPlan>,
  operatorName: string,
) {
  await delay();
  const rows = planStore();
  const before = rows.find((row) => row.id === planId);
  if (!before) throw new Error('Plan not found');
  const after = withUpdate({ ...before, ...patch }, operatorName);
  setPlanStore(rows.map((row) => (row.id === planId ? after : row)));
  writeAudit(operatorName, ACTION_UPDATE, MODULE_NEXT, after.accountName, before, after);
  writeVersion(MODULE_NEXT, after.id, after.accountName, operatorName, before, after);
  return after;
}

export async function deletePlan(planId: string, operatorName: string) {
  await delay();
  const rows = planStore();
  const before = rows.find((row) => row.id === planId);
  setPlanStore(rows.filter((row) => row.id !== planId));
  writeAudit(operatorName, ACTION_DELETE, MODULE_NEXT, before?.accountName ?? planId, before ?? '-', '-');
}

export async function uploadPlanCsv(text: string, operatorName: string) {
  await delay();
  const rows = parseCsv(text).map((cols, index): NextWeekPlan => ({
    id: `plan-upload-${Date.now()}-${index}`,
    accountName: cols[0] || 'Unnamed account',
    plannedTime: cols[1] || timestamp(),
    articleTitle: cols[2] || 'Untitled',
    courseCode: cols[3] || undefined,
    articleUrl: cols[4] || undefined,
    plannedAmount: Number(cols[5]) || 0,
    layoutStatus: (cols[6] as NextWeekPlan['layoutStatus']) || 'pending',
    paymentStatus: (cols[7] as PaymentStatus) || 'unpaid',
    sortOrder: planStore().length + index + 1,
    createdBy: operatorName,
    createdAt: timestamp(),
    updatedBy: operatorName,
    updatedAt: timestamp(),
    uploadedBy: operatorName,
    uploadedAt: timestamp(),
  }));
  setPlanStore([...planStore(), ...rows]);
  writeAudit(operatorName, ACTION_UPLOAD, MODULE_NEXT, 'CSV', '-', `Imported ${rows.length} rows`);
}

export async function getAccountHistory(accountName: string) {
  await delay();
  return getHistoryWeeklyViews().filter((row) => row.accountName === accountName);
}

export async function getHistorySummary(): Promise<HistorySummary> {
  await delay();
  const rows = getHistoryWeeklyViews();
  const accountMap = new Map<string, WeeklyDeliveryView[]>();
  rows.forEach((row) => {
    accountMap.set(row.accountName, [...(accountMap.get(row.accountName) ?? []), row]);
  });
  const accountPerformance: AccountPerformance[] = [...accountMap.entries()].map(
    ([accountName, list], index) => {
      const totalSpendAmount = sum(list, 'spendAmount');
      const totalReadCount = sum(list, 'adReadCount');
      const totalLeads = sum(list, 'wechatAdds');
      const totalDeals = sum(list, 'dealCount');
      const dealAmount = sum(list, 'dealAmount');
      const uploadedAtList = list
        .map((row) => row.uploadedAt ?? row.updatedAt ?? row.createdAt)
        .filter(Boolean)
        .sort();
      return {
        id: `perf-${index}`,
        accountName,
        uploadedAt: uploadedAtList[uploadedAtList.length - 1],
        periods: [...new Set(list.map((row) => row.period || row.weekStartDate).filter(Boolean))],
        accountLevel:
          accountLevelRules.get(accountName) ??
          inferAccountLevel(dealAmount / Math.max(totalSpendAmount, 1)),
        cooperationCount: list.length,
        totalReadCount,
        averageReadCount: totalReadCount / Math.max(list.length, 1),
        totalLeads,
        leadCost: totalSpendAmount / Math.max(totalLeads, 1),
        addWechatRate: totalLeads / Math.max(totalReadCount, 1),
        conversionRate: totalDeals / Math.max(totalLeads, 1),
        roi: dealAmount / Math.max(totalSpendAmount, 1),
        totalDeals,
        totalSpendAmount,
      };
    },
  );
  const totalSpendAmount = sum(rows, 'spendAmount');
  const totalLeads = sum(rows, 'wechatAdds');
  const totalDeals = sum(rows, 'dealCount');
  const dealAmount = sum(rows, 'dealAmount');
  return {
    kpi: {
      totalSpendAmount,
      totalLeads,
      totalDeals,
      overallRoi: dealAmount / Math.max(totalSpendAmount, 1),
      averageLeadCost: totalSpendAmount / Math.max(totalLeads, 1),
    },
    accountPerformance,
    roiTrend:
      titleRoiTrend.length > 0
        ? titleRoiTrend.map((item) => ({ date: item.date, value: item.roi }))
        : buildTrend(rows, 'roi'),
    leadCostTrend: buildLeadCostTrend(rows),
  };
}

export async function getAuditLogs() {
  await delay();
  return canReadAnyData() ? [...auditLogs] : [];
}

export async function getVersionRecords(targetId?: string) {
  await delay();
  return targetId
    ? versionRecords.filter((record) => record.targetId === targetId)
    : [...versionRecords];
}

export async function mockGetDashboardTabData(
  _teacherId: string,
  _tabKey: DashboardTabKey,
): Promise<DeliveryMetric[]> {
  await delay();
  return [];
}

export async function getDashboardScreenData(): Promise<DashboardScreenData> {
  const summary = await getHistorySummary();
  const weeklyDetails = getAllWeeklyViews().slice(0, 12);
  const spendAmount = sum(weeklyDetails, 'spendAmount');
  const dealAmount = sum(weeklyDetails, 'dealAmount');
  return {
    weeklyKpi: {
      spendAmount,
      readCount: sum(weeklyDetails, 'adReadCount'),
      leads: sum(weeklyDetails, 'wechatAdds'),
      deals: sum(weeklyDetails, 'dealCount'),
      dealAmount,
      roi: dealAmount / Math.max(spendAmount, 1),
    },
    roiTrend: summary.roiTrend,
    leadCostTrend: summary.leadCostTrend,
    accountRanking: summary.accountPerformance,
    weeklyDetails,
  };
}

export function exportVersionRecordsCsv(rows: VersionRecord[]) {
  const header = ['versionNo', 'uploadedBy', 'uploadedAt', 'module', 'sheet', 'target', 'versionTime', 'before', 'after'];
  const body = rows.map((row) => [
    row.versionNo ?? '',
    row.uploadedBy ?? row.operatorName,
    row.uploadedAt ?? row.versionTime,
    row.module,
    row.sheetName ?? '',
    row.targetName,
    row.versionTime,
    row.before,
    row.after,
  ]);
  return [header, ...body]
    .map((line) => line.map((cell) => `"${String(cell).split('"').join('""')}"`).join(','))
    .join('\n');
}

function rowsFromSheet(matrix: Array<Array<string | number | Date>>, sheetName: string) {
  const headerIndex = matrix.findIndex((row) => row.some((cell) => String(cell).trim()));
  if (headerIndex < 0) return [];
  const headers = matrix[headerIndex].map((cell) => normalizeHeader(String(cell)));
  return matrix
    .slice(headerIndex + 1)
    .map((row) => {
      const record: Record<string, string | number> = {};
      headers.forEach((header, index) => {
        if (!header) return;
        const value = row[index];
        record[header] = value instanceof Date ? dayjs(value).format('YYYY-MM-DD HH:mm') : String(value ?? '').trim();
      });
      return record;
    })
    .filter((row) => !shouldSkipRow(row, sheetName));
}

function shouldSkipRow(row: Record<string, string | number>, sheetName: string) {
  const values = Object.values(row).map((value) => String(value).trim()).filter(Boolean);
  if (values.length === 0) return true;
  const text = values.join('');
  return /合计|总计|说明|备注|填表|示例|小计/i.test(text) || /^Sheet\d+$/i.test(sheetName);
}

function excelRowToWeekly(
  row: Record<string, string | number>,
  sheetName: string,
  index: number,
  operatorName: string,
  uploadedAt: string,
): WeeklyDelivery {
  const deliveryTime =
    stringValue(row, ['发文时间', '投放时间', '时间', '日期', 'deliveryTime']) || uploadedAt;
  const weekStartDate = dayjs(deliveryTime).isValid()
    ? dayjs(deliveryTime).startOf('week').add(1, 'day').format('YYYY-MM-DD')
    : dayjs().startOf('week').add(1, 'day').format('YYYY-MM-DD');
  return recalculateWeeklyRow({
    id: `upload-row-${Date.now()}-${index}`,
    period: sheetName,
    weekStartDate,
    accountName:
      stringValue(row, ['账号', '账号名称', '公众号', '公众号名称', 'accountName']) || 'Unnamed account',
    paymentChannel: stringValue(row, ['付款渠道', '支付渠道', 'paymentChannel']),
    placement: stringValue(row, ['投放位置', '位置', 'placement']),
    deliveryTime,
    articleTitle:
      stringValue(row, ['文章标题', '标题', '投放标题', 'articleTitle']) || 'Untitled',
    courseCode: stringValue(row, ['投放课程', '课程', 'courseCode', '课程编码']),
    articleUrl: stringValue(row, ['链接', '文章链接', '预览链接', 'articleUrl']),
    previewUrl: stringValue(row, ['预览链接', 'previewUrl']),
    qrCode: stringValue(row, ['二维码', '二维码链接', 'qrCode']),
    screenshot: stringValue(row, ['截图', '截图链接', 'screenshot']),
    spendAmount: numberValue(row, ['投放金额', '金额', '计划金额', 'spendAmount']),
    normalReadCount: numberValue(row, ['常文阅读量', '自然阅读量', 'normalReadCount']),
    readCount: numberValue(row, ['广告阅读量', '阅读量', 'readCount']),
    adReadCount: numberValue(row, ['广告阅读量', '阅读量', 'adReadCount']),
    wechatAdds: numberValue(row, ['加微量', '加粉量', '获客数', 'wechatAdds']),
    dealCount: numberValue(row, ['成交量', '成交数', 'dealCount']),
    coursePrice: numberValue(row, ['课程单价', '单价', '客单价', 'coursePrice']),
    dealAmount: numberValue(row, ['成交金额', 'dealAmount']),
    raw: row,
    createdBy: operatorName,
    createdAt: uploadedAt,
    updatedBy: operatorName,
    updatedAt: uploadedAt,
    uploadedBy: operatorName,
    uploadedAt,
  });
}

function normalizeHeader(header: string) {
  return header.replace(/\s+/g, '').replace(/[：:]/g, '').trim();
}

function stringValue(row: Record<string, string | number>, aliases: string[]) {
  const value = findValue(row, aliases);
  return value === undefined ? undefined : String(value).trim() || undefined;
}

function numberValue(row: Record<string, string | number>, aliases: string[]) {
  const value = findValue(row, aliases);
  if (value === undefined || value === '') return 0;
  const normalized = String(value).replace(/[%￥¥,]/g, '').trim();
  const number = Number(normalized);
  if (Number.isFinite(number)) return String(value).includes('%') ? number / 100 : number;
  return 0;
}

function findValue(row: Record<string, string | number>, aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeHeader);
  const key = Object.keys(row).find((item) => normalizedAliases.includes(normalizeHeader(item)));
  return key ? row[key] : undefined;
}

function csvToMatrix(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(',').map((cell) => cell.replace(/^"|"$/g, '').trim()));
}

function parseCsv(text: string) {
  return csvToMatrix(text).slice(1);
}

function sum<T>(rows: T[], key: keyof T) {
  return rows.reduce((total, row) => total + Number(row[key] ?? 0), 0);
}

function buildTrend(rows: WeeklyDeliveryView[], key: 'roi') {
  return rows.slice(-8).map((row) => ({
    date: row.period ?? dayjs(row.deliveryTime).format('MM-DD'),
    value: row[key],
  }));
}

function buildLeadCostTrend(rows: WeeklyDeliveryView[]) {
  return rows.slice(-8).map((row) => ({
    date: row.period ?? dayjs(row.deliveryTime).format('MM-DD'),
    value: row.wechatAddCost,
  }));
}

function inferAccountLevel(roi: number) {
  if (roi >= 2) return 'S';
  if (roi >= 1.5) return 'A';
  if (roi >= 1) return 'B';
  return 'C';
}

function detectTemplateKind(headers: string[]) {
  const normalizedWeeklyFields = uploadTemplates.weekly.detectFields.map(normalizeHeader);
  const normalizedNextFields = uploadTemplates.next.detectFields.map(normalizeHeader);
  if (normalizedWeeklyFields.every((field) => headers.includes(field))) return 'weekly';
  if (normalizedNextFields.every((field) => headers.includes(field))) return 'next';
  return undefined;
}

function normalizeCellValue(value: string | number | Date | undefined) {
  if (value instanceof Date) return dayjs(value).format('YYYY-MM-DD');
  if (value === undefined || value === null) return '';
  return typeof value === 'number' ? value : String(value).trim();
}

function standardRowToWeekly(
  row: Record<string, string | number>,
  index: number,
  operatorName: string,
  uploadedAt: string,
): WeeklyDelivery {
  const deliveryTime = parseDateValue(row[normalizeHeader('发文日期')]) || uploadedAt;
  return recalculateWeeklyRow({
    id: `weekly-template-${Date.now()}-${index}`,
    period: stringFromRow(row, '投放周期'),
    weekStartDate: dayjs(deliveryTime).isValid()
      ? dayjs(deliveryTime).startOf('week').add(1, 'day').format('YYYY-MM-DD')
      : dayjs().startOf('week').add(1, 'day').format('YYYY-MM-DD'),
    accountName: stringFromRow(row, '公众号名称') || '未命名账号',
    placement: stringFromRow(row, '投放位置'),
    deliveryTime,
    articleTitle: stringFromRow(row, '文章标题') || '未命名标题',
    articleUrl: stringFromRow(row, '文章链接'),
    spendAmount: parseMoney(row[normalizeHeader('投放金额')]),
    readCount: parseNumber(row[normalizeHeader('阅读量')]),
    adReadCount: parseNumber(row[normalizeHeader('阅读量')]),
    wechatAdds: parseNumber(row[normalizeHeader('加微量')]),
    dealCount: parseNumber(row[normalizeHeader('成交量')]),
    dealAmount: parseMoney(row[normalizeHeader('成交金额')]),
    raw: row,
    createdBy: operatorName,
    createdAt: uploadedAt,
    updatedBy: operatorName,
    updatedAt: uploadedAt,
    uploadedBy: operatorName,
    uploadedAt,
  });
}

function standardRowToPlan(
  row: Record<string, string | number>,
  index: number,
  operatorName: string,
  uploadedAt: string,
): NextWeekPlan {
  return {
    id: `plan-template-${Date.now()}-${index}`,
    period: stringFromRow(row, '投放周期'),
    accountName: stringFromRow(row, '公众号名称') || '未命名账号',
    plannedTime: parseDateValue(row[normalizeHeader('计划投放日期')]) || uploadedAt,
    articleTitle: stringFromRow(row, '文章标题') || '未命名标题',
    plannedAmount: parseMoney(row[normalizeHeader('计划金额')]),
    paymentStatus: parsePaymentStatus(stringFromRow(row, '付款状态')),
    layoutStatus: parseLayoutStatus(stringFromRow(row, '发布状态')),
    contactPerson: stringFromRow(row, '对接人'),
    remark: stringFromRow(row, '备注'),
    sortOrder: planStore().length + index + 1,
    createdBy: operatorName,
    createdAt: uploadedAt,
    updatedBy: operatorName,
    updatedAt: uploadedAt,
    uploadedBy: operatorName,
    uploadedAt,
  };
}

function stringFromRow(row: Record<string, string | number>, field: string) {
  const value = row[normalizeHeader(field)];
  return value === undefined ? undefined : String(value).trim() || undefined;
}

function parseDateValue(value: string | number | undefined) {
  if (value === undefined || value === '') return undefined;
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return dayjs(new Date(parsed.y, parsed.m - 1, parsed.d)).format('YYYY-MM-DD');
  }
  const text = String(value).trim();
  const parsed = dayjs(text);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : text;
}

function parseMoney(value: string | number | undefined) {
  return parseNumber(value);
}

function parseNumber(value: string | number | undefined) {
  if (value === undefined || value === '') return 0;
  const normalized = String(value).replace(/人民币|元|￥|¥|,/g, '').trim();
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

function parsePaymentStatus(value?: string): PaymentStatus {
  if (value?.includes('已')) return 'paid';
  if (value?.includes('部分')) return 'partial';
  return 'unpaid';
}

function parseLayoutStatus(value?: string): NextWeekPlan['layoutStatus'] {
  if (value?.includes('已发') || value?.includes('发布')) return 'published';
  if (value?.includes('已排')) return 'done';
  if (value?.includes('中')) return 'processing';
  return 'pending';
}
