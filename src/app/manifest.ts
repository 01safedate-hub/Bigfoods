import type { MetadataRoute } from "next";

/** Lets people add FastChina to their home screen; opens full screen like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FastChina",
    short_name: "FastChina",
    description: "China’s factories, delivered free to your Jumia pickup station.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111111",
    categories: ["shopping"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Deals", url: "/deals" },
      { name: "Track an order", url: "/track" },
      { name: "My cart", url: "/cart" },
    ],
  };
}
