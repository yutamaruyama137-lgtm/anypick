export type MetricType = "scan" | "camera_complete" | "save_click" | "outbound_click" | "submit_complete";

export interface EventPublic {
  id: string;
  name: string;
  starts_at: string | null;
  ends_at: string | null;
  rules_text: string;
  share_caption_template: string;
  share_hashtags: string[];
  share_targets: string[];
  frame_active: { id: string; image_url: string } | null;
  consent_template: { id: string; version: number; text: string } | null;
  submission_policy: {
    max_submissions_per_person: number;
    allow_retake_count: number;
    require_ticket_code: boolean;
  };
}

export interface SessionStartResponse {
  session_id: string;
  already_submitted: boolean;
}

export interface UploadResponse {
  media_asset_id: string;
  upload_url: string;
  public_read_url: string;
}

export interface SubmissionResponse {
  submission_id: string;
  locked: boolean;
}
