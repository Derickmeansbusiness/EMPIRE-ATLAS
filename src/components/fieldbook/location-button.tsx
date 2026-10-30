"use client";

import { useState } from "react";
import { setLocationAction } from "@/app/actions/fieldbook";

/** Optional, permission-based location tag. Nothing is requested until the user taps the button. */
export function LocationButton({ sessionId }: { sessionId: string }) {
  const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const tag = () => {
    if (!("geolocation" in navigator)) { setMsg("This browser does not offer location."); return; }
    setBusy(true); setMsg("Waiting for permission…");
    navigator.geolocation.getCurrentPosition(
      async (pos) => { const r = await setLocationAction({ sessionId, lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null }); setBusy(false); setMsg(r.ok ? "Location tagged to this inspection." : "Could not save the location."); if (r.ok) window.location.reload(); },
      (err) => { setBusy(false); setMsg(err.code === err.PERMISSION_DENIED ? "Permission denied. Nothing was recorded." : "Could not get a location."); },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
    );
  };
  return (<div><button type="button" onClick={tag} disabled={busy} className="min-h-11 rounded-md border border-platinum/25 px-4 text-sm text-platinum hover:border-gold hover:text-gold">Tag my location (optional)</button>{msg && <p role="status" className="mt-2 text-xs text-slate-mist">{msg}</p>}</div>);
}
