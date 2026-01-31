import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("multiple copper pours with different outlines", async () => {
  const { circuit } = getTestFixture()

  // Define two separate copper pour outlines on opposite sides of the board
  // Left side pour for GND
  const gndOutline = [
    { x: -5, y: -5 },
    { x: -1, y: -5 },
    { x: -1, y: 5 },
    { x: -5, y: 5 },
    { x: -5, y: -5 },
  ]

  // Right side pour for VCC
  const vccOutline = [
    { x: 1, y: -5 },
    { x: 5, y: -5 },
    { x: 5, y: 5 },
    { x: 1, y: 5 },
    { x: 1, y: -5 },
  ]

  circuit.add(
    <board width="12mm" height="12mm">
      <resistor name="R1" resistance="1k" pcbX={-3} pcbY={0} footprint="0402" />
      <capacitor
        name="C1"
        capacitance="100nF"
        pcbX={3}
        pcbY={0}
        footprint="0402"
      />
      <trace from=".R1 > .pin1" to="net.GND" />
      <trace from=".R1 > .pin2" to="net.VCC" />
      <trace from=".C1 > .pin1" to="net.VCC" />
      <trace from=".C1 > .pin2" to="net.GND" />
      <copperpour connectsTo="net.GND" layer="top" outline={gndOutline} />
      <copperpour connectsTo="net.VCC" layer="top" outline={vccOutline} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const copperPours = circuit.db.pcb_copper_pour.list()
  // Should have at least 2 copper pours (one for each net)
  expect(copperPours.length).toBeGreaterThanOrEqual(2)

  // Verify we have pours for both nets
  const sourceNets = circuit.db.source_net.list()
  const gndNet = sourceNets.find((n) => n.name === "GND")
  const vccNet = sourceNets.find((n) => n.name === "VCC")

  expect(gndNet).toBeDefined()
  expect(vccNet).toBeDefined()

  const gndPours = copperPours.filter(
    (p) => p.source_net_id === gndNet?.source_net_id,
  )
  const vccPours = copperPours.filter(
    (p) => p.source_net_id === vccNet?.source_net_id,
  )

  expect(gndPours.length).toBeGreaterThan(0)
  expect(vccPours.length).toBeGreaterThan(0)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
