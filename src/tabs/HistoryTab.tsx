import { Alert, Empty, Modal, Spin, Statistic, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { LineChart } from '../components/LineChart';
import { getHistoryDetails, getHistorySummary } from '../services/historyService';
import type {
  AccountPerformance,
  HistorySummary,
  WeeklyDeliveryView,
} from '../types/shared';

const { Link, Text } = Typography;

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

export function HistoryTab() {
  const [summary, setSummary] = useState<HistorySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailAccount, setDetailAccount] = useState<string | null>(null);
  const [details, setDetails] = useState<WeeklyDeliveryView[]>([]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    void getHistorySummary()
      .then(setSummary)
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : '未知错误'),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);

  const openDetails = useCallback(async (accountName: string) => {
    setDetailAccount(accountName);
    setDetails(await getHistoryDetails(accountName));
  }, []);

  const columns = useMemo<ColumnsType<AccountPerformance>>(
    () => [
      {
        title: '账号名称',
        dataIndex: 'accountName',
        render: (value: string) => (
          <Link onClick={() => void openDetails(value)}>{value}</Link>
        ),
        fixed: 'left',
        width: 170,
      },
      {
        title: '账号等级',
        dataIndex: 'accountLevel',
        sorter: (a, b) => a.accountLevel.localeCompare(b.accountLevel),
        width: 100,
      },
      {
        title: '合作次数',
        dataIndex: 'cooperationCount',
        sorter: (a, b) => a.cooperationCount - b.cooperationCount,
        width: 110,
      },
      {
        title: '总阅读量',
        dataIndex: 'totalReadCount',
        render: (value: number) => value.toLocaleString('zh-CN'),
        sorter: (a, b) => a.totalReadCount - b.totalReadCount,
        width: 130,
      },
      {
        title: '平均阅读量',
        dataIndex: 'averageReadCount',
        render: (value: number) => Math.round(value).toLocaleString('zh-CN'),
        sorter: (a, b) => a.averageReadCount - b.averageReadCount,
        width: 130,
      },
      {
        title: '总获客数',
        dataIndex: 'totalLeads',
        sorter: (a, b) => a.totalLeads - b.totalLeads,
        width: 120,
      },
      {
        title: '获客成本',
        dataIndex: 'leadCost',
        render: money,
        sorter: (a, b) => a.leadCost - b.leadCost,
        width: 120,
      },
      {
        title: '加微率',
        dataIndex: 'addWechatRate',
        render: percent,
        sorter: (a, b) => a.addWechatRate - b.addWechatRate,
        width: 100,
      },
      {
        title: '转化率',
        dataIndex: 'conversionRate',
        render: percent,
        sorter: (a, b) => a.conversionRate - b.conversionRate,
        width: 100,
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
        title: '总成交量',
        dataIndex: 'totalDeals',
        sorter: (a, b) => a.totalDeals - b.totalDeals,
        width: 120,
      },
      {
        title: '总投放金额',
        dataIndex: 'totalSpendAmount',
        render: money,
        sorter: (a, b) => a.totalSpendAmount - b.totalSpendAmount,
        width: 140,
      },
    ],
    [openDetails],
  );

  if (loading) {
    return (
      <div className="history-state">
        <Spin tip="加载历史汇总" />
      </div>
    );
  }

  if (error) {
    return <Alert showIcon type="error" message="历史汇总加载失败" description={error} />;
  }

  if (!summary) return <Empty description="暂无历史汇总数据" />;

  return (
    <div className="history-tab">
      <div className="history-kpi-grid">
        <article className="history-kpi-card">
          <Statistic
            title="累计投放金额"
            value={summary.kpi.totalSpendAmount}
            precision={2}
            prefix="¥"
          />
        </article>
        <article className="history-kpi-card">
          <Statistic title="累计获客" value={summary.kpi.totalLeads} />
        </article>
        <article className="history-kpi-card">
          <Statistic title="累计成交" value={summary.kpi.totalDeals} />
        </article>
        <article className="history-kpi-card">
          <Statistic title="整体 ROI" value={summary.kpi.overallRoi} precision={2} />
        </article>
        <article className="history-kpi-card">
          <Statistic
            title="平均获客成本"
            value={summary.kpi.averageLeadCost}
            precision={2}
            prefix="¥"
          />
        </article>
      </div>
      <section className="history-section">
        <div className="history-section-header">
          <Text strong>账号表现</Text>
        </div>
        <Table
          columns={columns}
          dataSource={summary.accountPerformance}
          rowKey="id"
          scroll={{ x: 1500 }}
        />
      </section>
      <div className="history-chart-grid">
        <section className="history-chart-card">
          <LineChart
            color="#2563eb"
            data={summary.roiTrend}
            title="ROI 趋势"
            valueFormatter={(value) => Number(value).toFixed(2)}
          />
        </section>
        <section className="history-chart-card">
          <LineChart
            color="#16a34a"
            data={summary.leadCostTrend}
            title="获客成本趋势"
            valueFormatter={(value) => money(Number(value))}
          />
        </section>
      </div>
      <Modal
        title={`${detailAccount ?? '账号'}历史明细`}
        open={Boolean(detailAccount)}
        onCancel={() => setDetailAccount(null)}
        footer={null}
        width={900}
      >
        <Table
          dataSource={details}
          rowKey="id"
          pagination={false}
          columns={[
            { title: '投放时间', dataIndex: 'deliveryTime' },
            { title: '标题', dataIndex: 'articleTitle' },
            { title: '投放课程', dataIndex: 'courseCode' },
            { title: '投放金额', dataIndex: 'spendAmount', render: money },
            { title: '阅读量', dataIndex: 'readCount' },
            { title: '成交金额', dataIndex: 'dealAmount', render: money },
            { title: 'ROI', dataIndex: 'roi', render: (value: number) => value.toFixed(2) },
          ]}
        />
      </Modal>
    </div>
  );
}
