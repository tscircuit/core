import type { Point } from "circuit-json"

const endpointsMatch = (first: Point, second: Point) =>
  Math.hypot(first.x - second.x, first.y - second.y) <= 1e-6

/** Only closed chains become polygons. Unmatched/open lines remain available
 * to the existing courtyard validator rather than silently losing protection. */
export function stitchCourtyardLineSegments(outlines: Point[][]) {
  const pending = outlines.map((outline, sourceOutlineIndex) => ({
    outline: [...outline],
    sourceOutlineIndexes: [sourceOutlineIndex],
  }))
  const chains = []
  while (pending.length > 0) {
    const chain = pending.shift()!
    while (!endpointsMatch(chain.outline[0]!, chain.outline.at(-1)!)) {
      const chainEnd = chain.outline.at(-1)!
      const nextChainIndex = pending.findIndex(
        (candidate) =>
          endpointsMatch(chainEnd, candidate.outline[0]!) ||
          endpointsMatch(chainEnd, candidate.outline.at(-1)!),
      )
      if (nextChainIndex === -1) break
      const nextChain = pending.splice(nextChainIndex, 1)[0]!
      if (!endpointsMatch(chainEnd, nextChain.outline[0]!))
        nextChain.outline.reverse()
      chain.outline.push(...nextChain.outline.slice(1))
      chain.sourceOutlineIndexes.push(...nextChain.sourceOutlineIndexes)
    }
    const closed =
      chain.outline.length >= 4 &&
      endpointsMatch(chain.outline[0]!, chain.outline.at(-1)!)
    if (closed) chain.outline.pop()
    chains.push({ ...chain, closed })
  }
  return chains
}
