'use client';

import React from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default icon paths for Leaflet when bundled
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString(),
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString(),
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString(),
});

export default function ZoneMap({ zones = [], riders = [] }: any) {
  // Determine a sensible default center
  const defaultCenter: [number, number] = [6.2146, 6.7898]; // approximate center for Anambra / Awka area

  const center: [number, number] =
    (zones && zones.length > 0 && zones[0].center && Array.isArray(zones[0].center)) ? zones[0].center : defaultCenter;

  return (
    <div className="w-full" style={{ height: 460 }}>
      <MapContainer center={center} zoom={11} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Render zone polygons if available. Expect each zone to have `polygon: [[lat,lng], ...]` or `geojson` */}
        {(zones || []).map((z: any, i: number) => {
          const coords = z.polygon ?? (z.geojson && z.geojson.coordinates ? z.geojson.coordinates[0].map((c: any) => [c[1], c[0]]) : null);
          // If polygon is provided as [[lat,lng],...], use it directly. If it's GeoJSON [lng,lat] pairs, convert.
          const polygonCoords = Array.isArray(coords) ? coords : null;
          return polygonCoords ? (
            <Polygon
              key={z.id ?? i}
              positions={polygonCoords}
              pathOptions={{ color: '#ff8a65', weight: 2, fillOpacity: 0.08 }}
            />
          ) : null;
        })}

        {/* Render live riders as markers if lat/lng are provided */}
        {(riders || []).map((r: any, i: number) => {
          const lat = r.lat ?? r.latitude ?? r.location?.lat;
          const lng = r.lng ?? r.longitude ?? r.location?.lng;
          if (typeof lat !== 'number' || typeof lng !== 'number') return null;
          return (
            <Marker key={r.id ?? i} position={[lat, lng]}>
              <Popup>
                <div>
                  <div style={{ fontWeight: 600 }}>{r.name ?? 'Rider'}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{r.status ?? ''}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
