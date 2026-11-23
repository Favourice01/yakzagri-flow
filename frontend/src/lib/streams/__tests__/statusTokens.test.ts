import { STREAM_HEALTH_TOKENS, STREAM_STATUS_TOKENS } from "../statusTokens";

const palette: Record<string, string> = {
  "bg-emerald-100": "#d1fae5",
  "text-emerald-900": "#064e3b",
  "bg-amber-100": "#fef3c7",
  "text-amber-900": "#78350f",
  "bg-red-100": "#fee2e2",
  "text-red-900": "#7f1d1d",
  "bg-blue-100": "#dbeafe",
  "text-blue-900": "#1e3a8a",
  "bg-gray-100": "#f3f4f6",
  "text-gray-900": "#111827",
};

function luminance(hex: string): number {
  const channels = hex.match(/[a-f\d]{2}/gi);
  if (!channels || channels.length !== 3) {
    throw new Error(`Invalid RGB hex color "${hex}"`);
  }
  const [red, green, blue] = channels.map((channel) => {
    const value = Number.parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string): number {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort(
    (first, second) => second - first,
  );
  return (lighter + 0.05) / (darker + 0.05);
}

describe("STREAM_STATUS_TOKENS", () => {
  it("covers every stream lifecycle status", () => {
    expect(Object.keys(STREAM_STATUS_TOKENS).sort()).toEqual([
      "ACTIVE",
      "COMPLETED",
      "SUSPENDED",
      "TERMINATED",
    ]);
  });

  it("covers every derived stream health status", () => {
    expect(Object.keys(STREAM_HEALTH_TOKENS).sort()).toEqual([
      "Completed",
      "Near Depletion",
      "Paused",
      "Streaming",
    ]);
  });

  it("uses WCAG AA text contrast for each badge background", () => {
    const tokenMaps = [STREAM_STATUS_TOKENS, STREAM_HEALTH_TOKENS];
    for (const classes of tokenMaps.flatMap((tokens) => Object.values(tokens))) {
      const backgroundClass = classes.split(" ").find((name) => name.startsWith("bg-"));
      const foregroundClass = classes.split(" ").find((name) => name.startsWith("text-"));
      if (!backgroundClass || !foregroundClass) {
        throw new Error(`Missing foreground or background class in "${classes}"`);
      }

      const background = palette[backgroundClass];
      const foreground = palette[foregroundClass];
      if (!background || !foreground) {
        throw new Error(`Unknown foreground or background class in "${classes}"`);
      }

      expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
