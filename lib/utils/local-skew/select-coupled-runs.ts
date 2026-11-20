/** Overlaps shorter than this, in mm, are rounding noise at shared corners. */
export const MIN_OVERLAP = 1e-6

/**
 * Corner tolerance when chaining runs in route order, in mm: half
 * {@link MIN_OVERLAP}, so every run is strictly longer than the tolerance
 * and can never precede itself or an earlier-started run.
 */
const CHAIN_TOLERANCE = MIN_OVERLAP / 2

/**
 * A stretch where the two traces of a pair run side by side. Distances are
 * measured along each walk from its first point, in mm.
 */
export type CoupledRun = {
  positiveStart: number
  positiveEnd: number
  negativeStart: number
  negativeEnd: number
}

/** A coupled run before selection, with how far apart its traces are. */
export type CandidateRun = CoupledRun & {
  /** Distance between the traces at the middle of the run, in mm. */
  offset: number
}

/** A stretch of distance along one trace, in mm. */
type Interval = { start: number; end: number }

/**
 * Chooses which candidate runs to keep: the set that couples the most
 * length while using each stretch of either trace at most once and keeping
 * route order on both, the nearer partner on a tie. Whole candidates
 * compete with the pieces left after trimming nearest-first, so a nearer
 * pass that breaks route order (say a trace doubling back) can't knock
 * out the passes that keep it.
 */
export function selectCoupledRuns(candidates: CandidateRun[]): CoupledRun[] {
  const options = candidates.concat(trimNearestFirst(candidates))
  return bestOrderedChain(options).map(({ offset: _offset, ...run }) => run)
}

/** Trims candidates, nearest first, so no stretch of either trace is used twice. */
function trimNearestFirst(candidates: CandidateRun[]): CandidateRun[] {
  const order = [...candidates].sort(
    (a, b) => a.offset - b.offset || a.positiveStart - b.positiveStart,
  )
  const usedPositive: Interval[] = []
  const usedNegative: Interval[] = []
  const pieces: CandidateRun[] = []
  for (const run of order) {
    for (const free of freeParts({ run, usedPositive, usedNegative })) {
      pieces.push(free)
      insertInterval({
        intervals: usedPositive,
        interval: { start: free.positiveStart, end: free.positiveEnd },
      })
      insertInterval({
        intervals: usedNegative,
        interval: { start: free.negativeStart, end: free.negativeEnd },
      })
    }
  }
  return pieces
}

/** The parts of `run` whose positive and negative stretches are both unused. */
function freeParts({
  run,
  usedPositive,
  usedNegative,
}: {
  run: CandidateRun
  usedPositive: Interval[]
  usedNegative: Interval[]
}): CandidateRun[] {
  // Work in positive-trace distance; the negative side maps onto it linearly.
  const negativePerPositive =
    (run.negativeEnd - run.negativeStart) /
    (run.positiveEnd - run.positiveStart)
  const blocked = overlapping({
    intervals: usedPositive,
    interval: { start: run.positiveStart, end: run.positiveEnd },
  })
  for (const used of overlapping({
    intervals: usedNegative,
    interval: { start: run.negativeStart, end: run.negativeEnd },
  })) {
    blocked.push({
      start:
        run.positiveStart +
        (used.start - run.negativeStart) / negativePerPositive,
      end:
        run.positiveStart +
        (used.end - run.negativeStart) / negativePerPositive,
    })
  }
  blocked.sort((a, b) => a.start - b.start)

  const parts: CandidateRun[] = []
  let cursor = run.positiveStart
  for (const cut of blocked) {
    if (cut.start - cursor > MIN_OVERLAP) {
      parts.push(sliceRun({ run, from: cursor, to: cut.start }))
    }
    cursor = Math.max(cursor, cut.end)
  }
  if (run.positiveEnd - cursor > MIN_OVERLAP) {
    parts.push(sliceRun({ run, from: cursor, to: run.positiveEnd }))
  }
  return parts
}

/**
 * The runs, in route order, that never share a stretch of either trace and
 * cover the most positive length, the smallest length-weighted offset on a
 * tie. Runs are swept by positive start; a Fenwick tree over negative end
 * order holds the best chains already ended on the positive trace.
 */
function bestOrderedChain(runs: CandidateRun[]): CandidateRun[] {
  const total: number[] = new Array(runs.length)
  const weightedOffset: number[] = new Array(runs.length)
  const previous: number[] = new Array(runs.length)
  /** True when the chain ending at `a` beats the one ending at `b` (-1 for none). */
  const beats = (a: number, b: number) => {
    if (a < 0) return false
    if (b < 0) return true
    const byLength =
      Math.round(total[a] / MIN_OVERLAP) - Math.round(total[b] / MIN_OVERLAP)
    if (byLength !== 0) return byLength > 0
    return weightedOffset[a] < weightedOffset[b]
  }

  const order = (key: (run: CandidateRun) => number) =>
    runs.map((_, index) => index).sort((a, b) => key(runs[a]) - key(runs[b]))
  const byNegativeEnd = order((run) => run.negativeEnd)
  const negativeEnds = byNegativeEnd.map((index) => runs[index].negativeEnd)
  const rank: number[] = new Array(runs.length)
  byNegativeEnd.forEach((index, position) => {
    rank[index] = position + 1
  })
  const byPositiveEnd = order((run) => run.positiveEnd)
  const tree = new Array<number>(runs.length + 1).fill(-1)

  let ended = 0
  for (const index of order((run) => run.positiveStart)) {
    const run = runs[index]
    // Chains that end before this run on the positive trace become available.
    while (
      ended < byPositiveEnd.length &&
      runs[byPositiveEnd[ended]].positiveEnd <
        run.positiveStart + CHAIN_TOLERANCE
    ) {
      const done = byPositiveEnd[ended++]
      for (let at = rank[done]; at < tree.length; at += at & -at) {
        if (beats(done, tree[at])) tree[at] = done
      }
    }
    // The best of them that also ends before this run on the negative trace.
    let before = -1
    for (
      let at = countLessThan({
        sorted: negativeEnds,
        value: run.negativeStart + CHAIN_TOLERANCE,
      });
      at > 0;
      at -= at & -at
    ) {
      if (beats(tree[at], before)) before = tree[at]
    }
    const length = run.positiveEnd - run.positiveStart
    total[index] = length
    weightedOffset[index] = run.offset * length
    if (before >= 0) {
      total[index] += total[before]
      weightedOffset[index] += weightedOffset[before]
    }
    previous[index] = before
  }

  let best = -1
  runs.forEach((_, index) => {
    if (beats(index, best)) best = index
  })
  const chain: CandidateRun[] = []
  for (let index = best; index >= 0; index = previous[index]) {
    if (chain.length >= runs.length) {
      throw new Error("Coupled run chain contains a cycle")
    }
    chain.push(runs[index])
  }
  return chain.reverse()
}

/** How many values in an ascending list are strictly below `value` (binary search). */
function countLessThan({
  sorted,
  value,
}: {
  sorted: number[]
  value: number
}): number {
  let low = 0
  let high = sorted.length
  while (low < high) {
    const middle = (low + high) >> 1
    if (sorted[middle] < value) {
      low = middle + 1
      continue
    }
    high = middle
  }
  return low
}

/** Intervals in a sorted, non-overlapping list that overlap `interval`. */
function overlapping({
  intervals,
  interval,
}: {
  intervals: Interval[]
  interval: Interval
}): Interval[] {
  const found: Interval[] = []
  for (
    let index = firstEndingAfter({ intervals, position: interval.start });
    index < intervals.length && intervals[index].start < interval.end;
    index++
  ) {
    found.push(intervals[index])
  }
  return found
}

/** Adds an interval to a sorted, non-overlapping list, keeping it sorted. */
function insertInterval({
  intervals,
  interval,
}: {
  intervals: Interval[]
  interval: Interval
}): void {
  // Insert by start: a trimmed piece can begin a rounding error before the
  // end of the interval it follows, and must still sort after it.
  let index = firstEndingAfter({ intervals, position: interval.start })
  while (index < intervals.length && intervals[index].start <= interval.start) {
    index++
  }
  intervals.splice(index, 0, interval)
}

/** Index of the first interval that ends after `position` (binary search). */
function firstEndingAfter({
  intervals,
  position,
}: {
  intervals: Interval[]
  position: number
}): number {
  let low = 0
  let high = intervals.length
  while (low < high) {
    const middle = (low + high) >> 1
    if (intervals[middle].end <= position) {
      low = middle + 1
      continue
    }
    high = middle
  }
  return low
}

/** The part of a run between two positive-trace distances, with skews interpolated. */
function sliceRun({
  run,
  from,
  to,
}: {
  run: CandidateRun
  from: number
  to: number
}): CandidateRun {
  const span = run.positiveEnd - run.positiveStart
  const negativeSpan = run.negativeEnd - run.negativeStart
  const negativeStart =
    run.negativeStart + (negativeSpan * (from - run.positiveStart)) / span
  const negativeEnd =
    run.negativeStart + (negativeSpan * (to - run.positiveStart)) / span
  return {
    positiveStart: from,
    positiveEnd: to,
    negativeStart,
    negativeEnd,
    offset: run.offset,
  }
}
