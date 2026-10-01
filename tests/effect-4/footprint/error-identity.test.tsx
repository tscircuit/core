import { expect, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import { footprintUrl } from "./helpers"

test("the Promise boundary preserves Error, string and undefined failures and always clears ownership", async () => {
  for (const failure of [new Error("offline"), "offline", undefined]) {
    const circuit = new RootCircuit({
      platform: { routingDisabled: true },
      experimentalFootprintLoading: {
        fetch: () => {
          throw failure
        },
      },
    })
    circuit.add(
      <board width="10mm" height="10mm">
        <resistor name="R1" resistance="10k" footprint="0402" />
      </board>,
    )
    await circuit.renderUntilSettled()
    const onErrorCauses: unknown[] = []
    const scope = circuit.experimentalFootprintLoader!
    const outcome = await scope
      .load(circuit.selectOne("resistor")!, {
        url: footprintUrl,
        isCurrent: () => true,
        decode: async () => {
          throw new Error("A failed fetch must not decode")
        },
        commit: () => {
          throw new Error("A failed fetch must not commit")
        },
        onError: (cause) => onErrorCauses.push(cause),
      })
      .then(
        () => ({ status: "success" }),
        (cause: unknown) => ({ status: "failure", cause }),
      )
    expect(outcome).toEqual({ status: "failure", cause: failure })
    expect(onErrorCauses).toEqual([failure])
    expect(scope.activeJobCount).toBe(0)
    await scope.dispose()
  }
})
