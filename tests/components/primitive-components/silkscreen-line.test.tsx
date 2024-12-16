import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SilkscreenLine rendering", () => {
    const { project } = getTestFixture()
    project.add(
        <board width="10mm" height="10mm">
            <silkscreenline
                x1={0}
                y1={0}
                x2={5}
                y2={5}
                layer="top"
                strokeWidth={0.2}
            />
        </board>,
    )
    project.render()

    const silkscreenLines = project.db.pcb_silkscreen_line.list()

    expect(silkscreenLines.length).toBe(1)
    expect(silkscreenLines[0].layer).toBe("top")
    expect(silkscreenLines[0].x1).toBe(0)
    expect(silkscreenLines[0].y1).toBe(0)
    expect(silkscreenLines[0].x2).toBe(5)
    expect(silkscreenLines[0].y2).toBe(5)
    expect(silkscreenLines[0].stroke_width).toBe(0.2)

    expect(project).toMatchPcbSnapshot(import.meta.path)
}
)

