import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AdminLayout } from '@/layouts/AdminLayout'
import { KioskLayout } from '@/layouts/KioskLayout'
import { PublicLayout } from '@/layouts/PublicLayout'
import { StudentLayout } from '@/layouts/StudentLayout'
import { LoginPage } from '@/pages/public/LoginPage'
import { RegisterPage } from '@/pages/public/RegisterPage'
import { AdministratorLoginPage } from '@/pages/public/AdministratorLoginPage'
import { NotFoundPage } from '@/pages/errors/NotFoundPage'
import { UnauthorizedPage } from '@/pages/errors/UnauthorizedPage'
import { AdminDashboardPage } from '@/features/admin/pages/AdminDashboardPage'
import { LiveAlertsPage } from '@/features/admin/pages/LiveAlertsPage'
import { AlertHistoryPage } from '@/features/admin/pages/AlertHistoryPage'
import { MatricUploadPage } from '@/features/admin/pages/MatricUploadPage'
import { AdminSettingsPage } from '@/features/admin/pages/AdminSettingsPage'
import { StudentDashboardPage } from '@/features/student/pages/StudentDashboardPage'
import { StudentProfilePage } from '@/features/student/pages/StudentProfilePage'
import { StudentSettingsPage } from '@/features/student/pages/StudentSettingsPage'
import { KioskDashboardPage } from '@/features/kiosk/pages/KioskDashboardPage'
import { GuestRoute, ProtectedRoute, RootRedirect } from '@/routes/ProtectedRoute'
import { RoleRoute } from '@/routes/RoleRoute'
import { paths } from '@/routes/paths'
import { UserRole } from '@/types/enums/user-role'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
  },
  {
    element: <PublicLayout />,
    children: [
      {
        path: paths.login,
        element: (
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        ),
      },
      {
        path: paths.adminLogin,
        element: (
          <GuestRoute>
            <AdministratorLoginPage />
          </GuestRoute>
        ),
      },
      {
        path: paths.register,
        element: (
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        ),
      },
    ],
  },
  {
    path: paths.student.root,
    element: (
      <ProtectedRoute>
        <RoleRoute allowedRoles={[UserRole.Student]}>
          <StudentLayout />
        </RoleRoute>
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <StudentDashboardPage /> },
      { path: 'profile', element: <StudentProfilePage /> },
      { path: 'settings', element: <StudentSettingsPage /> },
    ],
  },
  {
    path: paths.admin.root,
    element: (
      <ProtectedRoute>
        <RoleRoute allowedRoles={[UserRole.Admin]}>
          <AdminLayout />
        </RoleRoute>
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'alerts', element: <LiveAlertsPage /> },
      { path: 'history', element: <AlertHistoryPage /> },
      { path: 'matric', element: <MatricUploadPage /> },
      { path: 'settings', element: <AdminSettingsPage /> },
    ],
  },
  {
    path: paths.faculty,
    element: (
      <ProtectedRoute>
        <RoleRoute
          allowedRoles={[
            UserRole.Faculty,
            UserRole.Kiosk,
            UserRole.FireKiosk,
            UserRole.ClinicKiosk,
          ]}
        >
          <KioskLayout />
        </RoleRoute>
      </ProtectedRoute>
    ),
    children: [{ index: true, element: <KioskDashboardPage /> }],
  },
  {
    path: paths.fireKiosk,
    element: (
      <ProtectedRoute>
        <RoleRoute
          allowedRoles={[
            UserRole.Faculty,
            UserRole.Kiosk,
            UserRole.FireKiosk,
            UserRole.ClinicKiosk,
          ]}
        >
          <KioskLayout />
        </RoleRoute>
      </ProtectedRoute>
    ),
    children: [{ index: true, element: <KioskDashboardPage /> }],
  },
  {
    path: paths.clinicKiosk,
    element: (
      <ProtectedRoute>
        <RoleRoute
          allowedRoles={[
            UserRole.Faculty,
            UserRole.Kiosk,
            UserRole.FireKiosk,
            UserRole.ClinicKiosk,
          ]}
        >
          <KioskLayout />
        </RoleRoute>
      </ProtectedRoute>
    ),
    children: [{ index: true, element: <KioskDashboardPage /> }],
  },
  {
    path: paths.kiosk.root,
    element: <Navigate to={paths.faculty} replace />,
  },
  {
    path: paths.kiosk.faculty,
    element: <Navigate to={paths.faculty} replace />,
  },
  {
    path: paths.kiosk.fire,
    element: <Navigate to={paths.fireKiosk} replace />,
  },
  {
    path: paths.kiosk.clinic,
    element: <Navigate to={paths.clinicKiosk} replace />,
  },
  {
    path: paths.kiosk.standby,
    element: <Navigate to={paths.faculty} replace />,
  },
  {
    path: paths.unauthorized,
    element: <UnauthorizedPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
