import { Alert } from 'antd';

interface Props {
  readonly children: React.ReactNode;
  readonly type?: 'warning' | 'error' | 'info' | 'success';
}

export default function AlertWarning({ children, type = 'warning' }: Props) {
  return (
    <Alert
      type={type}
      message={children}
      showIcon
      style={{ marginTop: 8, marginBottom: 8 }}
    />
  );
}
