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
•	React 19
•	TypeScript
•	Vite
•	Zustand
•	React Router v7
•	Axios
•	SignalR Client
•	TailwindCSS
•	Shadcn/UI
•	React Hook Form
•	Zod
•	Leaflet + React Leaflet
•	Firebase Messaging
•	PWA Support
Backend already exists and must not be modified.
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
Create authentication flow.
Student Login
Student Register
Admin Login
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
Create route protection.
Roles:
Student
Admin
Faculty
Kiosk
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
/kiosk
Role Guards:
Students -> Student Dashboard
Admins -> Admin Dashboard
Faculty -> Faculty Kiosk
FireKiosk -> Fire Kiosk
ClinicKiosk -> Clinic Kiosk
Unauthorized users redirected.
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
Use Leaflet.
Display alert markers.
Marker color:
Fire = Red
Medical = Blue
Security = Orange
Click marker:
Open alert details.
Map updates live from SignalR.
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
All kiosks use the same codebase.
Role determines behavior.
________________________________________
Faculty Kiosk
Fire:
Full red screen
Large text:
FIRE EVACUATION IN PROGRESS
Play siren.
Security:
Flashing visual lockdown screen.
No siren.
Medical:
Remain idle.
________________________________________
Fire Kiosk
Fire:
Show emergency details.
Show map.
Play siren.
Security:
Ignore.
Medical:
Ignore.
________________________________________
Clinic Kiosk
Medical:
Display location.
Play medical chime.
Show map.
Fire:
Ignore.
Security:
Ignore.
________________________________________
Kiosk Requirements
No menus.
No navigation.
No forms.
Full-screen experience.
Large readable typography.
Automatic live updates.
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
