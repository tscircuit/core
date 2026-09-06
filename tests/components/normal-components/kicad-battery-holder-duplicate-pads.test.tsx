import { expect, test } from "bun:test"
import { readFileSync } from "fs"
import { KicadFootprintToCircuitJsonConverter } from "kicad-to-circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const batteryContent = readFileSync(
  "tests/fixtures/assets/battery-holder-keystone-3002.kicad_mod",
  "utf8",
)

test("kicad battery holder positive pads get routable pcb_ports", async () => {
  // Convert the real KiCad 10 footprint with the production converter
  const conv = new KicadFootprintToCircuitJsonConverter()
  conv.addFile("BatteryHolder_Keystone_3002_1x2032.kicad_mod", batteryContent)
  conv.runUntilFinished()
  const footprintCircuitJson = conv.getOutput()

  const blobUrl =
    URL.createObjectURL(new Blob([batteryContent], { type: "text/plain" })) +
    "#ext=kicad_mod"
  const { circuit } = getTestFixture({
    platform: {
      footprintFileParserMap: {
        kicad_mod: { loadFromUrl: async () => ({ footprintCircuitJson }) },
      },
    },
  })

  try {
    circuit.add(
      <board width="40mm" height="40mm">
        <chip
          name="BT1"
          footprint={blobUrl}
          pinLabels={{ pin1: ["POS"], pin2: ["NEG"] }}
        />
        <trace from=".BT1 > .POS" to=".BT1 > .NEG" />
      </board>,
    )

    await circuit.renderUntilSettled()

    const db = circuit.db
    const sourcePorts = db.source_port.list()
    const pcbPorts = db.pcb_port.list()
    const smtpads = db.pcb_smtpad.list()

    // Every source port gets a routable pcb_port, including the positive
    // terminal whose two physical pads carry duplicated KiCad pad number "1"
    expect(sourcePorts.length).toBe(3)
    expect(pcbPorts.length).toBe(3)
    expect(smtpads.length).toBe(3)

    const posPort = sourcePorts.find((p) => p.name === "POS")
    const internalPosPort = sourcePorts.find((p) =>
      String(p.name).startsWith("pin1_internal"),
    )
    expect(posPort).toBeDefined()
    expect(internalPosPort).toBeDefined()

    // The internally-connected duplicate pad has its own pcb_port so traces
    // to either physical positive terminal can land on copper
    const internalSourcePortId = internalPosPort!.source_port_id
    expect(
      pcbPorts.some((p) => p.source_port_id === internalSourcePortId),
    ).toBe(true)

    // The explicit trace between POS and NEG routes without errors
    const pcbTraces = db.pcb_trace.list()
    expect(pcbTraces.length).toBeGreaterThan(0)
  } finally {
    URL.revokeObjectURL(blobUrl)
  }
})
