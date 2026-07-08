import { Layout, Tabs, Typography } from 'antd';
import * as echarts from 'echarts/core';
import { TeacherSelect } from '../components/TeacherSelect';
import { useDashboardContext } from '../context/DashboardContext';
import { HistoryTab } from '../tabs/HistoryTab';
import { NextWeekTab } from '../tabs/NextWeekTab';
import { WeeklyTab } from '../tabs/WeeklyTab';

const { Header, Content } = Layout;

export function Dashboard() {
  const { currentTeacher } = useDashboardContext();

  void echarts;

  return (
    <Layout className="app-shell">
      <Header className="dashboard-header">
        <Typography.Title className="dashboard-title" level={1}>
          公众号投放监控仪表盘
        </Typography.Title>
        <TeacherSelect />
      </Header>
      <Content className="dashboard-content">
        <section className="overview-panel" aria-label="老师投放概览">
          <h2 className="overview-title">
            {currentTeacher?.name ?? '老师'}投放概览
          </h2>
          <p className="overview-copy">
            切换老师后，下方各模块会按当前老师重新加载自己的 Mock 数据。
          </p>
        </section>

        <section className="tabs-panel" aria-label="投放数据视图">
          <Tabs
            defaultActiveKey="weekly"
            items={[
              {
                key: 'weekly',
                label: '本周投放',
                children: <WeeklyTab />,
              },
              {
                key: 'nextWeek',
                label: '下周排期',
                children: <NextWeekTab />,
              },
              {
                key: 'history',
                label: '历史汇总',
                children: <HistoryTab />,
              },
            ]}
          />
        </section>
      </Content>
    </Layout>
  );
}
