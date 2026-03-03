import { TaskPriority, TaskStatus } from "@/generated/prisma";

export const TASK_STATUSES: Array<{ key: TaskStatus; label: string }> = [
  { key: TaskStatus.INBOX, label: "Inbox" },
  { key: TaskStatus.DOING, label: "Doing" },
  { key: TaskStatus.WAITING, label: "Waiting" },
  { key: TaskStatus.BLOCKED, label: "Blocked" },
  { key: TaskStatus.DONE, label: "Done" },
];

export const TASK_PRIORITIES: Array<{ key: TaskPriority; label: string }> = [
  { key: TaskPriority.P0, label: "P0" },
  { key: TaskPriority.P1, label: "P1" },
  { key: TaskPriority.P2, label: "P2" },
  { key: TaskPriority.P3, label: "P3" },
];
