import { request } from "./client";

export interface StreamResponse {
  streamId: string;
  recipient: string;
  totalVested: string;
  claimed: string;
  unclaimed: string;
  pendingClawback: string;
  createdAt: string;
  updatedAt: string;
}

export interface StreamRemainingResponse {
  totalVested: string;
  claimed: string;
  unclaimed: string;
  pendingClawback: string;
  assetCode?: string;
  assetIssuer?: string;
  decimals?: number;
  recipient?: string;
  contractId?: string;
}

export interface ClawbackExecuteRequest {
  amount: string;
  /** Admin audit trail fields recorded with the dispatch. */
  reasonCode: string;
  auditTicket: string;
  reason: string;
}

export interface ClawbackPreviewRequest {
  amount: string;
}

export interface ClawbackPreviewResponse {
  streamId: string;
  remainingVested: string;
  requestedClawback: string;
  postClawbackBalance: string;
  preview: boolean;
  timestamp: string;
  assetCode?: string;
  assetIssuer?: string;
  decimals?: number;
}

export interface SuspendStreamRequest {
  reason?: string;
}

export interface SuspendStreamResponse {
  streamId: string;
  status: string;
  suspendedBy: string;
  suspendedAt: string;
  reason: string;
  reversible: boolean;
}

export interface ResumeStreamRequest {
  note?: string;
}

export interface ResumeStreamResponse {
  streamId: string;
  status: string;
  resumedBy: string;
  resumedAt: string;
  note: string;
}

export const streamsApi = {
  /**
   * Get stream remaining amounts
   */
  getRemaining: async (token: string, streamId: string): Promise<StreamRemainingResponse> => {
    return request<StreamRemainingResponse>(`/streams/${streamId}/remaining`, {
      method: "GET",
      token,
    });
  },

  /**
   * Preview clawback effect (admin only)
   */
  previewClawback: async (
    token: string,
    streamId: string,
    data: ClawbackPreviewRequest
  ): Promise<ClawbackPreviewResponse> => {
    return request<ClawbackPreviewResponse>(`/admin/streams/${streamId}/clawback/preview`, {
      method: "POST",
      token,
      body: JSON.stringify(data),
    });
  },

  /**
   * Execute clawback (admin only, irreversible)
   */
  executeClawback: async (
    token: string,
    streamId: string,
    data: ClawbackExecuteRequest
  ): Promise<{ streamId: string; clawedBack: string }> => {
    return request<{ streamId: string; clawedBack: string }>(
      `/admin/streams/${encodeURIComponent(streamId)}/clawback`,
      { method: "POST", token, body: JSON.stringify(data) }
    );
  },

  /**
   * Suspend a stream (admin only)
   */
  suspend: async (
    token: string,
    streamId: string,
    data: SuspendStreamRequest
  ): Promise<SuspendStreamResponse> => {
    return request<SuspendStreamResponse>(`/admin/streams/${streamId}/suspend`, {
      method: "POST",
      token,
      body: JSON.stringify(data),
    });
  },

  /**
   * Resume a stream (admin only)
   */
  resume: async (
    token: string,
    streamId: string,
    data: ResumeStreamRequest
  ): Promise<ResumeStreamResponse> => {
    return request<ResumeStreamResponse>(`/admin/streams/${streamId}/resume`, {
      method: "POST",
      token,
      body: JSON.stringify(data),
    });
  },
};
