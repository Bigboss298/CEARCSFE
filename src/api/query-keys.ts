export const queryKeys = {
  alerts: {
    all: ['alerts'] as const,
    detail: (id: string) => ['alerts', id] as const,
  },
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
  },
  matric: {
    all: ['matric-records'] as const,
    detail: (id: string) => ['matric-records', id] as const,
  },
} as const
