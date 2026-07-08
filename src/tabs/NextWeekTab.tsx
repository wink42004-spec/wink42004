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
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDashboardContext } from '../context/DashboardContext';
import {
  createPlan,
  deletePlan,
  getAccountHistory,
  getNextWeekPlan,
  updatePlan,
} from '../services/nextWeekService';
import type {
  AccountHistoryRecord,
  NextWeekPlan,
  PaymentStatus,
} from '../types/nextWeek';

const { Link, Text } = Typography;

interface PlanFormValues {
  accountName: string;
  plannedTime: Dayjs;
  articleTitle: string;
  plannedAmount: number;
  paymentStatus: PaymentStatus;
}

const paymentStatusOptions: Array<{ label: string; value: PaymentStatus }> = [
  { label: '未付款', value: 'unpaid' },
  { label: '部分付款', value: 'partial' },
  { label: '已付款', value: 'paid' },
];

const paymentStatusMap: Record<PaymentStatus, string> = {
  unpaid: '未付款',
  partial: '部分付款',
  paid: '已付款',
};

function formatCurrency(value: number) {
  return `¥${value.toLocaleString('zh-CN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
}

export function NextWeekTab() {
  const { currentTeacher } = useDashboardContext();
  const [form] = Form.useForm<PlanFormValues>();
  const [data, setData] = useState<NextWeekPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<NextWeekPlan | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [historyAccountName, setHistoryAccountName] = useState<string | null>(
    null,
  );
  const [historyRows, setHistoryRows] = useState<AccountHistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadPlans = useCallback(() => {
    let ignore = false;

    if (!currentTeacher) {
      setData([]);
      setError(null);
      setLoading(false);

      return () => {
        ignore = true;
      };
    }

    setLoading(true);
    setError(null);

    getNextWeekPlan(currentTeacher.id)
      .then((nextData) => {
        if (!ignore) {
          setData(nextData);
        }
      })
      .catch((reason: unknown) => {
        if (!ignore) {
          setData([]);
          setError(reason instanceof Error ? reason.message : '未知错误');
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [currentTeacher]);

  useEffect(() => loadPlans(), [loadPlans]);

  const openCreateModal = () => {
    setEditingPlan(null);
    form.setFieldsValue({
      accountName: '',
      plannedTime: dayjs().add(1, 'week').hour(10).minute(0).second(0),
      articleTitle: '',
      plannedAmount: 0,
      paymentStatus: 'unpaid',
    });
    setIsPlanModalOpen(true);
  };

  const openEditModal = (plan: NextWeekPlan) => {
    setEditingPlan(plan);
    form.setFieldsValue({
      accountName: plan.accountName,
      plannedTime: dayjs(plan.plannedTime),
      articleTitle: plan.articleTitle,
      plannedAmount: plan.plannedAmount,
      paymentStatus: plan.paymentStatus,
    });
    setIsPlanModalOpen(true);
  };

  const closePlanModal = () => {
    setIsPlanModalOpen(false);
    setEditingPlan(null);
    form.resetFields();
  };

  const handleSubmitPlan = async () => {
    if (!currentTeacher) {
      return;
    }

    const values = await form.validateFields();
    const payload = {
      teacherId: currentTeacher.id,
      accountName: values.accountName,
      plannedTime: values.plannedTime.format('YYYY-MM-DD HH:mm'),
      articleTitle: values.articleTitle,
      plannedAmount: values.plannedAmount,
      paymentStatus: values.paymentStatus,
    };

    setSaving(true);
    setError(null);

    try {
      if (editingPlan) {
        const nextPlan = await updatePlan(editingPlan.id, payload);
        setData((prevRows) =>
          prevRows.map((row) => (row.id === editingPlan.id ? nextPlan : row)),
        );
        message.success('排期已更新');
      } else {
        const nextPlan = await createPlan(payload);
        setData((prevRows) => [...prevRows, nextPlan]);
        message.success('排期已新增');
      }

      closePlanModal();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '未知错误');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    setError(null);

    try {
      await deletePlan(planId);
      setData((prevRows) => prevRows.filter((row) => row.id !== planId));
      message.success('排期已删除');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '未知错误');
    }
  };

  const handlePaymentStatusChange = async (
    plan: NextWeekPlan,
    paymentStatus: PaymentStatus,
  ) => {
    setError(null);

    try {
      const nextPlan = await updatePlan(plan.id, { paymentStatus });
      setData((prevRows) =>
        prevRows.map((row) => (row.id === plan.id ? nextPlan : row)),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '未知错误');
    }
  };

  const openHistoryModal = async (accountName: string) => {
    if (!currentTeacher) {
      return;
    }

    setHistoryAccountName(accountName);
    setHistoryRows([]);
    setHistoryLoading(true);

    try {
      const nextRows = await getAccountHistory(currentTeacher.id, accountName);
      setHistoryRows(nextRows);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '未知错误');
    } finally {
      setHistoryLoading(false);
    }
  };

  const columns = useMemo<ColumnsType<NextWeekPlan>>(
    () => [
      {
        title: '账号名称',
        dataIndex: 'accountName',
        render: (accountName: string) => (
          <Link onClick={() => void openHistoryModal(accountName)}>
            {accountName}
          </Link>
        ),
        sorter: (a, b) => a.accountName.localeCompare(b.accountName, 'zh-CN'),
        width: 170,
      },
      {
        title: '计划投放时间',
        dataIndex: 'plannedTime',
        sorter: (a, b) =>
          dayjs(a.plannedTime).valueOf() - dayjs(b.plannedTime).valueOf(),
        width: 180,
      },
      {
        title: '文章标题',
        dataIndex: 'articleTitle',
        sorter: (a, b) => a.articleTitle.localeCompare(b.articleTitle, 'zh-CN'),
        width: 320,
      },
      {
        title: '计划金额',
        dataIndex: 'plannedAmount',
        render: formatCurrency,
        sorter: (a, b) => a.plannedAmount - b.plannedAmount,
        width: 140,
      },
      {
        title: '付款状态',
        dataIndex: 'paymentStatus',
        render: (value: PaymentStatus, record) => (
          <Select
            aria-label="修改付款状态"
            value={value}
            options={paymentStatusOptions}
            onChange={(nextValue) =>
              void handlePaymentStatusChange(record, nextValue)
            }
            style={{ width: 120 }}
          />
        ),
        sorter: (a, b) =>
          paymentStatusMap[a.paymentStatus].localeCompare(
            paymentStatusMap[b.paymentStatus],
            'zh-CN',
          ),
        width: 150,
      },
      {
        title: '操作',
        key: 'actions',
        fixed: 'right',
        render: (_, record) => (
          <Space size={8}>
            <Button onClick={() => openEditModal(record)} size="small">
              编辑
            </Button>
            <Popconfirm
              title="确认删除这条排期？"
              okText="删除"
              cancelText="取消"
              onConfirm={() => void handleDeletePlan(record.id)}
            >
              <Button danger size="small">
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
        width: 140,
      },
    ],
    [],
  );

  const historyColumns = useMemo<ColumnsType<AccountHistoryRecord>>(
    () => [
      {
        title: '投放时间',
        dataIndex: 'deliveryTime',
        width: 170,
      },
      {
        title: '文章标题',
        dataIndex: 'articleTitle',
      },
      {
        title: '投放金额',
        dataIndex: 'spendAmount',
        render: formatCurrency,
        width: 130,
      },
      {
        title: '广告阅读量',
        dataIndex: 'adReadCount',
        render: (value: number) => value.toLocaleString('zh-CN'),
        width: 130,
      },
      {
        title: 'ROI',
        dataIndex: 'roi',
        render: (value: number) => value.toFixed(2),
        width: 90,
      },
    ],
    [],
  );

  // TODO: Replace normal table sorting with drag-and-drop ordering when schedule priority is finalized.
  return (
    <div className="next-week-tab">
      <div className="next-week-toolbar">
        <Text strong>下周排期</Text>
        <Button onClick={openCreateModal} type="primary">
          新增排期
        </Button>
      </div>

      {error ? (
        <Alert
          className="weekly-alert"
          showIcon
          type="error"
          message="排期操作失败"
          description={error}
        />
      ) : null}

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        locale={{ emptyText: '暂无下周排期' }}
        pagination={{ pageSize: 8, showSizeChanger: false }}
        rowKey="id"
        scroll={{ x: 1100 }}
        size="middle"
      />

      <Modal
        title={editingPlan ? '编辑排期' : '新增排期'}
        open={isPlanModalOpen}
        onCancel={closePlanModal}
        onOk={() => void handleSubmitPlan()}
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            label="账号名称"
            name="accountName"
            rules={[{ required: true, message: '请输入账号名称' }]}
          >
            <Input placeholder="请输入账号名称" />
          </Form.Item>
          <Form.Item
            label="计划投放时间"
            name="plannedTime"
            rules={[{ required: true, message: '请选择计划投放时间' }]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            label="文章标题"
            name="articleTitle"
            rules={[{ required: true, message: '请输入文章标题' }]}
          >
            <Input placeholder="请输入文章标题" />
          </Form.Item>
          <Form.Item
            label="计划金额"
            name="plannedAmount"
            rules={[{ required: true, message: '请输入计划金额' }]}
          >
            <InputNumber
              min={0}
              precision={2}
              prefix="¥"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            label="付款状态"
            name="paymentStatus"
            rules={[{ required: true, message: '请选择付款状态' }]}
          >
            <Select options={paymentStatusOptions} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`${historyAccountName ?? '账号'}历史投放记录`}
        open={Boolean(historyAccountName)}
        onCancel={() => setHistoryAccountName(null)}
        footer={null}
        width={820}
      >
        <Table
          columns={historyColumns}
          dataSource={historyRows}
          loading={historyLoading}
          locale={{ emptyText: '暂无历史投放记录' }}
          pagination={false}
          rowKey="id"
          size="middle"
        />
      </Modal>
    </div>
  );
}
