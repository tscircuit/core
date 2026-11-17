import { createHash } from "node:crypto"
import { isDeepStrictEqual } from "node:util"
import type { AnyCircuitElement } from "circuit-json"
import type { AutoroutingStartEvent } from "lib/events"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

export interface NativeH3InputEvidence {
  fixtureSha256: string
  boardTsxSha256: string
  nativePartSha256: string
  initialGeometry: AnyCircuitElement[]
  initialCopper: AnyCircuitElement[]
  initialPhaseInput: SimpleRouteJson
}

export const hashNativeH3Input = (
  value: NativeH3InputEvidence | SimpleRouteJson | AnyCircuitElement[],
) => createHash("sha256").update(JSON.stringify(value)).digest("hex")

/** Compare the actual initial physical/request data in board-world mm
 * (+X right, +Y up). Keep the entire initial SRJ: supplied copper must not be
 * stripped alongside the generated copper that legitimately differs later.
 */
export const compareNativeH3InitialInputs = ({
  baseline,
  consumer,
}: {
  baseline: NativeH3InputEvidence
  consumer: NativeH3InputEvidence
}) => ({
  fixtureMatches: baseline.fixtureSha256 === consumer.fixtureSha256,
  tsxMatches:
    baseline.boardTsxSha256 === consumer.boardTsxSha256 &&
    baseline.nativePartSha256 === consumer.nativePartSha256,
  initialGeometryMatches: isDeepStrictEqual(
    baseline.initialGeometry,
    consumer.initialGeometry,
  ),
  initialCopperMatches: isDeepStrictEqual(baseline.initialCopper, consumer.initialCopper),
  initialPhaseInputMatches: isDeepStrictEqual(
    baseline.initialPhaseInput,
    consumer.initialPhaseInput,
  ),
})

/** Generated traces/obstacles may differ after earlier phases improve. Compare
 * each later phase's declared requests and rules separately; each run's fixed
 * copper preservation is checked against its own accepted earlier output.
 */
export const compareNativeH3PhaseRequests = ({
  baseline,
  consumer,
  initialBaseline,
  initialConsumer,
}: {
  baseline: AutoroutingStartEvent
  consumer: AutoroutingStartEvent
  initialBaseline: SimpleRouteJson
  initialConsumer: SimpleRouteJson
}) => {
  const {
    traces: _baselineGeneratedCopper,
    obstacles: _baselineCurrentObstacles,
    ...baselineIntent
  } = baseline.simpleRouteJson
  const {
    traces: _consumerGeneratedCopper,
    obstacles: _consumerCurrentObstacles,
    ...consumerIntent
  } = consumer.simpleRouteJson
  return (
    baseline.phaseName === consumer.phaseName &&
    isDeepStrictEqual(baselineIntent, consumerIntent) &&
    nativeObstaclesPreserved(initialBaseline, baseline.simpleRouteJson) &&
    nativeObstaclesPreserved(initialConsumer, consumer.simpleRouteJson)
  )
}

/** Generated copper may add obstacle rows and electrical aliases. Match each
 * original native pad/hole/keepout once, retaining every physical/provenance
 * field and every original electrical alias. Geometry cannot be stripped with
 * the earlier phase's generated trace/via obstacles.
 */
const nativeObstaclesPreserved = (
  initial: SimpleRouteJson,
  phase: SimpleRouteJson,
) => {
  const matched = new Set<number>()
  return initial.obstacles.every((original) => {
    const { connectedTo: originalAliases, ...originalGeometry } = original
    const match = phase.obstacles.findIndex((candidate, obstacleIndex) => {
      if (matched.has(obstacleIndex)) return false
      const { connectedTo, ...geometry } = candidate
      return (
        isDeepStrictEqual(originalGeometry, geometry) &&
        originalAliases.every((alias) => connectedTo.includes(alias))
      )
    })
    if (match < 0) return false
    matched.add(match)
    return true
  })
}
