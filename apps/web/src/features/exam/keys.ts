export const examKeys = {
  all: ["exam"] as const,
  info: () => [...examKeys.all, "info"] as const,
  status: () => [...examKeys.all, "status"] as const,
};
