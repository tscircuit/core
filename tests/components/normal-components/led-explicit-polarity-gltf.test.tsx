import { expect, test } from "bun:test"
import { convertCircuitJsonToGltf } from "circuit-json-to-gltf"
import gltfPkg from "circuit-json-to-gltf/package.json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const parseSemver = (version: string) =>
  version
    .replace(/^[^0-9]*/, "")
    .split(".")
    .map((part) => Number.parseInt(part, 10))

test("LED and diode with explicit pinLabels polarity retain their 3D glTF models (#5567)", async () => {
  const [major = 0, minor = 0, patch = 0] = parseSemver(gltfPkg.version)
  expect(
    major > 0 || minor > 0 || patch >= 165,
    `expected circuit-json-to-gltf >= 0.0.165, got ${gltfPkg.version}`,
  ).toBe(true)

  const { circuit } = getTestFixture()
  circuit.add(
    <board width="12mm" height="8mm" routingDisabled>
      <led
        name="D1"
        color="red"
        footprint="0603"
        pcbX={-2}
        pinLabels={{ pin1: "cathode", pin2: "anode" }}
      />
      <diode
        name="D2"
        footprint="0603"
        pcbX={2}
        pinLabels={{ pin1: "cathode", pin2: "anode" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()

  const cadComponents = circuit.db.cad_component.list()
  expect(cadComponents.map((c) => c.footprinter_string)).toEqual([
    "diode0603_anodepin2_cathodepin1_color(red)",
    "diode0603_anodepin2_cathodepin1",
  ])

  const warnings: string[] = []
  const originalWarn = console.warn
  console.warn = (...args: unknown[]) => {
    warnings.push(args.map(String).join(" "))
  }

  let gltf: {
    nodes?: Array<{ name?: string }>
    meshes?: unknown[]
  }
  try {
    gltf = (await convertCircuitJsonToGltf(circuitJson, {
      format: "gltf",
    })) as typeof gltf
  } finally {
    console.warn = originalWarn
  }

  expect(
    warnings.filter((msg) =>
      /Failed to generate footprinter model|Diode anode pin must be 1 or 2/i.test(
        msg,
      ),
    ),
  ).toEqual([])

  const nodeNames = (gltf.nodes ?? []).map((node) => node.name)
  expect(nodeNames).toContain("D1")
  expect(nodeNames).toContain("D2")
  expect((gltf.meshes ?? []).length).toBeGreaterThanOrEqual(3)
})
