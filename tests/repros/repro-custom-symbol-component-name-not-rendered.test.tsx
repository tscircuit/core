import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * When a <chip> has a custom React <symbol> element (e.g. imported from JLCPCB
 * with a drawn inductor coil), the schematic SVG renders the symbol paths but
 * does NOT render the component name (reference designator) text.
 *
 * The renderer skips {REF}/{VAL} text generation when
 * is_box_with_pins === false, which is set for any component with a React
 * <symbol> child.
 *
 * Expected: "L1" text appears in the schematic SVG
 * Actual:   Only the coil arc paths appear — no text at all
 */
test.failing(
  "custom symbol components don't display refdes name in schematic SVG",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="30mm" height="20mm">
        <chip
          name="L1"
          pinLabels={{ pin1: "pin1", pin2: "pin2" }}
          symbol={
            <symbol>
              <port
                name="pin1"
                pinNumber={1}
                direction="left"
                schX={-5.08}
                schY={0}
              />
              <port
                name="pin2"
                pinNumber={2}
                direction="right"
                schX={5.08}
                schY={0}
              />
              <schematicpath svgPath="M -4.288 0.017 A 1.016 0.991 0 1 0 -2.265 0.016" />
              <schematicpath svgPath="M -2.134 0.018 A 1.016 0.991 0 1 0 -0.110 0.017" />
              <schematicpath svgPath="M 0.017 0.018 A 1.016 0.991 0 1 0 2.040 0.017" />
              <schematicpath svgPath="M 2.210 0.018 A 1.016 0.991 0 1 0 4.233 0.016" />
            </symbol>
          }
        />
      </board>,
    )

    await circuit.renderUntilSettled()

    const schematicJson = circuit
      .getCircuitJson()
      .filter((e: any) => e.type === "schematic_component")

    expect(schematicJson).toHaveLength(1)

    // The snapshot should contain "L1" text — currently it doesn't
    await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  },
)
