export const participantKeys = {
  all: ["participants"] as const,
  lists: () => [...participantKeys.all, "list"] as const,
  list: (testId: string, p?: unknown) => [...participantKeys.lists(), testId, p] as const,
};
