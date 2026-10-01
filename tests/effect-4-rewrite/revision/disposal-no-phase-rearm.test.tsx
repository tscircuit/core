import { expect, spyOn, test } from "bun:test"
import { Circuit } from "lib/RootCircuit"

test("supplementary: disposing pending supplier work does not re-arm render phases", async () => {
  let started!: () => void
  const lookupStarted = new Promise<void>((resolve) => {
    started = resolve
  })
  const circuit = new Circuit({
    platform: {
      routingDisabled: true,
      partsEngine: {
        findPart: () => {
          started()
          return new Promise(() => {})
        },
      },
    },
  })
  circuit.add(
    <board width={10} height={10}>
      <resistor name="R1" resistance="1k" footprint="0402" />
    </board>,
  )
  const settling = circuit.renderUntilSettled().catch(() => {})
  await lookupStarted
  const resistor = circuit.selectOne(".R1")!
  const markDirty = spyOn(resistor, "_markDirty")
  try {
    await circuit.dispose()
    await settling
    expect(markDirty.mock.calls).toEqual([])
    expect(circuit.effectRuntime.activeJobCount).toBe(0)
  } finally {
    markDirty.mockRestore()
    await circuit.dispose()
  }
})
