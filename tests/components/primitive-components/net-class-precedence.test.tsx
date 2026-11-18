import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("class precedence is deterministic and explicit net widths take precedence", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={20} height={12} routingDisabled>
      <net name="VCC" />
      <net name="SENSE" nominalTraceWidth="0.3mm" />
      <netclass
        name="Default"
        priority={0}
        traceWidth="0.1mm"
        nets={["net.VCC", "net.SENSE"]}
      />
      <netclass
        name="B"
        priority={1}
        traceWidth="0.5mm"
        nets={["net.VCC", "net.SENSE"]}
      />
      <netclass name="Inherited" priority={0} nets={["net.VCC", "net.SENSE"]} />
      <netclass
        name="A"
        priority={1}
        traceWidth="0.8mm"
        nets={["net.VCC", "net.SENSE"]}
      />
      <pcbnotetext text="VCC: A 0.8 mm; SENSE: explicit 0.3 mm" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const vcc = circuit.db.source_net.list().find((net) => net.name === "VCC")!
  const sense = circuit.db.source_net
    .list()
    .find((net) => net.name === "SENSE")!
  expect(vcc.trace_width).toBe(0.8)
  expect(sense.trace_width).toBe(0.3)
  expect(
    vcc.source_net_class_ids?.map(
      (id) => circuit.db.source_net_class.get(id)!.name,
    ),
  ).toEqual(["Inherited", "A", "B", "Default"])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
