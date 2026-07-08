import { Select } from 'antd';
import { useDashboardContext } from '../context/DashboardContext';

export function TeacherSelect() {
  const { currentOperator, setCurrentOperator, teacherList } =
    useDashboardContext();

  return (
    <div className="teacher-switcher">
      <span className="teacher-switcher-label">当前操作人</span>
      <Select
        aria-label="当前操作人"
        value={currentOperator.id}
        onChange={setCurrentOperator}
        options={teacherList.map((teacher) => ({
          label: teacher.name,
          value: teacher.id,
        }))}
        style={{ minWidth: 150 }}
      />
    </div>
  );
}
