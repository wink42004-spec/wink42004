import {
  Alert,
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
  Upload,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { uploadTemplates } from '../config/uploadTemplates';
import { useAuthContext } from '../context/AuthContext';
import { getNextWeekPlan } from '../services/nextWeekService';
import {
  createWeeklyData,
  deleteWeeklyData,
  getVersionRecords,
  getWeeklyData,
  updateWeeklyData,
  uploadWeeklyCsv,
} from '../services/weeklyService';
import type {
  NextWeekPlan,
  VersionRecord,
  WeeklyDelivery,
  WeeklyDeliveryView,
} from '../types/shared';

interface WeeklyFormValues {
  accountName: string;
  paymentChannel?: string;
  placement?: string;
  deliveryTime: Dayjs;
  articleTitle: string;
  courseCode?: string;
  articleUrl?: string;
  previewUrl?: string;
  qrCode?: string;
  screenshot?: string;
  spendAmount: number;
  normalReadCount?: number;
  adReadCount: number;
  wechatAdds: number;
  dealCount: number;
  coursePrice?: number;
}

const weeklyUploadTemplate = uploadTemplates.weekly;
const templateBaseUrl = 'templates/';

function getCurrentMonday() {
  const today = dayjs();
  const day = today.day();
  return today.subtract(day === 0 ? 6 : day - 1, 'day').startOf('day');
}

function money(value: number) {
  return `¥${value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function percent(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

function roiClass(roi: number) {
  if (roi >= 2) return 'roi-good';
  if (roi >= 1) return 'roi-warning';
  return 'roi-danger';
}

function formulaTitle(title: string) {
  return (
    <Tooltip title="公式计算字段，系统自动计算">
      <span className="formula-column-title">{title}</span>
    </Tooltip>
  );
}

function buildCsv(headers: string[], body: Array<Array<string | number | undefined>>) {
  return [headers, ...body]
    .map((line) =>
      line.map((cell) => `"${String(cell ?? '').split('"').join('""')}"`).join(','),
    )
    .join('\n');
}

function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(
    new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportWeeklyCsv(rows: WeeklyDeliveryView[]) {
  const header = [
    '期次',
    '账号',
    '付款渠道',
    '投放位置',
    '发文时间',
    '文章标题',
    '投放课程',
    '链接',
    '预览链接',
    '二维码',
    '截图',
    '投放金额',
    '常文阅读量',
    '广告阅读量',
    '加微量',
    '加微成本',
    '加微率',
    '阅读成本',
    '成交量',
    '课程单价',
    '成交金额',
    '转化率',
    'ROI',
  ];
  const body = rows.map((row) => [
    row.period,
    row.accountName,
    row.paymentChannel,
    row.placement,
    row.deliveryTime,
    row.articleTitle,
    row.courseCode,
    row.articleUrl,
    row.previewUrl,
    row.qrCode,
    row.screenshot,
    row.spendAmount,
    row.normalReadCount,
    row.adReadCount,
    row.wechatAdds,
    row.wechatAddCost.toFixed(2),
    percent(row.wechatAddRate),
    row.readCost.toFixed(2),
    row.dealCount,
    row.coursePrice,
    row.dealAmount.toFixed(2),
    percent(row.conversionRate),
    row.roi.toFixed(2),
  ]);
  downloadCsv(
    `本期投放-${dayjs().format('YYYYMMDD-HHmmss')}.csv`,
    buildCsv(header, body),
  );
}

function exportVersionCsv(rows: VersionRecord[], targetName: string) {
  const header = ['版本号', '上传人', '上传时间', 'Sheet', '版本时间', '操作账号', '修改前', '修改后'];
  const body = rows.map((row) => [
    row.versionNo,
    row.uploadedBy ?? row.operatorName,
    row.uploadedAt ?? row.versionTime,
    row.sheetName,
    row.versionTime,
    row.operatorName,
    row.before,
    row.after,
  ]);
  downloadCsv(
    `${targetName}-历史版本-${dayjs().format('YYYYMMDD-HHmmss')}.csv`,
    buildCsv(header, body),
  );
}

export function WeeklyTab() {
  const { currentUser } = useAuthContext();
  const [form] = Form.useForm<WeeklyFormValues>();
  const [weekStartDate, setWeekStartDate] = useState(getCurrentMonday());
  const [rows, setRows] = useState<WeeklyDeliveryView[]>([]);
  const [pendingRows, setPendingRows] = useState<NextWeekPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<WeeklyDeliveryView | null>(null);
  const [open, setOpen] = useState(false);
  const [versionTarget, setVersionTarget] = useState<WeeklyDeliveryView | null>(null);
  const [versionRows, setVersionRows] = useState<VersionRecord[]>([]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    void Promise.all([
      getWeeklyData(weekStartDate.format('YYYY-MM-DD')),
      getNextWeekPlan(),
    ])
      .then(([weeklyRows, planRows]) => {
        setRows(weeklyRows);
        setPendingRows(planRows.filter((row) => row.layoutStatus !== 'published'));
      })
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : '未知错误'),
      )
      .finally(() => setLoading(false));
  }, [weekStartDate]);

  useEffect(() => load(), [load]);

  const openCreate = () => {
    setEditingRow(null);
    form.setFieldsValue({
      accountName: '',
      paymentChannel: '',
      placement: '',
      deliveryTime: weekStartDate.hour(10),
      articleTitle: '',
      courseCode: '',
      articleUrl: '',
      previewUrl: '',
      qrCode: '',
      screenshot: '',
      spendAmount: 0,
      normalReadCount: 0,
      adReadCount: 0,
      wechatAdds: 0,
      dealCount: 0,
      coursePrice: 0,
    });
    setOpen(true);
  };

  const openEdit = (row: WeeklyDeliveryView) => {
    setEditingRow(row);
    form.setFieldsValue({ ...row, deliveryTime: dayjs(row.deliveryTime) });
    setOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    const payload = {
      period: editingRow?.period ?? weekStartDate.format('YYYY-MM-DD'),
      weekStartDate: weekStartDate.format('YYYY-MM-DD'),
      accountName: values.accountName,
      paymentChannel: values.paymentChannel,
      placement: values.placement,
      deliveryTime: values.deliveryTime.format('YYYY-MM-DD HH:mm'),
      articleTitle: values.articleTitle,
      courseCode: values.courseCode,
      articleUrl: values.articleUrl,
      previewUrl: values.previewUrl,
      qrCode: values.qrCode,
      screenshot: values.screenshot,
      spendAmount: values.spendAmount,
      normalReadCount: values.normalReadCount,
      readCount: values.adReadCount,
      adReadCount: values.adReadCount,
      wechatAdds: values.wechatAdds,
      dealCount: values.dealCount,
      coursePrice: values.coursePrice,
      dealAmount: 0,
    };
    if (editingRow) {
      const nextRow = await updateWeeklyData(
        editingRow.id,
        payload as Partial<WeeklyDelivery>,
        currentUser.username,
      );
      setRows((prev) => prev.map((row) => (row.id === nextRow.id ? nextRow : row)));
    } else {
      const nextRow = await createWeeklyData(payload, currentUser.username);
      setRows((prev) => [nextRow, ...prev]);
    }
    message.success('已保存，公式字段已自动重算');
    setOpen(false);
  };

  const openVersions = async (row: WeeklyDeliveryView) => {
    setVersionTarget(row);
    setVersionRows(await getVersionRecords(row.id));
  };

  const columns = useMemo<ColumnsType<WeeklyDeliveryView>>(
    () => [
      { title: '期次', dataIndex: 'period', width: 120 },
      {
        title: '账号',
        dataIndex: 'accountName',
        sorter: (a, b) => a.accountName.localeCompare(b.accountName),
        fixed: 'left',
        width: 140,
      },
      { title: '付款渠道', dataIndex: 'paymentChannel', width: 110 },
      { title: '投放位置', dataIndex: 'placement', width: 100 },
      {
        title: '发文时间',
        dataIndex: 'deliveryTime',
        render: (value: string) => dayjs(value).format('MM-DD HH:mm'),
        sorter: (a, b) =>
          dayjs(a.deliveryTime).valueOf() - dayjs(b.deliveryTime).valueOf(),
        width: 105,
      },
      { title: '文章标题', dataIndex: 'articleTitle', width: 240 },
      { title: '投放课程', dataIndex: 'courseCode', width: 120 },
      {
        title: '链接/预览',
        dataIndex: 'articleUrl',
        render: (_, row) => (
          <Space size={6}>
            {row.articleUrl ? <a href={row.articleUrl}>链接</a> : null}
            {row.previewUrl ? <a href={row.previewUrl}>预览</a> : null}
            {row.qrCode ? <a href={row.qrCode}>二维码</a> : null}
            {row.screenshot ? <a href={row.screenshot}>截图</a> : null}
            {!row.articleUrl && !row.previewUrl && !row.qrCode && !row.screenshot ? '-' : null}
          </Space>
        ),
        width: 140,
      },
      {
        title: '投放金额',
        dataIndex: 'spendAmount',
        render: money,
        sorter: (a, b) => a.spendAmount - b.spendAmount,
        width: 120,
      },
      {
        title: '常文阅读量',
        dataIndex: 'normalReadCount',
        render: (value?: number) => Number(value ?? 0).toLocaleString('zh-CN'),
        width: 115,
      },
      {
        title: '广告阅读量',
        dataIndex: 'adReadCount',
        render: (value?: number) => Number(value ?? 0).toLocaleString('zh-CN'),
        sorter: (a, b) => Number(a.adReadCount ?? 0) - Number(b.adReadCount ?? 0),
        width: 115,
      },
      { title: '加微量', dataIndex: 'wechatAdds', width: 95 },
      {
        title: formulaTitle('加微成本'),
        dataIndex: 'wechatAddCost',
        className: 'formula-cell',
        render: money,
        width: 110,
      },
      {
        title: formulaTitle('加微率'),
        dataIndex: 'wechatAddRate',
        className: 'formula-cell',
        render: percent,
        width: 95,
      },
      {
        title: formulaTitle('阅读成本'),
        dataIndex: 'readCost',
        className: 'formula-cell',
        render: money,
        width: 110,
      },
      { title: '成交量', dataIndex: 'dealCount', width: 95 },
      { title: '课程单价', dataIndex: 'coursePrice', render: money, width: 105 },
      {
        title: formulaTitle('成交金额'),
        dataIndex: 'dealAmount',
        className: 'formula-cell',
        render: money,
        width: 120,
      },
      {
        title: formulaTitle('转化率'),
        dataIndex: 'conversionRate',
        className: 'formula-cell',
        render: percent,
        width: 95,
      },
      {
        title: formulaTitle('ROI'),
        dataIndex: 'roi',
        className: 'formula-cell',
        render: (roi: number) => (
          <span className={`roi-value ${roiClass(roi)}`}>{roi.toFixed(2)}</span>
        ),
        sorter: (a, b) => a.roi - b.roi,
        width: 90,
      },
      {
        title: '操作',
        fixed: 'right',
        width: 190,
        render: (_, record) => (
          <Space>
            <Button size="small" onClick={() => openEdit(record)}>
              编辑
            </Button>
            <Button size="small" onClick={() => void openVersions(record)}>
              版本
            </Button>
            <Popconfirm
              title="确认删除？"
              onConfirm={() =>
                void deleteWeeklyData(record.id, currentUser.username).then(load)
              }
            >
              <Button danger size="small">
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [currentUser.username, load],
  );

  const pendingColumns = useMemo<ColumnsType<NextWeekPlan>>(
    () => [
      { title: '账号', dataIndex: 'accountName', width: 140 },
      {
        title: '计划时间',
        dataIndex: 'plannedTime',
        render: (value: string) => dayjs(value).format('MM-DD HH:mm'),
        width: 105,
      },
      { title: '标题', dataIndex: 'articleTitle', width: 240 },
      { title: '投放课程', dataIndex: 'courseCode', width: 120 },
      { title: '投放金额', dataIndex: 'plannedAmount', render: money, width: 120 },
      { title: '排版状态', dataIndex: 'layoutStatus', render: (value: string) => <Tag>{value}</Tag>, width: 110 },
      { title: '付款状态', dataIndex: 'paymentStatus', render: (value: string) => <Tag>{value}</Tag>, width: 110 },
    ],
    [],
  );

  return (
    <div className="weekly-tab">
      <div className="weekly-toolbar">
        <Space wrap>
          <DatePicker
            allowClear={false}
            value={weekStartDate}
            onChange={(value) => value && setWeekStartDate(value.startOf('day'))}
          />
          <Button type="primary" onClick={openCreate}>
            新增投放
          </Button>
          <Button
            href={`${templateBaseUrl}${weeklyUploadTemplate.fileName}`}
            download={weeklyUploadTemplate.fileName}
          >
            {`下载${weeklyUploadTemplate.name}.xlsx ${weeklyUploadTemplate.version}（${weeklyUploadTemplate.versionDate}）`}
          </Button>
          <Upload
            accept=".csv"
            showUploadList={false}
            beforeUpload={(file) => {
              void file
                .text()
                .then((text) => uploadWeeklyCsv(text, currentUser.username))
                .then(() => {
                  message.success('上传成功，公式字段已自动重算并写入修改记录');
                  load();
                });
              return false;
            }}
          >
            <Button>上传 CSV</Button>
          </Upload>
        </Space>
        <Button onClick={() => exportWeeklyCsv(rows)}>导出 CSV</Button>
      </div>
      {error ? (
        <Alert showIcon type="error" message="加载失败" description={error} />
      ) : null}

      <section className="data-section">
        <div className="section-heading">
          <h3>已投放</h3>
          <span>{rows.length} 条记录</span>
        </div>
        <Table
          columns={columns}
          dataSource={rows}
          loading={loading}
          rowKey="id"
          scroll={{ x: 2300 }}
        />
      </section>

      <section className="data-section">
        <div className="section-heading">
          <h3>待排期</h3>
          <span>{pendingRows.length} 条记录</span>
        </div>
        <Table
          columns={pendingColumns}
          dataSource={pendingRows}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1000 }}
          pagination={{ pageSize: 5 }}
        />
      </section>

      <Modal
        title={editingRow ? '编辑投放' : '新增投放'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => void submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="accountName" label="账号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="paymentChannel" label="付款渠道">
            <Input />
          </Form.Item>
          <Form.Item name="placement" label="投放位置">
            <Input />
          </Form.Item>
          <Form.Item name="deliveryTime" label="发文时间" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="articleTitle" label="文章标题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="courseCode" label="投放课程">
            <Input placeholder="courseCode" />
          </Form.Item>
          <Form.Item name="articleUrl" label="链接">
            <Input placeholder="https://" />
          </Form.Item>
          <Form.Item name="previewUrl" label="预览链接">
            <Input placeholder="https://" />
          </Form.Item>
          <Form.Item name="qrCode" label="二维码">
            <Input />
          </Form.Item>
          <Form.Item name="screenshot" label="截图">
            <Input />
          </Form.Item>
          <Form.Item name="spendAmount" label="投放金额">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="normalReadCount" label="常文阅读量">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="adReadCount" label="广告阅读量">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="wechatAdds" label="加微量">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="dealCount" label="成交量">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="coursePrice" label="课程单价">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Alert
            showIcon
            type="info"
            message="加微成本、加微率、阅读成本、成交金额、转化率、ROI 为公式计算字段，系统自动计算，不支持手填。"
          />
        </Form>
      </Modal>

      <Modal
        title={`${versionTarget?.articleTitle ?? '投放'} 历史版本`}
        open={Boolean(versionTarget)}
        onCancel={() => {
          setVersionTarget(null);
          setVersionRows([]);
        }}
        footer={
          <Button
            disabled={versionRows.length === 0}
            onClick={() =>
              versionTarget && exportVersionCsv(versionRows, versionTarget.articleTitle)
            }
          >
            下载 CSV
          </Button>
        }
        width={980}
      >
        <Table
          dataSource={versionRows}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          columns={[
            { title: '版本号', dataIndex: 'versionNo', width: 90 },
            { title: '上传人', dataIndex: 'uploadedBy', width: 110 },
            { title: '上传时间', dataIndex: 'uploadedAt', width: 170 },
            { title: 'Sheet', dataIndex: 'sheetName', width: 120 },
            { title: '日期时间', dataIndex: 'versionTime', width: 170 },
            { title: '操作账号', dataIndex: 'operatorName', width: 120 },
            { title: '修改前', dataIndex: 'before', ellipsis: true },
            { title: '修改后', dataIndex: 'after', ellipsis: true },
          ]}
        />
      </Modal>
    </div>
  );
}
