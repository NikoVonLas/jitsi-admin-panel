import FetchAndRedirectPage from '../FetchAndRedirectPage';

export default function RoomByCodePage() {
  return <FetchAndRedirectPage endpoint="/api/pub/room/get/link/byshortcode" />;
}
