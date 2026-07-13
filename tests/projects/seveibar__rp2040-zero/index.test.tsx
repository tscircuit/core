import { test, expect } from "bun:test"
import { getBoundFromCenteredRect } from "@tscircuit/math-utils"
import { getTestFixture } from "../../fixtures/get-test-fixture.ts"
import Project from "./index"

test("seveibar__rp2040-zero matches snapshots", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<Project />)
  circuit.render()

  const u2SourceComponent = circuit.db.source_component.getWhere({ name: "U2" })
  const u2SchematicComponent = circuit.db.schematic_component.getWhere({
    source_component_id: u2SourceComponent!.source_component_id,
  })!
  const u2Bounds = getBoundFromCenteredRect({
    center: u2SchematicComponent.center,
    width: u2SchematicComponent.size.width,
    height: u2SchematicComponent.size.height,
  })

  const decouplingCapNames = new Set(["C6", "C1", "C2"])
  const decouplingRailTraces = circuit.db.schematic_trace
    .list()
    .filter((trace) => {
      if (!trace.source_trace_id) return false
      const endpointComponentNames = trace.source_trace_id
        .split("-")
        .map((portRef) => portRef.split(".")[0])
      return (
        endpointComponentNames.length === 2 &&
        endpointComponentNames.every((name) => decouplingCapNames.has(name))
      )
    })
  const railEdgesIntersectingU2 = decouplingRailTraces.flatMap((trace) =>
    trace.edges.filter((edge) => {
      const minX = Math.min(edge.from.x, edge.to.x)
      const maxX = Math.max(edge.from.x, edge.to.x)
      const minY = Math.min(edge.from.y, edge.to.y)
      const maxY = Math.max(edge.from.y, edge.to.y)
      return (
        maxX >= u2Bounds.minX &&
        minX <= u2Bounds.maxX &&
        maxY >= u2Bounds.minY &&
        minY <= u2Bounds.maxY
      )
    }),
  )

  expect(decouplingRailTraces.length).toBeGreaterThan(0)
  expect(railEdgesIntersectingU2).toHaveLength(0)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 200_000)
