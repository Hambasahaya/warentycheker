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

function MovingHead({ tilt, phase }: { tilt: number; phase: Phase }) {
  const isActive = phase === "verifying" || phase === "verified";
  const isVerified = phase === "verified";
  const beamOpacity = isVerified ? 0.55 : isActive ? 0.4 : 0.22;
  const glowRadius = isActive ? 40 : 18;
  const glowOpacity = isActive ? 0.55 : 0.22;

  return (
    <div
      style={{
        animation: "mox-float 7s ease-in-out infinite",
        filter: `drop-shadow(0 0 ${glowRadius}px rgba(59,130,246,${glowOpacity}))`,
        transition: "filter 1s ease",
      }}
    >
      <svg width="300" height="460" viewBox="0 0 300 460" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="g-yoke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1c1c3a" />
            <stop offset="40%" stopColor="#2c2c50" />
            <stop offset="60%" stopColor="#363660" />
            <stop offset="100%" stopColor="#121226" />
          </linearGradient>
          <linearGradient id="g-body-top" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#22223e" />
            <stop offset="50%" stopColor="#2a2a48" />
            <stop offset="100%" stopColor="#0e0e20" />
          </linearGradient>
          <linearGradient id="g-body-side" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#101024" />
            <stop offset="50%" stopColor="#1a1a34" />
            <stop offset="100%" stopColor="#0c0c1c" />
          </linearGradient>
          <radialGradient id="g-lens" cx="42%" cy="38%" r="62%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
            <stop offset="18%" stopColor={isVerified ? "#93c5fd" : "#bfdbfe"} stopOpacity="0.9" />
            <stop offset="45%" stopColor={isVerified ? "#3b82f6" : "#60a5fa"} stopOpacity="0.75" />
            <stop offset="75%" stopColor={isVerified ? "#1d4ed8" : "#2563eb"} stopOpacity="0.4" />
            <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="g-lens-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={isVerified ? "#3b82f6" : "#60a5fa"} stopOpacity={isActive ? 0.9 : 0.35} />
            <stop offset="60%" stopColor="#1d4ed8" stopOpacity={isActive ? 0.3 : 0.08} />
            <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="g-beam" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isVerified ? "#3b82f6" : "#60a5fa"} stopOpacity={beamOpacity} />
            <stop offset="35%" stopColor={isVerified ? "#2563eb" : "#3b82f6"} stopOpacity={beamOpacity * 0.3} />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="g-beam-core" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={isActive ? 0.12 : 0.04} />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
          </linearGradient>
          <filter id="f-blur4"><feGaussianBlur stdDeviation="4" /></filter>
          <filter id="f-blur10"><feGaussianBlur stdDeviation="10" /></filter>
          <filter id="f-blur18"><feGaussianBlur stdDeviation="18" /></filter>
        </defs>

        {/* ── Beam of light ── */}
        <g transform={`rotate(${tilt * 0.35}, 150, 300)`}>
          <polygon
            points="128,286 172,286 252,460 48,460"
            fill="url(#g-beam)"
            filter="url(#f-blur4)"
          />
          <polygon
            points="140,286 160,286 192,460 108,460"
            fill="url(#g-beam-core)"
          />
        </g>

        {/* ── Yoke top mounting bar ── */}
        <rect x="52" y="16" width="196" height="26" rx="8" fill="url(#g-yoke)" />
        {/* Omega clamp detail */}
        <rect x="108" y="10" width="84" height="14" rx="5" fill="#20203c" />
        <rect x="128" y="6" width="44" height="10" rx="4" fill="#1a1a32" />
        {/* Mounting bolts */}
        <circle cx="88" cy="29" r="5.5" fill="#0c0c1e" stroke="#38386a" strokeWidth="1.5" />
        <circle cx="88" cy="29" r="2" fill="#252545" />
        <circle cx="212" cy="29" r="5.5" fill="#0c0c1e" stroke="#38386a" strokeWidth="1.5" />
        <circle cx="212" cy="29" r="2" fill="#252545" />

        {/* ── Left yoke arm ── */}
        <rect x="60" y="38" width="24" height="146" rx="7" fill="url(#g-yoke)" />
        {/* Left arm channel detail */}
        <rect x="65" y="46" width="8" height="130" rx="3" fill="rgba(0,0,0,0.35)" />
        {[58, 80, 102, 124, 146].map(y => (
          <rect key={y} x="68" y={y} width="12" height="2.5" rx="1" fill="rgba(120,130,200,0.25)" />
        ))}

        {/* ── Right yoke arm ── */}
        <rect x="216" y="38" width="24" height="146" rx="7" fill="url(#g-yoke)" />
        <rect x="227" y="46" width="8" height="130" rx="3" fill="rgba(0,0,0,0.35)" />
        {[58, 80, 102, 124, 146].map(y => (
          <rect key={y} x="220" y={y} width="12" height="2.5" rx="1" fill="rgba(120,130,200,0.25)" />
        ))}

        {/* ── Pivot joints ── */}
        <circle cx="72" cy="182" r="13" fill="#14142a" stroke="rgba(59,130,246,0.35)" strokeWidth="2" />
        <circle cx="72" cy="182" r="6" fill="#20203c" />
        <circle cx="72" cy="182" r="2.5" fill="#383858" />
        <circle cx="228" cy="182" r="13" fill="#14142a" stroke="rgba(59,130,246,0.35)" strokeWidth="2" />
        <circle cx="228" cy="182" r="6" fill="#20203c" />
        <circle cx="228" cy="182" r="2.5" fill="#383858" />

        {/* ── Head unit (tilts with mouse) ── */}
        <g transform={`rotate(${tilt * 0.35}, 150, 182)`}>
          {/* Back cap / top of head */}
          <ellipse cx="150" cy="196" rx="72" ry="36" fill="url(#g-body-top)" />
          <ellipse cx="150" cy="190" rx="65" ry="20" fill="rgba(50,50,90,0.4)" />

          {/* Main barrel */}
          <rect x="82" y="196" width="136" height="92" fill="#161630" />

          {/* Left side panel */}
          <rect x="82" y="196" width="20" height="92" fill="#101024" />
          <rect x="84" y="200" width="16" height="84" rx="2" fill="url(#g-body-side)" />

          {/* Right side panel */}
          <rect x="198" y="196" width="20" height="92" fill="#1a1a36" />
          <rect x="200" y="200" width="16" height="84" rx="2" fill="url(#g-body-side)" />

          {/* Vent slats — left */}
          {[210, 224, 238, 252, 266, 280].map(y => (
            <rect key={y} x="88" y={y} width="12" height="5" rx="1.5" fill="#08081a" />
          ))}
          {/* Vent slats — right */}
          {[210, 224, 238, 252, 266, 280].map(y => (
            <rect key={y} x="200" y={y} width="12" height="5" rx="1.5" fill="#08081a" />
          ))}

          {/* Center body label area */}
          <rect x="106" y="206" width="88" height="38" rx="5" fill="rgba(0,0,0,0.35)" />
          <rect x="112" y="215" width="76" height="1.5" rx="1" fill="rgba(255,255,255,0.07)" />
          <rect x="112" y="222" width="54" height="1.5" rx="1" fill="rgba(255,255,255,0.05)" />
          <rect x="112" y="229" width="62" height="1.5" rx="1" fill="rgba(255,255,255,0.04)" />

          {/* Moxlite logo mark on fixture */}
          <text x="150" y="220" textAnchor="middle" fill="rgba(255,255,255,0.12)" fontSize="7" fontFamily="'Outfit',sans-serif" fontWeight="600" letterSpacing="3">
            MOXLITE
          </text>

          {/* Status LED */}
          <circle
            cx="186"
            cy="218"
            r="3.5"
            fill={phase === "verifying" ? "#fb923c" : phase === "verified" ? "#4ade80" : "#3b82f6"}
            style={{
              filter: `drop-shadow(0 0 5px ${phase === "verified" ? "#4ade80" : phase === "verifying" ? "#fb923c" : "#3b82f6"})`,
            }}
          />

          {/* DMX connector area */}
          <rect x="106" y="254" width="88" height="28" rx="4" fill="rgba(0,0,0,0.3)" />
          {[0, 1, 2, 3, 4].map(i => (
            <circle key={i} cx={116 + i * 16} cy="268" r="4" fill="#0c0c1e" stroke="#282848" strokeWidth="1.5" />
          ))}

          {/* Bottom barrel converging to lens */}
          <path d="M82,288 Q82,302 98,306 L202,306 Q218,302 218,288 L218,288 Z" fill="#0e0e22" />

          {/* Lens housing rings */}
          <circle cx="150" cy="306" r="50" fill="#0a0a1e" />
          <circle cx="150" cy="306" r="47" fill="#0c0c22" />
          <circle cx="150" cy="306" r="44" fill="#0e0e26" />

          {/* Gobo ring detail */}
          <circle cx="150" cy="306" r="41" fill="none" stroke="#1e1e40" strokeWidth="3" />

          {/* Lens glow (behind lens) */}
          <circle cx="150" cy="306" r="38" fill="url(#g-lens-glow)" filter="url(#f-blur18)" />

          {/* Lens glass */}
          <circle cx="150" cy="306" r="35" fill="url(#g-lens)" />

          {/* Lens inner optics */}
          <circle cx="150" cy="306" r="30" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
          <circle cx="150" cy="306" r="22" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
          <circle cx="150" cy="306" r="14" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <circle cx="150" cy="306" r="6" fill="rgba(255,255,255,0.6)" />
          <circle cx="150" cy="306" r="3" fill="rgba(255,255,255,0.95)" />

          {/* Lens surface highlight */}
          <ellipse cx="138" cy="292" rx="12" ry="7" fill="rgba(255,255,255,0.22)" style={{ filter: "blur(4px)" }} />
          <ellipse cx="160" cy="316" rx="6" ry="4" fill="rgba(100,160,255,0.12)" style={{ filter: "blur(3px)" }} />

          {/* Outer lens trim */}
          <circle cx="150" cy="306" r="43" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
          <circle cx="150" cy="306" r="48" fill="none" stroke="rgba(59,130,246,0.12)" strokeWidth="1" />
        </g>

        {/* ── Scanning rings (verifying) ── */}
        {phase === "verifying" && (
          <>
            <circle cx="150" cy="306" r="62" fill="none" stroke="rgba(59,130,246,0.3)" strokeWidth="1.5"
              strokeDasharray="8 5"
              style={{ animation: "mox-spin 3s linear infinite", transformOrigin: "150px 306px" }}
            />
            <circle cx="150" cy="306" r="82" fill="none" stroke="rgba(147,197,253,0.15)" strokeWidth="1"
              strokeDasharray="5 9"
              style={{ animation: "mox-spin 5s linear infinite reverse", transformOrigin: "150px 306px" }}
            />
            <circle cx="150" cy="306" r="104" fill="none" stroke="rgba(59,130,246,0.07)" strokeWidth="1"
              strokeDasharray="3 11"
              style={{ animation: "mox-spin 8s linear infinite", transformOrigin: "150px 306px" }}
            />
          </>
        )}

        {/* ── Verified rings ── */}
        {phase === "verified" && (
          <>
            <circle cx="150" cy="306" r="62" fill="none" stroke="rgba(59,130,246,0.45)" strokeWidth="1.5"
              strokeDasharray="5 4"
              style={{ animation: "mox-spin 7s linear infinite", transformOrigin: "150px 306px" }}
            />
            <circle cx="150" cy="306" r="86" fill="none" stroke="rgba(52,211,153,0.2)" strokeWidth="1"
              style={{ animation: "mox-spin 11s linear infinite reverse", transformOrigin: "150px 306px" }}
            />
            <circle cx="150" cy="306" r="108" fill="none" stroke="rgba(59,130,246,0.08)" strokeWidth="1"
              strokeDasharray="2 8"
              style={{ animation: "mox-spin 15s linear infinite", transformOrigin: "150px 306px" }}
            />
          </>
        )}

        {/* ── Stage floor reflection ── */}
        <ellipse cx="150" cy="450" rx="55" ry="5" fill="rgba(59,130,246,0.08)" filter="url(#f-blur10)" />
      </svg>
    </div>
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

            <p
              className="mt-4 text-center text-[11px]"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: "rgba(255,255,255,0.18)",
              }}
            >
              Try: MXL-PRO-7042 · MXL-TIT-1187
            </p>
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
          background:
            "linear-gradient(160deg, rgba(59,130,246,0.09) 0%, rgba(14,14,32,0.85) 45%, rgba(6,182,212,0.05) 100%)",
          border: "1px solid rgba(59,130,246,0.22)",
          backdropFilter: "blur(28px) saturate(1.2)",
          WebkitBackdropFilter: "blur(28px) saturate(1.2)",
          boxShadow:
            "0 40px 90px rgba(0,0,0,0.75), 0 0 90px rgba(59,130,246,0.1), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        {data.imageUrl ? (
          <div className="relative overflow-hidden w-full h-64 mb-6 rounded-[20px]">
            <img
              src={data.imageUrl}
              alt={data.model}
              className="w-full h-full object-cover"
              style={{ display: "block" }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(180deg, rgba(4,4,12,0.2), rgba(4,4,12,0.85))",
              }}
            />
          </div>
        ) : null}
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
  const productCheck = serial.trim() ? MOCK_DB[serial.trim().toUpperCase()] : undefined;
  const productImageUrl = warrantyData?.imageUrl || productCheck?.imageUrl;
  const productModel = warrantyData?.model || productCheck?.model || "Moxlite product";

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

        {/* Spotlight with parallax */}
        <div
          className="relative"
          style={{
            transform: `translate(${px}px, ${py}px)`,
            transition: "transform 0.18s ease-out",
          }}
        >
          <div
            className="relative overflow-hidden rounded-[28px] border border-white/10 shadow-2xl"
            style={{ width: 360, height: 360, minWidth: 360 }}
          >
            <div className="w-full h-full bg-slate-950/80" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
          </div>
        </div>

        {/* UI panel — overlaps lower fixture */}
        <div
          className="w-full px-4"
          style={{
            maxWidth: phase === "verified" ? "680px" : "380px",
            marginTop: phase === "verified" ? "-120px" : "-180px",
            transition: "max-width 0.5s ease, margin-top 0.5s ease",
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
