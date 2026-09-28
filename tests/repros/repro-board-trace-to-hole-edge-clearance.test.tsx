import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board requests 0.2mm trace-to-hole edge clearance", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={10}
      height={7}
      minTraceWidth={0.1}
      defaultTraceWidth={0.1}
      minTraceToPadEdgeClearance={0.1}
      minTraceToHoleEdgeClearance={0.2}
      autorouter={{ local: true, groupMode: "subcircuit" }}
      autorouterVersion="beta_pipeline9"
    >
      <testpoint name="LEFT" footprintVariant="pad" pcbX={-3} pcbY={1.15} />
      <testpoint name="RIGHT" footprintVariant="pad" pcbX={3} pcbY={1.15} />
      <hole name="MOUNT" diameter={2} pcbX={0} pcbY={0} />
      <trace from=".LEFT > .pin1" to=".RIGHT > .pin1" />
      <pcbnotetext
        text="Trace to NPTH edge: 0.2 mm minimum"
        pcbY={-2}
        fontSize={0.35}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
