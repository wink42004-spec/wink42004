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
  Upload,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDashboardContext } from '../context/DashboardContext';
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
  deliveryTime: Dayjs;
  articleTitle: string;
  courseCode?: string;
  articleUrl?: string;
  spendAmount: number;
  readCount: number;
  wechatAdds: number;
  dealCount: number;
  dealAmount: number;
}

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
    '账号',
    '投放时间',
    '标题',
    '投放课程',
    '文章链接',
    '投放金额',
    '阅读量',
    '加微量',
    '加微成本',
    '加微率',
    '阅读成本',
    '成交量',
    '成交金额',
    'ROI',
  ];
  const body = rows.map((row) => [
    row.accountName,
    row.deliveryTime,
    row.articleTitle,
    row.courseCode,
    row.articleUrl,
    row.spendAmount,
    row.readCount,
    row.wechatAdds,
    row.wechatAddCost.toFixed(2),
    percent(row.wechatAddRate),
    row.readCost.toFixed(2),
    row.dealCount,
    row.dealAmount,
    row.roi.toFixed(2),
  ]);
  downloadCsv(
    `本期投放-${dayjs().format('YYYYMMDD-HHmmss')}.csv`,
    buildCsv(header, body),
  );
}

function exportVersionCsv(rows: VersionRecord[], targetName: string) {
  const header = ['版本时间', '操作人', '模块', '对象', '修改前', '修改后'];
  const body = rows.map((row) => [
    row.versionTime,
    row.operatorName,
    row.module,
    row.targetName,
    JSON.stringify(row.before),
    JSON.stringify(row.after),
  ]);
  downloadCsv(
    `${targetName}-历史版本-${dayjs().format('YYYYMMDD-HHmmss')}.csv`,
    buildCsv(header, body),
  );
}

export function WeeklyTab() {
  const { currentOperator } = useDashboardContext();
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
      deliveryTime: weekStartDate.hour(10),
      articleTitle: '',
      courseCode: '',
      articleUrl: '',
      spendAmount: 0,
      readCount: 0,
      wechatAdds: 0,
      dealCount: 0,
      dealAmount: 0,
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
      weekStartDate: weekStartDate.format('YYYY-MM-DD'),
      accountName: values.accountName,
      deliveryTime: values.deliveryTime.format('YYYY-MM-DD HH:mm'),
      articleTitle: values.articleTitle,
      courseCode: values.courseCode,
      articleUrl: values.articleUrl,
      spendAmount: values.spendAmount,
      readCount: values.readCount,
      wechatAdds: values.wechatAdds,
      dealCount: values.dealCount,
      dealAmount: values.dealAmount,
    };
    if (editingRow) {
      const nextRow = await updateWeeklyData(
        editingRow.id,
        payload as Partial<WeeklyDelivery>,
        currentOperator.name,
      );
      setRows((prev) => prev.map((row) => (row.id === nextRow.id ? nextRow : row)));
    } else {
      const nextRow = await createWeeklyData(payload, currentOperator.name);
      setRows((prev) => [nextRow, ...prev]);
    }
    message.success('已保存');
    setOpen(false);
  };

  const openVersions = async (row: WeeklyDeliveryView) => {
    setVersionTarget(row);
    setVersionRows(await getVersionRecords(row.id));
  };

  const columns = useMemo<ColumnsType<WeeklyDeliveryView>>(
    () => [
      {
        title: '账号',
        dataIndex: 'accountName',
        sorter: (a, b) => a.accountName.localeCompare(b.accountName),
        fixed: 'left',
        width: 140,
      },
      {
        title: '投放时间',
        dataIndex: 'deliveryTime',
        render: (value: string) => dayjs(value).format('MM-DD HH:mm'),
        sorter: (a, b) =>
          dayjs(a.deliveryTime).valueOf() - dayjs(b.deliveryTime).valueOf(),
        width: 105,
      },
      {
        title: '标题',
        dataIndex: 'articleTitle',
        sorter: (a, b) => a.articleTitle.localeCompare(b.articleTitle),
        width: 240,
      },
      { title: '投放课程', dataIndex: 'courseCode', width: 120 },
      {
        title: '文章链接',
        dataIndex: 'articleUrl',
        render: (value?: string) =>
          value ? (
            <a href={value} target="_blank" rel="noreferrer">
              查看文章
            </a>
          ) : (
            '-'
          ),
        width: 105,
      },
      {
        title: '投放金额',
        dataIndex: 'spendAmount',
        render: money,
        sorter: (a, b) => a.spendAmount - b.spendAmount,
        width: 120,
      },
      {
        title: '阅读量',
        dataIndex: 'readCount',
        render: (value: number) => value.toLocaleString('zh-CN'),
        sorter: (a, b) => a.readCount - b.readCount,
        width: 110,
      },
      {
        title: '加微量',
        dataIndex: 'wechatAdds',
        sorter: (a, b) => a.wechatAdds - b.wechatAdds,
        width: 95,
      },
      {
        title: '加微成本',
        dataIndex: 'wechatAddCost',
        render: money,
        sorter: (a, b) => a.wechatAddCost - b.wechatAddCost,
        width: 110,
      },
      {
        title: '加微率',
        dataIndex: 'wechatAddRate',
        render: percent,
        sorter: (a, b) => a.wechatAddRate - b.wechatAddRate,
        width: 95,
      },
      {
        title: '阅读成本',
        dataIndex: 'readCost',
        render: money,
        sorter: (a, b) => a.readCost - b.readCost,
        width: 110,
      },
      {
        title: '成交量',
        dataIndex: 'dealCount',
        sorter: (a, b) => a.dealCount - b.dealCount,
        width: 95,
      },
      {
        title: '成交金额',
        dataIndex: 'dealAmount',
        render: money,
        sorter: (a, b) => a.dealAmount - b.dealAmount,
        width: 120,
      },
      {
        title: 'ROI',
        dataIndex: 'roi',
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
                void deleteWeeklyData(record.id, currentOperator.name).then(load)
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
    [currentOperator.name, load],
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
      {
        title: '投放金额',
        dataIndex: 'plannedAmount',
        render: money,
        width: 120,
      },
      {
        title: '排版状态',
        dataIndex: 'layoutStatus',
        render: (value: string) => <Tag>{value}</Tag>,
        width: 110,
      },
      {
        title: '付款状态',
        dataIndex: 'paymentStatus',
        render: (value: string) => <Tag>{value}</Tag>,
        width: 110,
      },
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
          <Upload
            accept=".csv"
            showUploadList={false}
            beforeUpload={(file) => {
              void file
                .text()
                .then((text) => uploadWeeklyCsv(text, currentOperator.name))
                .then(() => {
                  message.success('上传成功，阅读量已自动更新并写入修改记录');
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
          scroll={{ x: 1800 }}
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
          <Form.Item
            name="deliveryTime"
            label="投放时间"
            rules={[{ required: true }]}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="articleTitle" label="投放标题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="courseCode" label="投放课程">
            <Input placeholder="courseCode" />
          </Form.Item>
          <Form.Item name="articleUrl" label="文章链接">
            <Input placeholder="https://" />
          </Form.Item>
          <Form.Item name="spendAmount" label="投放金额">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="readCount" label="阅读量">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="wechatAdds" label="加微量">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="dealCount" label="成交量">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="dealAmount" label="成交金额">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
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
            { title: '日期时间', dataIndex: 'versionTime', width: 170 },
            { title: '操作老师', dataIndex: 'operatorName', width: 120 },
            {
              title: '修改前',
              dataIndex: 'before',
              render: (value: unknown) => JSON.stringify(value),
            },
            {
              title: '修改后',
              dataIndex: 'after',
              render: (value: unknown) => JSON.stringify(value),
            },
          ]}
        />
      </Modal>
    </div>
  );
}
