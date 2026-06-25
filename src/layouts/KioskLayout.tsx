import { Outlet } from 'react-router-dom'

export function KioskLayout() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Outlet />
    </div>
  )
}
