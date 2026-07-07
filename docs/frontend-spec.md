Build the complete CEARCS Frontend.
IMPORTANT:
Do not create multiple frontend applications.
Create ONE React application that serves:
•	Students
•	Admins
•	Faculty Kiosks
•	Fire Kiosks
•	Clinic Kiosks
Role-based routing must determine which dashboard is displayed.
Technology Stack:
• React 19
• TypeScript
• Vite
• Zustand
• React Router v7
• Axios
• SignalR Client
• TailwindCSS
• Shadcn/UI
• React Hook Form
• Zod
• Google Maps JavaScript API
• Firebase Messaging
• PWA Support

Backend already exists and must not be modified.

IMPORTANT IMPLEMENTATION RULES

- The backend is the single source of truth.
- Follow backend-spec.md and cearcs-api.json exactly.
- Do not invent endpoints.
- Do not invent DTOs.
- Do not invent SignalR events.
- Do not invent roles.
- Do not modify backend contracts.
- Extend the existing frontend instead of regenerating it.
- Reuse existing services, stores, routes, and components whenever possible.
- Every generated feature must compile successfully before moving to the next implementation phase.
________________________________________
PHASE 1 — PROJECT STRUCTURE
Create a scalable enterprise structure.
src/
api/
auth/
components/
features/
hooks/
layouts/
lib/
pages/
routes/
services/
stores/
types/
utils/
Inside features:
auth/
student/
admin/
kiosk/
alerts/
notifications/
settings/
Use feature-based organization.
________________________________________
PHASE 2 — API LAYER
Create Axios client.
Features:
•	Base URL from environment
•	JWT interceptor
•	Refresh token ready architecture
•	Global error handling
Create API services for:
AuthApi
AlertApi
AdminApi
MatricApi
DeviceTokenApi
DashboardApi
Use TypeScript interfaces.
________________________________________


PHASE 3 — AUTHENTICATION

Create a unified authentication flow.

There must be ONE Login page for the entire application.

The backend authentication contracts must be followed exactly.

Student Authentication

Endpoint:
POST /api/auth/login

Credentials:
- Matric Number
- Password

Admin / Faculty / FireKiosk / ClinicKiosk Authentication

Endpoint:
POST /api/auth/admin/login

Credentials:
- Username
- Password

The Login page must provide a role selector:

• Student
• Admin / Faculty / Kiosk

The selected login type determines which backend endpoint is called.

Student Registration

Endpoint:
POST /api/auth/register

Store JWT in Zustand.

Persist login state.

Create:

AuthStore

Capabilities:

loginStudent()
registerStudent()
loginAdmin()
logout()
restoreSession()

After successful authentication:

Student → /student

Admin → /admin

Faculty → /kiosk/faculty

FireKiosk → /kiosk/fire

ClinicKiosk → /kiosk/clinic

Dedicated kiosk deployments must not require a login screen.

When deployed as a kiosk device, the application should open directly into kiosk mode.

Create route protection.

Roles:

Student
Admin
Faculty
FireKiosk
ClinicKiosk
________________________________________

PHASE 4 — ROUTING

Public Routes

/login
/register

Protected Routes

/student
/admin

Kiosk Routes (No Authentication)

 /kiosk/faculty

 /kiosk/fire

 /kiosk/clinic

Role Guards

Student → Student Dashboard

Admin → Admin Dashboard

Faculty → Faculty Kiosk

FireKiosk → Fire Kiosk

ClinicKiosk → Clinic Kiosk

Unauthorized users must be redirected appropriately.

Kiosk deployments bypass authentication and open directly into their assigned kiosk route.
________________________________________
PHASE 5 — SIGNALR
Create SignalR service.
Auto-connect after login.
Reconnect automatically.
Subscribe to:
NewAlert
AlertAcknowledged
AlertBroadcasted
AlertResolved
AlertClosed
DashboardUpdated
Expose events through Zustand stores.
________________________________________
PHASE 6 — STUDENT DASHBOARD
This is the most important screen.
Student dashboard must be extremely simple.
Center screen:
[FIRE]
[MEDICAL]
[SECURITY]
Large buttons.
Mobile first.
Long press:
1500ms
before activation.
Flow:
Long Press
↓
Request GPS
↓
Confirm Location Acquired
↓
Call Create Alert API
Show:
Sending...
Alert Sent
Failed
Profile section:
Name
Matric Number
Email
Settings:
Link Telegram
Enable Push Notifications
Register Device Token
________________________________________
PHASE 7 — ADMIN DASHBOARD
Admin dashboard is the command center.
Layout:
Sidebar
Top Bar
Dashboard Content
Sections:
Overview
Live Alerts
Alert Details
History
Matric Upload
Settings
Dashboard cards:
Pending Alerts
Active Alerts
Resolved Alerts
Closed Alerts
Fire Today
Medical Today
Security Today
________________________________________
PHASE 8 — LIVE ALERT MONITOR
Admin sees alerts in real-time.
Alert card displays:
Type
Student
Time
Status
Confidence
Countdown Timer
Map Button
When clicked:
Open Alert Details Drawer
Display:
Full alert information
Reporters
Coordinates
Google Maps Link
Leaflet Map
Actions:
Acknowledge
Broadcast
Resolve
Close
________________________________________

PHASE 9 — MAP SYSTEM

Use Google Maps JavaScript API.

Display live emergency markers.

Marker Colors:

Fire = Red

Medical = Blue

Security = Orange

Clicking a marker must display:

- Alert Details
- Student Information
- Coordinates
- Google Maps Directions

Maps must update in real time using SignalR.

Support marker clustering when multiple incidents occur nearby.
________________________________________
PHASE 10 — MATRIC UPLOAD
Admin upload page.
Drag and Drop CSV.
Show:
Rows Imported
Rows Skipped
Errors
History table.

________________________________________

PHASE 11 — KIOSK DASHBOARDS

Dedicated kiosk deployments do not require authentication.

Each kiosk launches directly into its assigned dashboard.

Routes:

/kiosk/faculty

/kiosk/fire

/kiosk/clinic

All kiosks use the same codebase.

The assigned kiosk type determines the behavior.

________________________________________

Faculty Kiosk

Fire:

Full red evacuation screen

Large text:

FIRE EVACUATION IN PROGRESS

Play evacuation siren.

Security:

Display flashing lockdown screen.

No siren.

Medical:

Remain idle.

________________________________________

Fire Kiosk

Fire:

Display emergency details.

Display Google Map.

Play siren.

Security:

Ignore.

Medical:

Ignore.

________________________________________

Clinic Kiosk

Medical:

Display emergency details.

Display Google Map.

Play medical chime.

Fire:

Ignore.

Security:

Ignore.

________________________________________

Kiosk Requirements

No login screen.

No menus.

No navigation.

No forms.

Full-screen experience.

Large readable typography.

Automatic live updates via SignalR.
________________________________________

PHASE 12 — NOTIFICATIONS
Integrate Firebase Messaging.
Request permission.
Register device token.
Receive push notifications.
Display browser notifications.
________________________________________
PHASE 13 — PWA
Installable application.
Offline shell.
Home screen support.
Android support.
Desktop support.
________________________________________
PHASE 14 — UI/UX
Theme:
Emergency Response System
Colors:
Fire = Red
Medical = Blue
Security = Orange
Use modern professional design.
Accessibility:
Large touch targets.
Keyboard navigation.
Screen reader support.
________________________________________
PHASE 15 — STATE MANAGEMENT
Create Zustand stores:
AuthStore
AlertStore
DashboardStore
NotificationStore
KioskStore
Each store must:
•	Define state
•	Actions
•	API integration
•	SignalR integration
________________________________________
PHASE 16 — FINAL OUTPUT
Generate:
1.	Complete folder structure
2.	All routes
3.	All pages
4.	All stores
5.	All services
6.	Component hierarchy
7.	SignalR integration flow
8.	Authentication flow
9.	PWA flow
10.	Deployment instructions
Implement production-quality code.
Do not provide mockups only.
Generate the actual frontend implementation.
