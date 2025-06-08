import { test, expect } from "bun:test"
import "lib/register-catalogue"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Schematic box component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint={"soic8"}
        schPinStyle={{
          pin3: { bottomMargin: 0.1 },
        }}
      />
      <chip name="U2" footprint={"soic8"} schX={2} />
      <chip
        name="U3"
        footprint={"soic8"}
        schY={-2}
        schPinArrangement={{
          topSide: {
            direction: "left-to-right",
            pins: ["pin1", "pin2", "pin3", "pin4"],
          },
          bottomSide: {
            direction: "left-to-right",
            pins: ["pin5", "pin6", "pin7", "pin8"],
          },
        }}
      />
      <schematicbox
        paddingTop={0.2}
        paddingBottom={0.2}
        strokeStyle="dashed"
        title="U1 pins"
        titleFontSize={0.13}
        overlay={[".U1 > .pin1", ".U1 > .pin2", ".U1 > .pin3", ".U1 > .pin4"]}
        schX={0}
        schY={0}
      />
      <schematicbox
        padding={0.3}
        strokeStyle="dashed"
        title="U2+U1 pins"
        titleInside={true}
        titleAnchorPosition={{ x: 0, y: -0.45 }}
        titleFontSize={0.13}
        overlay={[
          ".U2 > .pin1",
          ".U2 > .pin2",
          ".U2 > .pin3",
          ".U2 > .pin4",
          ".U1 > .pin5",
          ".U1 > .pin6",
          ".U1 > .pin7",
          ".U1 > .pin8",
        ]}
        schX={0}
        schY={0}
      />
      <schematicbox
        padding={0.15}
        strokeStyle="dashed"
        title="U3 Bottom pins"
        titleFontSize={0.13}
        titleAnchorPosition={{ x: 0, y: -1.15 }}
        overlay={[".U3 > .pin1", ".U3 > .pin2", ".U3 > .pin3", ".U3 > .pin4"]}
        schX={0}
        schY={0}
      />
      <schematicbox
        paddingRight={0.15}
        paddingLeft={0.15}
        title="U3 Top pins"
        titleFontSize={0.13}
        strokeStyle="dashed"
        overlay={[".U3 > .pin5", ".U3 > .pin6", ".U3 > .pin7", ".U3 > .pin8"]}
        schX={0}
        schY={0}
      />
      <schematicbox
        strokeStyle="dashed"
        title="Fixed size box"
        titleFontSize={0.13}
        titleInside={true}
        width={2}
        height={2}
        schX={3}
        schY={-2}
      />
    </board>,
  )
  circuit.render()
  expect(circuit.getCircuitJson()).toMatchSchematicSnapshot(import.meta.path)
})
