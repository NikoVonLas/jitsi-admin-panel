// -----------------------------------------------------------------------------
// 000  - public interfaces
// 111  - interfaces accessed by access codes (audiences, candidates etc)
// 222  - interfaces shared with members
// 333  - interfaces shared with partners
// none - interfaces shared with owners
// -----------------------------------------------------------------------------

export type Affiliation = "host" | "guest";
export type DomainAuthType = "none" | "token";
export type RequestStatus = "pending" | "rejected";

// -----------------------------------------------------------------------------
export interface Attr {
  [key: string]: string;
}

// -----------------------------------------------------------------------------
export interface Domain {
  id: string;
  name: string;
  auth_type: DomainAuthType;
  domain_attr: {
    [key: string]: string;
  };
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// -----------------------------------------------------------------------------
export interface Domain333 {
  id: string;
  name: string;
  auth_type: DomainAuthType;
  url: string;
  enabled: boolean;
  updated_at: string;
}

// -----------------------------------------------------------------------------
export interface Id {
  id: string;
  at: string;
}

// -----------------------------------------------------------------------------
export interface Identity {
  id: string;
  identity_attr: {
    [key: string]: string;
  };
  enabled: boolean;
  created_at: string;
  updated_at: string;
  seen_at: string;
}

// -----------------------------------------------------------------------------
export interface Meeting {
  id: string;
  name: string;
  info: string;
  profile_id: string;
  profile_name: string;
  profile_email: string;
  domain_id: string;
  domain_name: string;
  domain_url: string;
  domain_enabled: boolean;
  room_id: string;
  room_name: string;
  room_enabled: boolean;
  hidden: boolean;
  subscribable: boolean;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// -----------------------------------------------------------------------------
export interface Meeting000 {
  id: string;
  name: string;
  info: string;
  subscribable: boolean;
}

// -----------------------------------------------------------------------------
export interface Meeting222 {
  id: string;
  name: string;
  short_code: string;
  info: string;
  profile_name: string;
  profile_email: string;
  domain_name: string;
  domain_url: string;
  room_name: string;
  session_list: string[];
  session_at: string;
  hidden: boolean;
  subscribable: boolean;
  enabled: boolean;
  chain_enabled: boolean;
  updated_at: string;
  ownership: string;
  membership_id: string;
  join_as: Affiliation;
}

// -----------------------------------------------------------------------------
export interface MeetingLinkset {
  id: string;
  name: string;
  room_name: string;
  schedule_name: string;
  has_suffix: boolean;
  suffix: string;
  auth_type: DomainAuthType;
  domain_attr: {
    url: string;
    app_id: string;
    app_secret: string;
    app_alg: string;
  };
  join_as: Affiliation;
  started_at: string;
  ended_at: string;
  duration: number;
  remaining: number;
  profile_name: string;
  profile_email: string;
  profile_avatar_url: string;
}

// -----------------------------------------------------------------------------
export interface MeetingRequest {
  id: string;
  profile_id: string;
  profile_name: string;
  meeting_id: string;
  meeting_name: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  expired_at: string;
}

// -----------------------------------------------------------------------------
export interface MeetingSchedule {
  id: string;
  meeting_id: string;
  schedule_attr: {
    [key: string]: string;
  };
  host_key: string;
  session_at: string;
  session_remaining: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// -----------------------------------------------------------------------------
export interface MeetingSchedule222 {
  meeting_id: string;
  meeting_name: string;
  meeting_info: string;
  started_at: string;
  ended_at: string;
  duration: number;
  waiting_time: number;
  join_as: Affiliation;
  membership_id: string | null;
}

// -----------------------------------------------------------------------------
export interface MeetingSessionForReminder {
  id: string;
  session_id: string;
  email: string;
  meeting_name: string;
  started_at: string;
}

// -----------------------------------------------------------------------------
export interface Meta {
  mvalue: string;
}

// -----------------------------------------------------------------------------
export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// -----------------------------------------------------------------------------
export interface RandomRoomName {
  name: string;
  suffix: string;
}

// -----------------------------------------------------------------------------
export interface Room {
  id: string;
  name: string;
  label: string;
  domain_id: string;
  domain_name: string;
  domain_url: string;
  domain_enabled: boolean;
  has_suffix: boolean;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  accessed_at: string;
}

// -----------------------------------------------------------------------------
export interface Room333 {
  id: string;
  name: string;
  label: string;
  short_code: string;
  domain_name: string;
  domain_url: string;
  enabled: boolean;
  chain_enabled: boolean;
  updated_at: string;
  owner_email?: string;
  owner_name?: string;
}

// -----------------------------------------------------------------------------
export interface RoomLinksetWithSession extends RoomLinkset {
  started_at: string;
  ended_at: string;
}

// -----------------------------------------------------------------------------
export interface RoomLinkset {
  name: string;
  label: string;
  has_suffix: boolean;
  suffix: string;
  auth_type: DomainAuthType;
  domain_attr: {
    url: string;
    app_id: string;
    app_secret: string;
    app_alg: string;
  };
}
