import { Button, Card, Result, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import {
  approveUser,
  getPendingUsers,
  rejectUser,
} from '../services/mockAuthApi';
import type { AppUser } from '../types/shared';

export function UserReviewPage({ onBack }: { onBack: () => void }) {
  const { currentUser } = useAuthContext();
  const [users, setUsers] = useState<AppUser[]>([]);

  useEffect(() => {
    if (currentUser.isAdmin) {
      void getPendingUsers().then(setUsers);
    }
  }, [currentUser.isAdmin]);

  const columns = useMemo<ColumnsType<AppUser>>(
    () => [
      { title: '注册时间', dataIndex: 'registeredAt', width: 170 },
      { title: '用户名', dataIndex: 'username', width: 150 },
      { title: '公司/备注', dataIndex: 'companyNote' },
      {
        title: '当前状态',
        dataIndex: 'status',
        width: 120,
        render: (status: AppUser['status']) => <Tag>{status}</Tag>,
      },
      {
        title: '操作',
        width: 180,
        render: (_, record) => (
          <Space>
            <Button
              size="small"
              type="primary"
              disabled={record.status === 'approved'}
              onClick={() =>
                void approveUser(record.id).then((nextUsers) => {
                  setUsers(nextUsers);
                  message.success('已通过');
                })
              }
            >
              通过
            </Button>
            <Button
              danger
              size="small"
              disabled={record.status === 'rejected'}
              onClick={() =>
                void rejectUser(record.id).then((nextUsers) => {
                  setUsers(nextUsers);
                  message.success('已拒绝');
                })
              }
            >
              拒绝
            </Button>
          </Space>
        ),
      },
    ],
    [],
  );

  if (!currentUser.isAdmin) {
    return (
      <Result
        status="403"
        title="仅 wyt 可访问"
        extra={<Button onClick={onBack}>返回看板</Button>}
      />
    );
  }

  return (
    <div className="review-page">
      <Card>
        <div className="review-header">
          <Typography.Title level={2}>用户审核管理</Typography.Title>
          <Button onClick={onBack}>返回看板</Button>
        </div>
        <Table columns={columns} dataSource={users} rowKey="id" />
      </Card>
    </div>
  );
}
