/**
 * Jumia pickup stations. Placeholder entries until the official list is loaded
 * into the `pickup_stations` table (admin import).
 */
export const STATIONS = [
  { id: "lag-ikeja-1", state: "Lagos", area: "Ikeja", name: "Jumia Pickup Station, Ikeja 1", hours: "Mon–Sat 8am–7pm" },
  { id: "lag-ikeja-2", state: "Lagos", area: "Ikeja", name: "Jumia Pickup Station, Ikeja 2", hours: "Mon–Sat 9am–6pm" },
  { id: "lag-lekki-1", state: "Lagos", area: "Lekki", name: "Jumia Pickup Station, Lekki 1", hours: "Mon–Sat 8am–7pm" },
  { id: "lag-yaba-1", state: "Lagos", area: "Yaba", name: "Jumia Pickup Station, Yaba 1", hours: "Mon–Fri 8am–6pm" },
  { id: "fct-wuse-1", state: "FCT Abuja", area: "Wuse", name: "Jumia Pickup Station, Wuse 1", hours: "Mon–Sat 8am–6pm" },
  { id: "riv-ph-1", state: "Rivers", area: "Port Harcourt", name: "Jumia Pickup Station, Port Harcourt 1", hours: "Mon–Sat 8am–6pm" },
  { id: "oyo-ibadan-1", state: "Oyo", area: "Ibadan", name: "Jumia Pickup Station, Ibadan 1", hours: "Mon–Sat 8am–6pm" },
] as const;

export const STATES = [...new Set(STATIONS.map((s) => s.state))];
