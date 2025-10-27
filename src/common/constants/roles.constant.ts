export const ROLES = ['admin', 'viewer', 'client'] as const;

export type AppRole = (typeof ROLES)[number];
