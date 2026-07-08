import { Alert, Empty, Spin, Statistic } from 'antd';
import type { DeliveryMetric } from '../types/dashboard';

interface TabDataPanelProps {
  data: DeliveryMetric[];
  error: string | null;
  loading: boolean;
}

export function TabDataPanel({ data, error, loading }: TabDataPanelProps) {
  if (loading) {
    return (
      <div className="tab-state">
        <Spin tip="加载中" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        showIcon
        type="error"
        message="数据加载失败"
        description={error}
      />
    );
  }

  if (data.length === 0) {
    return <Empty description="暂无数据" />;
  }

  return (
    <div className="metric-grid">
      {data.map((metric) => (
        <article className="metric-card" key={metric.id}>
          <Statistic title={metric.title} value={metric.value} />
          <span className="metric-trend">{metric.trend}</span>
        </article>
      ))}
    </div>
  );
}
