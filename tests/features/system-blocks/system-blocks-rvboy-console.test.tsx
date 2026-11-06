import { expect, test } from "bun:test"
import { convertCircuitJsonToSystemSvg } from "circuit-to-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { assertSystemWireSeparation } from "./assert-system-wire-separation"
import { assertSystemGeometry } from "./assert-system-geometry"
import { SystemOverview } from "./fixtures/rvboy-system-overview"

test("RVBoy console: dense interfaces retain obstacle-free routes and readable labels", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.schematicDisabled = true
  circuit.add(
    <board>
      <SystemOverview />
    </board>,
  )
  circuit.render()
  const json = circuit.getCircuitJson()
  assertSystemGeometry(json)
  const page = circuit.db.system_block_page
    .list()
    .find((p) => p.name === "console")!
  const connections = circuit.db.system_block_connection
    .list()
    .filter((c) => c.system_block_page_id === page.system_block_page_id)
  expect(connections).toHaveLength(10)
  assertSystemWireSeparation(connections)
  expect(connections.find((c) => c.label === "FT6236 / I2C0")).toMatchObject({
    color: "#16856b",
    direction: "both",
    is_signal: true,
    is_power: false,
  })
  expect(
    connections.find((c) => c.label === "UART2 or CPU SWD / recovery"),
  ).toMatchObject({ color: "#64748b", line_style: "dotted" })
  const cpu = circuit.db.system_block_component
    .list()
    .find((c) => c.name === "soc")!
  const landing = (label: string) => {
    const connection = connections.find((c) => c.label === label)!
    return connection.from_system_block_component_id ===
      cpu.system_block_component_id
      ? connection.route[0]
      : connection.route.at(-1)!
  }
  // The three wires turn right above the CPU. Their top-face order must be
  // USB, audio, debug so that the shorter turns do not cross the taller runs.
  for (const label of [
    "USB 2.0",
    "Codec LINEOUT",
    "UART2 or CPU SWD / recovery",
  ]) {
    expect(landing(label).y).toBeCloseTo(cpu.center.y + cpu.height / 2, 6)
  }
  expect(landing("USB 2.0").x).toBeLessThan(landing("Codec LINEOUT").x)
  expect(landing("Codec LINEOUT").x).toBeLessThan(
    landing("UART2 or CPU SWD / recovery").x,
  )
  await expect(
    convertCircuitJsonToSystemSvg(json, {
      systemBlockPageId: page.system_block_page_id,
      width: 1400,
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
