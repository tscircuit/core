import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("local routing explicitly disables board via-in-pad permission", async () => {
  const { circuit } = getTestFixture()
  let autorouterInput: SimpleRouteJson | undefined

  circuit.add(
    <board
      schematicDisabled
      width="12mm"
      height="8mm"
      isViaInPadAllowed
      autorouter={{
        allowViaInPad: false,
        local: true,
        groupMode: "subcircuit",
        algorithmFn: createBasicAutorouter(async (input) => {
          autorouterInput = input
          return []
        }),
      }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-3} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={3} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_board.list()[0].is_via_in_pad_allowed).toBe(true)
  expect(autorouterInput).toBeDefined()
  expect(autorouterInput!.connections).toHaveLength(1)
  expect(autorouterInput!.allowViaInPad).toBe(false)
})
