// -----------------------------------------------------------------------------
// 000  - public interfaces
// 111  - interfaces accessed by access codes (audiences, candidates etc)
// 222  - interfaces shared with members
// 333  - interfaces shared with partners
// none - interfaces shared with owners
// -----------------------------------------------------------------------------

export type Affiliation = 'host' | 'guest';
export type DomainAuthType = 'none' | 'token' | 'jaas';
export type EnabledFilter = 'all' | 'enabled' | 'disabled';
export type IntercomStatus = 'none' | 'seen' | 'accepted' | 'rejected';
export type Message = 'call' | 'phone' | 'text';

// -----------------------------------------------------------------------------
export interface ContactStatus {
  id: string;
  seen_second_ago: number;
}

// -----------------------------------------------------------------------------
export interface Domain {
  id: string;
  name: string;
  auth_type: DomainAuthType;
  domain_attr: {
    url: string;
    app_id: string;
    app_secret: string;
    app_alg: string;
    jaas_url: string;
    jaas_app_id: string;
    jaas_kid: string;
    jaas_key: string;
    jaas_alg: string;
    jaas_aud: string;
    jaas_iss: string;
  };
  public: boolean;
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
  public: boolean;
  enabled: boolean;
  updated_at: string;
}

// -----------------------------------------------------------------------------
export interface DomainMember {
  id: string;
  email: string;
  created_at: string;
}

// -----------------------------------------------------------------------------
export interface IntercomCall {
  id: string;
  url: string;
}

// -----------------------------------------------------------------------------
export interface IntercomMessage222 {
  id: string;
  contact_id: string | null;
  contact_name: string | null;
  status: IntercomStatus;
  message_type: Message;
  intercom_attr: {
    [key: string]: string;
  };
  created_at: string;
  microsec_created_at: number;
  expired_at: string;
}

// -----------------------------------------------------------------------------
export interface IntercomRing {
  id: string;
  status: IntercomStatus;
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
  schedule_type?: string;
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
interface MeetingScheduleBase {
  readonly meeting_name: string;
  readonly meeting_info: string;
  readonly started_at: string;
  readonly ended_at: string;
  readonly duration: number;
  readonly waiting_time: number;
  readonly join_as: Affiliation;
}

// -----------------------------------------------------------------------------
export interface MeetingSchedule111 extends MeetingScheduleBase {
  code: string;
}

// -----------------------------------------------------------------------------
export interface MeetingSchedule222 extends MeetingScheduleBase {
  meeting_id: string;
  membership_id: string | null;
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
