import { expect, it } from "bun:test"
import { Mosfet } from "lib/components/normal-components/Mosfet"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("keeps N-channel and P-channel MOSFET terminal aliases on physical pins for every pin permutation", () => {
  const permutations = [
    ["gate", "source", "drain"],
    ["gate", "drain", "source"],
    ["source", "gate", "drain"],
    ["source", "drain", "gate"],
    ["drain", "gate", "source"],
    ["drain", "source", "gate"],
  ] as const
  for (const channelType of ["n", "p"] as const) {
    for (const mosfetMode of ["enhancement", "depletion"] as const) {
      for (const roles of permutations) {
        for (const schRotation of [0, 90, 180, 270]) {
          const { circuit } = getTestFixture()
          circuit.add(
            <board width={10} height={10} routingDisabled>
              <mosfet
                name="Q1"
                channelType={channelType}
                mosfetMode={mosfetMode}
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
          const mosfet = circuit.selectOne(".Q1") as Mosfet
          expect(circuit.db.source_port.list()).toHaveLength(3)
          for (const [index, role] of roles.entries()) {
            const port =
              mosfet.portMap[(["pin1", "pin2", "pin3"] as const)[index]!]
            expect(mosfet[role]).toBe(port)
            expect(circuit.selectOne(`.Q1 > .${role[0]}`)).toBe(port)
            expect(port.schematicSymbolPortDef?.labels).toContain(role)
            expect(
              port
                .getNameAndAliases()
                .filter((alias) => ["d", "g", "s"].includes(alias)),
            ).toEqual([role[0]])
          }
          expect(circuit.selectOne(".Q1 > .CUSTOM")).toBe(mosfet.portMap.pin1)
        }
      }
    }
  }
})
