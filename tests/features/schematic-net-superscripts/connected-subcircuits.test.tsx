import type { SourceNet } from "circuit-json"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("connected same-name nets share one superscript and lose it when all networks join", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  circuit.add(
    <board width={30} height={20}>
      {["A", "B", "C"].map((name, index) => (
        <subcircuit key={name} name={name} schX={index * 4}>
          <resistor name={`R${index + 1}`} resistance="1k" />
          <netlabel
            net="GND"
            connectsTo={`R${index + 1}.pin1`}
            schY={-2}
            anchorSide="top"
          />
        </subcircuit>
      ))}
      <trace from=".A .R1 .pin1" to=".B .R2 .pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const nets = circuit.db.source_net.list().filter((net) => net.name === "GND")
  expect(nets).toHaveLength(3)
  const suffixForNet = (netId: SourceNet["source_net_id"]) =>
    circuit.db.schematic_net_label
      .list()
      .find((label) => label.source_net_id === netId)?.display_superscript
  expect(suffixForNet(nets[0]!.source_net_id)).toBe("1")
  expect(suffixForNet(nets[1]!.source_net_id)).toBe("1")
  expect(suffixForNet(nets[2]!.source_net_id)).toBe("2")
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)

  // A direct database edit must dirty the phase that consumes the new data.
  circuit.db.source_trace.insert({
    connected_source_net_ids: nets.map((net) => net.source_net_id),
    connected_source_port_ids: [],
  })
  circuit.firstChild!._markDirty("SchematicNetLabelSuperscripts")
  circuit.render()
  expect(
    circuit.db.schematic_net_label
      .list()
      .filter((label) => label.text === "GND")
      .every((label) => label.display_superscript === undefined),
  ).toBe(true)
})
