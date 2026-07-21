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
  Tooltip,
  Upload,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { uploadTemplates } from '../config/uploadTemplates';
import { useAuthContext } from '../context/AuthContext';
import {
  createWeeklyData,
  deleteWeeklyData,
  getVersionRecords,
  getWeeklyData,
  updatePeriod,
  updateWeeklyData,
  uploadWeeklyCsv,
} from '../services/weeklyService';
import type {
  VersionRecord,
  WeeklyDelivery,
  WeeklyDeliveryView,
} from '../types/shared';
import { getCurrentWeekRange } from '../utils/dateRange';

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
  adReadCount: number;
  wechatAdds: number;
  dealCount: number;
  coursePrice?: number;
}

const weeklyUploadTemplate = uploadTemplates.weekly;
const templateBaseUrl = 'templates/';

function money(value?: number) {
  return `¥${Number(value ?? 0).toLocaleString('zh-CN', {
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
  downloadCsv(`本期投放-${dayjs().format('YYYYMMDD-HHmmss')}.csv`, buildCsv(header, body));
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

function getTeacherDisplayName(row: WeeklyDeliveryView) {
  return row.teacherId ?? row.uploadedBy ?? row.createdBy ?? '-';
}

function compareText(left: unknown, right: unknown) {
  return String(left ?? '').localeCompare(String(right ?? ''), 'zh-CN', {
    numeric: true,
    sensitivity: 'base',
  });
}

function compareNumber(left: number | undefined, right: number | undefined) {
  return Number(left ?? 0) - Number(right ?? 0);
}

function getLinkSortValue(row: WeeklyDeliveryView) {
  return [row.articleUrl, row.previewUrl, row.qrCode, row.screenshot]
    .filter(Boolean)
    .join(' ');
}

interface WeeklyTabProps {
  dataRevision?: number;
  onDataChanged?: () => void;
}

export function WeeklyTab({ dataRevision = 0, onDataChanged }: WeeklyTabProps) {
  const { currentUser } = useAuthContext();
  const [form] = Form.useForm<WeeklyFormValues>();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(getCurrentWeekRange);
  const [rows, setRows] = useState<WeeklyDeliveryView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<WeeklyDeliveryView | null>(null);
  const [open, setOpen] = useState(false);
  const [versionTarget, setVersionTarget] = useState<WeeklyDeliveryView | null>(null);
  const [versionRows, setVersionRows] = useState<VersionRecord[]>([]);
  const [periodUpdating, setPeriodUpdating] = useState(false);
  const sequenceById = useMemo(
    () => new Map(rows.map((row, index) => [row.id, index + 1])),
    [rows],
  );

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    void getWeeklyData({
      startDate: dateRange[0].format('YYYY-MM-DD'),
      endDate: dateRange[1].format('YYYY-MM-DD'),
    })
      .then(setRows)
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : '未知错误'),
      )
      .finally(() => setLoading(false));
  }, [currentUser.id, dateRange]);

  useEffect(() => load(), [dataRevision, load]);

  useEffect(() => {
    setOpen(false);
    setEditingRow(null);
    setVersionTarget(null);
    setVersionRows([]);
  }, [currentUser.id]);

  const openCreate = () => {
    setEditingRow(null);
    form.setFieldsValue({
      accountName: '',
      paymentChannel: '',
      placement: '',
      deliveryTime: dateRange[0].hour(10),
      articleTitle: '',
      courseCode: '',
      articleUrl: '',
      previewUrl: '',
      qrCode: '',
      screenshot: '',
      spendAmount: 0,
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
      period: editingRow?.period ?? dateRange[0].format('YYYY-MM-DD'),
      weekStartDate: dateRange[0].format('YYYY-MM-DD'),
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
      readCount: values.adReadCount,
      adReadCount: values.adReadCount,
      wechatAdds: values.wechatAdds,
      dealCount: values.dealCount,
      coursePrice: values.coursePrice,
      dealAmount: 0,
    };
    if (editingRow) {
      await updateWeeklyData(
        editingRow.id,
        payload as Partial<WeeklyDelivery>,
        currentUser.username,
      );
    } else {
      await createWeeklyData(payload, currentUser.username);
    }
    load();
    message.success('已保存，公式字段已自动重算');
    setOpen(false);
  };

  const openVersions = async (row: WeeklyDeliveryView) => {
    setVersionTarget(row);
    setVersionRows(await getVersionRecords(row.id));
  };

  const handlePeriodUpdate = async () => {
    setPeriodUpdating(true);
    try {
      const result = await updatePeriod(currentUser.username);
      onDataChanged?.();
      if (result.promotedStartDate && result.promotedEndDate) {
        setDateRange([
          dayjs(result.promotedStartDate).startOf('day'),
          dayjs(result.promotedEndDate).startOf('day'),
        ]);
      } else if (!onDataChanged) {
        load();
      }
      message.success(
        `期次更新完成：已归档 ${result.archivedCount} 条，下期转入本期 ${result.promotedCount} 条`,
      );
    } catch (reason) {
      message.error(reason instanceof Error ? reason.message : '期次更新失败');
    } finally {
      setPeriodUpdating(false);
    }
  };

  const columns = useMemo<ColumnsType<WeeklyDeliveryView>>(
    () => [
      {
        title: '期次',
        dataIndex: 'period',
        sorter: (a, b) => compareText(a.period, b.period),
        width: 120,
      },
      {
        title: '序号',
        key: 'sequence',
        render: (_value, record) => sequenceById.get(record.id) ?? 0,
        sorter: (a, b) =>
          (sequenceById.get(a.id) ?? 0) - (sequenceById.get(b.id) ?? 0),
        fixed: 'left',
        width: 80,
      },
      {
        title: '账号',
        dataIndex: 'accountName',
        sorter: (a, b) => compareText(a.accountName, b.accountName),
        fixed: 'left',
        width: 140,
      },
      {
        title: '讲师',
        dataIndex: 'teacherId',
        render: (_value: string | undefined, row) => getTeacherDisplayName(row),
        sorter: (a, b) => compareText(getTeacherDisplayName(a), getTeacherDisplayName(b)),
        width: 110,
      },
      {
        title: '付款渠道',
        dataIndex: 'paymentChannel',
        sorter: (a, b) => compareText(a.paymentChannel, b.paymentChannel),
        width: 110,
      },
      {
        title: '投放位置',
        dataIndex: 'placement',
        sorter: (a, b) => compareText(a.placement, b.placement),
        width: 100,
      },
      {
        title: '发文时间',
        dataIndex: 'deliveryTime',
        render: (value: string) => dayjs(value).format('MM-DD HH:mm'),
        sorter: (a, b) => dayjs(a.deliveryTime).valueOf() - dayjs(b.deliveryTime).valueOf(),
        width: 105,
      },
      {
        title: '文章标题',
        dataIndex: 'articleTitle',
        sorter: (a, b) => compareText(a.articleTitle, b.articleTitle),
        width: 240,
      },
      {
        title: '投放课程',
        dataIndex: 'courseCode',
        sorter: (a, b) => compareText(a.courseCode, b.courseCode),
        width: 120,
      },
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
        sorter: (a, b) => compareText(getLinkSortValue(a), getLinkSortValue(b)),
        width: 140,
      },
      {
        title: '投放金额',
        dataIndex: 'spendAmount',
        render: money,
        sorter: (a, b) => compareNumber(a.spendAmount, b.spendAmount),
        width: 120,
      },
      {
        title: '广告阅读量',
        dataIndex: 'adReadCount',
        render: (value?: number) => Number(value ?? 0).toLocaleString('zh-CN'),
        sorter: (a, b) => compareNumber(a.adReadCount, b.adReadCount),
        width: 115,
      },
      {
        title: '加微量',
        dataIndex: 'wechatAdds',
        sorter: (a, b) => compareNumber(a.wechatAdds, b.wechatAdds),
        width: 95,
      },
      {
        title: formulaTitle('加微成本'),
        dataIndex: 'wechatAddCost',
        className: 'formula-cell',
        render: money,
        sorter: (a, b) => compareNumber(a.wechatAddCost, b.wechatAddCost),
        width: 110,
      },
      {
        title: formulaTitle('加微率'),
        dataIndex: 'wechatAddRate',
        className: 'formula-cell',
        render: percent,
        sorter: (a, b) => compareNumber(a.wechatAddRate, b.wechatAddRate),
        width: 95,
      },
      {
        title: formulaTitle('阅读成本'),
        dataIndex: 'readCost',
        className: 'formula-cell',
        render: money,
        sorter: (a, b) => compareNumber(a.readCost, b.readCost),
        width: 110,
      },
      {
        title: '成交量',
        dataIndex: 'dealCount',
        sorter: (a, b) => compareNumber(a.dealCount, b.dealCount),
        width: 95,
      },
      {
        title: '课程单价',
        dataIndex: 'coursePrice',
        render: money,
        sorter: (a, b) => compareNumber(a.coursePrice, b.coursePrice),
        width: 105,
      },
      {
        title: formulaTitle('成交金额'),
        dataIndex: 'dealAmount',
        className: 'formula-cell',
        render: money,
        sorter: (a, b) => compareNumber(a.dealAmount, b.dealAmount),
        width: 120,
      },
      {
        title: formulaTitle('转化率'),
        dataIndex: 'conversionRate',
        className: 'formula-cell',
        render: percent,
        sorter: (a, b) => compareNumber(a.conversionRate, b.conversionRate),
        width: 95,
      },
      {
        title: formulaTitle('ROI'),
        dataIndex: 'roi',
        className: 'formula-cell',
        render: (roi: number) => (
          <span className={`roi-value ${roiClass(roi)}`}>{roi.toFixed(2)}</span>
        ),
        sorter: (a, b) => compareNumber(a.roi, b.roi),
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
    [currentUser.username, load, sequenceById],
  );

  return (
    <div className="weekly-tab">
      <div className="weekly-toolbar">
        <Space wrap>
          <DatePicker.RangePicker
            allowClear={false}
            format="YYYY-MM-DD"
            placeholder={['开始日期', '结束日期']}
            value={dateRange}
            onChange={(values) => {
              if (values?.[0] && values[1]) {
                setDateRange([values[0].startOf('day'), values[1].startOf('day')]);
              }
            }}
            style={{ width: 260, maxWidth: '100%' }}
          />
          <Button type="primary" onClick={openCreate}>
            新增投放
          </Button>
          <Popconfirm
            title="确认要更新批次吗？"
            description="更新后，本期全部数据会放入历史汇总，下期全部数据会切换到本期。"
            okText="确认更新"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={handlePeriodUpdate}
          >
            <Button danger loading={periodUpdating}>
              期次更新
            </Button>
          </Popconfirm>
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
      {error ? <Alert showIcon type="error" message="加载失败" description={error} /> : null}

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
          scroll={{ x: 2500 }}
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
            <Input placeholder="图片链接或文件地址" />
          </Form.Item>
          <Form.Item name="screenshot" label="截图">
            <Input placeholder="图片链接或文件地址" />
          </Form.Item>
          <Form.Item name="spendAmount" label="投放金额">
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
        </Form>
      </Modal>

      <Modal
        title={`${versionTarget?.accountName ?? '记录'} 历史版本`}
        open={Boolean(versionTarget)}
        onCancel={() => setVersionTarget(null)}
        width={860}
        footer={
          <Space>
            <Button onClick={() => setVersionTarget(null)}>关闭</Button>
            <Button
              type="primary"
              disabled={versionRows.length === 0}
              onClick={() => versionTarget && exportVersionCsv(versionRows, versionTarget.accountName)}
            >
              下载 CSV
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={versionRows}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          columns={[
            { title: '版本号', dataIndex: 'versionNo', width: 90 },
            { title: '上传人', dataIndex: 'uploadedBy', width: 110 },
            { title: '上传时间', dataIndex: 'uploadedAt', width: 170 },
            { title: '版本时间', dataIndex: 'versionTime', width: 170 },
            { title: '修改前', dataIndex: 'before', ellipsis: true },
            { title: '修改后', dataIndex: 'after', ellipsis: true },
          ]}
        />
      </Modal>
    </div>
  );
}
