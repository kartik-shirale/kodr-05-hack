export const sessionKeys = {
  all: ["sessions"] as const,
  lists: () => [...sessionKeys.all, "list"] as const,
  list: (testId: string, p?: unknown) => [...sessionKeys.lists(), testId, p] as const,
  details: () => [...sessionKeys.all, "detail"] as const,
  detail: (id: string) => ["session", id] as const,
};
