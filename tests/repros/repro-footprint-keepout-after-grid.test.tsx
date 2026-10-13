import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const footprintLocalClearance = { pcbY: 15.8, width: 43.2, height: 20.4 }

test("footprint keepout follows PCB grid placement", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={100} height={70} routingDisabled schematicDisabled>
      <group pcbGrid pcbGridCols={2} pcbGridGap={10}>
        <chip
          name="U1"
          footprint={
            <footprint>
              <smtpad
                portHints={["pin1"]}
                shape="rect"
                pcbX={-5.9}
                pcbY={4}
                width={0.8}
                height={0.4}
              />
              <silkscreenrect width={13.2} height={16.6} pcbY={2.7} />
              <keepout
                shape="rect"
                {...footprintLocalClearance}
                layers={["top", "bottom"]}
                excludeRefs={[".U1"]}
              />
              <pcbnoterect {...footprintLocalClearance} color="#36e4be" />
            </footprint>
          }
        />
      </group>
      <copperpour name="GND_TOP" connectsTo="net.GND" layer="top" />
      <pcbnotetext
        text="GRID: GREEN SHOULD MATCH HATCHED KEEPOUT"
        pcbY={31}
        fontSize={2}
      />
      <pcbnotetext text="COPPER CLEARS ANTENNA AREA" pcbY={-30} fontSize={2} />
    </board>,
  )
  await circuit.renderUntilSettled()
  const [expectedClearance] = circuit.db.pcb_note_rect.list()
  const [antennaKeepout] = circuit.db.pcb_keepout.list()
  expect(antennaKeepout).toMatchObject({ center: expectedClearance.center })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
