import { t } from '../i18n';

export const SCHEDULE_TYPE_OPTIONS = [
  ['ephemeral', 'Ad hoc'],
  ['permanent', 'Permanent'],
  ['scheduled', 'Scheduled'],
];

export function getScheduleTypeOptions() {
  return [
    ['ephemeral', t('meeting.type.ephemeral')],
    ['permanent', t('meeting.type.permanent')],
    ['scheduled', t('meeting.type.scheduled')],
  ];
}
