import FetchAndRedirectPage from '../FetchAndRedirectPage';

export default function JoinByCodePage() {
  return <FetchAndRedirectPage endpoint="/api/pub/meeting/get/link/byshortcode" />;
}
