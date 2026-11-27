import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("CopperText inherits parent rotation, flips onto bottom footprints, and supports multi-layer emission", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="22mm" height="10mm" routingDisabled>
      <group name="G1" pcbX={-6} pcbY={0} pcbRotation={90}>
        <silkscreentext text="5V" pcbY={1.8} fontSize={1.3} />
        <coppertext text="5V" pcbY={-1.8} fontSize={1.3} />
      </group>
      <chip
        name="U1"
        pcbX={2.5}
        pcbY={0}
        pcbRotation={45}
        layer="bottom"
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width={1.6}
              height={0.9}
              portHints={["1"]}
              pcbX={-1.4}
              pcbY={0}
            />
            <smtpad
              shape="rect"
              width={1.6}
              height={0.9}
              portHints={["2"]}
              pcbX={1.4}
              pcbY={0}
            />
            <silkscreentext text="BOT" pcbY={1.8} fontSize={1.2} />
            <coppertext text="BOT" pcbY={-1.8} fontSize={1.2} />
          </footprint>
        }
      />
      <coppertext
        text="DUAL"
        pcbX={8.5}
        pcbY={0}
        fontSize={1.1}
        layers={["top", "bottom"]}
      />
    </board>,
  )

  project.render()

  const copperTexts = project.db.pcb_copper_text.list()
  expect(copperTexts).toHaveLength(4)

  const groupLabel = copperTexts.find((item) => item.text === "5V")
  expect(groupLabel?.layer).toBe("top")
  expect(groupLabel?.ccw_rotation).toBeCloseTo(90, 5)
  expect(groupLabel?.pcb_component_id).toBeUndefined()

  const bottomFootprintLabel = copperTexts.find((item) => item.text === "BOT")
  expect(bottomFootprintLabel?.layer).toBe("bottom")
  expect(bottomFootprintLabel?.ccw_rotation).toBeCloseTo(45, 5)
  expect(bottomFootprintLabel?.pcb_component_id).toBeDefined()

  const dualLayerLabels = copperTexts.filter((item) => item.text === "DUAL")
  expect(dualLayerLabels.map((item) => item.layer).sort()).toEqual([
    "bottom",
    "top",
  ])

  expect(project).toMatchPcbSnapshot(import.meta.path)
})
