import { test, expect } from "bun:test"
import "lib/register-catalogue"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pinrow5", () => {
  const { circuit } = getTestFixture()

  const pinLabelSides = ["top", "bottom", "left", "right"] as const
  const rotationConfigs = [
    { parallel: false, orthogonal: false, rotationSuffix: "" }, // Default rotation (0 deg)
    { parallel: true, orthogonal: false, rotationSuffix: "_pinlabelparallel" }, // 90 deg
    {
      parallel: false,
      orthogonal: true,
      rotationSuffix: "_pinlabelorthogonal",
    }, // 180 deg
    {
      parallel: true,
      orthogonal: true,
      rotationSuffix: "_pinlabelparallel_pinlabelorthogonal",
    }, // 270 deg
  ]
  const jumpers = []

  for (let i = 0; i < pinLabelSides.length; i++) {
    const side = pinLabelSides[i]
    for (let j = 0; j < rotationConfigs.length; j++) {
      const rotConfig = rotationConfigs[j]
      let def = `pinrow3`

      if (!(side === "top" && !rotConfig.parallel && !rotConfig.orthogonal)) {
        def += `_pinlabel${side}`
      }
      def += rotConfig.rotationSuffix
      jumpers.push(
        <jumper
          name={def}
          footprint={def}
          pcbX={j * 20 - 30}
          pcbY={i * 20 - 30}
        />,
      )
    }
  }

  circuit.add(
    <board width="80mm" height="70mm">
      {jumpers}
    </board>,
  )
  circuit.render()
  const soup = circuit.getCircuitJson()
  expect(soup).toMatchPcbSnapshot(import.meta.path)
})
