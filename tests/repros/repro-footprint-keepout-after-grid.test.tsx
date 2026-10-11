import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * Footprint-local mm, right-handed: +X right, +Y top, +Z above the PCB.
 * pcbY is a point coordinate; width and height are extents.
 */
const antennaClearance = { pcbY: 15.8, width: 43.2, height: 20.4 }

test.failing("footprint keepout follows PCB grid placement", async () => {
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
              <silkscreenrect width={13.2} height={5.4} pcbY={8.3} />
              <pcbnotetext text="ANTENNA" pcbY={8.3} fontSize={1.4} />
              <keepout
                shape="rect"
                {...antennaClearance}
                layers={["top", "bottom"]}
                excludeRefs={[".U1"]}
              />
              <pcbnoterect {...antennaClearance} color="#36e4be" />
            </footprint>
          }
        />
        <pinheader name="J1" pinCount={2} pitch="2.54mm" />
      </group>
      <copperpour name="GND_TOP" connectsTo="net.GND" layer="top" />
      <pcbnotetext
        text="GRID: GREEN SHOULD MATCH HATCHED KEEPOUT"
        pcbY={31}
        fontSize={2}
      />
      <pcbnotetext
        text="BUG: COPPER FILLS ANTENNA AREA"
        pcbY={-30}
        fontSize={2}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)

  // Emitted board-world points in mm (+X right, +Y top, +Z above, right-handed).
  const [expectedClearance] = circuit.db.pcb_note_rect.list()
  const [antennaKeepout] = circuit.db.pcb_keepout.list()
  expect(antennaKeepout).toMatchObject({ center: expectedClearance.center })
})
