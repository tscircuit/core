import { expect, test } from "bun:test"
import { KicadFootprintToCircuitJsonConverter } from "kicad-to-circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const spdtKicad = `(footprint "SW_SPDT_PCM12"
	(version 20240108)
	(generator "pcbnew")
	(layer "F.Cu")
	(pad "1" smd rect (at -2 -1) (size 1.2 1) (layers "F.Cu" "F.Mask"))
	(pad "2" smd rect (at 0 1) (size 1.2 1) (layers "F.Cu" "F.Mask"))
	(pad "3" smd rect (at 2 -1) (size 1.2 1) (layers "F.Cu" "F.Mask"))
)`

function makeAsyncFootprintFixture() {
  const conv = new KicadFootprintToCircuitJsonConverter()
  conv.addFile("sw.kicad_mod", spdtKicad)
  conv.runUntilFinished()
  const footprintCircuitJson = conv.getOutput()

  const blobUrl =
    URL.createObjectURL(new Blob([spdtKicad], { type: "text/plain" })) +
    "#ext=kicad_mod"

  const fixture = getTestFixture({
    platform: {
      footprintFileParserMap: {
        kicad_mod: {
          loadFromUrl: async () => ({ footprintCircuitJson }),
        },
      },
    },
  })

  return { fixture, blobUrl }
}

test("no missing-trace warnings for ports connected by a trace when the footprint loads asynchronously", async () => {
  const { fixture, blobUrl } = makeAsyncFootprintFixture()
  const { circuit } = fixture

  try {
    circuit.add(
      <board width="30mm" height="20mm">
        <switch
          name="SW1"
          type="spdt"
          footprint={blobUrl}
          pinLabels={{ pin1: "COM", pin2: "A", pin3: "B" }}
          noConnect={["B"]}
        />
        <trace from=".SW1 > .COM" to=".SW1 > .A" />
      </board>,
    )

    await circuit.renderUntilSettled()

    // COM and A are connected by an explicit trace and B is marked
    // do_not_connect, so nothing should warn
    const warnings = circuit.db.source_pin_missing_trace_warning.list()
    const warnedNames = warnings.map((w) => {
      const port = circuit.db.source_port.get(w.source_port_id as string)
      return port?.name
    })
    expect(warnedNames).not.toContain("COM")
    expect(warnedNames).not.toContain("A")
    expect(warnedNames).not.toContain("B")
    expect(warnings.length).toBe(0)
  } finally {
    URL.revokeObjectURL(blobUrl)
  }
})

test("legitimate missing-trace warnings are still emitted for unconnected pins after async footprint load", async () => {
  const { fixture, blobUrl } = makeAsyncFootprintFixture()
  const { circuit } = fixture

  try {
    circuit.add(
      <board width="30mm" height="20mm">
        <switch
          name="SW1"
          type="spdt"
          footprint={blobUrl}
          pinLabels={{ pin1: "COM", pin2: "A", pin3: "B" }}
        />
        <trace from=".SW1 > .COM" to=".SW1 > .A" />
        {/* B is intentionally left unconnected and un-marked */}
      </board>,
    )

    await circuit.renderUntilSettled()

    const warnings = circuit.db.source_pin_missing_trace_warning.list()
    const warnedNames = warnings.map((w) => {
      const port = circuit.db.source_port.get(w.source_port_id as string)
      return port?.name
    })
    expect(warnedNames).toContain("B")
    expect(warnedNames).not.toContain("COM")
    expect(warnedNames).not.toContain("A")
  } finally {
    URL.revokeObjectURL(blobUrl)
  }
})
