import { expect, mock, spyOn, test } from "bun:test"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// https://github.com/tscircuit/tscircuit/issues/4948
test("placement preview skips the local router and unavailable routing cache", async () => {
  const startLocalRouter = spyOn(TscircuitAutorouter.prototype, "start")

  try {
    for (const routingDisabled of [false, true]) {
      startLocalRouter.mockClear()
      const getItem = mock(() => {
        if (routingDisabled) throw new Error("Routing cache is unavailable")
        return null
      })
      const setItem = mock(() => {
        if (routingDisabled) throw new Error("Routing cache is unavailable")
      })
      const { circuit } = getTestFixture({
        platform: {
          routingDisabled,
          localCacheEngine: { getItem, setItem },
        },
      })

      circuit.add(
        <board width="24mm" height="10mm">
          <subcircuit name="child" routingDisabled={false}>
            <resistor
              name="R1"
              resistance="1k"
              footprint="0402"
              pcbX={-3}
              schX={-3}
            />
            <resistor
              name="R2"
              resistance="1k"
              footprint="0402"
              pcbX={3}
              schX={3}
            />
            <trace from=".R1 > .pin2" to=".R2 > .pin1" />
          </subcircuit>
          <pcbnotetext
            text="Placement preview: connected R1 and R2"
            pcbY={3}
            fontSize={0.6}
          />
          <pcbnotetext
            text="Expected: ratsnest, no router or cache calls"
            pcbY={-3}
            fontSize={0.5}
          />
        </board>,
      )

      await circuit.renderUntilSettled()

      if (routingDisabled) {
        expect(startLocalRouter).not.toHaveBeenCalled()
        expect(getItem).not.toHaveBeenCalled()
        expect(setItem).not.toHaveBeenCalled()
        expect(circuit.db.pcb_trace.list()).toHaveLength(0)
        expect(circuit.db.pcb_component.list()).toHaveLength(2)
        expect(circuit.db.pcb_port.list()).toHaveLength(4)
        expect(circuit.db.source_trace.list()).toHaveLength(1)
        await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
          shouldDrawRatsNest: true,
        })
      } else {
        // This control proves the fixture actually needs routing and caching.
        expect(startLocalRouter).toHaveBeenCalled()
        expect(getItem).toHaveBeenCalled()
        expect(setItem).toHaveBeenCalled()
        expect(circuit.db.pcb_trace.list().length).toBeGreaterThan(0)
      }
    }
  } finally {
    startLocalRouter.mockRestore()
  }
})
