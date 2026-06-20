import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './pages/Layout';
import PrivateLayout from './pages/PrivateLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';

// OIDC
import OidcValidate from './pages/oidc/OidcValidate';
import OidcLogout from './pages/oidc/OidcLogout';
import OidcClean from './pages/oidc/OidcClean';

// Public
import JoinByCodePage from './pages/j/JoinByCodePage';
import RoomByCodePage from './pages/r/RoomByCodePage';
import JoinByMeetingPage from './pages/jm/JoinByMeetingPage';
import RoomByMeetingPage from './pages/rm/RoomByMeetingPage';
import JitsiTokenAuthPage from './pages/jitsi/JitsiTokenAuthPage';

// Private
import MeetingPage from './pages/private/MeetingPage';
import DomainPage from './pages/private/DomainPage';
import RoomPage from './pages/private/RoomPage';
import ProfilePage from './pages/private/ProfilePage';
import SettingPage from './pages/private/SettingPage';
import CalendarPage from './pages/private/CalendarPage';

import DomainDelPage from './pages/private/domain/DomainDelPage';
import DomainDisablePage from './pages/private/domain/DomainDisablePage';
import DomainEnablePage from './pages/private/domain/DomainEnablePage';

import MeetingDelPage from './pages/private/meeting/MeetingDelPage';
import MeetingDisablePage from './pages/private/meeting/MeetingDisablePage';
import MeetingEnablePage from './pages/private/meeting/MeetingEnablePage';

import ProfileAddPage from './pages/private/profile/ProfileAddPage';
import ProfileDelPage from './pages/private/profile/ProfileDelPage';
import ProfileUpdatePage from './pages/private/profile/ProfileUpdatePage';
import ProfileSetDefaultPage from './pages/private/profile/ProfileSetDefaultPage';

import CalendarMonthPage from './pages/private/calendar/CalendarMonthPage';
import CallJoinPage from './pages/private/call/CallJoinPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'oidc/validate', element: <OidcValidate /> },
      { path: 'oidc/logout', element: <OidcLogout /> },
      { path: 'oidc/clean', element: <OidcClean /> },
      { path: 'j/:code', element: <JoinByCodePage /> },
      { path: 'r/:code', element: <RoomByCodePage /> },
      { path: 'jm/:uuid', element: <JoinByMeetingPage /> },
      { path: 'rm/:uuid', element: <RoomByMeetingPage /> },
      { path: 'jitsi/token-auth', element: <JitsiTokenAuthPage /> },
      {
        element: <PrivateLayout />,
        children: [
          { path: 'meeting', element: <MeetingPage /> },
          { path: 'meeting/del/:uuid', element: <MeetingDelPage /> },
          { path: 'meeting/disable/:uuid', element: <MeetingDisablePage /> },
          { path: 'meeting/enable/:uuid', element: <MeetingEnablePage /> },
          { path: 'domain', element: <DomainPage /> },
          { path: 'domain/del/:uuid', element: <DomainDelPage /> },
          { path: 'domain/disable/:uuid', element: <DomainDisablePage /> },
          { path: 'domain/enable/:uuid', element: <DomainEnablePage /> },
          { path: 'room', element: <RoomPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'profile/add', element: <ProfileAddPage /> },
          { path: 'profile/del/:uuid', element: <ProfileDelPage /> },
          { path: 'profile/update/:uuid', element: <ProfileUpdatePage /> },
          { path: 'profile/set/default/:uuid', element: <ProfileSetDefaultPage /> },
          { path: 'setting', element: <SettingPage /> },
          { path: 'calendar', element: <CalendarPage /> },
          { path: 'calendar/month', element: <CalendarPage /> },
          { path: 'calendar/month/:date', element: <CalendarMonthPage /> },
          { path: 'call/join/:uuid', element: <CallJoinPage /> },
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
