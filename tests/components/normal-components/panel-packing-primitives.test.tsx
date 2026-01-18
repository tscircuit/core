import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("panel packing with various primitives", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel layoutMode="grid">
      <board width="10mm" height="10mm" name="B_breakout">
        <resistor name="R1" resistance="1k" footprint="0805" />
        <breakoutpoint connection=".R1 > .pin1" pcbX={-2} pcbY={-2} />
      </board>
      <board width="10mm" height="10mm" name="B_cutout">
        <cutout shape="circle" radius={1} pcbX={0} pcbY={0} />
      </board>
      <board width="10mm" height="10mm" name="B_fiducial">
        <fiducial name="F1" padDiameter="1mm" pcbX={0} pcbY={0} />
      </board>
      <board width="10mm" height="10mm" name="B_hole">
        <hole diameter={1} pcbX={0} pcbY={0} />
      </board>
      <board width="10mm" height="10mm" name="B_platedhole">
        <platedhole
          shape="circle"
          outerDiameter={2}
          holeDiameter={1}
          pcbX={0}
          pcbY={0}
        />
      </board>
      <board width="10mm" height="10mm" name="B_smtpad">
        <smtpad shape="rect" width={2} height={2} pcbX={0} pcbY={0} />
      </board>
      <board width="10mm" height="10mm" name="B_pcbnotedimension">
        <pcbnotedimension from={{ x: -2, y: -2 }} to={{ x: 2, y: 2 }} />
      </board>
      <board width="10mm" height="10mm" name="B_pcbnotepath">
        <pcbnotepath
          route={[
            { x: -2, y: -2 },
            { x: 2, y: 2 },
          ]}
        />
      </board>
      <board width="10mm" height="10mm" name="B_coppertext">
        <coppertext text="Cu" pcbX={0} pcbY={0} fontSize={1.5} />
      </board>
      <board width="10mm" height="10mm" name="B_pcbnoteline">
        <group name="g1 l1">
          <pcbnoteline x1={-2} y1={-2} x2={2} y2={2} />
        </group>
      </board>
      <board width="10mm" height="10mm" name="B_pcbnoterect">
        <group name="g2 l1">
          <pcbnoterect width={4} height={4} />
        </group>
      </board>
      <board width="10mm" height="10mm" name="B_pcbnotetext">
        <group name="g3 l1">
          <group name="g4 l2">
            <pcbnotetext text="Note" />
          </group>
        </group>
      </board>
      <board width="10mm" height="10mm" name="B_fabricationnotetext">
        <fabricationnotetext text="Fab Note" />
      </board>
      <board width="10mm" height="10mm" name="B_fabricationnoterect">
        <fabricationnoterect width={4} height={4} strokeWidth={0.2} />
      </board>
      <board width="10mm" height="10mm" name="B_fabricationnotepath">
        <fabricationnotepath
          route={[
            { x: -2, y: -2 },
            { x: 2, y: 2 },
          ]}
          strokeWidth={0.1}
        />
      </board>
      <board width="10mm" height="10mm" name="B_fabricationnotedimension">
        <fabricationnotedimension from={{ x: -2, y: -2 }} to={{ x: 2, y: 2 }} />
      </board>
    </panel>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showAnchorOffsets: true,
  })
})
