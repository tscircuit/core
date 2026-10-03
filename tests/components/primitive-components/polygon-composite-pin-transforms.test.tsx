import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { ICS_43434 } from "tests/fixtures/ics43434-import/C5656610"
import type { SmtPad } from "lib/components/primitive-components/SmtPad"
import { getPcbPrimitiveBoundsBeforeRender } from "lib/components/primitive-components/Port/pcbPrimitiveOverlapBeforeRender"

test("polygon composite pins retain physical PCB ports through rotation and layer flips", async () => {
  const { circuit } = getTestFixture()
  const placements = (["top", "bottom"] as const).flatMap((layer, row) =>
    [0, 90, 180, 270].map((pcbRotation, column) => ({
      name: `MIC_${layer}_${pcbRotation}`,
      layer,
      pcbRotation,
      pcbX: -12 + column * 8,
      pcbY: 5 - row * 10,
    })),
  )
  circuit.add(
    <board width={34} height={22} routingDisabled>
      {placements.map((placement) => (
        <Fragment key={placement.name}>
          <ICS_43434 {...placement} />
          <pcbnotetext
            text={`${placement.layer} ${placement.pcbRotation} degrees: four GND contacts`}
            pcbX={placement.pcbX}
            pcbY={placement.pcbY - 3.5}
            fontSize={0.22}
          />
        </Fragment>
      ))}
    </board>,
  )
  await circuit.renderUntilSettled()

  for (const placement of placements) {
    const microphone = circuit.db.source_component.getWhere({
      name: placement.name,
    })!
    const groundPorts = circuit.db.source_port
      .list({ source_component_id: microphone.source_component_id })
      .filter((port) => port.port_hints?.includes("pin3"))
    const pcbPorts = circuit.db.pcb_port
      .list()
      .filter((pcbPort) =>
        groundPorts.some(
          (port) => port.source_port_id === pcbPort.source_port_id,
        ),
      )
    const internalConnection = circuit.db.source_component_internal_connection
      .list()
      .find(
        (connection) =>
          connection.source_component_id === microphone.source_component_id,
      )
    expect(groundPorts).toHaveLength(4)
    expect(pcbPorts).toHaveLength(4)
    expect(internalConnection?.source_port_ids.toSorted()).toEqual(
      groundPorts.map((port) => port.source_port_id).toSorted(),
    )
  }

  for (const polygonPad of (circuit.selectAll("smtpad") as SmtPad[]).filter(
    (pad) => pad._parsedProps.shape === "polygon",
  )) {
    const beforeRenderBounds = getPcbPrimitiveBoundsBeforeRender(polygonPad)!
    const emittedBounds = polygonPad._getPcbCircuitJsonBounds().bounds
    // Compare with emitted vertices, rather than reimplementing the transform.
    expect(beforeRenderBounds.left).toBeCloseTo(emittedBounds.left, 6)
    expect(beforeRenderBounds.right).toBeCloseTo(emittedBounds.right, 6)
    expect(beforeRenderBounds.top).toBeCloseTo(emittedBounds.top, 6)
    expect(beforeRenderBounds.bottom).toBeCloseTo(emittedBounds.bottom, 6)
  }
  expect(circuit.db.source_ambiguous_port_reference.list()).toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
