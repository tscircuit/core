import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("internal connection fabrication notes only appear below six pins", async () => {
  const { circuit } = getTestFixture()
  const pinCounts = [5, 6, 8]

  circuit.add(
    <board width="24mm" height="12mm">
      <pcbnotetext
        text="5 PINS: MARKED / 6 AND 8 PINS: NO AUTO NOTES"
        pcbY={5}
        fontSize={0.3}
      />
      {pinCounts.map((pinCount, column) => (
        <chip
          key={pinCount}
          name={`U${pinCount}`}
          pcbX={(column - 1) * 7}
          internallyConnectedPins={[["pin1", "pin2"]]}
          footprint={
            <footprint>
              {Array.from({ length: pinCount }, (_, index) => (
                <smtpad
                  shape="rect"
                  width={0.8}
                  height={0.8}
                  pcbX={index % 2 === 0 ? -2 : 2}
                  pcbY={2 - Math.floor(index / 2) * 1.5}
                  portHints={[`pin${index + 1}`]}
                />
              ))}
            </footprint>
          }
        />
      ))}
    </board>,
  )

  await circuit.renderUntilSettled()

  for (const pinCount of pinCounts) {
    const sourceComponent = circuit.db.source_component.getWhere({
      name: `U${pinCount}`,
    })!
    const pcbComponent = circuit.db.pcb_component.getWhere({
      source_component_id: sourceComponent.source_component_id,
    })!
    const pcbComponentFilter = {
      pcb_component_id: pcbComponent.pcb_component_id,
    }

    expect(
      circuit.db.source_component_internal_connection.list({
        source_component_id: sourceComponent.source_component_id,
      }),
    ).toHaveLength(1)
    expect(
      circuit.db.pcb_fabrication_note_text.list({
        ...pcbComponentFilter,
        text: "MARKED INTERNALLY CONNECTED",
      }),
    ).toHaveLength(pinCount === 5 ? 1 : 0)
    expect(
      circuit.db.pcb_fabrication_note_path.list(pcbComponentFilter),
    ).toHaveLength(pinCount === 5 ? 1 : 0)
  }

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
