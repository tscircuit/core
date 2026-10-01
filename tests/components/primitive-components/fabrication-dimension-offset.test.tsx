import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("dimension offset directions rotate and reflect without translation", () => {
  const { circuit } = getTestFixture()
  const angles = [0, 90, 180, 270, 30]
  circuit.add(
    <board width={100} height={50}>
      {(["top", "bottom"] as const).flatMap((layer, row) =>
        angles.map((angle, i) => (
          <chip
            key={`U${row}_${i}`}
            name={`U${row}_${i}`}
            pcbX={-40 + i * 20}
            pcbY={row ? -12 : 12}
            pcbRotation={angle}
            layer={layer}
            footprint={
              <footprint>
                <smtpad
                  shape="circle"
                  radius={0.15}
                  pcbX={0}
                  pcbY={-1}
                  portHints={["1"]}
                />
                <fabricationnotedimension
                  from={{ x: 0, y: 0 }}
                  to={{ x: 4, y: 0 }}
                  offset="3mm"
                  offsetDirection={{ x: 0, y: -1 }}
                  text={`${layer} ${angle}`}
                  fontSize={0.7}
                />
              </footprint>
            }
          />
        )),
      )}
      <fabricationnotedimension
        from={{ x: -4, y: 0 }}
        to={{ x: 4, y: 0 }}
        offset={2}
        text="default perpendicular"
        fontSize={0.7}
      />
      <fabricationnotedimension
        from={{ x: 0, y: 0 }}
        to={{ x: 0, y: 0 }}
        offset={0}
        text="zero"
        fontSize={0.7}
      />
    </board>,
  )
  circuit.render()
  const dimensions = circuit.db.pcb_fabrication_note_dimension.list()
  const pads = circuit.db.pcb_smtpad
    .list()
    .filter((pad) => pad.shape === "circle")
  for (const dimension of dimensions.slice(0, 10)) {
    const pad = pads.find(
      (p) => p.pcb_component_id === dimension.pcb_component_id,
    )!
    expect(dimension.offset_distance).toBe(3)
    // The pad is one local mm along the supplied direction, relative to from.
    expect(dimension.offset_direction?.x).toBeCloseTo(
      pad.x - dimension.from.x,
      6,
    )
    expect(dimension.offset_direction?.y).toBeCloseTo(
      pad.y - dimension.from.y,
      6,
    )
    expect(
      Math.hypot(
        dimension.to.x - dimension.from.x,
        dimension.to.y - dimension.from.y,
      ),
    ).toBeCloseTo(4)
  }
  expect(dimensions[10].offset_direction).toEqual({ x: -0, y: 1 })
  expect(dimensions[11].offset_distance).toBe(0)
  expect(dimensions[11].offset_direction).toBeUndefined()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
