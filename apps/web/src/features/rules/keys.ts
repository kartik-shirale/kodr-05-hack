export const ruleKeys = {
  all: ["rules"] as const,
  detail: (testId: string) => ["rules", testId] as const,
};
