import { expect } from "bun:test"
import { runAllAssemblyChecks } from "@tscircuit/checks"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "./get-test-fixture"
import {
  RealisticEnclosureDrc,
  type PortConfig,
} from "./realistic-enclosure-drc"
export async function verifyRealisticEnclosureDrc(
  testPath: string,
  ports: PortConfig[],
  expectedNames: string[],
  options: {
    inAssembly?: boolean
    incomplete?: boolean
    camPos?: [number, number, number]
  } = {},
) {
  const { circuit } = getTestFixture({ platform: { drcChecksDisabled: true } })
  circuit.add(
    <RealisticEnclosureDrc
      ports={ports}
      title={`${expectedNames.length ? "COLLISION" : "CLEAR"}: ${ports.map((p) => p.name).join(" / ")}`}
      inAssembly={options.inAssembly}
    />,
  )
  await circuit.renderUntilSettled()
  const json: AnyCircuitElement[] = JSON.parse(
    JSON.stringify(circuit.db.toArray()),
  )
  const diagnostics = await runAllAssemblyChecks(json)
  const sources = new Map(
    json
      .filter((e) => e.type === "source_component")
      .map((e) => [e.source_component_id, e.name]),
  )
  const hitNames = diagnostics
    .filter((e) => e.type === "cad_collision_error")
    .flatMap((e) =>
      e.source_component_ids
        .map((id) => sources.get(id))
        .filter((name) => name !== "CASE"),
    )
    .sort()
  expect(hitNames).toEqual(expectedNames.slice().sort())
  expect(
    diagnostics.filter((e) => e.type === "source_runtime_error").length > 0,
  ).toBe(Boolean(options.incomplete))
  const enclosure = json.find((e) => e.type === "cad_enclosure")!
  expect(enclosure).toMatchObject({
    is_in_assembly: options.inAssembly !== false,
  })
  // The serialized JSON is the complete input: no mesh provider/association options.
  expect(await runAllAssemblyChecks(JSON.parse(JSON.stringify(json)))).toEqual(
    diagnostics,
  )
  await expect(circuit).toMatchSimple3dSnapshot(testPath, {
    camPos:
      options.camPos ??
      (ports[0]?.rotation === 90
        ? [85, 65, 35]
        : ports[0]?.rotation === 180
          ? [-55, 55, -75]
          : ports[0]?.rotation === 270
            ? [-85, 65, 35]
            : [65, 70, 85]),
    poppygl: { lookAt: [0, 0, 4], backgroundColor: [1, 1, 1], grid: false },
  })
  if (ports.length > 1)
    await expect(circuit).toMatchSimple3dSnapshot(testPath, {
      snapshotSuffix: "controls-side",
      camPos: [-65, 70, -85],
      poppygl: { lookAt: [0, 0, 4], backgroundColor: [1, 1, 1], grid: false },
    })
  await expect(circuit).toMatchPcbSnapshot(testPath)
}
