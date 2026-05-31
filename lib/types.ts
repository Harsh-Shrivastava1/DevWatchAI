export type AppView =
  | "landing"
  | "overview"
  | "projects"
  | "reviews"
  | "deployments"
  | "monitoring"
  | "alerts"
  | "analytics"
  | "team"
  | "integrations"
  | "settings"
  | "ide";

export interface UserSession {
  id: string;
  uid?: string;
  email: string;
  name: string;
  photoURL?: string;
  token: string;
  onboardingRequired?: boolean;
  onboardingCompleted?: boolean;
}

export interface ApiEntity {
  _id?: string;
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Workspace extends ApiEntity {
  workspaceName: string;
  slug?: string;
  ownerId?: string;
}

export interface Project extends ApiEntity {
  workspaceId: string;
  projectName: string;
  description?: string;
  status?: string;
  aiScore?: number;
  createdBy?: string;
  lastOpenedAt?: string;
}

export interface WorkspaceFile extends ApiEntity {
  projectId: string;
  parentId?: string | null;
  type: "file" | "folder";
  name: string;
  path: string;
  content: string;
  language: string;
  size?: number;
  lastEditedBy?: string;
}

export interface ChatMessage extends ApiEntity {
  workspaceId?: string;
  projectId: string;
  sender?: string | UserSummary;
  message: string;
  room?: string;
}

export interface UserSummary {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  photoURL?: string;
}

export interface Member extends ApiEntity {
  workspaceId: string;
  userId?: string | UserSummary;
  invitedEmail?: string;
  role: "owner" | "admin" | "developer" | "viewer";
  status: "invited" | "active" | "removed";
  joinedAt?: string;
}

export interface AIReviewIssue {
  type?: "Bug" | "Security" | "Performance" | "Clean Code";
  severity?: "Low" | "Medium" | "High";
  title: string;
  message?: string;
  filePath?: string;
  line?: number;
  column?: number;
  suggestion?: string;
  status?: "open" | "fixed" | "ignored";
}

export interface AIReview extends ApiEntity {
  projectId: string;
  fileId?: string;
  requestedBy?: string;
  score: number;
  summary?: string;
  issues: AIReviewIssue[];
  positives?: string[];
  nextActions?: string[];
  model?: string;
  reviewId?: string | null;
}

export interface MonitoringRecord extends ApiEntity {
  projectId: string;
  cpu: number;
  ram: number;
  latency: number;
  uptime?: number;
  traffic?: number;
  status?: "healthy" | "warning" | "critical";
  alerts?: Array<{
    type?: string;
    message?: string;
    severity?: "low" | "medium" | "high";
    createdAt?: string;
  }>;
}

export interface NotificationRecord extends ApiEntity {
  userId: string;
  workspaceId?: string;
  projectId?: string;
  type?: "mention" | "ai-alert" | "deployment" | "member" | "system";
  message: string;
  read: boolean;
}

export interface Activity extends ApiEntity {
  workspaceId: string;
  projectId?: string;
  actorId?: string;
  action: string;
  targetType?: string;
  targetPath?: string;
  metadata?: Record<string, unknown>;
}

export interface Deployment extends ApiEntity {
  workspaceId: string;
  projectId: string;
  triggeredBy?: string;
  environment?: "preview" | "staging" | "production";
  provider?: string;
  status?: "queued" | "running" | "success" | "failed" | "cancelled";
  url?: string;
  buildId?: string;
}

export interface DashboardData {
  counts: {
    projects?: number;
    aiReviews?: number;
    deployments?: number;
    monitoring?: number;
    notifications?: number;
    members?: number;
  };
  projects: Project[];
  reviews: AIReview[];
  deployments: Deployment[];
  monitoring: MonitoringRecord[];
  notifications: NotificationRecord[];
  activity: Activity[];
  members: Member[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  user?: UserSummary & {
    firebaseUid?: string;
    onboardingCompleted?: boolean;
    photoURL?: string;
  };
  token?: string;
  onboardingRequired?: boolean;
  error?: string;
  message?: string;
}
