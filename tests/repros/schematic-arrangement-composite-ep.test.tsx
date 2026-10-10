import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic pin arrangement leaves a composite exposed pad ambiguous", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={14} height={10} routingDisabled>
      <chip
        name="U1"
        pinLabels={{ pin1: "EP" }}
        schPinArrangement={{ bottomSide: ["EP"] }}
        footprint={
          <footprint>
            {[-1.1, 0, 1.1].flatMap((pcbX) =>
              [-1.1, 0, 1.1].map((pcbY) => (
                <Fragment key={`${pcbX},${pcbY}`}>
                  <smtpad
                    portHints={["pin1"]}
                    pcbX={pcbX}
                    pcbY={pcbY}
                    width={0.7}
                    height={0.7}
                    shape="rect"
                  />
                </Fragment>
              )),
            )}
          </footprint>
        }
      />
      <testpoint name="GND" pcbX={4} schX={3} footprintVariant="pad" />
      <trace from="U1.EP" to="GND.pin1" pcbPath={[]} />
      <pcbnotetext
        text="Nine exposed pads share U1.EP"
        pcbY={3.5}
        fontSize={0.55}
      />
      <pcbnotetext
        text="Requested trace: U1.EP to GND"
        pcbY={2.5}
        fontSize={0.45}
      />
      <pcbnotetext
        text="EP is arranged at the bottom of the schematic"
        pcbY={-3.5}
        fontSize={0.4}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const chip = circuit.db.pcb_component.getWhere({
    source_component_id: circuit.db.source_component.getWhere({ name: "U1" })!
      .source_component_id,
  })!
  const exposedPads = circuit.db.pcb_smtpad
    .list()
    .filter(
      (pad) =>
        pad.port_hints?.includes("pin1") &&
        pad.pcb_component_id === chip.pcb_component_id,
    )
  expect(exposedPads).toHaveLength(9)
  expect(exposedPads.filter((pad) => pad.pcb_port_id)).toHaveLength(0)
  expect(circuit.db.source_ambiguous_port_reference.list()).toHaveLength(1)
  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
