import { describe, expect, it } from "bun:test"
import { createElement } from "react"
import { getTestFixture } from "./get-test-fixture"
import { resolvePoppyglOptions } from "./extend-expect-3d-matcher"

describe("resolvePoppyglOptions", () => {
  it("merges poppygl options with top-level camera overrides", async () => {
    const result = await resolvePoppyglOptions([], {
      poppygl: {
        width: 512,
        height: 256,
        camPos: [1, 2, 3],
      },
      camPos: [4, 5, 6],
      cameraPreset: "bottom_angled",
    })

    expect(result).toEqual({
      width: 512,
      height: 256,
      ambient: 0.2,
      gamma: 2.2,
      camPos: [4, 5, 6],
      cameraPreset: "bottom_angled",
    })
  })

  it("applies defaults when no options are provided", async () => {
    await expect(resolvePoppyglOptions([])).resolves.toEqual({
      width: 1024,
      height: 1024,
      ambient: 0.2,
      gamma: 2.2,
    })
  })

  it("derives a camera position from the bottom_angled preset", async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      createElement(
        "board",
        { width: "10mm", height: "10mm" },
        createElement("resistor", {
          name: "R1",
          resistance: "1k",
          footprint: "0402",
          pcbX: 0,
          pcbY: 0,
        }),
      ),
    )

    await circuit.renderUntilSettled()

    const soup = circuit.getCircuitJson()
    const result = await resolvePoppyglOptions(soup, {
      cameraPreset: "bottom_angled",
    })

    expect(result.camPos).toBeDefined()
    const [x, y, z] = result.camPos!
    expect(y).toBeLessThan(0)

    const { circuit: largerCircuit } = getTestFixture()
    largerCircuit.add(
      createElement(
        "board",
        { width: "40mm", height: "25mm" },
        createElement("resistor", {
          name: "R1",
          resistance: "1k",
          footprint: "0402",
          pcbX: 5,
          pcbY: -3,
        }),
      ),
    )
    await largerCircuit.renderUntilSettled()
    const largerResult = await resolvePoppyglOptions(
      largerCircuit.getCircuitJson(),
      {
        cameraPreset: "bottom_angled",
      },
    )

    const baseRadius = Math.hypot(x, z)
    const largerRadius = Math.hypot(
      largerResult.camPos![0],
      largerResult.camPos![2],
    )
    expect(largerRadius).toBeGreaterThan(baseRadius)
  })
})
