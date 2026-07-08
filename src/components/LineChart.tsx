import * as echarts from 'echarts';
import { useEffect, useMemo, useRef } from 'react';
import type { TrendPoint } from '../types/history';

interface LineChartProps {
  color: string;
  data: TrendPoint[];
  title: string;
  valueFormatter?: (value: number) => string;
}

export function LineChart({
  color,
  data,
  title,
  valueFormatter,
}: LineChartProps) {
  const chartRef = useRef<HTMLDivElement | null>(null);

  const option = useMemo(
    () => ({
      color: [color],
      grid: {
        bottom: 28,
        left: 44,
        right: 20,
        top: 38,
      },
      title: {
        left: 0,
        text: title,
        textStyle: {
          color: '#172033',
          fontSize: 15,
          fontWeight: 650,
        },
      },
      tooltip: {
        trigger: 'axis',
        valueFormatter,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.map((item) => item.date),
        axisLine: {
          lineStyle: {
            color: '#d8e0ec',
          },
        },
        axisTick: {
          show: false,
        },
      },
      yAxis: {
        type: 'value',
        splitLine: {
          lineStyle: {
            color: '#edf2f7',
          },
        },
      },
      series: [
        {
          data: data.map((item) => item.value),
          smooth: true,
          symbolSize: 7,
          type: 'line',
          areaStyle: {
            color: `${color}1f`,
          },
          lineStyle: {
            width: 3,
          },
        },
      ],
    }),
    [color, data, title, valueFormatter],
  );

  useEffect(() => {
    if (!chartRef.current) {
      return undefined;
    }

    const chart = echarts.init(chartRef.current);
    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });

    chart.setOption(option);
    resizeObserver.observe(chartRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.dispose();
    };
  }, [option]);

  return <div className="line-chart" ref={chartRef} />;
}
