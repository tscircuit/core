import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("nested subcircuit routing ignores a board-owned cutout", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={18} autorouter="auto-local" schematicDisabled>
      <group name="Child" subcircuit width={22} height={16}>
        {[-7, 7].map((pcbX, index) => (
          <chip
            key={pcbX}
            name={`J${index + 1}`}
            pcbX={pcbX}
            pinLabels={{ pin1: ["SIGNAL"] }}
            footprint={
              <footprint>
                <smtpad
                  portHints={["pin1"]}
                  shape="rect"
                  width={1}
                  height={1}
                />
                <silkscreentext text={`J${index + 1}.pin1`} pcbY={1.5} />
              </footprint>
            }
          />
        ))}
        <trace from=".J1 > .pin1" to=".J2 > .pin1" />
      </group>
      <cutout shape="rect" width={4} height={8} />
      <pcbnotetext text="Board-owned slot" pcbY={-5.5} fontSize={0.6} />
      <pcbnotetext
        text="Copper must detour around the opening"
        pcbY={-7}
        fontSize={0.6}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  // Capture the current bug without changing production code: the track
  // crosses the slot even though the cutout exists before child routing.
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbNotes: true,
  })
})
