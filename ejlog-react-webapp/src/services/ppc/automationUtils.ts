export const formatIpAddress = (ip: unknown): string => {
  if (!ip) {
    return '';
  }

  if (typeof ip === 'string') {
    return ip;
  }

  if (typeof ip === 'object') {
    const data = ip as { Address?: string; address?: string };
    return data.Address || data.address || '';
  }

  return '';
};
