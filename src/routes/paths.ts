export const paths = {
  login: '/login',
  register: '/register',
  adminLogin: '/admin/login',
  unauthorized: '/unauthorized',
  student: {
    root: '/student',
    profile: '/student/profile',
    settings: '/student/settings',
  },
  admin: {
    root: '/admin',
    alerts: '/admin/alerts',
    history: '/admin/history',
    matric: '/admin/matric',
    settings: '/admin/settings',
  },
  kiosk: {
    root: '/kiosk',
  },
} as const
