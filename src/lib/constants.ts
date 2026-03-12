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

export const COMPANY_ID = 'joncoach'; // Single-tenant for now
