import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("small panel boards keep mouse bites clear of fixed copper and edge text", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel
      layoutMode="grid"
      col={1}
      boardGap="2mm"
      edgePadding="3mm"
      panelizationMethod="tab-routing"
      tabWidth="2mm"
      tabLength="3mm"
    >
      {["TOP", "BOTTOM"].map((name) => (
        <board key={name} width="10.4mm" height="6mm" schematicDisabled>
          <resistor
            name="R1"
            resistance="1k"
            footprint="0402"
            pcbX={-3.5}
            pcbY={1.5}
          />
          <resistor
            name="R2"
            resistance="1k"
            footprint="0402"
            pcbX={3.5}
            pcbY={1.5}
          />
          <trace
            from=".R1 > .pin2"
            to=".R2 > .pin1"
            thickness="0.15mm"
            pcbPath={[
              { x: 0.51, y: 1.05 },
              { x: 6.49, y: 1.05 },
            ]}
          />
          <silkscreentext
            text="VCC"
            pcbX={4}
            pcbY={0.1}
            fontSize={0.8}
            anchorAlignment="center"
          />
          <pcbnotetext text={`${name}: FIXED EDGE TRACE`} fontSize={0.4} />
          <pcbnotetext
            text="EXPECT: 0.5 mm DRILL / 0.8 mm PITCH"
            fontSize={0.32}
            pcbY={-1.4}
          />
          <pcbnotetext
            text="KEEP COPPER + VCC CLEAR"
            fontSize={0.32}
            pcbY={-2.1}
          />
        </board>
      ))}
    </panel>,
  )

  await circuit.renderUntilSettled()
  // Capture the current small-hole geometry without asserting the bug as
  // desired behavior. The fix changes this existing snapshot in the stack.
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
