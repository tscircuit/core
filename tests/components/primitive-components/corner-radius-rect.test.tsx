import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SilkscreenRect rendering", () => {
  const { project } = getTestFixture()
  project.add(
    <board width="20mm" height="20mm">
      <silkscreenrect
        pcbX={5}
        pcbY={5}
        width={"2mm"}
        height={"1.5mm"}
        layer="bottom"
        cornerRadius={0.2}
      />
      <pcbnoterect width={"4mm"} height={"3mm"} cornerRadius={0.4} />
      <fabricationnoterect
        width={2}
        height={1}
        pcbX={-5}
        pcbY={-5}
        strokeWidth={0.2}
        isFilled
        color="rgba(255, 255, 255, 0.5)"
        cornerRadius={0.3}
      />
    </board>,
  )
  project.render()

  expect(project).toMatchPcbSnapshot(import.meta.path)
})
