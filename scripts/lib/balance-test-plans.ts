/** Assign the longest test files first to the shard with the least estimated work. */
export function balanceTestPlans(
  testFiles: string[],
  nodeCount: number,
  durations: Record<string, number>,
) {
  // New files use the median recorded duration until CI timings are refreshed.
  const recordedDurations = Object.values(durations)
    .filter((duration) => Number.isFinite(duration) && duration > 0)
    .sort((a, b) => a - b)
  const defaultDuration =
    recordedDurations[Math.floor(recordedDurations.length / 2)] ?? 100
  const getDuration = (file: string) => {
    const duration = durations[file]
    return Number.isFinite(duration) && duration > 0
      ? duration
      : defaultDuration
  }
  const plans = Array.from({ length: nodeCount }, () => ({
    files: [] as string[],
    durationMs: 0,
  }))

  for (const file of [...testFiles].sort(
    (a, b) => getDuration(b) - getDuration(a) || a.localeCompare(b),
  )) {
    const lightestPlan = plans.reduce((lightest, plan) =>
      plan.durationMs < lightest.durationMs ||
      (plan.durationMs === lightest.durationMs &&
        plan.files.length < lightest.files.length)
        ? plan
        : lightest,
    )
    lightestPlan.files.push(file)
    lightestPlan.durationMs += getDuration(file)
  }

  return plans
}
