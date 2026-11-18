import { expect, spyOn, test } from "bun:test"
import type { Board } from "lib/components/normal-components/Board/Board"
import { Group_getRoutingPhasePlans } from "lib/components/primitive-components/Group/Group_getRoutingPhasePlans"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const bitIndexes = Array.from({ length: 16 }, (_, bit) => bit)
const pinLabels = Object.fromEntries(
  bitIndexes.map((bit) => [`pin${bit + 1}`, `DQ${bit}`]),
)

test("phase planning resolves shared bus selectors and pin aliases", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={48} height={29} autorouter="local" schematicDisabled>
      <pcbnotetext
        text="16-bit memory bus: two routing phases"
        pcbY={12}
        fontSize={1}
      />
      {["U1", "U2"].map((name, index) => (
        <chip
          name={name}
          pinLabels={pinLabels}
          pcbX={index === 0 ? -12 : 12}
          footprint={
            <footprint>
              {bitIndexes.map((bit) => (
                <smtpad
                  portHints={[`pin${bit + 1}`]}
                  pcbX={index === 0 ? 2 : -2}
                  pcbY={7.5 - bit}
                  width={1}
                  height={0.5}
                  shape="rect"
                />
              ))}
            </footprint>
          }
        />
      ))}
      {bitIndexes.map((bit) => (
        <trace
          name={`D${bit}`}
          from={`.U1 > .pin${bit + 1}`}
          to={`.U2 > .pin${bit + 1}`}
        />
      ))}
      {[0, 1].map((byte) => (
        <group>
          <bus
            name={`BYTE${byte}`}
            connections={bitIndexes
              .slice(byte * 8, byte * 8 + 8)
              .map((bit) => `D${bit}`)}
            routingPhaseIndex={byte}
          />
          <autoroutingphase
            name={`BYTE${byte}`}
            phaseIndex={byte}
            connections={bitIndexes
              .slice(byte * 8, byte * 8 + 8)
              .map((bit) => `.U1 > .DQ${bit}`)}
          />
        </group>
      ))}
      <pcbnotetext
        text="Phase 0: DQ0-7   |   Phase 1: DQ8-15"
        pcbY={-10}
        fontSize={0.8}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const board = circuit.firstChild as Board
  const selectOne = spyOn(board, "selectOne")
  let selectorSearches: number
  try {
    const plans = Group_getRoutingPhasePlans(board)
    selectorSearches = selectOne.mock.calls.length
    expect(selectorSearches).toBeLessThanOrEqual(bitIndexes.length * 6)
    selectOne.mockClear()
    Group_getRoutingPhasePlans(board)
    expect(selectOne.mock.calls.length).toBe(selectorSearches)
    expect(plans.map((plan) => plan.traces.map((trace) => trace.name))).toEqual(
      [
        bitIndexes.slice(0, 8).map((bit) => `D${bit}`),
        bitIndexes.slice(8).map((bit) => `D${bit}`),
      ],
    )
  } finally {
    selectOne.mockRestore()
  }
  board.add(
    <pcbnotetext
      text={`Phase planning: ${selectorSearches} selector searches`}
      pcbY={-12}
      fontSize={0.85}
    />,
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showDebugObjects: false,
  })
})
