import { useState, useRef } from 'react';
import { Button, Drawer, Space, theme } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import Brand from './Brand';
import ButtonAccountOidc from './ButtonAccountOidc';
import { useTr } from '../../i18n';
import { useRoleStore } from '../../store/role';

interface NavLink {
  readonly href: string;
  readonly label: string;
  readonly icon: string;
}

interface NavLinksProps {
  readonly links: NavLink[];
  readonly token: ReturnType<typeof theme.useToken>['token'];
  readonly isActive: (href: string) => boolean;
  readonly onLinkClick: () => void;
}

function NavLinks({ links, token, isActive, onLinkClick }: NavLinksProps) {
  return (
    <>
      {links.map((link) => (
        <Link
          key={link.href}
          to={link.href}
          onClick={onLinkClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 6,
            textDecoration: 'none',
            color: isActive(link.href) ? token.colorText : token.colorTextSecondary,
            fontWeight: isActive(link.href) ? 600 : 400,
            background: isActive(link.href) ? token.colorBgTextHover : 'transparent',
            fontSize: 14,
          }}
        >
          <i className={`bi ${link.icon}`} />
          {link.label}
        </Link>
      ))}
    </>
  );
}

export default function NavBarPri() {
  const { token } = theme.useToken();
  const t = useTr();
  const location = useLocation();
  const { isSuperAdmin } = useRoleStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 60) setDrawerOpen(false); // swipe right → close
    touchStartX.current = null;
  }

  const isDesktop =
    typeof globalThis !== 'undefined' && globalThis.matchMedia?.('(min-width: 992px)').matches;

  const navStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1030,
    background: token.colorBgContainer,
    borderTop: `1px solid ${token.colorBorderSecondary}`,
    padding: '0 16px',
    height: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 -2px 6px rgba(0,0,0,0.07)',
  };

  const navDesktopStyle: React.CSSProperties = {
    ...navStyle,
    bottom: 'auto',
    top: 0,
    borderTop: 'none',
    borderBottom: `1px solid ${token.colorBorderSecondary}`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  };

  const navLinks = [
    { href: '/calendar', label: t('nav.calendar'), icon: 'bi-calendar3' },
    { href: '/meeting', label: t('nav.meetings'), icon: 'bi-camera-video' },
    { href: '/room', label: t('nav.rooms'), icon: 'bi-door-open' },
    ...(isSuperAdmin ? [{ href: '/setting', label: t('nav.settings'), icon: 'bi-gear' }] : []),
  ];

  function isActive(href: string) {
    return location.pathname.startsWith(href);
  }

  const innerStyle: React.CSSProperties = {
    maxWidth: 1320,
    margin: '0 auto',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
  };

  return (
    <>
      <nav style={isDesktop ? navDesktopStyle : navStyle}>
        <div style={innerStyle}>
          <Brand />

          {/* Desktop nav */}
          <div
            style={{
              display: 'flex',
              gap: 4,
              flex: 1,
              paddingLeft: 24,
              ['@media(max-width:991px)' as string]: { display: 'none' },
            }}
            className="desktop-nav"
          >
            <style>{`
              @media (max-width: 991px) { .desktop-nav { display: none !important; } }
              @media (min-width: 992px) { .mobile-nav-toggle { display: none !important; } }
            `}</style>
            <NavLinks links={navLinks} token={token} isActive={isActive} onLinkClick={() => setDrawerOpen(false)} />
          </div>

          <Space>
            <ButtonAccountOidc />
            <Button
              icon={<i className="bi bi-list" />}
              onClick={() => setDrawerOpen((v) => !v)}
              className="mobile-nav-toggle"
            />
          </Space>
        </div>
      </nav>

      <Drawer
        title={null}
        placement="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={260}
        zIndex={1100}
      >
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: 4, height: '100%' }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <NavLinks links={navLinks} token={token} isActive={isActive} onLinkClick={() => setDrawerOpen(false)} />
        </div>
      </Drawer>
    </>
  );
}
