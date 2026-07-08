import { Button, Card, Form, Input, Typography, message } from 'antd';
import { useState } from 'react';
import { useAuthContext } from '../context/AuthContext';

interface RegisterPageProps {
  onDone: () => void;
  onLogin: () => void;
}

export function RegisterPage({ onDone, onLogin }: RegisterPageProps) {
  const { register } = useAuthContext();
  const [loading, setLoading] = useState(false);

  const submit = async (values: {
    username: string;
    password: string;
    companyNote: string;
  }) => {
    setLoading(true);
    try {
      await register(values.username, values.password, values.companyNote);
      message.success('注册成功，等待 wyt 审核');
      onDone();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <Typography.Title level={2}>注册账号</Typography.Title>
        <Typography.Paragraph>
          新注册账号默认为待审核状态，审核通过后才能查看真实公司数据。
        </Typography.Paragraph>
        <Form layout="vertical" onFinish={(values) => void submit(values)}>
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="companyNote"
            label="公司/备注"
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button block type="primary" htmlType="submit" loading={loading}>
            提交注册
          </Button>
          <Button block type="link" onClick={onLogin}>
            返回登录
          </Button>
        </Form>
      </Card>
    </div>
  );
}
