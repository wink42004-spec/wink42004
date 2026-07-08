import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { mockTeachers } from '../mock/teachers';
import type { Teacher } from '../types/teacher';

interface DashboardContextValue {
  currentTeacher: Teacher | null;
  teacherList: Teacher[];
  setCurrentTeacher: (teacher: Teacher) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

interface DashboardProviderProps {
  children: ReactNode;
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  const [currentTeacher, updateCurrentTeacher] = useState<Teacher | null>(
    mockTeachers[0] ?? null,
  );

  const setCurrentTeacher = useCallback((teacher: Teacher) => {
    updateCurrentTeacher(teacher);
  }, []);

  const value = useMemo(
    () => ({
      currentTeacher,
      teacherList: mockTeachers,
      setCurrentTeacher,
    }),
    [currentTeacher, setCurrentTeacher],
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
