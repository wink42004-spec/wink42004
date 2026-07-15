import {
  Alert,
  Button,
  Layout,
  Modal,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import type { UploadProps } from 'antd';
import { useState } from 'react';
import { standardTemplateList } from '../config/uploadTemplates';
import { PermissionNotice } from '../components/PermissionNotice';
import { UserStatusBadge } from '../components/UserStatusBadge';
import { useAuthContext } from '../context/AuthContext';
import {
  commitStandardExcelUpload,
  previewStandardExcelUpload,
} from '../services/mockApi';
import { AuditLogTab } from '../tabs/AuditLogTab';
import { HistoryTab } from '../tabs/HistoryTab';
import { NextWeekTab } from '../tabs/NextWeekTab';
import { WeeklyTab } from '../tabs/WeeklyTab';
import type { StandardUploadPreview } from '../types/shared';

const { Header, Content } = Layout;

interface DashboardProps {
  onEnterScreen: () => void;
  onLogin: () => void;
  onRegister: () => void;
  onReview: () => void;
}

const templateBaseUrl = 'templates/';

export function Dashboard({
  onEnterScreen,
  onLogin,
  onRegister,
  onReview,
}: DashboardProps) {
  const { currentUser } = useAuthContext();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [preview, setPreview] = useState<StandardUploadPreview | null>(null);
  const [uploading, setUploading] = useState(false);

  const canViewData =
    currentUser.status === 'guest' ||
    currentUser.status === 'approved' ||
    currentUser.isAdmin;

  const uploadProps: UploadProps = {
    accept: '.xlsx,.xls',
    multiple: false,
    showUploadList: false,
    beforeUpload: (file) => {
      const realFile = file as File;
      void realFile
        .arrayBuffer()
        .then((buffer) => previewStandardExcelUpload(realFile.name, buffer))
        .then((result) => {
          setPreview(result);
          if (result.missingFields.length > 0 || result.errors.length > 0) {
            message.warning('文件已解析，请先处理字段或行错误');
          } else {
            message.success(`识别成功：${result.validRows} 条`);
          }
        });
      return false;
    },
  };

  const confirmImport = async () => {
    if (!preview) return;
    setUploading(true);
    try {
      const result = await commitStandardExcelUpload(preview, currentUser.username);
      message.success(`导入成功：${result.rowCount} 条，版本 V${result.versionNo}`);
      setPreview(null);
      setUploadOpen(false);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '导入失败');
    } finally {
      setUploading(false);
    }
  };

  const canImport =
    Boolean(preview?.kind) &&
    preview?.missingFields.length === 0 &&
    preview?.errors.length === 0 &&
    preview.validRows > 0;

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
                : `当前账号：${currentUser.username}。请使用标准模板上传，本期投放和下期排期会自动识别并预览。`}
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
        title="上传标准模板"
        open={uploadOpen}
        onCancel={() => {
          setUploadOpen(false);
          setPreview(null);
        }}
        onOk={() => void confirmImport()}
        okText="确认导入"
        okButtonProps={{ disabled: !canImport, loading: uploading }}
        width={860}
      >
        <Space wrap className="template-actions">
          {standardTemplateList.map((template) => (
            <Button
              key={template.kind}
              href={`${templateBaseUrl}${template.fileName}`}
              download
            >
              下载{template.name}.xlsx {template.version}（{template.versionDate}）
            </Button>
          ))}
        </Space>
        <Upload.Dragger {...uploadProps}>
          <p className="upload-source-title">拖拽或点击上传 Excel 模板</p>
          <p className="upload-hint">
            仅支持两个标准模板，系统会按字段名识别，不按列位置识别。
          </p>
        </Upload.Dragger>
        {preview ? (
          <div className="upload-preview">
            <Alert
              showIcon
              type={canImport ? 'success' : 'warning'}
              message={
                canImport
                  ? `识别为：${preview.templateName}，可导入 ${preview.validRows} 条`
                  : '文件暂不可导入'
              }
              description={`总行数 ${preview.totalRows}，成功 ${preview.validRows}，错误 ${preview.errors.length}`}
            />
            {preview.missingFields.length > 0 ? (
              <Alert
                showIcon
                type="error"
                message="缺少字段"
                description={preview.missingFields.join('、')}
              />
            ) : null}
            {preview.errors.length > 0 ? (
              <Table
                size="small"
                rowKey={(row) => `${row.rowNumber}-${row.reason}`}
                dataSource={preview.errors}
                pagination={false}
                columns={[
                  { title: '错误行号', dataIndex: 'rowNumber', width: 120 },
                  { title: '原因', dataIndex: 'reason' },
                ]}
              />
            ) : null}
          </div>
        ) : null}
      </Modal>
    </Layout>
  );
}
