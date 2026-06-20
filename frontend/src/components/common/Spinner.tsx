import { Spin } from 'antd';

interface Props {
  readonly children?: React.ReactNode;
}

export default function Spinner({ children }: Props) {
  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 32 }}
    >
      <Spin size="large" />
      {children && <span style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>{children}</span>}
    </div>
  );
}
