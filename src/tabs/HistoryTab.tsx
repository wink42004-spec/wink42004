import {
  Alert,
  Empty,
  Modal,
  Spin,
  Statistic,
  Table,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { LineChart } from '../components/LineChart';
import { useDashboardContext } from '../context/DashboardContext';
import { getHistoryDetails, getHistorySummary } from '../services/historyService';
import type {
  AccountPerformance,
  HistoryDetail,
  HistorySummary,
} from '../types/history';

const { Link, Text } = Typography;

function formatCurrency(value: number) {
  return `¥${value.toLocaleString('zh-CN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
}

function formatNumber(value: number) {
  return value.toLocaleString('zh-CN');
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

function getRoiClassName(roi: number) {
  if (roi >= 2) {
    return 'roi-good';
  }

  if (roi >= 1) {
    return 'roi-warning';
  }

  return 'roi-danger';
}

export function HistoryTab() {
  const { currentTeacher } = useDashboardContext();
  const [summary, setSummary] = useState<HistorySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailAccountName, setDetailAccountName] = useState<string | null>(
    null,
  );
  const [detailRows, setDetailRows] = useState<HistoryDetail[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadSummary = useCallback(() => {
    let ignore = false;

    if (!currentTeacher) {
      setSummary(null);
      setError(null);
      setLoading(false);

      return () => {
        ignore = true;
      };
    }

    setLoading(true);
    setError(null);

    getHistorySummary(currentTeacher.id)
      .then((nextSummary) => {
        if (!ignore) {
          setSummary(nextSummary);
        }
      })
      .catch((reason: unknown) => {
        if (!ignore) {
          setSummary(null);
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

  useEffect(() => loadSummary(), [loadSummary]);

  const openDetailModal = useCallback(
    async (accountName: string) => {
      if (!currentTeacher) {
        return;
      }

      setDetailAccountName(accountName);
      setDetailRows([]);
      setDetailLoading(true);
      setError(null);

      try {
        const nextRows = await getHistoryDetails(
          currentTeacher.id,
          accountName,
        );
        setDetailRows(nextRows);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : '未知错误');
      } finally {
        setDetailLoading(false);
      }
    },
    [currentTeacher],
  );

  const columns = useMemo<ColumnsType<AccountPerformance>>(
    () => [
      {
        title: '账号名称',
        dataIndex: 'accountName',
        render: (accountName: string) => (
          <Link onClick={() => void openDetailModal(accountName)}>
            {accountName}
          </Link>
        ),
        sorter: (a, b) => a.accountName.localeCompare(b.accountName, 'zh-CN'),
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
        render: formatNumber,
        sorter: (a, b) => a.totalReadCount - b.totalReadCount,
        width: 130,
      },
      {
        title: '平均阅读量',
        dataIndex: 'averageReadCount',
        render: formatNumber,
        sorter: (a, b) => a.averageReadCount - b.averageReadCount,
        width: 130,
      },
      {
        title: '总获客数',
        dataIndex: 'totalLeads',
        render: formatNumber,
        sorter: (a, b) => a.totalLeads - b.totalLeads,
        width: 120,
      },
      {
        title: '获客成本',
        dataIndex: 'leadCost',
        render: formatCurrency,
        sorter: (a, b) => a.leadCost - b.leadCost,
        width: 120,
      },
      {
        title: '加微率',
        dataIndex: 'addWechatRate',
        render: formatPercent,
        sorter: (a, b) => a.addWechatRate - b.addWechatRate,
        width: 110,
      },
      {
        title: '转化率',
        dataIndex: 'conversionRate',
        render: formatPercent,
        sorter: (a, b) => a.conversionRate - b.conversionRate,
        width: 110,
      },
      {
        title: 'ROI',
        dataIndex: 'roi',
        render: (roi: number) => (
          <span className={`roi-value ${getRoiClassName(roi)}`}>
            {roi.toFixed(2)}
          </span>
        ),
        sorter: (a, b) => a.roi - b.roi,
        width: 90,
      },
      {
        title: '总成交量',
        dataIndex: 'totalDeals',
        render: formatNumber,
        sorter: (a, b) => a.totalDeals - b.totalDeals,
        width: 120,
      },
      {
        title: '总投放金额',
        dataIndex: 'totalSpendAmount',
        render: formatCurrency,
        sorter: (a, b) => a.totalSpendAmount - b.totalSpendAmount,
        width: 140,
      },
    ],
    [openDetailModal],
  );

  const detailColumns = useMemo<ColumnsType<HistoryDetail>>(
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
        title: '阅读量',
        dataIndex: 'readCount',
        render: formatNumber,
        width: 120,
      },
      {
        title: '获客',
        dataIndex: 'leads',
        render: formatNumber,
        width: 90,
      },
      {
        title: '成交',
        dataIndex: 'deals',
        render: formatNumber,
        width: 90,
      },
      {
        title: '成交金额',
        dataIndex: 'dealAmount',
        render: formatCurrency,
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

  if (loading) {
    return (
      <div className="history-state">
        <Spin tip="加载历史汇总" />
      </div>
    );
  }

  if (error && !summary) {
    return (
      <Alert
        showIcon
        type="error"
        message="历史汇总加载失败"
        description={error}
      />
    );
  }

  if (!summary || summary.accountPerformance.length === 0) {
    return <Empty description="暂无历史汇总数据" />;
  }

  return (
    <div className="history-tab">
      {error ? (
        <Alert
          showIcon
          type="error"
          message="历史明细加载失败"
          description={error}
        />
      ) : null}

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
          <Statistic
            title="整体 ROI"
            value={summary.kpi.overallRoi}
            precision={2}
          />
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
          locale={{ emptyText: '暂无账号表现数据' }}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          rowKey="id"
          scroll={{ x: 1580 }}
          size="middle"
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
            valueFormatter={(value) => formatCurrency(Number(value))}
          />
        </section>
      </div>

      <Modal
        title={`${detailAccountName ?? '账号'}历史明细`}
        open={Boolean(detailAccountName)}
        onCancel={() => setDetailAccountName(null)}
        footer={null}
        width={980}
      >
        <Table
          columns={detailColumns}
          dataSource={detailRows}
          loading={detailLoading}
          locale={{ emptyText: '暂无历史明细' }}
          pagination={false}
          rowKey="id"
          scroll={{ x: 900 }}
          size="middle"
        />
      </Modal>
    </div>
  );
}
