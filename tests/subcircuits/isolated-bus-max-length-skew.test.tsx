import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/** The bus's allowed length difference between its traces, in mm. */
const MAX_LENGTH_SKEW_MM = 0.1

type SubcircuitName = "Normal" | "Isolated"

/** What the board writes above each subcircuit. */
type StatusLines = Record<SubcircuitName, string>

/** A bus of a 4 mm trace (A) and a 12 mm trace (B): 8 mm of length skew. */
function SkewedBus() {
  return (
    <>
      <resistor
        name="R1"
        resistance="100"
        footprint="0603"
        pcbX={-6}
        pcbY={0.8}
      />
      <resistor
        name="R2"
        resistance="100"
        footprint="0603"
        pcbX={-2}
        pcbY={0.8}
      />
      <resistor
        name="R3"
        resistance="100"
        footprint="0603"
        pcbX={-6}
        pcbY={-0.8}
      />
      <resistor
        name="R4"
        resistance="100"
        footprint="0603"
        pcbX={6}
        pcbY={-0.8}
      />
      <trace name="A" from=".R1 > .pin2" to=".R2 > .pin1" pcbStraightLine />
      <trace name="B" from=".R3 > .pin2" to=".R4 > .pin1" pcbStraightLine />
      <bus
        name="BUS"
        connections={["A", "B"]}
        maxLengthSkew={MAX_LENGTH_SKEW_MM}
      />
    </>
  )
}

/** Renders the same skewed bus in a normal and an isolated subcircuit, labelled with `statusLines`. */
async function renderBoard({ statusLines }: { statusLines: StatusLines }) {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={20} height={17}>
      <pcbnotetext
        text="<bus maxLengthSkew> must be checked whether or not its subcircuit renders in isolation"
        pcbY={7.4}
        fontSize={0.36}
      />
      <pcbnotetext text={statusLines.Normal} pcbY={5.7} fontSize={0.4} />
      <subcircuit name="Normal" pcbY={3}>
        <SkewedBus />
      </subcircuit>
      <pcbnotetext text={statusLines.Isolated} pcbY={0.1} fontSize={0.4} />
      <subcircuit name="Isolated" pcbY={-3} _subcircuitCachingEnabled>
        <SkewedBus />
      </subcircuit>
    </board>,
  )
  await circuit.renderUntilSettled()
  return circuit
}

/** PASS when the subcircuit's bus reports its length skew, FAIL when the skew goes unreported. */
function getStatusLine({
  circuit,
  name,
}: {
  circuit: Awaited<ReturnType<typeof renderBoard>>
  name: SubcircuitName
}): string {
  const { db } = circuit
  const subcircuit_id = db.source_group.getWhere({ name })?.subcircuit_id
  const lengthSkewError = db.pcb_bus_length_skew_error
    .list()
    .find(
      (error) =>
        db.source_bus.get(error.source_bus_id)?.subcircuit_id === subcircuit_id,
    )
  if (!lengthSkewError) {
    return `FAIL: ${name} - no length skew error, maxLengthSkew was dropped`
  }
  return `PASS: ${name} - ${lengthSkewError.actual_length_skew.toFixed(2)} mm skew exceeds ${MAX_LENGTH_SKEW_MM} mm`
}

test.failing("isolated-bus-max-length-skew", async () => {
  const firstPass = await renderBoard({
    statusLines: { Normal: "", Isolated: "" },
  })
  const statusLines: StatusLines = {
    Normal: getStatusLine({ circuit: firstPass, name: "Normal" }),
    Isolated: getStatusLine({ circuit: firstPass, name: "Isolated" }),
  }
  const circuit = await renderBoard({ statusLines })

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(statusLines.Normal).toStartWith("PASS")
  expect(statusLines.Isolated).toStartWith("PASS")
})
