/** A Jumia pickup station. The live list is the `pickup_stations` table (Admin → stations). */
export interface Station {
  id: string;
  state: string;
  area: string;
  name: string;
  hours: string;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  /** False for a station a customer added; staff check it before the first dispatch. */
  verified?: boolean;
}

/** Used only when the database isn't connected; the live list is the `pickup_stations` table. */
export const STATIONS: readonly Station[] = [
  { id: "lag-ikeja-1", state: "Lagos", area: "Ikeja", name: "Jumia Pickup Station, Ikeja 1", hours: "Mon–Sat 8am–7pm", lat: 6.6018, lng: 3.3515 },
  { id: "lag-ikeja-2", state: "Lagos", area: "Ikeja", name: "Jumia Pickup Station, Ikeja 2", hours: "Mon–Sat 9am–6pm", lat: 6.596, lng: 3.342 },
  { id: "lag-lekki-1", state: "Lagos", area: "Lekki", name: "Jumia Pickup Station, Lekki 1", hours: "Mon–Sat 8am–7pm", lat: 6.4474, lng: 3.4723 },
  { id: "lag-yaba-1", state: "Lagos", area: "Yaba", name: "Jumia Pickup Station, Yaba 1", hours: "Mon–Fri 8am–6pm", lat: 6.5095, lng: 3.3711 },
  { id: "fct-wuse-1", state: "FCT Abuja", area: "Wuse", name: "Jumia Pickup Station, Wuse 1", hours: "Mon–Sat 8am–6pm", lat: 9.0765, lng: 7.4683 },
  { id: "riv-ph-1", state: "Rivers", area: "Port Harcourt", name: "Jumia Pickup Station, Port Harcourt 1", hours: "Mon–Sat 8am–6pm", lat: 4.8156, lng: 7.0498 },
  { id: "oyo-ibadan-1", state: "Oyo", area: "Ibadan", name: "Jumia Pickup Station, Ibadan 1", hours: "Mon–Sat 8am–6pm", lat: 7.3775, lng: 3.947 },
];

export const statesOf = (stations: readonly Station[]) => [...new Set(stations.map((s) => s.state))];
