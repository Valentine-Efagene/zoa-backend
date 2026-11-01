import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const markPath =
  "M 3.592 18.000 L 50.000 18.000 A 32 32 0 0 1 79.674 61.977 L 96.408 78.711 L 96.408 82.000 L 50.000 82.000 A 32 32 0 0 1 20.326 38.023 L 3.592 21.289 L 3.592 18.000 Z M 71.925 50.000 A 21.925 21.925 0 1 0 28.075 50.000 A 21.925 21.925 0 1 0 71.925 50.000 Z";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#13458B",
          borderRadius: 40,
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="-0.41 -0.41 100.82 100.82"
          fill="none"
        >
          <path fill="#FF9933" fillRule="evenodd" d={markPath} />
        </svg>
      </div>
    ),
    { ...size },
  );
}
