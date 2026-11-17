import { getPrbsOrder } from "./get-prbs-order"
import { getSignalIntegrityBlocks } from "./get-signal-integrity-blocks"
import { PcbDriverReceiverChannel } from "lib/components/primitive-components/PcbDriverReceiverChannel"
import type { PcbTransientChannelSimulation } from "lib/components/primitive-components/PcbTransientChannelSimulation"

function compareSignalNames(a: string, b: string) {
  const left = Array.from(a, (char) => char.codePointAt(0)!)
  const right = Array.from(b, (char) => char.codePointAt(0)!)
  for (let i = 0; i < Math.min(left.length, right.length); i++)
    if (left[i] !== right[i]) return left[i] - right[i]
  return left.length - right.length
}

function getPrbsTap(order: number) {
  if (order === 31) return 28
  return order - 1
}

function advance(state: number, order: number, tap: number, period: number) {
  return (
    (state * 2 + (((state >>> (order - 1)) ^ (state >>> (tap - 1))) & 1)) %
    (period + 1)
  )
}

function apply(basis: number[], state: number, order: number) {
  let result = 0
  for (let bit = 0; bit < order; bit++)
    if ((state >>> bit) & 1) result ^= basis[bit]
  return result
}

/** RFC phase plan, shared by name/order across every block on the board. */
export function getSignalSeed(
  block: PcbTransientChannelSimulation,
  signal: PcbDriverReceiverChannel,
) {
  const { pattern, seed, name } = signal._parsedProps
  const order = getPrbsOrder(pattern)
  if (!order) return undefined
  const period = 2 ** order - 1
  const names = [
    ...new Set(
      getSignalIntegrityBlocks(block._getBoard())
        .flatMap((candidate) => candidate.children)
        .filter((candidate) => candidate instanceof PcbDriverReceiverChannel)
        .filter(
          (candidate) =>
            !candidate.shouldBeRemoved &&
            !candidate.parent?.shouldBeRemoved &&
            candidate._parsedProps.pattern === pattern,
        )
        .map((candidate) => candidate._parsedProps.name),
    ),
  ].sort(compareSignalNames)
  if (names.length > period)
    throw new Error(
      `${pattern} supports at most ${period} distinct signal names on a board.`,
    )
  if (seed !== undefined) return seed
  let steps = Math.floor((names.indexOf(name) * period) / names.length)
  const tap = getPrbsTap(order)
  // Exponentiate the linear PRBS transition so PRBS31 phases take O(n² log P),
  // instead of iterating billions of bits to reach the planned phase.
  let basis = Array.from({ length: order }, (_, bit) =>
    advance(2 ** bit, order, tap, period),
  )
  let state = period
  while (steps > 0) {
    if (steps % 2) state = apply(basis, state, order)
    basis = basis.map((column) => apply(basis, column, order))
    steps = Math.floor(steps / 2)
  }
  return state
}
