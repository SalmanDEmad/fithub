export const queryKeys = {
  member: {
    home: (userId: string) => ['member', 'home', userId] as const,
    history: (userId: string) => ['member', 'history', userId] as const,
  },
  gym: {
    overview: (gymId: string) => ['gym', 'overview', gymId] as const,
    invites: (gymId: string) => ['gym', 'invites', gymId] as const,
    settings: (gymId: string) => ['gym', 'settings', gymId] as const,
  },
  risk: {
    members: (gymId: string) => ['risk', 'members', gymId] as const,
  },
} as const;

export function createApiUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}
