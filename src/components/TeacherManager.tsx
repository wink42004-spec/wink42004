import { Button, Form, Input, Modal, Space, Table, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { useDashboardContext } from '../context/DashboardContext';
import type { Teacher } from '../types/shared';

interface TeacherManagerProps {
  open: boolean;
  onClose: () => void;
}

export function TeacherManager({ open, onClose }: TeacherManagerProps) {
  const { addTeacher, renameTeacher, teacherList } = useDashboardContext();
  const [form] = Form.useForm<{ name: string }>();
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const submit = async () => {
    const values = await form.validateFields();
    if (editingTeacher) {
      await renameTeacher(editingTeacher.id, values.name);
      message.success('老师名称已更新');
    } else {
      await addTeacher(values.name);
      message.success('老师已新增');
    }
    setEditingTeacher(null);
    form.resetFields();
  };

  const columns: ColumnsType<Teacher> = [
    {
      title: '老师',
      dataIndex: 'name',
    },
    {
      title: '操作',
      width: 100,
      render: (_, record) => (
        <Button
          size="small"
          onClick={() => {
            setEditingTeacher(record);
            form.setFieldsValue({ name: record.name });
          }}
        >
          改名
        </Button>
      ),
    },
  ];

  return (
    <Modal title="老师管理" open={open} onCancel={onClose} footer={null}>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Form form={form} layout="inline">
          <Form.Item
            name="name"
            rules={[{ required: true, message: '请输入老师姓名' }]}
            style={{ flex: 1 }}
          >
            <Input placeholder="老师姓名" />
          </Form.Item>
          <Button type="primary" onClick={() => void submit()}>
            {editingTeacher ? '保存改名' : '新增老师'}
          </Button>
        </Form>
        <Table
          columns={columns}
          dataSource={teacherList}
          pagination={false}
          rowKey="id"
          size="small"
        />
      </Space>
    </Modal>
  );
}
