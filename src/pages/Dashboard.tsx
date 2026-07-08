import { Button, Layout, Modal, Space, Tabs, Tag, Typography, Upload, message } from 'antd';
import { useState } from 'react';
import { PermissionNotice } from '../components/PermissionNotice';
import { UserStatusBadge } from '../components/UserStatusBadge';
import { useAuthContext } from '../context/AuthContext';
import { uploadWeeklyCsv } from '../services/mockApi';
import { AuditLogTab } from '../tabs/AuditLogTab';
import { HistoryTab } from '../tabs/HistoryTab';
import { NextWeekTab } from '../tabs/NextWeekTab';
import { WeeklyTab } from '../tabs/WeeklyTab';

const { Header, Content } = Layout;

interface DashboardProps {
  onEnterScreen: () => void;
  onLogin: () => void;
  onRegister: () => void;
  onReview: () => void;
}

export function Dashboard({
  onEnterScreen,
  onLogin,
  onRegister,
  onReview,
}: DashboardProps) {
  const { currentUser } = useAuthContext();
  const [uploadOpen, setUploadOpen] = useState(false);

  const canViewData =
    currentUser.status === 'guest' ||
    currentUser.status === 'approved' ||
    currentUser.isAdmin;

  return (
    <Layout className="app-shell">
      <Header className="dashboard-header">
        <div className="dashboard-heading">
          <Typography.Title className="dashboard-title" level={1}>
            公众号投放监控共享看板
          </Typography.Title>
          <span className="dashboard-subtitle">
            Shared campaign intelligence console
          </span>
        </div>
        <Space className="dashboard-actions" wrap>
          <UserStatusBadge
            onLogin={onLogin}
            onRegister={onRegister}
            onReview={onReview}
          />
          <Button disabled={!canViewData} onClick={() => setUploadOpen(true)}>
            上传数据
          </Button>
          <Button disabled={!canViewData} onClick={onEnterScreen} type="primary">
            进入大屏
          </Button>
        </Space>
      </Header>
      <Content className="dashboard-content">
        <section className="overview-panel">
          <div>
            <Tag className="overview-tag">
              {currentUser.status === 'guest' ? 'MOCK DATA' : 'LIVE OPERATIONS'}
            </Tag>
            <h2 className="overview-title">共享投放数据中枢</h2>
            <p className="overview-copy">
              {currentUser.status === 'guest'
                ? '当前为访客模式，展示模拟数据。'
                : `当前账号：${currentUser.username}。所有人查看同一套共享数据，新增、修改、上传、删除都会写入修改记录。`}
            </p>
          </div>
          <div className="overview-signal" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </section>
        {!canViewData ? (
          <section className="tabs-panel">
            <PermissionNotice />
          </section>
        ) : (
          <section className="tabs-panel">
            <Tabs
              defaultActiveKey="weekly"
              items={[
                { key: 'weekly', label: '本期投放', children: <WeeklyTab /> },
                { key: 'nextWeek', label: '下期投放', children: <NextWeekTab /> },
                { key: 'history', label: '历史汇总', children: <HistoryTab /> },
                { key: 'audit', label: '修改记录', children: <AuditLogTab /> },
              ]}
            />
          </section>
        )}
      </Content>
      <Modal
        title="上传共享投放数据"
        open={uploadOpen}
        onCancel={() => setUploadOpen(false)}
        footer={null}
      >
        <Upload.Dragger
          accept=".csv"
          showUploadList={false}
          beforeUpload={(file) => {
            void file.text().then((text) =>
              uploadWeeklyCsv(text, currentUser.username).then(() => {
                message.success('已上传到本期投放，并自动更新阅读量');
                setUploadOpen(false);
              }),
            );
            return false;
          }}
        >
          <p>拖拽或点击上传 CSV</p>
          <p className="upload-hint">
            格式：周起始日期,账号,投放时间,标题,投放课程,文章链接,投放金额,阅读量,加微量,成交量,成交金额
          </p>
        </Upload.Dragger>
      </Modal>
    </Layout>
  );
}
