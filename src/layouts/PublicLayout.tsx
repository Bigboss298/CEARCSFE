import { Outlet } from 'react-router-dom'
import { ShieldAlert, BellRing, MapPinned } from 'lucide-react'

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.12),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(249,115,22,0.10),_transparent_24%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] text-slate-900 dark:bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.20),_transparent_32%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] dark:text-slate-50">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-8 px-4 py-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-6 lg:py-8">
        <section className="hidden rounded-[2rem] border border-white/60 bg-slate-950/95 p-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
              <ShieldAlert className="h-4 w-4" />
              Campus Emergency Response
            </div>
            <div className="max-w-2xl space-y-4">
              <h1 className="text-5xl font-semibold leading-tight">
                Professional incident response for students, staff, and kiosks.
              </h1>
              <p className="max-w-xl text-base leading-7 text-white/70">
                A single frontend for emergency reporting, command-center monitoring, and live
                campus kiosks with shared realtime and notification infrastructure.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: BellRing, title: 'Realtime', text: 'SignalR-connected alert updates' },
                { icon: MapPinned, title: 'Location aware', text: 'Campus geofence and map support' },
                { icon: ShieldAlert, title: 'Role-based', text: 'Student, admin, and kiosk experiences' },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <item.icon className="h-5 w-5 text-orange-300" />
                  <p className="mt-3 text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm text-white/60">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs uppercase tracking-[0.22em] text-white/40">
            CEARCS Frontend
          </p>
        </section>

        <section className="flex items-center justify-center">
          <div className="w-full max-w-xl">
            <Outlet />
          </div>
        </section>
      </div>
    </div>
  )
}
