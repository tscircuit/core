import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/** The bus's allowed length difference between its traces, in mm. */
const MAX_LENGTH_SKEW_MM = 0.1

type SubcircuitName = "Normal" | "Isolated"

/** Two lines of text the board writes above one subcircuit. */
type StatusLines = { result: string; reason: string }

/** What the board writes: a headline, then two lines above each subcircuit. */
type BoardText = { headline: string } & Record<SubcircuitName, StatusLines>

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

/** Renders the same skewed bus in a normal and an isolated subcircuit, labelled with `boardText`. */
async function renderBoard({ boardText }: { boardText: BoardText }) {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={20} height={22}>
      <pcbnotetext text={boardText.headline} pcbY={9.6} fontSize={0.6} />
      <pcbnotetext text={boardText.Normal.result} pcbY={7.6} fontSize={0.45} />
      <pcbnotetext text={boardText.Normal.reason} pcbY={6.8} fontSize={0.4} />
      <subcircuit name="Normal" pcbY={3.6}>
        <SkewedBus />
      </subcircuit>
      <pcbnotetext text={boardText.Isolated.result} pcbY={0} fontSize={0.45} />
      <pcbnotetext
        text={boardText.Isolated.reason}
        pcbY={-0.8}
        fontSize={0.4}
      />
      <subcircuit name="Isolated" pcbY={-4} _subcircuitCachingEnabled>
        <SkewedBus />
      </subcircuit>
    </board>,
  )
  await circuit.renderUntilSettled()
  return circuit
}

/** PASS when the subcircuit's bus reports its length skew, FAIL when the skew goes unreported. */
function getStatusLines({
  circuit,
  name,
}: {
  circuit: Awaited<ReturnType<typeof renderBoard>>
  name: SubcircuitName
}): StatusLines {
  const { db } = circuit
  const subcircuit_id = db.source_group.getWhere({ name })?.subcircuit_id
  const lengthSkewError = db.pcb_bus_length_skew_error
    .list()
    .find(
      (error) =>
        db.source_bus.get(error.source_bus_id)?.subcircuit_id === subcircuit_id,
    )
  if (!lengthSkewError) {
    return {
      result: `FAIL: ${name.toLowerCase()} subcircuit`,
      reason: "no error, the bus max length skew was ignored",
    }
  }
  return {
    result: `PASS: ${name.toLowerCase()} subcircuit`,
    reason: `error: ${lengthSkewError.actual_length_skew.toFixed(2)} mm skew is over the ${MAX_LENGTH_SKEW_MM} mm limit`,
  }
}

test("isolated-bus-max-length-skew", async () => {
  const blank = { result: "", reason: "" }
  const firstPass = await renderBoard({
    boardText: { headline: "", Normal: blank, Isolated: blank },
  })
  const Normal = getStatusLines({ circuit: firstPass, name: "Normal" })
  const Isolated = getStatusLines({ circuit: firstPass, name: "Isolated" })
  let headline = "In isolation, bus props are ignored"
  if (Isolated.result.startsWith("PASS")) {
    headline = "In isolation, bus props are kept"
  }
  const circuit = await renderBoard({
    boardText: { headline, Normal, Isolated },
  })

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(Normal.result).toStartWith("PASS")
  expect(Isolated.result).toStartWith("PASS")
})
