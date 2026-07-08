import { Button, Card, Form, Input, Typography, message } from 'antd';
import { useState } from 'react';
import { useAuthContext } from '../context/AuthContext';

interface LoginPageProps {
  onDone: () => void;
  onRegister: () => void;
}

export function LoginPage({ onDone, onRegister }: LoginPageProps) {
  const { continueAsGuest, login } = useAuthContext();
  const [loading, setLoading] = useState(false);

  const submit = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.username, values.password);
      message.success('登录成功');
      onDone();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <Typography.Title level={2}>登录投放看板</Typography.Title>
        <Typography.Paragraph>
          访客可直接进入演示模式；注册用户需经 wyt 审核后查看真实数据。
        </Typography.Paragraph>
        <Form layout="vertical" onFinish={(values) => void submit(values)}>
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
            <Input placeholder="wyt" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true }]}>
            <Input.Password placeholder="wyt123456" />
          </Form.Item>
          <Button block type="primary" htmlType="submit" loading={loading}>
            登录
          </Button>
          <Button block type="link" onClick={onRegister}>
            注册新账号
          </Button>
          <Button
            block
            onClick={() => void continueAsGuest().then(onDone)}
          >
            以访客模式进入
          </Button>
        </Form>
      </Card>
    </div>
  );
}
