import {
  Alert,
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Upload,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { uploadTemplates } from '../config/uploadTemplates';
import { useAuthContext } from '../context/AuthContext';
import {
  createPlan,
  deletePlan,
  getAccountHistory,
  getNextWeekPlan,
  updatePlan,
  uploadPlanCsv,
} from '../services/nextWeekService';
import type {
  LayoutStatus,
  NextWeekPlan,
  PaymentStatus,
  WeeklyDeliveryView,
} from '../types/shared';

interface PlanFormValues {
  accountName: string;
  plannedTime: Dayjs;
  articleTitle: string;
  courseCode?: string;
  articleUrl?: string;
  plannedAmount: number;
  layoutStatus: LayoutStatus;
  paymentStatus: PaymentStatus;
}

const nextUploadTemplate = uploadTemplates.next;
const templateBaseUrl = 'templates/';

const paymentOptions: Array<{ label: string; value: PaymentStatus }> = [
  { label: '未付款', value: 'unpaid' },
  { label: '部分付款', value: 'partial' },
  { label: '已付款', value: 'paid' },
];

const layoutOptions: Array<{ label: string; value: LayoutStatus }> = [
  { label: '未排版', value: 'pending' },
  { label: '排版中', value: 'processing' },
  { label: '已排版', value: 'done' },
  { label: '已发布', value: 'published' },
];

const layoutStatusTheme: Record<LayoutStatus, { label: string; color: string; bg: string }> = {
  pending: { label: '未排版', color: '#475569', bg: '#f1f5f9' },
  processing: { label: '排版中', color: '#0369a1', bg: '#e0f2fe' },
  done: { label: '已排版', color: '#15803d', bg: '#dcfce7' },
  published: { label: '已发布', color: '#6d28d9', bg: '#ede9fe' },
};

const paymentStatusTheme: Record<PaymentStatus, { label: string; color: string; bg: string }> = {
  unpaid: { label: '未付款', color: '#b91c1c', bg: '#fee2e2' },
  partial: { label: '部分付款', color: '#b45309', bg: '#fef3c7' },
  paid: { label: '已付款', color: '#15803d', bg: '#dcfce7' },
};

function StatusTag({
  value,
  theme,
}: {
  value: LayoutStatus | PaymentStatus;
  theme: Record<string, { label: string; color: string; bg: string }>;
}) {
  const item = theme[value];
  return (
    <Tag
      bordered={false}
      style={{
        background: item.bg,
        color: item.color,
        fontWeight: 700,
        marginInlineEnd: 0,
      }}
    >
      {item.label}
    </Tag>
  );
}

function money(value: number) {
  return `¥${value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function NextWeekTab() {
  const { currentUser } = useAuthContext();
  const [form] = Form.useForm<PlanFormValues>();
  const [rows, setRows] = useState<NextWeekPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<NextWeekPlan | null>(null);
  const [open, setOpen] = useState(false);
  const [historyAccount, setHistoryAccount] = useState<string | null>(null);
  const [historyRows, setHistoryRows] = useState<WeeklyDeliveryView[]>([]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    void getNextWeekPlan()
      .then(setRows)
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : '未知错误'),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);

  const openCreate = () => {
    setEditingRow(null);
    form.setFieldsValue({
      accountName: '',
      plannedTime: dayjs().add(1, 'week').hour(10),
      articleTitle: '',
      courseCode: '',
      articleUrl: '',
      plannedAmount: 0,
      layoutStatus: 'pending',
      paymentStatus: 'unpaid',
    });
    setOpen(true);
  };

  const openEdit = (row: NextWeekPlan) => {
    setEditingRow(row);
    form.setFieldsValue({ ...row, plannedTime: dayjs(row.plannedTime) });
    setOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    const payload = {
      accountName: values.accountName,
      plannedTime: values.plannedTime.format('YYYY-MM-DD HH:mm'),
      articleTitle: values.articleTitle,
      courseCode: values.courseCode,
      articleUrl: values.articleUrl,
      plannedAmount: values.plannedAmount,
      layoutStatus: values.layoutStatus,
      paymentStatus: values.paymentStatus,
    };
    if (editingRow) {
      const nextRow = await updatePlan(editingRow.id, payload, currentUser.username);
      setRows((prev) => prev.map((row) => (row.id === nextRow.id ? nextRow : row)));
    } else {
      const nextRow = await createPlan(payload, currentUser.username);
      setRows((prev) => [...prev, nextRow]);
    }
    message.success('已保存');
    setOpen(false);
  };

  const openHistory = async (accountName: string) => {
    setHistoryAccount(accountName);
    setHistoryRows(await getAccountHistory(accountName));
  };

  const columns = useMemo<ColumnsType<NextWeekPlan>>(
    () => [
      {
        title: '账号',
        dataIndex: 'accountName',
        render: (value: string) => (
          <Button type="link" onClick={() => void openHistory(value)}>
            {value}
          </Button>
        ),
        sorter: (a, b) => a.accountName.localeCompare(b.accountName),
        width: 160,
      },
      {
        title: '计划时间',
        dataIndex: 'plannedTime',
        render: (value: string) => dayjs(value).format('MM-DD HH:mm'),
        sorter: (a, b) => dayjs(a.plannedTime).valueOf() - dayjs(b.plannedTime).valueOf(),
        width: 110,
      },
      {
        title: '标题',
        dataIndex: 'articleTitle',
        sorter: (a, b) => a.articleTitle.localeCompare(b.articleTitle),
        width: 260,
      },
      { title: '投放课程', dataIndex: 'courseCode', width: 120 },
      {
        title: '投放金额',
        dataIndex: 'plannedAmount',
        render: money,
        sorter: (a, b) => a.plannedAmount - b.plannedAmount,
        width: 120,
      },
      {
        title: '排版状态',
        dataIndex: 'layoutStatus',
        render: (value: LayoutStatus, record) => (
          <Select
            value={value}
            options={layoutOptions}
            style={{ width: 120 }}
            optionRender={(option) => (
              <StatusTag value={option.value as LayoutStatus} theme={layoutStatusTheme} />
            )}
            labelRender={({ value }) => (
              <StatusTag value={value as LayoutStatus} theme={layoutStatusTheme} />
            )}
            onChange={(layoutStatus) =>
              void updatePlan(record.id, { layoutStatus }, currentUser.username).then(
                (nextRow) =>
                  setRows((prev) =>
                    prev.map((row) => (row.id === nextRow.id ? nextRow : row)),
                  ),
              )
            }
          />
        ),
        width: 150,
      },
      {
        title: '付款状态',
        dataIndex: 'paymentStatus',
        render: (value: PaymentStatus, record) => (
          <Select
            value={value}
            options={paymentOptions}
            style={{ width: 120 }}
            optionRender={(option) => (
              <StatusTag value={option.value as PaymentStatus} theme={paymentStatusTheme} />
            )}
            labelRender={({ value }) => (
              <StatusTag value={value as PaymentStatus} theme={paymentStatusTheme} />
            )}
            onChange={(paymentStatus) =>
              void updatePlan(record.id, { paymentStatus }, currentUser.username).then(
                (nextRow) =>
                  setRows((prev) =>
                    prev.map((row) => (row.id === nextRow.id ? nextRow : row)),
                  ),
              )
            }
          />
        ),
        width: 150,
      },
      {
        title: '操作',
        fixed: 'right',
        width: 130,
        render: (_, record) => (
          <Space>
            <Button size="small" onClick={() => openEdit(record)}>
              编辑
            </Button>
            <Popconfirm
              title="确认删除？"
              onConfirm={() => void deletePlan(record.id, currentUser.username).then(load)}
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

  return (
    <div className="next-week-tab">
      <div className="next-week-toolbar">
        <Space wrap>
          <Button type="primary" onClick={openCreate}>
            新增排期
          </Button>
          <Button
            href={`${templateBaseUrl}${nextUploadTemplate.fileName}`}
            download={nextUploadTemplate.fileName}
          >
            {`下载${nextUploadTemplate.name}.xlsx ${nextUploadTemplate.version}（${nextUploadTemplate.versionDate}）`}
          </Button>
          <Upload
            accept=".csv"
            showUploadList={false}
            beforeUpload={(file) => {
              void file.text().then((text) => uploadPlanCsv(text, currentUser.username).then(load));
              return false;
            }}
          >
            <Button>上传 CSV</Button>
          </Upload>
        </Space>
      </div>
      {error ? (
        <Alert showIcon type="error" message="加载失败" description={error} />
      ) : null}
      <Table
        columns={columns}
        dataSource={rows}
        loading={loading}
        rowKey="id"
        scroll={{ x: 1200 }}
      />
      <Modal
        title={editingRow ? '编辑排期' : '新增排期'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => void submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="accountName" label="账号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="plannedTime" label="计划时间" rules={[{ required: true }]}>
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
          <Form.Item name="plannedAmount" label="投放金额">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="layoutStatus" label="排版状态">
            <Select options={layoutOptions} />
          </Form.Item>
          <Form.Item name="paymentStatus" label="付款状态">
            <Select options={paymentOptions} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={`${historyAccount ?? '账号'}历史投放`}
        open={Boolean(historyAccount)}
        onCancel={() => setHistoryAccount(null)}
        footer={null}
        width={900}
      >
        <Table
          dataSource={historyRows}
          rowKey="id"
          pagination={false}
          columns={[
            { title: '投放时间', dataIndex: 'deliveryTime' },
            { title: '标题', dataIndex: 'articleTitle' },
            { title: '投放课程', dataIndex: 'courseCode' },
            { title: '投放金额', dataIndex: 'spendAmount', render: money },
            { title: '阅读量', dataIndex: 'readCount' },
            { title: 'ROI', dataIndex: 'roi', render: (value: number) => value.toFixed(2) },
          ]}
        />
      </Modal>
    </div>
  );
}
