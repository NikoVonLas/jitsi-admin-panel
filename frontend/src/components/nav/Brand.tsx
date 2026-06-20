import { useAppConfig } from '../../store/appconfig';

export default function Brand() {
  const config = useAppConfig((s) => s.config);
  const logoSrc = config.logo_url || '/logo.svg';

  return (
    <a href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
      <img
        src={logoSrc}
        alt="logo"
        height={40}
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/logo.svg';
        }}
      />
    </a>
  );
}
