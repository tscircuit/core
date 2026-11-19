import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("warns for the removed pour when a separate same-net pour survives", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="10mm" layers={2}>
      <resistor
        name="R1"
        resistance="10k"
        footprint="0603"
        pcbX={-5}
        connections={{ pin1: "net.GND", pin2: "net.GND" }}
      />
      <copperpour
        connectsTo="net.GND"
        layer="top"
        outline={[
          { x: -9, y: -4 },
          { x: -1, y: -4 },
          { x: -1, y: 4 },
          { x: -9, y: 4 },
        ]}
      />
      <copperpour
        connectsTo="net.GND"
        layer="top"
        outline={[
          { x: 1, y: -4 },
          { x: 9, y: -4 },
          { x: 9, y: 4 },
          { x: 1, y: 4 },
        ]}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const json = circuit.getCircuitJson()
  const pours = json.filter((element) => element.type === "pcb_copper_pour")
  const warnings = json.filter(
    (element) => element.type === "pcb_copper_pour_isolated_warning",
  )
  expect(pours).toHaveLength(1)
  expect(warnings).toHaveLength(1)
  expect(warnings[0]).toMatchObject({
    layer: "top",
    source_net_id: pours[0]!.source_net_id,
  })
  expect(warnings[0]!.pcb_copper_pour_id).not.toBe(pours[0]!.pcb_copper_pour_id)
})
