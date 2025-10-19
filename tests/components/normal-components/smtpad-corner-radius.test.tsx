import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("smtpad cornerRadius sets corner_radius", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width="2mm"
              height="1mm"
              portHints={["pin1"]}
              cornerRadius={0.25}
            />
            <smtpad
              shape="rotated_rect"
              width="2mm"
              height="1mm"
              portHints={["pin2"]}
              cornerRadius={0.25}
              ccwRotation={45}
              pcbX={3}
            />
            <smtpad
              shape="rotated_rect"
              width="2mm"
              height="1mm"
              portHints={["pin3"]}
              cornerRadius={0.25}
              ccwRotation={90}
              pcbX={-3}
            />
            <smtpad
              shape="rotated_rect"
              width="2mm"
              height="1mm"
              portHints={["pin4"]}
              cornerRadius={0.25}
              ccwRotation={45}
              pcbY={-3}
              layer={"bottom"}
            />
          </footprint>
        }
      />
    </board>,
  )

  project.render()
  expect(project).toMatchPcbSnapshot(import.meta.path)
})
