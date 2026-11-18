import { expect, test } from "bun:test"
import type { Board } from "lib/components/normal-components/Board/Board"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("loading Circuit JSON retains net class definitions, membership and widths", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={14} routingDisabled schematicDisabled>
      <net name="VCC" nominalTraceWidth="0.8mm" />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} />
      <trace from=".R1 > .pin2" to="net.VCC" />
      <trace from=".R2 > .pin1" to="net.VCC" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const saved = JSON.parse(JSON.stringify(circuit.getCircuitJson()))
  const vcc = saved.find(
    (net: { type: string; name: string }) =>
      net.type === "source_net" && net.name === "VCC",
  )
  vcc.source_net_class_ids = ["power_class"]
  saved.push(
    {
      type: "source_net_class",
      source_net_class_id: "power_class",
      name: "Power",
      trace_width: 0.8,
      subcircuit_id: vcc.subcircuit_id,
    },
    {
      type: "source_net_class",
      source_net_class_id: "unused_class",
      name: "Unused",
      trace_width: 0.4,
      subcircuit_id: vcc.subcircuit_id,
    },
  )
  const { circuit: restored } = getTestFixture()
  restored.pcbRoutingDisabled = true
  restored.schematicDisabled = true
  restored.add(
    <board width={24} height={14}>
      <subcircuit name="RESTORED" circuitJson={saved} />
    </board>,
  )
  await restored.renderUntilSettled()
  const reloaded = JSON.parse(JSON.stringify(restored.getCircuitJson()))
  const classNames = reloaded
    .filter(
      (netClass: { type: string }) => netClass.type === "source_net_class",
    )
    .map((netClass: { name: string }) => netClass.name)
    .sort()
  const restoredBoard = restored.firstChild as Board
  restoredBoard.add(
    <pcbnotetext
      pcbY={4}
      text={classNames.join(", ") || "No class definitions restored"}
    />,
  )
  await restored.renderUntilSettled()
  await expect(restored).toMatchPcbSnapshot(import.meta.path)
  expect(classNames).toEqual(["Power", "Unused"])
  const power = reloaded.find(
    (netClass: { type: string; name: string }) =>
      netClass.type === "source_net_class" && netClass.name === "Power",
  )
  expect(
    reloaded.find(
      (net: { type: string; name: string }) =>
        net.type === "source_net" && net.name === "VCC",
    ),
  ).toMatchObject({
    trace_width: 0.8,
    source_net_class_ids: [power.source_net_class_id],
  })
})
