import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const C62857 = () => (
  <capacitor
    name="C1"
    capacitance="100nF"
    supplierPartNumbers={{ jlcpcb: ["C62857"] }}
    manufacturerPartNumber="6124B104K500NT"
    symbol={
      <symbol>
        <schematicpath
          points={[
            { x: 0.3, y: -0.64 },
            { x: -0.3, y: -0.64 },
            { x: -0.3, y: 0.66 },
            { x: 0.3, y: 0.66 },
            { x: 0.3, y: -0.64 },
          ]}
          strokeColor="#880000"
        />
        <schematicpath
          points={[
            { x: -0.04, y: 0.56 },
            { x: -0.04, y: 0.36 },
          ]}
          strokeColor="#880000"
        />
        <schematicpath
          points={[
            { x: 0.02, y: 0.56 },
            { x: 0.02, y: 0.36 },
          ]}
          strokeColor="#880000"
        />
        <schematicpath
          points={[
            { x: -0.3, y: 0.46 },
            { x: -0.04, y: 0.46 },
          ]}
          strokeColor="#880000"
        />
        <schematicpath
          points={[
            { x: 0.02, y: 0.46 },
            { x: 0.3, y: 0.46 },
          ]}
          strokeColor="#880000"
        />
        <schematicpath
          points={[
            { x: -0.04, y: 0.26 },
            { x: -0.04, y: 0.06 },
          ]}
          strokeColor="#880000"
        />
        <schematicpath
          points={[
            { x: 0.02, y: 0.26 },
            { x: 0.02, y: 0.06 },
          ]}
          strokeColor="#880000"
        />
        <schematicpath
          points={[
            { x: -0.3, y: 0.16 },
            { x: -0.04, y: 0.16 },
          ]}
          strokeColor="#880000"
        />
        <schematicpath
          points={[
            { x: 0.02, y: 0.16 },
            { x: 0.3, y: 0.16 },
          ]}
          strokeColor="#880000"
        />
        <schematicpath
          points={[
            { x: -0.04, y: -0.04 },
            { x: -0.04, y: -0.24 },
          ]}
          strokeColor="#880000"
        />
        <schematicpath
          points={[
            { x: 0.02, y: -0.04 },
            { x: 0.02, y: -0.24 },
          ]}
          strokeColor="#880000"
        />
        <schematicpath
          points={[
            { x: -0.3, y: -0.14 },
            { x: -0.04, y: -0.14 },
          ]}
          strokeColor="#880000"
        />
        <schematicpath
          points={[
            { x: 0.02, y: -0.14 },
            { x: 0.3, y: -0.14 },
          ]}
          strokeColor="#880000"
        />
        <schematicpath
          points={[
            { x: -0.04, y: -0.34 },
            { x: -0.04, y: -0.54 },
          ]}
          strokeColor="#880000"
        />
        <schematicpath
          points={[
            { x: 0.02, y: -0.34 },
            { x: 0.02, y: -0.54 },
          ]}
          strokeColor="#880000"
        />
        <schematicpath
          points={[
            { x: -0.3, y: -0.44 },
            { x: -0.04, y: -0.44 },
          ]}
          strokeColor="#880000"
        />
        <schematicpath
          points={[
            { x: 0.02, y: -0.44 },
            { x: 0.3, y: -0.44 },
          ]}
          strokeColor="#880000"
        />
      </symbol>
    }
    footprint={
      <footprint>
        <smtpad
          portHints={["pin1"]}
          pcbX="-1.35001mm"
          pcbY="-0.770001mm"
          width="0.7500112mm"
          height="0.7999984mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin8"]}
          pcbX="-1.35001mm"
          pcbY="0.770001mm"
          width="0.7500112mm"
          height="0.7999984mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin2"]}
          pcbX="-0.40005mm"
          pcbY="-0.770001mm"
          width="0.580009mm"
          height="0.7999984mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin7"]}
          pcbX="-0.40005mm"
          pcbY="0.770001mm"
          width="0.580009mm"
          height="0.7999984mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin3"]}
          pcbX="0.40005mm"
          pcbY="-0.770001mm"
          width="0.580009mm"
          height="0.7999984mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin6"]}
          pcbX="0.40005mm"
          pcbY="0.770001mm"
          width="0.580009mm"
          height="0.7999984mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin4"]}
          pcbX="1.35001mm"
          pcbY="-0.770001mm"
          width="0.7500112mm"
          height="0.7999984mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin5"]}
          pcbX="1.35001mm"
          pcbY="0.770001mm"
          width="0.7500112mm"
          height="0.7999984mm"
          shape="rect"
        />
      </footprint>
    }
  />
)

test("C62857 capacitor array renders all footprint pins on its custom symbol", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <C62857 />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const sourcePinNumbers = circuitJson
    .filter((element) => element.type === "source_port")
    .map((port) => port.pin_number)
    .sort((a, b) => (a ?? 0) - (b ?? 0))
  const schematicPinNumbers = circuitJson
    .filter((element) => element.type === "schematic_port")
    .map((port) => port.pin_number)
    .sort((a, b) => (a ?? 0) - (b ?? 0))
  const schematicPorts = circuitJson
    .filter((element) => element.type === "schematic_port")
    .sort((a, b) => (a.pin_number ?? 0) - (b.pin_number ?? 0))

  expect(sourcePinNumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  expect(schematicPinNumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  expect(
    schematicPorts.map((port) => ({
      x: port.center.x,
      y: port.center.y,
      facingDirection: port.facing_direction,
      stemLength: port.distance_from_component_edge,
    })),
  ).toEqual([
    { x: -0.7, y: 0.46, facingDirection: "left", stemLength: 0.4 },
    { x: -0.7, y: 0.16, facingDirection: "left", stemLength: 0.4 },
    { x: -0.7, y: -0.14, facingDirection: "left", stemLength: 0.4 },
    { x: -0.7, y: -0.44, facingDirection: "left", stemLength: 0.4 },
    { x: 0.7, y: -0.44, facingDirection: "right", stemLength: 0.4 },
    { x: 0.7, y: -0.14, facingDirection: "right", stemLength: 0.4 },
    { x: 0.7, y: 0.16, facingDirection: "right", stemLength: 0.4 },
    { x: 0.7, y: 0.46, facingDirection: "right", stemLength: 0.4 },
  ])
  expect(
    circuitJson.filter((element) => element.type === "schematic_line"),
  ).toHaveLength(8)
  expect(
    schematicPorts.every((port) => port.display_pin_label === undefined),
  ).toBeTrue()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    drawPorts: true,
    css: ".sch-port-label { display: none; }",
  })
})
