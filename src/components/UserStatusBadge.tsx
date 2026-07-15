import { Button, Space, Tag } from 'antd';
import { useAuthContext } from '../context/AuthContext';

const statusLabel = {
  guest: '访客模式',
  pending: '待审核用户',
  approved: '已审核用户',
  rejected: '审核未通过',
};

interface UserStatusBadgeProps {
  onLogin: () => void;
  onRegister: () => void;
  onReview: () => void;
}

export function UserStatusBadge({
  onLogin,
  onRegister,
  onReview,
}: UserStatusBadgeProps) {
  const { currentUser, logout } = useAuthContext();
  const label = currentUser.isAdmin ? 'wyt 管理员' : statusLabel[currentUser.status];

  return (
    <Space className="user-status-group" wrap>
      <Tag className="identity-chip">
        {label}
      </Tag>
      {currentUser.status === 'guest' ? (
        <>
          <Button onClick={onLogin}>登录</Button>
          <Button onClick={onRegister}>注册</Button>
        </>
      ) : (
        <Button onClick={() => void logout()}>退出</Button>
      )}
      {currentUser.isAdmin ? <Button onClick={onReview}>用户审核</Button> : null}
    </Space>
  );
}
