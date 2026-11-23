import { expect, spyOn, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  transformCircuitJsonCadComponents,
  rotateVector,
} from "@tscircuit/flex-utils"

test("CAD is inserted folded after layout while PCB records stay flat", async () => {
  const render = async (bent: boolean) => {
    const { circuit } = getTestFixture()
    circuit.add(
      <board
        pcbX={30}
        pcbY={-10}
        width={40}
        height={20}
        thickness={0.15}
        material="flex"
        schematicDisabled
        routingDisabled
      >
        {bent && (
          <pcbbend
            name="B1"
            x1={0}
            y1={-10}
            x2={0}
            y2={10}
            bendAngle={90}
            bendRadius={2}
            bendSide="right"
          />
        )}
        <chip name="U1" footprint="soic8" pcbX={8} pcbY={3} pcbRotation={37} />
        <resistor name="R1" footprint="0402" resistance="1k" pcbX={-8} />
        <resistor
          name="R2"
          footprint="0402"
          resistance="1k"
          pcbX={9}
          pcbY={-3}
          layer="bottom"
          pcbRotation={71}
          cadModel={{
            glbUrl: "https://example.com/model.glb",
            positionOffset: { x: 0.2, y: 0.3, z: 0.4 },
            rotationOffset: { x: 13, y: 24, z: 35 },
          }}
        />
        <resistor
          name="R3"
          footprint="0402"
          resistance="1k"
          pcbX={8}
          pcbY={-6}
          cadModel={
            <cadmodel
              modelUrl="https://example.com/child.glb"
              positionOffset={{ x: 0.3, y: 0.1, z: 0.2 }}
            />
          }
        />
        <chip
          name="U2"
          pcbX={-8}
          pcbY={5}
          footprint={
            <footprint>
              <smtpad
                portHints={["pin1"]}
                pcbX={0}
                pcbY={0}
                width={1}
                height={1}
                shape="rect"
              />
            </footprint>
          }
        />
      </board>,
    )
    const insert = spyOn(circuit.db.cad_component, "insert")
    try {
      await circuit.renderUntilSettled()
      const cad = circuit.db.cad_component.list()
      expect(cad).toHaveLength(5)
      // Observe the insertion boundary, before getCircuitJson is ever called.
      for (const [record] of insert.mock.calls) {
        expect(record.is_on_folded_board).toBe(bent ? true : undefined)
      }
      expect(
        cad.every(
          (record) => record.is_on_folded_board === (bent ? true : undefined),
        ),
      ).toBe(true)
      const before = JSON.stringify(circuit.db.toArray())
      expect(JSON.stringify(circuit.getCircuitJson())).toBe(before)
      await circuit.renderUntilSettled()
      expect(JSON.stringify(circuit.db.toArray())).toBe(before)
      return circuit.db.toArray()
    } finally {
      insert.mockRestore()
    }
  }
  const flat = await render(false)
  const folded = await render(true)
  expect(folded.filter((e) => e.type === "pcb_component")).toEqual(
    flat.filter((e) => e.type === "pcb_component"),
  )
  expect(
    folded.some((e) => e.type === "cad_component" && e.position.z > 6),
  ).toBe(true)
  const restored = transformCircuitJsonCadComponents(folded, {
    foldPcbs: false,
  })
  for (const element of restored) {
    if (element.type !== "cad_component") continue
    const original = flat.find(
      (e) =>
        e.type === "cad_component" &&
        e.cad_component_id === element.cad_component_id,
    )
    if (original?.type !== "cad_component") throw new Error("Missing flat CAD")
    for (const key of ["x", "y", "z"] as const)
      expect(element.position[key]).toBeCloseTo(original.position[key], 7)
    for (const v of [
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
    ]) {
      const a = rotateVector(v, element.rotation!)
      const b = rotateVector(v, original.rotation!)
      for (const key of ["x", "y", "z"] as const)
        expect(a[key]).toBeCloseTo(b[key], 7)
    }
  }
})
