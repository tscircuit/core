import { getSignalIntegrityBlocks } from "./get-signal-integrity-blocks"
import type { Signal } from "lib/components/primitive-components/Signal"
import type { SignalIntegrity } from "lib/components/primitive-components/SignalIntegrity"

/** RFC phase plan, shared by name/order across every block on the board. */
export function getSignalSeed(block: SignalIntegrity, signal: Signal) {
  const { pattern, seed, name } = signal._parsedProps
  if (!/^prbs(7|15|31)$/.test(pattern)) return undefined
  const order = Number(pattern.slice(4))
  const period = 2 ** order - 1
  if (
    seed !== undefined &&
    (!Number.isInteger(seed) || seed < 1 || seed > period)
  )
    throw new Error(
      `Signal "${name}": ${pattern} seed must be an integer in 1..${period}.`,
    )
  const names = [
    ...new Set(
      getSignalIntegrityBlocks(block._getBoard())
        .flatMap((candidate) => candidate.children as Signal[])
        .filter(
          (candidate) =>
            !candidate.shouldBeRemoved &&
            !candidate.parent?.shouldBeRemoved &&
            candidate._parsedProps.pattern === pattern,
        )
        .map((candidate) => candidate._parsedProps.name),
    ),
  ].sort((a, b) => {
    const left = Array.from(a, (char) => char.codePointAt(0)!)
    const right = Array.from(b, (char) => char.codePointAt(0)!)
    for (let i = 0; i < Math.min(left.length, right.length); i++)
      if (left[i] !== right[i]) return left[i] - right[i]
    return left.length - right.length
  })
  if (names.length > period)
    throw new Error(
      `${pattern} supports at most ${period} distinct signal names on a board.`,
    )
  if (seed !== undefined) return seed
  let steps = Math.floor((names.indexOf(name) * period) / names.length)
  const tap = order === 31 ? 28 : order - 1
  const advance = (state: number) =>
    (state * 2 + (((state >>> (order - 1)) ^ (state >>> (tap - 1))) & 1)) %
    (period + 1)
  // Exponentiate the linear PRBS transition so PRBS31 phases take O(n² log P),
  // instead of iterating billions of bits to reach the planned phase.
  const apply = (basis: number[], state: number) => {
    let result = 0
    for (let bit = 0; bit < order; bit++)
      if ((state >>> bit) & 1) result ^= basis[bit]
    return result
  }
  let basis = Array.from({ length: order }, (_, bit) => advance(2 ** bit))
  let state = period
  while (steps > 0) {
    if (steps % 2) state = apply(basis, state)
    basis = basis.map((column) => apply(basis, column))
    steps = Math.floor(steps / 2)
  }
  return state
}
