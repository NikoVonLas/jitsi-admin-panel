import { Button, theme } from 'antd';
import Brand from './Brand';
import { useTr } from '../../i18n';

export default function NavBarPub() {
  const { token } = theme.useToken();
  const t = useTr();
  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1030,
        background: token.colorBgContainer,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        height: 56,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      <div
        style={{
          maxWidth: 1320,
          margin: '0 auto',
          padding: '0 16px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Brand />
        <Button
          type="primary"
          href="/api/adm/oidc/redirect?prompt=consent"
        >
          {t('btn.sign_in')}
        </Button>
      </div>
    </nav>
  );
}
