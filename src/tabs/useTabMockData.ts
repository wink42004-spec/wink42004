import { useEffect, useState } from 'react';
import { useDashboardContext } from '../context/DashboardContext';
import { getDashboardTabData } from '../services/dashboardDataService';
import type { DashboardTabKey, DeliveryMetric } from '../types/dashboard';

export function useTabMockData(tabKey: DashboardTabKey) {
  const { currentOperator } = useDashboardContext();
  const [data, setData] = useState<DeliveryMetric[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    if (!currentOperator) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    getDashboardTabData(currentOperator.id, tabKey)
      .then((nextData) => {
        if (!ignore) {
          setData(nextData);
        }
      })
      .catch((reason: unknown) => {
        if (!ignore) {
          setData([]);
          setError(reason instanceof Error ? reason.message : '未知错误');
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [currentOperator, tabKey]);

  return {
    data,
    error,
    loading,
  };
}
