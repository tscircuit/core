import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fabrication rectangles match footprint paths after orthogonal rotations", async () => {
  const { circuit } = getTestFixture()
  const rotations = [
    { group: 0, chip: 0 },
    { group: 0, chip: 90 },
    { group: 0, chip: 180 },
    { group: 0, chip: 270 },
    { group: 45, chip: 45 },
    { group: -45, chip: -45 },
  ]
  const layers = ["top", "bottom"] as const
  const outline = [
    { x: -1.3, y: 0 },
    { x: 2.7, y: 0 },
    { x: 2.7, y: 1 },
    { x: -1.3, y: 1 },
    { x: -1.3, y: 0 },
  ]

  circuit.add(
    <board width={50} height={22} routingDisabled schematicDisabled>
      {layers.flatMap((layer, row) =>
        rotations.map(({ group, chip }, column) => {
          const pcbX = (column - 2.5) * 8
          const pcbY = row === 0 ? 4 : -4
          return (
            <group
              key={`${layer}-${column}`}
              pcbX={pcbX}
              pcbY={pcbY}
              pcbRotation={group}
            >
              <chip
                name={`U${row * rotations.length + column + 1}`}
                pcbRotation={chip}
                layer={layer}
                footprint={
                  <footprint>
                    <smtpad
                      pcbX={-2.5}
                      width={0.5}
                      height={0.5}
                      shape="rect"
                      portHints={["pin1"]}
                    />
                    <smtpad
                      pcbX={2.5}
                      width={0.5}
                      height={0.5}
                      shape="rect"
                      portHints={["pin2"]}
                    />
                    <fabricationnoterect
                      pcbX={0.7}
                      pcbY={0.5}
                      width="4mm"
                      height="1mm"
                      strokeWidth={0.15}
                      color="blue"
                      cornerRadius={0.1}
                      isStrokeDashed
                    />
                    <fabricationnotepath
                      route={outline}
                      strokeWidth={0.05}
                      color="magenta"
                    />
                  </footprint>
                }
              />
            </group>
          )
        }),
      )}
      {layers.flatMap((layer, row) =>
        rotations.map(({ group, chip }, column) => (
          <Fragment key={`${layer}-${column}`}>
            <pcbnotetext
              pcbX={(column - 2.5) * 8}
              pcbY={row === 0 ? 7.5 : -7.5}
              text={`${layer}: ${group}+${chip} deg`}
              fontSize={0.55}
            />
          </Fragment>
        )),
      )}
      <pcbnotetext
        pcbY={10}
        text="Blue fabrication rect follows magenta outline"
        fontSize={0.7}
      />
    </board>,
  )

  circuit.render()

  const rects = circuit.db.pcb_fabrication_note_rect.list()
  const paths = circuit.db.pcb_fabrication_note_path.list()
  const rectComponents = circuit.selectAll("fabricationnoterect")
  expect(rects).toHaveLength(layers.length * rotations.length)

  for (const [index, rect] of rects.entries()) {
    const path = paths.find(
      (path) => path.pcb_component_id === rect.pcb_component_id,
    )!
    const minX = Math.min(...path.route.map((point) => point.x))
    const maxX = Math.max(...path.route.map((point) => point.x))
    const minY = Math.min(...path.route.map((point) => point.y))
    const maxY = Math.max(...path.route.map((point) => point.y))

    // Expectations come from independently emitted footprint geometry in
    // PCB world mm (+X right, +Y top), including parent rotation and mirroring.
    expect(rect.center.x).toBeCloseTo((minX + maxX) / 2)
    expect(rect.center.y).toBeCloseTo((minY + maxY) / 2)
    expect(rect.width).toBeCloseTo(maxX - minX)
    expect(rect.height).toBeCloseTo(maxY - minY)
    expect(path.layer).toBe(rect.layer)
    expect(rect).toMatchObject({
      stroke_width: 0.15,
      corner_radius: 0.1,
      is_stroke_dashed: true,
      is_filled: false,
      has_stroke: true,
      color: "blue",
    })
    expect(rectComponents[index].getPcbSize()).toEqual({
      width: rect.width,
      height: rect.height,
    })
  }

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
