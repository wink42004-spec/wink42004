import { Button, Layout, Modal, Space, Tabs, Tag, Typography, Upload, message } from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import { useState } from 'react';
import { PermissionNotice } from '../components/PermissionNotice';
import { UserStatusBadge } from '../components/UserStatusBadge';
import { useAuthContext } from '../context/AuthContext';
import { uploadDataFile } from '../services/mockApi';
import { AuditLogTab } from '../tabs/AuditLogTab';
import { HistoryTab } from '../tabs/HistoryTab';
import { NextWeekTab } from '../tabs/NextWeekTab';
import { WeeklyTab } from '../tabs/WeeklyTab';
import type { UploadSourceType } from '../types/shared';

const { Header, Content } = Layout;

interface DashboardProps {
  onEnterScreen: () => void;
  onLogin: () => void;
  onRegister: () => void;
  onReview: () => void;
}

const uploadAccept = '.xlsx,.xls,.csv,.docx,.pdf,.png,.jpg,.jpeg,.webp';

function getUploadSourceType(fileName: string): UploadSourceType | null {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'xlsx' || ext === 'xls') return 'trainingCamp';
  if (ext === 'csv') return 'csv';
  if (ext === 'docx') return 'document';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp') return 'image';
  return null;
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

  const uploadProps: UploadProps = {
    accept: uploadAccept,
    multiple: true,
    showUploadList: false,
    beforeUpload: (file: UploadFile) => {
      const realFile = file as unknown as File;
      const sourceType = getUploadSourceType(realFile.name);
      if (!sourceType) {
        message.error('暂不支持该文件格式');
        return false;
      }
      const readFile =
        sourceType === 'csv' ? realFile.text() : realFile.arrayBuffer();
      void readFile
        .then((content) =>
          uploadDataFile(sourceType, realFile.name, content, currentUser.username),
        )
        .then((result) => {
          if (result.structured) {
            message.success(
              `已结构化导入 ${result.rowCount} 条记录，版本号 V${result.versionNo}`,
            );
          } else {
            message.success(`已上传附件并记录版本 V${result.versionNo}`);
          }
        });
      return false;
    },
  };

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
                : `当前账号：${currentUser.username}。Excel / CSV 会结构化导入本期投放，Word / PDF / 图片会作为附件记录。`}
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
        title="上传数据文件"
        open={uploadOpen}
        onCancel={() => setUploadOpen(false)}
        footer={null}
        width={760}
      >
        <Upload.Dragger {...uploadProps}>
          <p className="upload-source-title">拖拽或点击上传文件</p>
          <p className="upload-hint">
            Excel（.xlsx/.xls）和 CSV（.csv）会解析 sheet、表头、数据行与公式字段，并写入本期投放数据。
          </p>
          <p className="upload-hint">
            Word（.docx）、PDF（.pdf）和图片（.png/.jpg/.jpeg/.webp）会作为附件记录上传历史。
          </p>
        </Upload.Dragger>
      </Modal>
    </Layout>
  );
}
