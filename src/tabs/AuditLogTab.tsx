import { DatePicker, Select, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { getAuditLogs } from '../services/mockApi';
import type { AuditLog } from '../types/shared';

export function AuditLogTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [actionType, setActionType] = useState<string>();
  const [date, setDate] = useState<Dayjs | null>(null);

  useEffect(() => {
    void getAuditLogs().then(setLogs);
  }, []);

  const filteredLogs = useMemo(
    () =>
      logs.filter((log) => {
        const matchType = actionType ? log.actionType === actionType : true;
        const matchDate = date ? dayjs(log.time).isSame(date, 'day') : true;
        return matchType && matchDate;
      }),
    [actionType, date, logs],
  );

  const columns: ColumnsType<AuditLog> = [
    { title: '时间', dataIndex: 'time', width: 170 },
    { title: '操作账号', dataIndex: 'operatorName', width: 110 },
    { title: '操作类型', dataIndex: 'actionType', width: 130 },
    { title: '模块', dataIndex: 'module', width: 120 },
    { title: '对象', dataIndex: 'target', width: 180 },
    { title: '修改前', dataIndex: 'before', ellipsis: true },
    { title: '修改后', dataIndex: 'after', ellipsis: true },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space wrap>
        <Select
          allowClear
          placeholder="操作类型"
          value={actionType}
          onChange={setActionType}
          options={['新增', '修改', '上传', '删除', '自动更新阅读量'].map((value) => ({
            label: value,
            value,
          }))}
          style={{ width: 170 }}
        />
        <DatePicker value={date} onChange={setDate} placeholder="操作日期" />
      </Space>
      <Table
        columns={columns}
        dataSource={filteredLogs}
        rowKey="id"
        scroll={{ x: 1100 }}
        size="middle"
      />
    </Space>
  );
}
