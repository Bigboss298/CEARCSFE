export const paths = {
  login: '/login',
  register: '/register',
  adminLogin: '/admin/login',
  unauthorized: '/unauthorized',
  faculty: '/faculty',
  fireKiosk: '/fire-kiosk',
  clinicKiosk: '/clinic-kiosk',
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
    faculty: '/kiosk/faculty',
    fire: '/kiosk/fire',
    clinic: '/kiosk/clinic',
    standby: '/kiosk/standby',
  },
} as const
