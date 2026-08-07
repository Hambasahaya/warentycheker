import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";

type Phase = "idle" | "verifying" | "verified" | "error";

interface WarrantyData {
  model: string;
  status: "Active" | "Expired";
  remaining: string;
  purchaseDate: string;
  expirationDate: string;
  dealer: string;
  imageUrl?: string;
}

const MOCK_DB: Record<string, WarrantyData> = {
  "MXL-PRO-7042": {
    model: "Moxlite Studio Basic",
    status: "Active",
    remaining: "2 years, 4 months",
    purchaseDate: "March 15, 2024",
    expirationDate: "March 15, 2027",
    dealer: "GMTGROUP.CO.ID — Jakarta, Indonesia",
    imageUrl: "https://moxlite-web.is3.cloudhost.id/Side_9071_87dde27f26.png",
  },
  "MXL-TIT-1187": {
    model: "Moxlite Amos Plus",
    status: "Expired",
    remaining: "Expired",
    purchaseDate: "November 2, 2023",
    expirationDate: "November 2, 2026",
    dealer: "GMTGROUP.CO.ID — Jakarta, Indonesia",
    imageUrl: "https://moxlite-web.is3.cloudhost.id/Artboard_16_d9dd19c44c.png",
  },
  "MXL-EVO-0291": {
    model: "Moxlite Evolution 300W Wash",
    status: "Expired",
    remaining: "Expired",
    purchaseDate: "January 8, 2022",
    expirationDate: "January 8, 2025",
    dealer: "Luminary Stage Equipment — Chicago, IL",
    imageUrl: "https://moxlite-web.is3.cloudhost.id/Side_9071_87dde27f26.png",
  },
};

// Deterministic particle data — no Math.random in render
const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  w: 80 + (i * 47) % 180,
  h: 80 + (i * 61) % 180,
  left: (i * 19.3) % 100,
  top: (i * 11.7) % 100,
  duration: 14 + (i * 2.1) % 12,
  delay: -((i * 4.3) % 22),
  opacity: 0.025 + (i % 5) * 0.008,
}));

function QRCodeSVG() {
  const cells = [
    [1,1,1,1,1,1,1,0,1,0,0,1,0,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,1,1,0,1,0,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,0,1,0,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,0,0,1,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,1,0,0,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,1,0,0,1,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0],
    [1,0,1,1,0,0,1,1,1,0,1,0,1,1,0,1,0,0,1,1,0],
    [0,1,0,0,1,1,0,0,0,1,0,1,0,0,1,1,0,1,0,0,1],
    [1,1,0,1,0,0,1,1,0,0,1,0,1,0,0,0,1,1,0,0,1],
    [0,0,1,0,1,0,0,1,1,0,0,1,0,1,0,1,0,0,1,1,0],
    [1,0,0,1,0,1,1,0,1,0,0,0,1,0,1,0,1,0,0,1,1],
    [0,0,0,0,0,0,0,0,0,1,1,0,0,1,0,1,0,1,0,0,0],
    [1,1,1,1,1,1,1,0,1,0,0,1,1,0,1,0,1,0,0,1,0],
    [1,0,0,0,0,0,1,0,0,1,0,1,0,1,0,1,1,0,1,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,0,0,1,0,1,0],
    [1,0,1,1,1,0,1,0,0,1,0,1,0,1,0,1,0,0,1,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,0,1,0,0,1,1,0,0,1,0],
    [1,0,0,0,0,0,1,0,0,1,0,0,1,0,1,0,0,1,1,0,1],
    [1,1,1,1,1,1,1,0,1,0,0,1,0,1,0,1,0,0,0,1,0],
  ];
  const s = 3.8;
  const cols = cells[0].length;
  const rows = cells.length;
  return (
    <svg width={cols * s} height={rows * s} viewBox={`0 0 ${cols * s} ${rows * s}`}>
      {cells.flatMap((row, i) =>
        row.map((v, j) =>
          v ? (
            <rect key={`${i}-${j}`} x={j * s} y={i * s} width={s} height={s} fill="rgba(255,255,255,0.82)" />
          ) : null
        )
      )}
    </svg>
  );
}

function Product3DShowcase({
  imageUrl,
  model,
  mouse,
  status = "Active",
}: {
  imageUrl: string;
  model: string;
  mouse: { x: number; y: number };
  status?: "Active" | "Expired";
}) {
  const rotateX = -mouse.y * 22;
  const rotateY = mouse.x * 28;
  const isActive = status === "Active";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 35 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex flex-col items-center justify-center my-6 z-20"
      style={{ perspective: "1200px" }}
    >
      {/* 3D Container with Parallax Tilt */}
      <div
        className="relative group cursor-pointer transition-transform duration-200 ease-out"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        }}
      >
        {/* 3D Glass Stage Card */}
        <div
          className="relative w-[320px] sm:w-[360px] h-[310px] sm:h-[340px] rounded-[32px] overflow-visible p-6 flex flex-col items-center justify-between transition-all duration-500"
          style={{
            background: isActive
              ? "linear-gradient(150deg, rgba(255,255,255,0.08) 0%, rgba(15,15,35,0.82) 60%, rgba(59,130,246,0.06) 100%)"
              : "linear-gradient(150deg, rgba(255,255,255,0.05) 0%, rgba(20,10,20,0.85) 60%, rgba(239,68,68,0.05) 100%)",
            border: isActive
              ? "1px solid rgba(147,197,253,0.3)"
              : "1px solid rgba(239,68,68,0.25)",
            boxShadow: isActive
              ? "0 40px 90px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.15), 0 0 50px rgba(59,130,246,0.12)"
              : "0 30px 70px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)",
            backdropFilter: "blur(24px) saturate(1.2)",
            WebkitBackdropFilter: "blur(24px) saturate(1.2)",
          }}
        >
          {/* Real Lamp Image */}
          <div
            className="relative z-10 w-full h-[200px] sm:h-[220px] flex items-center justify-center my-auto"
            style={{
              transform: "translateZ(55px)",
            }}
          >
            {/* ── Light beam cone from the lamp nozzle ── */}
            {isActive && (
              <div className="absolute inset-0 pointer-events-none z-0" style={{ overflow: "visible" }}>
                <svg
                  viewBox="0 0 500 300"
                  className="absolute"
                  style={{
                    width: "700px",
                    height: "420px",
                    top: "-80px",
                    left: "-320px",
                    overflow: "visible",
                  }}
                >
                  <defs>
                    {/* Beam cone gradient — bright at nozzle (right side), fades to left */}
                    <linearGradient id="beam-cone-lr" x1="100%" y1="50%" x2="0%" y2="50%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                      <stop offset="5%" stopColor="#bfdbfe" stopOpacity="0.6" />
                      <stop offset="20%" stopColor="#60a5fa" stopOpacity="0.3" />
                      <stop offset="45%" stopColor="#3b82f6" stopOpacity="0.12" />
                      <stop offset="75%" stopColor="#1d4ed8" stopOpacity="0.04" />
                      <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
                    </linearGradient>
                    {/* Inner core beam gradient */}
                    <linearGradient id="beam-core-lr" x1="100%" y1="50%" x2="0%" y2="50%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                      <stop offset="10%" stopColor="#e0f2fe" stopOpacity="0.55" />
                      <stop offset="35%" stopColor="#93c5fd" stopOpacity="0.2" />
                      <stop offset="70%" stopColor="#3b82f6" stopOpacity="0.06" />
                      <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                    </linearGradient>
                    <filter id="b-blur-wide"><feGaussianBlur stdDeviation="18" /></filter>
                    <filter id="b-blur-mid"><feGaussianBlur stdDeviation="10" /></filter>
                    <filter id="b-blur-tight"><feGaussianBlur stdDeviation="5" /></filter>
                    <filter id="b-nozzle"><feGaussianBlur stdDeviation="6" /></filter>
                  </defs>

                  {/* Wide outer atmospheric cone — spreads from nozzle (right) to far left */}
                  <polygon
                    points="490,140 0,0 0,300"
                    fill="url(#beam-cone-lr)"
                    filter="url(#b-blur-wide)"
                    opacity="0.5"
                  />

                  {/* Mid cone — sharper, brighter */}
                  <polygon
                    points="488,142 20,55 20,250"
                    fill="url(#beam-cone-lr)"
                    filter="url(#b-blur-mid)"
                    opacity="0.45"
                  />

                  {/* Inner bright core cone */}
                  <polygon
                    points="486,144 60,100 60,200"
                    fill="url(#beam-core-lr)"
                    filter="url(#b-blur-mid)"
                    opacity="0.4"
                  />

                  {/* Tight center beam core */}
                  <polygon
                    points="485,145 120,125 120,175"
                    fill="url(#beam-core-lr)"
                    filter="url(#b-blur-tight)"
                    opacity="0.5"
                  />

                  {/* Nozzle hot-spot glow — positioned at the lamp lens (right side of SVG) */}
                  <circle cx="490" cy="145" r="28" fill="#93c5fd" opacity="0.35" filter="url(#b-blur-wide)" />
                  <circle cx="490" cy="145" r="14" fill="#bfdbfe" opacity="0.55" filter="url(#b-nozzle)" />
                  <circle cx="490" cy="145" r="6" fill="#ffffff" opacity="0.85" filter="url(#b-blur-tight)" />
                </svg>

                {/* Animated dust/haze particles floating in beam path */}
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      width: 1.5 + (i % 3),
                      height: 1.5 + (i % 3),
                      background: `rgba(147,197,253,${0.3 + (i % 4) * 0.1})`,
                      left: `${-5 + i * 5}%`,
                      top: `${38 + ((i * 11) % 24)}%`,
                      animation: `mox-particle ${4 + i * 0.8}s ease-in-out infinite ${i * 0.6}s`,
                      filter: "blur(0.5px)",
                    }}
                  />
                ))}
              </div>
            )}

            <img
              src={imageUrl}
              alt={model}
              className="relative z-20 max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
              style={{
                filter: isActive
                  ? "drop-shadow(0 5px 20px rgba(0,0,0,0.6))"
                  : "drop-shadow(0 10px 20px rgba(0,0,0,0.8)) grayscale(0.3) brightness(0.7)",
              }}
            />
          </div>

          {/* Product Label */}
          <div
            className="relative z-10 text-center"
            style={{ transform: "translateZ(35px)" }}
          >
            <div className="text-white font-semibold text-base tracking-wide">{model}</div>
            <div
              className={`text-[11px] font-mono mt-0.5 ${
                isActive ? "text-emerald-300/90" : "text-red-400/80"
              }`}
            >
              {isActive ? "Warranty Active · Beam On" : "Warranty Expired"}
            </div>
          </div>

          {/* Glass glare overlay */}
          <div
            className="absolute inset-0 pointer-events-none rounded-[32px] opacity-20"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 40%, transparent 70%, rgba(255,255,255,0.1) 100%)",
            }}
          />
        </div>

        {/* 3D Floor Shadow */}
        <div
          className="w-[260px] h-[18px] mx-auto mt-3 rounded-full filter blur-md opacity-80"
          style={{
            background: isActive
              ? "radial-gradient(ellipse, rgba(59,130,246,0.4) 0%, rgba(0,0,0,0.8) 50%, transparent 80%)"
              : "radial-gradient(ellipse, rgba(0,0,0,0.95) 0%, transparent 80%)",
            transform: "translateZ(-30px)",
          }}
        />
      </div>
    </motion.div>
  );
}

function InfoField({
  label,
  value,
  mono,
  accent,
  wide,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <div
        className="text-[10px] uppercase tracking-[0.18em] mb-1.5 font-medium"
        style={{ fontFamily: "'JetBrains Mono', monospace", color: "rgba(148,170,210,0.5)" }}
      >
        {label}
      </div>
      <div
        className={`font-medium leading-snug ${accent ? "text-emerald-400" : "text-white/90"} ${
          mono ? "text-sm" : "text-[15px]"
        }`}
        style={mono ? { fontFamily: "'JetBrains Mono', monospace" } : undefined}
      >
        {value}
      </div>
    </div>
  );
}

function VerificationCard({
  phase,
  serial,
  setSerial,
  onVerify,
  onReset,
}: {
  phase: Phase;
  serial: string;
  setSerial: (s: string) => void;
  onVerify: () => void;
  onReset: () => void;
}) {
  return (
    <div
      className="rounded-[20px] overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, rgba(255,255,255,0.075) 0%, rgba(255,255,255,0.03) 100%)",
        border: "1px solid rgba(255,255,255,0.1)",
        backdropFilter: "blur(28px) saturate(1.2)",
        WebkitBackdropFilter: "blur(28px) saturate(1.2)",
        boxShadow:
          "0 32px 72px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 60px rgba(59,130,246,0.06)",
      }}
    >
      <div className="p-7">
        {phase === "error" ? (
          <div className="text-center py-3">
            <div
              className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.25)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 7v4m0 3.5h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z"
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2 text-[15px]">Product Not Found</h3>
            <p className="text-white/35 text-sm mb-5 leading-relaxed max-w-[240px] mx-auto">
              This serial number is not in our records. Please verify the number and try again.
            </p>
            <button
              onClick={onReset}
              className="text-blue-400 text-sm font-medium hover:text-blue-300 transition-colors"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <label
                className="block text-[10px] uppercase tracking-[0.18em] mb-2.5 font-medium"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "rgba(148,170,210,0.5)",
                }}
              >
                Serial Number
              </label>
              <input
                type="text"
                value={serial}
                onChange={(e) => setSerial(e.target.value.toUpperCase())}
                placeholder="MXL-XXX-XXXX"
                onKeyDown={(e) => e.key === "Enter" && onVerify()}
                disabled={phase === "verifying"}
                className="w-full rounded-xl px-4 py-3.5 text-white placeholder-white/20 outline-none text-sm tracking-widest transition-all"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "inset 0 2px 8px rgba(0,0,0,0.35)",
                }}
              />
            </div>

            <button
              onClick={onVerify}
              disabled={phase === "verifying" || !serial.trim()}
              className="w-full py-3.5 rounded-xl font-semibold text-white text-[13px] tracking-[0.12em] uppercase transition-all disabled:opacity-40 relative overflow-hidden"
              style={{
                background:
                  phase === "verifying"
                    ? "rgba(59,130,246,0.3)"
                    : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                boxShadow:
                  phase !== "verifying"
                    ? "0 0 36px rgba(59,130,246,0.38), 0 6px 24px rgba(0,0,0,0.55)"
                    : "none",
              }}
            >
              {phase === "verifying" ? (
                <span className="flex items-center justify-center gap-2.5">
                  <span className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin block" />
                  Authenticating
                </span>
              ) : (
                "Check Warranty"
              )}
            </button>

            <div className="mt-4 flex items-center justify-center gap-1.5 flex-wrap text-[11px] text-white/30" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <span>Try:</span>
              <button
                type="button"
                onClick={() => setSerial("MXL-PRO-7042")}
                className="hover:text-blue-400 underline decoration-dotted transition-colors cursor-pointer"
              >
                MXL-PRO-7042
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setSerial("MXL-TIT-1187")}
                className="hover:text-blue-400 underline decoration-dotted transition-colors cursor-pointer"
              >
                MXL-TIT-1187
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setSerial("MXL-EVO-0291")}
                className="hover:text-blue-400 underline decoration-dotted transition-colors cursor-pointer"
              >
                MXL-EVO-0291
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function WarrantyPanel({
  data,
  serial,
  onReset,
}: {
  data: WarrantyData;
  serial: string;
  onReset: () => void;
}) {
  const isActive = data.status === "Active";
  const isExpired = data.status === "Expired";
  const verifiedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: isExpired ? 38 : 28, scale: isExpired ? 0.94 : 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: isExpired ? 1.0 : 0.85, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      <div
        className="rounded-[20px] overflow-hidden relative"
        style={{
          background: isActive
            ? "linear-gradient(160deg, rgba(255,255,255,0.1) 0%, rgba(59,130,246,0.12) 40%, rgba(16,185,129,0.06) 100%)"
            : "linear-gradient(160deg, rgba(239,68,68,0.06) 0%, rgba(14,14,32,0.85) 45%, rgba(20,20,35,0.9) 100%)",
          border: isActive
            ? "1px solid rgba(147,197,253,0.4)"
            : "1px solid rgba(239,68,68,0.25)",
          backdropFilter: isActive ? "blur(14px) saturate(1.7)" : "blur(28px) saturate(1.2)",
          WebkitBackdropFilter: isActive ? "blur(14px) saturate(1.7)" : "blur(28px) saturate(1.2)",
          boxShadow: isActive
            ? "0 40px 90px rgba(0,0,0,0.75), 0 0 80px rgba(59,130,246,0.35), 0 0 35px rgba(52,211,153,0.25), inset 0 1px 0 rgba(255,255,255,0.2)"
            : "0 40px 90px rgba(0,0,0,0.75), 0 0 60px rgba(239,68,68,0.08)",
        }}
      >

        {/* Holographic scan line */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[20px]">
          <div
            className="absolute left-0 right-0 h-[1px]"
            style={{
              background: isExpired
                ? "linear-gradient(90deg, transparent, rgba(239,68,68,0.22), rgba(252,165,165,0.35), rgba(239,68,68,0.22), transparent)"
                : "linear-gradient(90deg, transparent, rgba(59,130,246,0.28), rgba(147,197,253,0.4), rgba(59,130,246,0.28), transparent)",
              animation: isExpired ? "mox-scanline-expired 5.5s linear infinite" : "mox-scanline 4.5s linear infinite",
            }}
          />
        </div>

        {/* Top noise texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none rounded-[20px] opacity-[0.015]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundSize: "180px 180px",
          }}
        />

        {/* ── Header ── */}
        <div
          className="px-7 py-5 flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.055)" }}
        >
          <div className="flex items-center gap-3.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "rgba(59,130,246,0.15)",
                border: "1px solid rgba(59,130,246,0.3)",
                boxShadow: "0 0 22px rgba(59,130,246,0.22)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M15.5 4.5L7.5 12.5L2.5 7.5"
                  stroke="#60a5fa"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <div className="text-white font-semibold text-[15px]">Genuine Moxlite Product</div>
              <div
                className="text-[11px] mt-0.5"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "rgba(96,165,250,0.65)",
                }}
              >
                {serial.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            <span
              className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-400" : "bg-red-400"}`}
              style={{
                boxShadow: `0 0 8px ${isActive ? "#4ade80" : "#f87171"}`,
                animation: "mox-pulse 2.2s ease-in-out infinite",
              }}
            />
            <span
              className={`text-[13px] font-semibold ${isActive ? "text-emerald-400" : "text-red-400"}`}
            >
              {data.status}
            </span>
          </div>
        </div>

        {/* ── Info grid ── */}
        <div className="px-7 py-6 grid grid-cols-2 gap-x-8 gap-y-6">
          <InfoField label="Product Model" value={data.model} wide />
          <InfoField
            label="Warranty Status"
            value={data.status}
            accent={isActive}
          />
          <InfoField label="Warranty Remaining" value={data.remaining} />
          <InfoField label="Purchase Date" value={data.purchaseDate} />
          <InfoField label="Expiration Date" value={data.expirationDate} />
          <InfoField label="Authorized Dealer" value={data.dealer} wide />
        </div>

        {/* ── Footer — QR + meta ── */}
        <div
          className="px-7 py-5 flex items-end justify-between gap-6"
          style={{ borderTop: "1px solid rgba(255,255,255,0.055)" }}
        >
          <div>
            <div
              className="text-[9px] uppercase tracking-[0.2em] mb-2 font-medium"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: "rgba(148,170,210,0.35)",
              }}
            >
              Verification QR
            </div>
            <div
              className="p-2.5 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <QRCodeSVG />
            </div>
          </div>

          <div className="text-right">
            <div
              className="text-[11px] mb-1"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: "rgba(255,255,255,0.2)",
              }}
            >
              Verified {verifiedDate}
            </div>
            <div
              className="text-[11px] mb-5"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: "rgba(255,255,255,0.15)",
              }}
            >
              Moxlite Warranty Authority
            </div>
            <button
              onClick={onReset}
              className="text-blue-400/60 text-[13px] font-medium hover:text-blue-400 transition-colors"
            >
              ← Verify another product
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function App() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [serial, setSerial] = useState("");
  const [warrantyData, setWarrantyData] = useState<WarrantyData | null>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMouse({
      x: e.clientX / window.innerWidth - 0.5,
      y: e.clientY / window.innerHeight - 0.5,
    });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  const handleVerify = async () => {
    if (!serial.trim() || phase === "verifying") return;
    setPhase("verifying");
    await new Promise((r) => setTimeout(r, 2600));
    const data = MOCK_DB[serial.trim().toUpperCase()];
    if (data) {
      setWarrantyData(data);
      setPhase("verified");
    } else {
      setPhase("error");
    }
  };

  const handleReset = () => {
    setPhase("idle");
    setSerial("");
    setWarrantyData(null);
  };

  const px = mouse.x * 24;
  const py = mouse.y * 10;
  const tilt = mouse.x * 14;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden flex flex-col"
      style={{ background: "#04040c", fontFamily: "'Outfit', sans-serif" }}
    >
      {/* ── Ambient background ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 100% 55% at 50% 0%, rgba(29,78,216,0.18) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 55% 40% at 85% 88%, rgba(6,182,212,0.055) 0%, transparent 60%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 42% 32% at 10% 55%, rgba(124,58,237,0.04) 0%, transparent 60%)",
          }}
        />
      </div>

      {/* ── Volumetric background beams ── */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-[1500ms]"
        style={{
          background: `conic-gradient(from -18deg at 50% -8%, transparent 0deg, rgba(59,130,246,${
            phase === "verified" ? "0.075" : "0.045"
          }) 16deg, transparent 32deg, transparent 328deg, rgba(59,130,246,${
            phase === "verified" ? "0.075" : "0.045"
          }) 344deg, transparent 360deg)`,
        }}
      />

      {/* ── Smoke / fog particles ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.w,
              height: p.h,
              left: `${p.left}%`,
              top: `${p.top}%`,
              background: `radial-gradient(circle, rgba(70,110,195,${p.opacity}) 0%, transparent 70%)`,
              animation: `mox-particle ${p.duration}s ease-in-out infinite ${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* ── Subtle horizontal light lines ── */}
      {[22, 47, 74].map((pct) => (
        <div
          key={pct}
          className="absolute left-0 right-0 h-px pointer-events-none"
          style={{
            top: `${pct}%`,
            background:
              "linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.05) 30%, rgba(59,130,246,0.08) 50%, rgba(59,130,246,0.05) 70%, transparent 100%)",
          }}
        />
      ))}

      {/* ── Header ── */}
      <header className="relative z-20 flex items-center justify-between px-8 pt-7 pb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
              boxShadow: "0 0 18px rgba(59,130,246,0.45)",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="2.5" fill="white" />
              <path
                d="M7 1.5V3M7 11V12.5M1.5 7H3M11 7H12.5"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="text-white font-semibold text-[15px] tracking-tight">MOXLITE</span>
          <span
            className="text-[10px] ml-0.5"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: "rgba(255,255,255,0.18)",
              letterSpacing: "0.2em",
            }}
          >
            PRO
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-7">
          {["Products", "Support", "Dealers", "About"].map((item) => (
            <a
              key={item}
              href="#"
              className="text-sm font-light tracking-wide transition-colors"
              style={{ color: "rgba(255,255,255,0.28)" }}
              onMouseEnter={(e) =>
                ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.65)")
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.28)")
              }
            >
              {item}
            </a>
          ))}
        </nav>
      </header>

      {/* ── Main content ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center">
        {/* Hero text */}
        <div className="text-center px-4 mt-4 mb-1">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6"
            style={{
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.18)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-blue-400"
              style={{
                animation: "mox-pulse 2.2s ease-in-out infinite",
                boxShadow: "0 0 7px #60a5fa",
              }}
            />
            <span
              className="text-blue-400 text-[11px] font-medium"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              {phase === "verified" ? "Authentication Complete" : "Warranty Verification System"}
            </span>
          </div>

          <h1
            className="text-5xl md:text-6xl lg:text-[68px] font-light text-white leading-[1.05] tracking-tight mb-3"
            style={{ textShadow: "0 0 100px rgba(59,130,246,0.2)" }}
          >
            {phase === "verified" ? (
              <span
                className="font-semibold"
                style={{
                  background: "linear-gradient(90deg, #60a5fa, #34d399)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Authenticated
              </span>
            ) : (
              <>
                Verify Your
                <br />
                <span
                  className="font-semibold"
                  style={{
                    background: "linear-gradient(90deg, #60a5fa, #a78bfa)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Warranty
                </span>
              </>
            )}
          </h1>

          {phase === "idle" && (
            <p
              className="text-lg font-light max-w-sm mx-auto leading-relaxed"
              style={{ color: "rgba(255,255,255,0.32)" }}
            >
              Authenticate your professional stage lighting with our global warranty registry.
            </p>
          )}
        </div>

        {/* 3D Real Product Showcase (Renders ONLY when verified & imageUrl exists) */}
        {phase === "verified" && warrantyData?.imageUrl && (
          <Product3DShowcase
            imageUrl={warrantyData.imageUrl}
            model={warrantyData.model}
            mouse={mouse}
            status={warrantyData.status}
          />
        )}

        {/* UI panel */}
        <div
          className="w-full px-4 my-6 transition-all duration-500 ease-out"
          style={{
            maxWidth: phase === "verified" ? "640px" : "420px",
          }}
        >
          {phase !== "verified" ? (
            <VerificationCard
              phase={phase}
              serial={serial}
              setSerial={setSerial}
              onVerify={handleVerify}
              onReset={handleReset}
            />
          ) : (
            warrantyData && (
              <WarrantyPanel data={warrantyData} serial={serial} onReset={handleReset} />
            )
          )}
        </div>

        <div className="h-20" />
      </main>

      {/* ── Footer ── */}
      <footer
        className="relative z-10 text-center py-6 text-[11px]"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          color: "rgba(255,255,255,0.12)",
        }}
      >
        © 2026 Moxlite Professional Lighting · All rights reserved
      </footer>

      {/* ── Global styles ── */}
      <style>{`
        @keyframes mox-float {
          0%, 100% { transform: translateY(0px); }
          38%       { transform: translateY(-15px); }
          72%       { transform: translateY(8px); }
        }
        @keyframes mox-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes mox-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.55; transform: scale(0.8); }
        }
        @keyframes mox-particle {
          0%,  100% { transform: translate(0, 0) scale(1);    opacity: 0; }
          15%        { opacity: 1; }
          55%        { transform: translate(18px, -55px) scale(1.5); opacity: 0.65; }
          85%        { opacity: 0.15; }
        }
        @keyframes mox-scanline {
          0%   { top: -2px;  opacity: 0; }
          4%   { opacity: 1; }
          96%  { opacity: 1; }
          100% { top: 100%;  opacity: 0; }
        }
        @keyframes mox-scanline-expired {
          0%   { top: -4px;  opacity: 0; filter: blur(0); }
          10%  { opacity: 1; filter: blur(0); }
          45%  { top: 30%; opacity: 0.8; filter: blur(2px); }
          70%  { top: 35%; opacity: 0.7; filter: blur(2px); }
          100% { top: 100%; opacity: 0; filter: blur(3px); }
        }
        * { scrollbar-width: none; }
        *::-webkit-scrollbar { display: none; }
        input:focus {
          border-color: rgba(59,130,246,0.45) !important;
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.35), 0 0 0 3px rgba(59,130,246,0.12) !important;
        }
        ::selection {
          background: rgba(59,130,246,0.35);
          color: #fff;
        }
      `}</style>
    </div>
  );
}
