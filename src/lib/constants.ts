/**
 * Central task status constants used across frontend and backend.
 */
export const TASK_STATUS = {
  PENDING: 'pending',
  QUEUED: 'queued',
  IN_PROGRESS: 'in_progress',
  WAITING_FOR_INPUT: 'waiting_for_input',
  BLOCKED: 'blocked',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

export const TASK_STATUS_LIST: TaskStatus[] = Object.values(TASK_STATUS);

/**
 * Workspace IDs — each maps to a row in the workspaces table.
 */
export const WORKSPACE_IDS = {
  BLOOMSUITE: 'bloomsuite',
  CLINICLEADER: 'clinicleader',
  PROJECTPATH: 'projectpath',
  DISC: 'disc',
} as const;

export type WorkspaceId = (typeof WORKSPACE_IDS)[keyof typeof WORKSPACE_IDS];

/**
 * Agent-to-workspace mapping.
 * Each agent belongs to exactly one workspace.
 * Executive agent has no workspace (null).
 */
export const AGENT_WORKSPACE: Record<string, string | null> = {
  bloomsuite: 'bloomsuite',
  clinicleader: 'clinicleader',
  projectpath: 'projectpath',
  disc: 'disc',
  discprofile: 'disc',
  inbox: null, // cross-workspace
  executive: null, // cross-workspace
};

export function getWorkspaceForAgent(agentId: string): string | null {
  return AGENT_WORKSPACE[agentId] ?? null;
}
