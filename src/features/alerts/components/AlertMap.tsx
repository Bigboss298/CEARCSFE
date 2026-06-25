import 'leaflet/dist/leaflet.css'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect } from 'react'
import type { AlertResponse } from '@/types'
import { AlertType } from '@/types/enums/alert-type'
import { CAMPUS_CENTER } from '@/lib/constants'
import { buildGoogleMapsUrl } from '@/utils/maps'

const markerIcons: Record<AlertType, L.DivIcon> = {
  [AlertType.Fire]: L.divIcon({
    className: '',
    html: '<div style="background:#dc2626;width:18px;height:18px;border-radius:50%;border:2px solid white;box-shadow:0 0 0 2px #dc2626"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  }),
  [AlertType.Medical]: L.divIcon({
    className: '',
    html: '<div style="background:#2563eb;width:18px;height:18px;border-radius:50%;border:2px solid white;box-shadow:0 0 0 2px #2563eb"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  }),
  [AlertType.Security]: L.divIcon({
    className: '',
    html: '<div style="background:#ea580c;width:18px;height:18px;border-radius:50%;border:2px solid white;box-shadow:0 0 0 2px #ea580c"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  }),
}

function MapBounds({ alerts }: { alerts: AlertResponse[] }) {
  const map = useMap()

  useEffect(() => {
    if (!alerts.length) {
      map.setView([CAMPUS_CENTER.latitude, CAMPUS_CENTER.longitude], 16)
      return
    }

    const bounds = L.latLngBounds(
      alerts.map((alert) => [alert.latitude, alert.longitude] as [number, number]),
    )
    map.fitBounds(bounds.pad(0.2))
  }, [alerts, map])

  return null
}

interface AlertMapProps {
  alerts: AlertResponse[]
  selectedAlertId?: string | null
  onSelectAlert?: (alert: AlertResponse) => void
  className?: string
  height?: string
}

export function AlertMap({
  alerts,
  selectedAlertId,
  onSelectAlert,
  className,
  height = '400px',
}: AlertMapProps) {
  return (
    <div className={className} style={{ height }}>
      <MapContainer
        center={[CAMPUS_CENTER.latitude, CAMPUS_CENTER.longitude]}
        zoom={16}
        className="h-full w-full rounded-lg"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBounds alerts={alerts} />
        {alerts.map((alert) => (
          <Marker
            key={alert.id}
            position={[alert.latitude, alert.longitude]}
            icon={markerIcons[alert.alertType]}
            eventHandlers={{
              click: () => onSelectAlert?.(alert),
            }}
          >
            <Popup>
              <div className="space-y-1 text-sm">
                <p className="font-semibold">{alert.alertType}</p>
                <p>{alert.studentFullName}</p>
                <p>{alert.alertStatus}</p>
                <a
                  className="text-blue-600 underline"
                  href={buildGoogleMapsUrl(alert.latitude, alert.longitude)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in Google Maps
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
        {selectedAlertId && alerts.some((a) => a.id === selectedAlertId) ? null : null}
      </MapContainer>
    </div>
  )
}

interface SingleAlertMapProps {
  latitude: number
  longitude: number
  alertType: AlertType
  height?: string
}

export function SingleAlertMap({ latitude, longitude, alertType, height = '240px' }: SingleAlertMapProps) {
  return (
    <div style={{ height }}>
      <MapContainer center={[latitude, longitude]} zoom={17} className="h-full w-full rounded-lg" scrollWheelZoom>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[latitude, longitude]} icon={markerIcons[alertType]} />
      </MapContainer>
    </div>
  )
}
