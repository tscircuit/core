import { expect, it } from "bun:test"
import { Transistor } from "lib/components/normal-components/Transistor"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("keeps NPN and PNP terminal aliases on physical pins for every pin permutation", () => {
  const permutations = [
    ["base", "emitter", "collector"],
    ["base", "collector", "emitter"],
    ["emitter", "base", "collector"],
    ["emitter", "collector", "base"],
    ["collector", "base", "emitter"],
    ["collector", "emitter", "base"],
  ] as const
  for (const type of ["npn", "pnp"] as const) {
    for (const roles of permutations) {
      for (const schRotation of [0, 90, 180, 270]) {
        const { circuit } = getTestFixture()
        circuit.add(
          <board width={10} height={10} routingDisabled>
            <transistor
              name="Q1"
              type={type}
              schRotation={schRotation}
              footprint="sot23"
              pinLabels={{
                pin1: [roles[0], "CUSTOM"],
                pin2: roles[1],
                pin3: roles[2],
              }}
            />
          </board>,
        )
        circuit.render()
        const transistor = circuit.selectOne(".Q1") as Transistor
        expect(circuit.db.source_port.list()).toHaveLength(3)
        for (const [index, role] of roles.entries()) {
          const port =
            transistor.portMap[(["pin1", "pin2", "pin3"] as const)[index]!]
          expect(transistor[role]).toBe(port)
          expect(circuit.selectOne(`.Q1 > .${role[0]}`)).toBe(port)
          expect(port.schematicSymbolPortDef?.labels).toContain(role)
          expect(
            port
              .getNameAndAliases()
              .filter((alias) => ["b", "c", "e"].includes(alias)),
          ).toEqual([role[0]])
        }
        expect(circuit.selectOne(".Q1 > .CUSTOM")).toBe(transistor.portMap.pin1)
      }
    }
  }
})
