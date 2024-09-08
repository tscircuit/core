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
          { x: "10mm", y: "0mm" }
        ]}
        strokeWidth="0.2mm"
        layer="top"
      />
    </board>
  )

  project.render()

  const silkscreenPaths = project.db.pcb_silkscreen_path.list()

  console.log(JSON.stringify(silkscreenPaths[0], null, 2));

  expect(silkscreenPaths.length).toBe(1)
  expect(silkscreenPaths[0].layer).toBe("top")
  expect(silkscreenPaths[0].stroke_width).toBe(0.2)
  
  expect(silkscreenPaths[0].route).toEqual([
    { x: 0, y: 0 },
    { x: 5, y: 5 },
    { x: 10, y: 0 }
  ])

  expect(silkscreenPaths[0].pcb_silkscreen_path_id).toBeTruthy()

  Bun.write("silkscreenpath_test.json", JSON.stringify(silkscreenPaths, null, 2))
  expect(project).toMatchPcbSnapshot(import.meta.path)
})