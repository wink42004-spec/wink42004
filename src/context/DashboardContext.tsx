import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  addTeacher,
  getTeachers,
  renameTeacher,
} from '../services/mockApi';
import type { Teacher } from '../types/shared';

interface DashboardContextValue {
  currentOperator: Teacher;
  teacherList: Teacher[];
  setCurrentOperator: (teacherId: string) => void;
  addTeacher: (name: string) => Promise<void>;
  renameTeacher: (teacherId: string, name: string) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

interface DashboardProviderProps {
  children: ReactNode;
}

const fallbackTeacher: Teacher = {
  id: 'teacher-zhang',
  name: '张老师',
};

export function DashboardProvider({ children }: DashboardProviderProps) {
  const [teacherList, setTeacherList] = useState<Teacher[]>([fallbackTeacher]);
  const [currentOperatorId, setCurrentOperatorId] = useState(fallbackTeacher.id);

  useEffect(() => {
    void getTeachers().then((teachers) => {
      setTeacherList(teachers);
      setCurrentOperatorId((currentId) => currentId || teachers[0]?.id || '');
    });
  }, []);

  const currentOperator =
    teacherList.find((teacher) => teacher.id === currentOperatorId) ||
    teacherList[0] ||
    fallbackTeacher;

  const handleAddTeacher = useCallback(async (name: string) => {
    const nextTeachers = await addTeacher(name, currentOperator.name);
    setTeacherList(nextTeachers);
  }, [currentOperator.name]);

  const handleRenameTeacher = useCallback(
    async (teacherId: string, name: string) => {
      const nextTeachers = await renameTeacher(
        teacherId,
        name,
        currentOperator.name,
      );
      setTeacherList(nextTeachers);
    },
    [currentOperator.name],
  );

  const value = useMemo(
    () => ({
      currentOperator,
      teacherList,
      setCurrentOperator: setCurrentOperatorId,
      addTeacher: handleAddTeacher,
      renameTeacher: handleRenameTeacher,
    }),
    [currentOperator, handleAddTeacher, handleRenameTeacher, teacherList],
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);

  if (!context) {
    throw new Error('useDashboardContext must be used within DashboardProvider');
  }

  return context;
}
