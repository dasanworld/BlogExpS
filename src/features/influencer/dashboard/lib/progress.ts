export type ApplicationCountInput = {
  totalAll: number;
  totalSelected: number;
  totalRejected: number;
};

export type ApplicationStatusBreakdown = {
  totalAll: number;
  selected: number;
  rejected: number;
  applied: number;
  completionRate: number;
};

const sanitize = (value: number) => {
  if (!Number.isFinite(value) || Number.isNaN(value)) return 0;
  return Math.max(0, Math.floor(value));
};

export const deriveApplicationStatusBreakdown = ({
  totalAll,
  totalSelected,
  totalRejected,
}: ApplicationCountInput): ApplicationStatusBreakdown => {
  const total = sanitize(totalAll);
  const selected = sanitize(totalSelected);
  const rejected = sanitize(totalRejected);
  const applied = Math.max(0, total - selected - rejected);
  const completionRate = total === 0 ? 0 : Number((selected / total).toFixed(3));
  return {
    totalAll: total,
    selected,
    rejected,
    applied,
    completionRate,
  };
};
