import type { StreamStatus } from "@/lib/api/types";
import type { StreamHealthStatus } from "@/lib/api/adminStreams";

export const STREAM_STATUS_TOKENS: Record<StreamStatus, string> = {
  ACTIVE: "border-emerald-300 bg-emerald-100 text-emerald-900",
  SUSPENDED: "border-amber-300 bg-amber-100 text-amber-900",
  TERMINATED: "border-red-300 bg-red-100 text-red-900",
  COMPLETED: "border-blue-300 bg-blue-100 text-blue-900",
};

export const STREAM_HEALTH_TOKENS: Record<StreamHealthStatus, string> = {
  Streaming: "border-emerald-300 bg-emerald-100 text-emerald-900",
  "Near Depletion": "border-amber-300 bg-amber-100 text-amber-900",
  Completed: "border-gray-300 bg-gray-100 text-gray-900",
  Paused: "border-blue-300 bg-blue-100 text-blue-900",
};
