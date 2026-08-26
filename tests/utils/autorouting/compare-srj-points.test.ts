import { expect, test } from "bun:test"
import {
  srjPointsHaveSameBoardPositionAndLayer,
  srjPointsHaveSamePointId,
  srjPointsReferToSameEndpoint,
} from "lib/utils/autorouting/compare-srj-points"

test("SRJ endpoint comparison prefers point identity and otherwise matches position and layer", () => {
  const sharedPointId = {
    x: 0,
    y: 0,
    layer: "top",
    pointId: "shared_endpoint",
  }
  const movedSharedPointId = {
    x: 4,
    y: 3,
    layer: "bottom",
    pointId: "shared_endpoint",
  }
  const samePositionAndLayer = { x: 0, y: 0, layer: "top" }
  const samePositionDifferentLayer = { x: 0, y: 0, layer: "bottom" }

  expect(srjPointsHaveSamePointId(sharedPointId, movedSharedPointId)).toBe(true)
  expect(
    srjPointsHaveSameBoardPositionAndLayer(sharedPointId, samePositionAndLayer),
  ).toBe(true)
  expect(
    srjPointsHaveSameBoardPositionAndLayer(
      sharedPointId,
      samePositionDifferentLayer,
    ),
  ).toBe(false)
  expect(srjPointsReferToSameEndpoint(sharedPointId, movedSharedPointId)).toBe(
    true,
  )
  expect(
    srjPointsReferToSameEndpoint(sharedPointId, samePositionAndLayer),
  ).toBe(true)
  expect(
    srjPointsReferToSameEndpoint(sharedPointId, samePositionDifferentLayer),
  ).toBe(false)
})
