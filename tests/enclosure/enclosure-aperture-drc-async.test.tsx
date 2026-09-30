import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { EnclosureApertureDrcFixture } from "tests/fixtures/enclosure-aperture-drc-fixture"

test("renderUntilSettled waits for assembly CAD loading and collision results", async () => {
  let release!: () => void
  let requestStarted!: () => void
  const waiting = new Promise<void>((resolve) => {
    release = resolve
  })
  const requested = new Promise<void>((resolve) => {
    requestStarted = resolve
  })
  const server = Bun.serve({
    port: 0,
    fetch: async () => {
      requestStarted()
      await waiting
      return new Response(
        "v -4 -6 0\nv 4 -6 0\nv 4 6 0\nv -4 6 0\nv -4 -6 6\nv 4 -6 6\nv 4 6 6\nv -4 6 6\nf 1 4 3 2\nf 5 6 7 8\nf 1 2 6 5\nf 2 3 7 6\nf 3 4 8 7\nf 4 1 5 8\n",
      )
    },
  })
  try {
    const { circuit } = getTestFixture()
    circuit.add(
      <EnclosureApertureDrcFixture objUrl={`${server.url}delayed.obj`} />,
    )
    let settled = false
    const render = circuit.renderUntilSettled().then(() => {
      settled = true
    })
    await requested
    expect(settled).toBe(false)
    expect(circuit.isDoneRendering()).toBe(false)
    expect(
      circuit.db.cad_enclosure_aperture_intersection_warning.list(),
    ).toHaveLength(0)
    release()
    await render
    expect(circuit.db.source_runtime_error.list()).toHaveLength(0)
    expect(
      circuit.db.cad_enclosure_aperture_intersection_warning.list(),
    ).toHaveLength(1)
  } finally {
    release()
    server.stop(true)
  }
})
