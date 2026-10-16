import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("female pinheader with an explicit pinrow footprint should render sockets", async () => {
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
  expect(explicitHeader).toMatchObject({
    ftype: "simple_pin_header",
    gender: "female",
  })
  expect(automaticHeader).toMatchObject({
    ftype: "simple_pin_header",
    gender: "female",
  })

  const automaticCad = circuit.db.cad_component.getWhere({
    source_component_id: automaticHeader?.source_component_id,
  })
  expect(automaticCad?.footprinter_string).toContain("_female")

  // Both female headers should render sockets, regardless of footprint source.
  await expect(circuit).toMatchSimple3dSnapshot(import.meta.path, {
    camPos: [8, 28, -20],
    poppygl: { backgroundColor: [255, 255, 255], grid: false },
  })

  const explicitCad = circuit.db.cad_component.getWhere({
    source_component_id: explicitHeader?.source_component_id,
  })
  expect(explicitCad?.footprinter_string).toBe("pinrow4_female")
})
