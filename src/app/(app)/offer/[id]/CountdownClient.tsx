"use client";

import { useEffect, useState } from "react";

export function CountdownClient({ expiresAt }: { expiresAt: string }) {
  const target = new Date(expiresAt).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const secs = Math.max(0, Math.floor((target - now) / 1000));
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return (
    <p className="mt-1 text-3xl font-extrabold tabular-nums">
      {m}:{s.toString().padStart(2, "0")}
    </p>
  );
}
