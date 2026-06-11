import { ImageResponse } from "next/og";

export const alt = "FIFA World Cup 2026 Schedule";
export const dynamic = "force-static";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background:
            "linear-gradient(135deg, #020404 0%, #031416 48%, #000000 100%)",
          color: "#f4fbfb",
          fontFamily: "Arial, Helvetica, sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 18% 22%, rgba(53,217,232,0.24), transparent 270px), radial-gradient(circle at 86% 32%, rgba(255,211,38,0.18), transparent 230px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 36,
            border: "2px solid rgba(53,217,232,0.32)",
            borderRadius: 28,
          }}
        />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              color: "#35d9e8",
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: 6,
              textTransform: "uppercase",
              marginBottom: 28,
            }}
          >
            Full Schedule
          </div>
          <div
            style={{
              maxWidth: 820,
              fontSize: 92,
              fontWeight: 900,
              lineHeight: 0.92,
              textTransform: "uppercase",
            }}
          >
            FIFA World Cup 2026
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 16 }}>
            {["Team search", "Group filters", "NL / JP time"].map((label) => (
              <div
                key={label}
                style={{
                  padding: "14px 20px",
                  border: "2px solid rgba(53,217,232,0.42)",
                  borderRadius: 999,
                  background: "rgba(53,217,232,0.12)",
                  color: "#f4fbfb",
                  fontSize: 24,
                  fontWeight: 700,
                }}
              >
                {label}
              </div>
            ))}
          </div>
          <div
            style={{
              color: "#98b5b8",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            @sonoda-kengo
          </div>
        </div>
      </div>
    ),
    size,
  );
}
