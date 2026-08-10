import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("usb_c connector without a parts engine still exposes canonical ports so traces connect", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <connector name="J1" standard="usb_c" pcbX={0} pcbY={0} />
      <net name="V5" />
      <trace from=".J1 > .VBUS1" to="net.V5" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const connector = circuit.selectOne("connector[name='J1']")!
  const portLabels = connector
    .selectAll("port")
    .flatMap((p: any) => p.getNameAndAliases())

  expect(portLabels).toContain("VBUS1")
  expect(portLabels).toContain("CC1")
  expect(portLabels).toContain("CC2")
  expect(portLabels).toContain("GND1")

  const errors = circuit.db
    .toArray()
    .filter((e: any) => e.type === "source_trace_not_connected_error")
  expect(errors).toHaveLength(0)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
