import { Button, Layout, Modal, Space, Tabs, Tag, Typography, Upload, message } from 'antd';
import type { UploadProps } from 'antd';
import { useState } from 'react';
import { PermissionNotice } from '../components/PermissionNotice';
import { UserStatusBadge } from '../components/UserStatusBadge';
import { useAuthContext } from '../context/AuthContext';
import { uploadExcelDataSource } from '../services/mockApi';
import { AuditLogTab } from '../tabs/AuditLogTab';
import { HistoryTab } from '../tabs/HistoryTab';
import { NextWeekTab } from '../tabs/NextWeekTab';
import { WeeklyTab } from '../tabs/WeeklyTab';
import type { ExcelSourceType } from '../types/shared';

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

  const uploadProps = (sourceType: ExcelSourceType): UploadProps => ({
    accept: '.xlsx,.xls',
    showUploadList: false,
    beforeUpload: (file) => {
      void file
        .arrayBuffer()
        .then((buffer) =>
          uploadExcelDataSource(sourceType, file.name, buffer, currentUser.username),
        )
        .then((result) => {
          message.success(
            `已导入 ${result.sheetCount} 个 sheet，${result.rowCount} 条记录，版本号 V${result.versionNo}`,
          );
          setUploadOpen(false);
        });
      return false;
    },
  });

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
                : `当前账号：${currentUser.username}。所有人查看同一套共享数据，上传 Excel 后会自动重算公式字段并写入修改记录。`}
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
        title="上传 Excel 数据源"
        open={uploadOpen}
        onCancel={() => setUploadOpen(false)}
        footer={null}
        width={760}
      >
        <div className="upload-source-grid">
          <Upload.Dragger {...uploadProps('trainingCamp')}>
            <p className="upload-source-title">训练营投放数据监测表</p>
            <p className="upload-hint">
              解析所有 sheet，sheet 名作为期次，表头作为本期投放字段。
            </p>
          </Upload.Dragger>
          <Upload.Dragger {...uploadProps('officialAccount')}>
            <p className="upload-source-title">公众号投放数据</p>
            <p className="upload-hint">
              读取投放数据明细、账号数据汇总、账号评估模型、标题 ROI 波动。
            </p>
          </Upload.Dragger>
        </div>
      </Modal>
    </Layout>
  );
}
