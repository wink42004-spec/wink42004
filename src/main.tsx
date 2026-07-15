import React from 'react';
import ReactDOM from 'react-dom/client';
import { App as AntdApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#06b6d4',
          borderRadius: 8,
          colorBgLayout: '#0b1726',
          colorSuccess: '#16a34a',
          colorWarning: '#ca8a04',
          colorError: '#dc2626',
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
        components: {
          Layout: {
            headerBg: '#050b16',
            bodyBg: '#0b1726',
          },
          Button: {
            controlHeight: 34,
          },
          Table: {
            headerBg: '#eef6fb',
            rowHoverBg: '#f8fbff',
          },
        },
      }}
    >
      <AntdApp>
        <App />
      </AntdApp>
    </ConfigProvider>
  </React.StrictMode>,
);
