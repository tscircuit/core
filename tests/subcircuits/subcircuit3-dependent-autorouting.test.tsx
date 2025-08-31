import { test, expect } from "bun:test"
import { Renderable } from "lib/components/base-components/Renderable"
import { getTestAutoroutingServer } from "tests/fixtures/get-test-autorouting-server"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subcircuit3-dependent-autorouting", async () => {
  const { circuit } = await getTestFixture()
  const { autoroutingServerUrl } = getTestAutoroutingServer()

  const cloudAutorouterConfig = {
    serverUrl: autoroutingServerUrl,
    serverMode: "solve-endpoint",
    inputFormat: "simplified",
  } as const

  circuit.add(
    <board width="10mm" height="10mm" autorouter={cloudAutorouterConfig}>
      <subcircuit name="S1" autorouter={cloudAutorouterConfig}>
        <resistor
          resistance="1k"
          footprint="0402"
          name="R1"
          schX={3}
          pcbX={3}
        />
        <resistor
          resistance="1k"
          footprint="0402"
          name="R2"
          schX={3}
          pcbX={3}
          pcbY={2}
        />
        <trace from=".R1 .pin1" to=".R2 .pin2" />
      </subcircuit>
      <subcircuit
        name="S2"
        autorouter={{ local: true, groupMode: "sequential-trace" }}
      >
        <capacitor
          capacitance="1000pF"
          footprint="0603"
          name="C1"
          schX={-3}
          pcbX={-3}
        />
        <trace from=".C1 .pin1" to=".C1 .pin2" />
      </subcircuit>
      <trace from=".S1 .R1 > .pin1" to=".S2 .C1 > .pin1" />
    </board>,
  )

  const asyncEffectEndEvents: any[] = []
  circuit.on("asyncEffect:end", (event) => {
    asyncEffectEndEvents.push({
      ...event,
      componentDisplayName: event.componentDisplayName.replace(/#\d+/, "#"),
    })
  })

  await circuit.renderUntilSettled()

  // Check that async effects run for both board and S1 (order may vary)
  expect(asyncEffectEndEvents).toHaveLength(2)
  expect(
    asyncEffectEndEvents.map((e) => e.componentDisplayName).sort(),
  ).toEqual(["<board# />", '<group# name=".S1" />'])

  // Check if the circuit matches the expected PCB snapshot
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
