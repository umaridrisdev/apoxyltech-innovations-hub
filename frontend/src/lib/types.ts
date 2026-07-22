// Mirrors components.schemas in ApoxylTech_Phase1_OpenAPI.yaml.
// Keep in sync manually for now; codegen (openapi-typescript) can replace
// this file later once the API is stable.

export type ProjectStatus =
  | "planning"
  | "in_progress"
  | "on_hold"
  | "completed"
  | "cancelled";

export type BlogPostStatus = "draft" | "published";

export interface UserPublic {
  id: string;
  email: string;
  status: "pending_verification" | "active" | "deactivated";
}

export interface UserPrivate extends UserPublic {
  roles: string[];
  created_at: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
}

export interface Client {
  id: string;
  user_id: string;
  company_name: string;
  user?: UserPublic;
}

export interface Project {
  id: string;
  client_id: string;
  name: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  due_date: string | null;
}

export interface ProjectDetail extends Project {
  milestones: Milestone[];
}

export interface ProjectFile {
  id: string;
  project_id: string;
  file_url: string;
  uploaded_at: string;
}

export interface BlogPost {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  status: BlogPostStatus;
  body: string;
  published_at?: string | null;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  created_at: string;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface LeadCreateResponse {
  received: true;
}
