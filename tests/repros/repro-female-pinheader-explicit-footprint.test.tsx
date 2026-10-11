import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing(
  "female pinheader with an explicit pinrow footprint should render sockets",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="30mm" height="20mm" routingDisabled>
        <pinheader
          name="J1"
          pinCount={4}
          gender="female"
          footprint="pinrow4"
          pcbX={-7}
          pcbY={2}
        />
        <pinheader name="J2" pinCount={4} gender="female" pcbX={7} pcbY={2} />
        <silkscreentext
          text="J1: female + pinrow4"
          pcbX={-7}
          pcbY={-4}
          fontSize={0.8}
        />
        <silkscreentext
          text="J2: female + auto"
          pcbX={7}
          pcbY={-4}
          fontSize={0.8}
        />
        <silkscreentext
          text="Both headers should have sockets"
          pcbY={-8}
          fontSize={0.8}
        />
      </board>,
    )

    await circuit.renderUntilSettled()

    const explicitHeader = circuit.db.source_component.getWhere({ name: "J1" })
    const automaticHeader = circuit.db.source_component.getWhere({ name: "J2" })
    expect(explicitHeader?.gender).toBe("female")
    expect(automaticHeader?.gender).toBe("female")

    const automaticCad = circuit.db.cad_component.getWhere({
      source_component_id: automaticHeader?.source_component_id,
    })
    expect(automaticCad?.footprinter_string).toContain("_female")

    // Preserve the current mismatch: J1 has male pins, while J2 has sockets.
    await expect(circuit).toMatchSimple3dSnapshot(import.meta.path, {
      camPos: [8, 28, -20],
      poppygl: { backgroundColor: [255, 255, 255], grid: false },
    })

    const explicitCad = circuit.db.cad_component.getWhere({
      source_component_id: explicitHeader?.source_component_id,
    })
    // Desired behavior: the explicit footprint should also select female CAD.
    expect(explicitCad?.footprinter_string).toContain("_female")
  },
)
