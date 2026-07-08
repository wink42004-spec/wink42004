import { Button, Layout, Modal, Statistic, Table, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { LineChart } from '../components/LineChart';
import { getDashboardScreenData } from '../services/mockApi';
import type { DashboardScreenData, WeeklyDeliveryView } from '../types/shared';

const { Content } = Layout;

function money(value: number) {
  return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function DashboardScreen({ onBack }: { onBack: () => void }) {
  const [data, setData] = useState<DashboardScreenData | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    void getDashboardScreenData().then(setData);
  }, []);

  const openDetail = (title: string) => {
    setModalTitle(title);
    setDetailOpen(true);
  };

  if (!data) return null;

  const detailRows: WeeklyDeliveryView[] = data.weeklyDetails;

  return (
    <Layout className="screen-shell">
      <Content className="screen-content">
        <div className="screen-header">
          <Typography.Title level={2}>公众号投放监控大屏</Typography.Title>
          <Button onClick={onBack}>返回看板</Button>
        </div>
        <div className="screen-kpi-grid">
          <article onClick={() => openDetail('本周投放金额')}><Statistic title="本周投放" value={data.weeklyKpi.spendAmount} prefix="¥" /></article>
          <article onClick={() => openDetail('本周阅读量')}><Statistic title="阅读量" value={data.weeklyKpi.readCount} /></article>
          <article onClick={() => openDetail('本周获客')}><Statistic title="获客" value={data.weeklyKpi.leads} /></article>
          <article onClick={() => openDetail('本周 ROI')}><Statistic title="ROI" value={data.weeklyKpi.roi} precision={2} /></article>
        </div>
        <div className="history-chart-grid">
          <section className="history-chart-card" onClick={() => openDetail('ROI 趋势')}><LineChart color="#38bdf8" data={data.roiTrend} title="ROI 趋势" /></section>
          <section className="history-chart-card" onClick={() => openDetail('获客成本趋势')}><LineChart color="#22c55e" data={data.leadCostTrend} title="获客成本趋势" valueFormatter={(value) => money(Number(value))} /></section>
        </div>
        <section className="history-section">
          <div className="history-section-header"><Typography.Text strong>账号排行</Typography.Text></div>
          <Table
            dataSource={data.accountRanking}
            rowKey="id"
            pagination={false}
            onRow={() => ({ onClick: () => openDetail('账号排行明细') })}
            columns={[
              { title: '账号', dataIndex: 'accountName' },
              { title: 'ROI', dataIndex: 'roi', render: (value: number) => value.toFixed(2) },
              { title: '总获客', dataIndex: 'totalLeads' },
              { title: '总投放', dataIndex: 'totalSpendAmount', render: money },
            ]}
          />
        </section>
        <Modal title={modalTitle} open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={900}>
          <Table
            dataSource={detailRows}
            rowKey="id"
            pagination={false}
            columns={[
              { title: '账号', dataIndex: 'accountName' },
              { title: '标题', dataIndex: 'articleTitle' },
              { title: '金额', dataIndex: 'spendAmount', render: money },
              { title: '阅读量', dataIndex: 'readCount' },
              { title: 'ROI', dataIndex: 'roi', render: (value: number) => value.toFixed(2) },
            ]}
          />
        </Modal>
      </Content>
    </Layout>
  );
}
