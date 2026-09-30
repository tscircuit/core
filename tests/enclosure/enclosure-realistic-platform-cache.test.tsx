import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { RealisticEnclosureDrc } from "tests/fixtures/realistic-enclosure-drc"

test("Core supplies its platform cache to automatic assembly DRC", async () => {
  const stored = new Map<string, string>()
  let writes = 0,
    hits = 0
  const platform = {
    localCacheEngine: {
      async getItem(key: string) {
        if (stored.has(key)) hits++
        return stored.get(key) ?? null
      },
      async setItem(key: string, value: string) {
        writes++
        stored.set(key, value)
      },
    },
  }
  const render = async () => {
    const { circuit } = getTestFixture({ platform })
    circuit.add(
      <RealisticEnclosureDrc
        ports={[{ kind: "usb", name: "J_PWR", widthOffset: 5 }]}
        title="Cached USB-PD panel: misplaced PWR aperture"
      />,
    )
    await circuit.renderUntilSettled()
    expect(circuit.db.cad_collision_error.list()).toHaveLength(1)
    expect(circuit.db.source_runtime_error.list()).toHaveLength(0)
    return circuit
  }
  const first = await render()
  const firstWrites = writes
  expect(
    [...stored.keys()].every((key) => key.startsWith("tscircuit:cad_mesh:v1:")),
  ).toBe(true)
  expect(firstWrites).toBe(3)
  const second = await render()
  expect(hits).toBe(3)
  expect(writes).toBe(firstWrites)
  expect(second.db.cad_collision_error.list()).toEqual(
    first.db.cad_collision_error.list(),
  )
  await expect(second).toMatchSimple3dSnapshot(import.meta.path, {
    camPos: [65, 70, 85],
    poppygl: { lookAt: [0, 0, 4], backgroundColor: [1, 1, 1], grid: false },
  })
  await expect(second).toMatchPcbSnapshot(import.meta.path)
})
