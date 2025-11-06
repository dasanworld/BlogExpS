export const normalizeBusinessNumber = (raw: string): string => {
  const digits = (raw || '').replace(/\D+/g, '');
  return digits;
};

export const isValidBusinessNumber = (raw: string): boolean => {
  const norm = normalizeBusinessNumber(raw);
  // Generic rule: non-empty numeric up to 20 digits to avoid locale-specific hardcoding
  return norm.length > 0 && norm.length <= 20 && /^\d+$/.test(norm);
};

export const makeBizDedupKey = (raw: string): string => {
  return normalizeBusinessNumber(raw);
};

