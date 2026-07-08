import { Alert, Button, DatePicker, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDashboardContext } from '../context/DashboardContext';
import { getWeeklyData, refreshReadCount } from '../services/weeklyService';
import type { WeeklyDeliveryViewRow } from '../types/weekly';

const { Text } = Typography;

function getCurrentMonday() {
  const today = dayjs();
  const day = today.day();
  const diff = day === 0 ? 6 : day - 1;

  return today.subtract(diff, 'day').startOf('day');
}

function formatCurrency(value: number) {
  return `¥${value.toLocaleString('zh-CN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
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

function exportRowsToCsv(rows: WeeklyDeliveryViewRow[]) {
  const headers = [
    '账号名称',
    '投放时间',
    '文章标题',
    '投放金额',
    '广告阅读量',
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
    row.spendAmount,
    row.adReadCount,
    row.wechatAdds,
    row.wechatAddCost.toFixed(2),
    formatPercent(row.wechatAddRate),
    row.readCost.toFixed(2),
    row.dealCount,
    row.dealAmount,
    row.roi.toFixed(2),
  ]);

  const escapeCell = (cell: string | number) =>
    `"${String(cell).split('"').join('""')}"`;

  const csv = [headers, ...body]
    .map((row) => row.map(escapeCell).join(','))
    .join('\n');
  const blob = new Blob([`\uFEFF${csv}`], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `本周投放-${dayjs().format('YYYYMMDD-HHmmss')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function WeeklyTab() {
  const { currentTeacher } = useDashboardContext();
  const [weekStartDate, setWeekStartDate] = useState<Dayjs>(
    getCurrentMonday(),
  );
  const [data, setData] = useState<WeeklyDeliveryViewRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshingRowId, setRefreshingRowId] = useState<string | null>(null);

  const loadWeeklyData = useCallback(() => {
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

    getWeeklyData(currentTeacher.id, weekStartDate.format('YYYY-MM-DD'))
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
  }, [currentTeacher, weekStartDate]);

  useEffect(() => loadWeeklyData(), [loadWeeklyData]);

  const handleRefreshReadCount = async (rowId: string) => {
    setRefreshingRowId(rowId);
    setError(null);

    try {
      const nextRow = await refreshReadCount(rowId);
      setData((prevRows) =>
        prevRows.map((row) => (row.id === rowId ? nextRow : row)),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '未知错误');
    } finally {
      setRefreshingRowId(null);
    }
  };

  const columns = useMemo<ColumnsType<WeeklyDeliveryViewRow>>(
    () => [
      {
        title: '账号名称',
        dataIndex: 'accountName',
        sorter: (a, b) => a.accountName.localeCompare(b.accountName, 'zh-CN'),
        width: 150,
      },
      {
        title: '投放时间',
        dataIndex: 'deliveryTime',
        sorter: (a, b) =>
          dayjs(a.deliveryTime).valueOf() - dayjs(b.deliveryTime).valueOf(),
        width: 170,
      },
      {
        title: '文章标题',
        dataIndex: 'articleTitle',
        sorter: (a, b) => a.articleTitle.localeCompare(b.articleTitle, 'zh-CN'),
        width: 280,
      },
      {
        title: '投放金额',
        dataIndex: 'spendAmount',
        render: formatCurrency,
        sorter: (a, b) => a.spendAmount - b.spendAmount,
        width: 130,
      },
      {
        title: '广告阅读量',
        dataIndex: 'adReadCount',
        render: (value: number, record) => (
          <Space size={8}>
            <Text>{value.toLocaleString('zh-CN')}</Text>
            <Button
              aria-label="刷新广告阅读量"
              loading={refreshingRowId === record.id}
              onClick={() => void handleRefreshReadCount(record.id)}
              size="small"
              type="text"
            >
              刷新
            </Button>
          </Space>
        ),
        sorter: (a, b) => a.adReadCount - b.adReadCount,
        width: 150,
      },
      {
        title: '加微量',
        dataIndex: 'wechatAdds',
        sorter: (a, b) => a.wechatAdds - b.wechatAdds,
        width: 110,
      },
      {
        title: '加微成本',
        dataIndex: 'wechatAddCost',
        render: formatCurrency,
        sorter: (a, b) => a.wechatAddCost - b.wechatAddCost,
        width: 120,
      },
      {
        title: '加微率',
        dataIndex: 'wechatAddRate',
        render: formatPercent,
        sorter: (a, b) => a.wechatAddRate - b.wechatAddRate,
        width: 110,
      },
      {
        title: '阅读成本',
        dataIndex: 'readCost',
        render: formatCurrency,
        sorter: (a, b) => a.readCost - b.readCost,
        width: 120,
      },
      {
        title: '成交量',
        dataIndex: 'dealCount',
        sorter: (a, b) => a.dealCount - b.dealCount,
        width: 110,
      },
      {
        title: '成交金额',
        dataIndex: 'dealAmount',
        render: formatCurrency,
        sorter: (a, b) => a.dealAmount - b.dealAmount,
        width: 130,
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
        fixed: 'right',
        width: 90,
      },
    ],
    [refreshingRowId],
  );

  return (
    <div className="weekly-tab">
      <div className="weekly-toolbar">
        <Space size={12} wrap>
          <Text className="toolbar-label">周起始日期</Text>
          <DatePicker
            allowClear={false}
            value={weekStartDate}
            onChange={(value) => {
              if (value) {
                setWeekStartDate(value.startOf('day'));
              }
            }}
          />
        </Space>
        <Button onClick={() => exportRowsToCsv(data)} type="primary">
          导出 Excel
        </Button>
      </div>

      {error ? (
        <Alert
          className="weekly-alert"
          showIcon
          type="error"
          message="本周投放数据加载失败"
          description={error}
        />
      ) : null}

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        locale={{ emptyText: '暂无本周投放数据' }}
        pagination={{ pageSize: 8, showSizeChanger: false }}
        rowKey="id"
        scroll={{ x: 1600 }}
        size="middle"
      />
    </div>
  );
}
