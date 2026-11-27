import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("bottom-authored jumper copper keeps its placement without a group flip", async () => {
  const footprint = (
    <footprint originalLayer="bottom">
      <smtpad
        shape="rect"
        layer="bottom"
        width={1}
        height={0.6}
        pcbX={-1}
        portHints={["1"]}
      />
      <smtpad
        shape="circle"
        layer="bottom"
        radius={0.4}
        pcbX={1}
        portHints={["2"]}
      />
    </footprint>
  )
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={32} height={28} schematicDisabled routingDisabled>
      <group>
        <jumper
          name="JP1"
          pinCount={2}
          footprint={footprint}
          pcbX={-5}
          pcbY={6}
        />
        <solderjumper
          name="JP2"
          pinCount={2}
          footprint={footprint}
          pcbX={5}
          pcbY={6}
        />
      </group>
      <group layer="top">
        <jumper
          name="JP3"
          pinCount={2}
          footprint={footprint}
          pcbX={-5}
          pcbY={2}
        />
        <solderjumper
          name="JP4"
          pinCount={2}
          footprint={footprint}
          pcbX={5}
          pcbY={2}
        />
      </group>
      <group pcbRotation={30}>
        <jumper
          name="JP5"
          pinCount={2}
          footprint={footprint}
          pcbX={-5}
          pcbY={-4}
        />
        <solderjumper
          name="JP6"
          pinCount={2}
          footprint={footprint}
          pcbX={5}
          pcbY={-4}
        />
      </group>
      <jumper
        name="JP7"
        pinCount={2}
        footprint={footprint}
        pcbX={-5}
        pcbY={-10}
      />
      <solderjumper
        name="JP8"
        pinCount={2}
        footprint={footprint}
        pcbX={5}
        pcbY={-10}
      />
      <pcbnotetext
        text="Jumper copper stays bottom with default, top or rotated groups"
        pcbY={11}
        fontSize={0.45}
      />
    </board>,
  )

  circuit.render()

  expect(circuit.db.pcb_smtpad.list().map(({ layer }) => layer)).toEqual(
    Array(16).fill("bottom"),
  )
  await expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
