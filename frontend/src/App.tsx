import type { ComponentType } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './pages/Layout';
import PrivateLayout from './pages/PrivateLayout';

type PageModule = Promise<{ default: ComponentType }>;

function lazyPage(importer: () => PageModule) {
  return async () => ({ Component: (await importer()).default });
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, lazy: lazyPage(() => import('./pages/HomePage')) },
      { path: 'login', lazy: lazyPage(() => import('./pages/LoginPage')) },
      { path: 'oidc/validate', lazy: lazyPage(() => import('./pages/oidc/OidcValidate')) },
      { path: 'oidc/logout', lazy: lazyPage(() => import('./pages/oidc/OidcLogout')) },
      { path: 'oidc/clean', lazy: lazyPage(() => import('./pages/oidc/OidcClean')) },
      { path: 'j/:code', lazy: lazyPage(() => import('./pages/j/JoinByCodePage')) },
      { path: 'r/:code', lazy: lazyPage(() => import('./pages/r/RoomByCodePage')) },
      { path: 'jm/:uuid', lazy: lazyPage(() => import('./pages/jm/JoinByMeetingPage')) },
      { path: 'rm/:uuid', lazy: lazyPage(() => import('./pages/rm/RoomByMeetingPage')) },
      {
        path: 'jitsi/token-auth',
        lazy: lazyPage(() => import('./pages/jitsi/JitsiTokenAuthPage')),
      },
      {
        element: <PrivateLayout />,
        children: [
          { path: 'meeting', lazy: lazyPage(() => import('./pages/private/MeetingPage')) },
          {
            path: 'meeting/del/:uuid',
            lazy: lazyPage(() => import('./pages/private/meeting/MeetingDelPage')),
          },
          {
            path: 'meeting/disable/:uuid',
            lazy: lazyPage(() => import('./pages/private/meeting/MeetingDisablePage')),
          },
          {
            path: 'meeting/enable/:uuid',
            lazy: lazyPage(() => import('./pages/private/meeting/MeetingEnablePage')),
          },
          { path: 'domain', lazy: lazyPage(() => import('./pages/private/DomainPage')) },
          {
            path: 'domain/del/:uuid',
            lazy: lazyPage(() => import('./pages/private/domain/DomainDelPage')),
          },
          {
            path: 'domain/disable/:uuid',
            lazy: lazyPage(() => import('./pages/private/domain/DomainDisablePage')),
          },
          {
            path: 'domain/enable/:uuid',
            lazy: lazyPage(() => import('./pages/private/domain/DomainEnablePage')),
          },
          { path: 'room', lazy: lazyPage(() => import('./pages/private/RoomPage')) },
          { path: 'profile', lazy: lazyPage(() => import('./pages/private/ProfilePage')) },
          {
            path: 'profile/add',
            lazy: lazyPage(() => import('./pages/private/profile/ProfileAddPage')),
          },
          {
            path: 'profile/del/:uuid',
            lazy: lazyPage(() => import('./pages/private/profile/ProfileDelPage')),
          },
          {
            path: 'profile/update/:uuid',
            lazy: lazyPage(() => import('./pages/private/profile/ProfileUpdatePage')),
          },
          {
            path: 'profile/set/default/:uuid',
            lazy: lazyPage(() => import('./pages/private/profile/ProfileSetDefaultPage')),
          },
          { path: 'setting', lazy: lazyPage(() => import('./pages/private/SettingPage')) },
          { path: 'calendar', lazy: lazyPage(() => import('./pages/private/CalendarPage')) },
          { path: 'calendar/month', lazy: lazyPage(() => import('./pages/private/CalendarPage')) },
          {
            path: 'calendar/month/:date',
            lazy: lazyPage(() => import('./pages/private/calendar/CalendarMonthPage')),
          },
          {
            path: 'call/join/:uuid',
            lazy: lazyPage(() => import('./pages/private/call/CallJoinPage')),
          },
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
