"use client";

/** Last resort if the root layout itself fails. Plain HTML: nothing else is guaranteed to have loaded. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0, textAlign: "center", padding: 24 }}>
        <div>
          <h1 style={{ fontSize: 22 }}>FastChina didn’t load</h1>
          <p style={{ color: "#555" }}>Check your connection and try again. Your cart is saved on this device.</p>
          {error.digest && <p style={{ color: "#888", fontSize: 12 }}>Reference: {error.digest}</p>}
          <button type="button" onClick={reset} style={{ minHeight: 44, padding: "0 20px", background: "#111", color: "#fff", border: 0, borderRadius: 6, fontWeight: 800 }}>
            TRY AGAIN
          </button>
        </div>
      </body>
    </html>
  );
}
