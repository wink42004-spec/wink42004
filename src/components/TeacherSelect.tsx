import { Select } from 'antd';
import { useDashboardContext } from '../context/DashboardContext';

export function TeacherSelect() {
  const { currentTeacher, setCurrentTeacher, teacherList } =
    useDashboardContext();

  return (
    <div className="teacher-switcher">
      <span className="teacher-switcher-label">Teacher Select</span>
      <Select
        aria-label="老师切换器"
        value={currentTeacher?.id}
        onChange={(teacherId) => {
          const nextTeacher = teacherList.find(
            (teacher) => teacher.id === teacherId,
          );

          if (nextTeacher) {
            setCurrentTeacher(nextTeacher);
          }
        }}
        options={teacherList.map((teacher) => ({
          label: teacher.name,
          value: teacher.id,
        }))}
        style={{ minWidth: 160 }}
      />
    </div>
  );
}
