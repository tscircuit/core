import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SilkscreenPath rendering", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <silkscreenpath
        route={[
          { x: "0mm", y: "0mm" },
          { x: "5mm", y: "5mm" },
          { x: "10mm", y: "0mm" },
        ]}
        strokeWidth="0.2mm"
        layer="top"
      />
    </board>,
  )

  project.render()

  const silkscreenPaths = project.db.pcb_silkscreen_path.list()

  expect(silkscreenPaths.length).toBe(1)
  expect(silkscreenPaths[0].layer).toBe("top")
  expect(silkscreenPaths[0].stroke_width).toBe(0.2)

  expect(silkscreenPaths[0].route).toEqual([
    { x: 0, y: 0 },
    { x: 5, y: 5 },
    { x: 10, y: 0 },
  ])

  expect(silkscreenPaths[0].pcb_silkscreen_path_id).toBeTruthy()

  expect(project).toMatchPcbSnapshot(import.meta.path)
})

test("SilkscreenPath not interpreted as pins in schematic view", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <silkscreenpath
        route={[
          { x: "0mm", y: "0mm" },
          { x: "5mm", y: "5mm" },
          { x: "10mm", y: "0mm" },
        ]}
        strokeWidth="0.2mm"
        layer="top"
      />
    </board>,
  )

  project.render()

  const schematicPins = project.db.schematic_pin.list()

  expect(schematicPins.length).toBe(0)
})

test("SilkscreenPath rendering on different layers", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <silkscreenpath
        route={[
          { x: "0mm", y: "0mm" },
          { x: "5mm", y: "5mm" },
          { x: "10mm", y: "0mm" },
        ]}
        strokeWidth="0.2mm"
        layer="bottom"
      />
    </board>,
  )

  project.render()

  const silkscreenPaths = project.db.pcb_silkscreen_path.list()

  expect(silkscreenPaths.length).toBe(1)
  expect(silkscreenPaths[0].layer).toBe("bottom")
  expect(silkscreenPaths[0].stroke_width).toBe(0.2)

  expect(silkscreenPaths[0].route).toEqual([
    { x: 0, y: 0 },
    { x: 5, y: 5 },
    { x: 10, y: 0 },
  ])

  expect(silkscreenPaths[0].pcb_silkscreen_path_id).toBeTruthy()

  expect(project).toMatchPcbSnapshot(import.meta.path)
})

test("SilkscreenPath rendering with different routes", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <silkscreenpath
        route={[
          { x: "0mm", y: "0mm" },
          { x: "2mm", y: "2mm" },
          { x: "4mm", y: "0mm" },
        ]}
        strokeWidth="0.2mm"
        layer="top"
      />
      <silkscreenpath
        route={[
          { x: "6mm", y: "0mm" },
          { x: "8mm", y: "2mm" },
          { x: "10mm", y: "0mm" },
        ]}
        strokeWidth="0.2mm"
        layer="top"
      />
    </board>,
  )

  project.render()

  const silkscreenPaths = project.db.pcb_silkscreen_path.list()

  expect(silkscreenPaths.length).toBe(2)
  expect(silkscreenPaths[0].route).toEqual([
    { x: 0, y: 0 },
    { x: 2, y: 2 },
    { x: 4, y: 0 },
  ])
  expect(silkscreenPaths[1].route).toEqual([
    { x: 6, y: 0 },
    { x: 8, y: 2 },
    { x: 10, y: 0 },
  ])

  expect(project).toMatchPcbSnapshot(import.meta.path)
})
