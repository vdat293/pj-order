export const SERVICE_SHIFT_IDS = {
  DAY: 'day',
  EVENING: 'evening',
};

export const SERVICE_SHIFT_OPTIONS = [
  {
    id: SERVICE_SHIFT_IDS.DAY,
    label: 'Ca ngày',
    time: '06h-14h+',
    filterLabel: '🌅 Ca ngày (06h-14h+)',
  },
  {
    id: SERVICE_SHIFT_IDS.EVENING,
    label: 'Ca tối',
    time: '17h-22h+',
    filterLabel: '🌙 Ca tối (17h-22h+)',
  },
];

export const getServiceShift = (dateString) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;

  const hour = date.getHours();
  return hour >= 6 && hour < 17 ? SERVICE_SHIFT_IDS.DAY : SERVICE_SHIFT_IDS.EVENING;
};

export const createServiceShiftStats = () =>
  SERVICE_SHIFT_OPTIONS.reduce((stats, shift) => {
    stats[shift.id] = 0;
    return stats;
  }, {});
