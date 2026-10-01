import { expect, test } from "bun:test"
import { any_circuit_element } from "circuit-json"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a coverlay window exposes a continuous region across a contact row", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      material="flex"
      width={14}
      height={12}
      thickness={0.12}
      pcbX={100}
      pcbY={-70}
      routingDisabled
      schematicDisabled
    >
      <chip
        name="CONTACTS"
        pcbY={2}
        footprint={
          <footprint>
            {[-3, -1, 1, 3].map((pcbX, index) => (
              <Fragment key={pcbX}>
                <smtpad
                  shape="rect"
                  layer="top"
                  pcbX={pcbX}
                  width={1}
                  height={4}
                  portHints={[`${index + 1}`]}
                  coveredWithSolderMask
                />
              </Fragment>
            ))}
            <pcbsoldermaskopening
              name="CONTACT_WINDOW"
              shape="rect"
              layer="top"
              width={9}
              height={6}
            />
          </footprint>
        }
      />
      <pcbnotetext
        text="Continuous coverlay window"
        pcbY={-3.5}
        fontSize={0.65}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const [opening] = circuit.db.pcb_soldermask_opening.list()
  expect(opening).toMatchObject({
    shape: "rect",
    layer: "top",
    x: 100,
    y: -68,
    width: 9,
    height: 6,
  })
  expect(any_circuit_element.parse(opening)).toEqual(opening)
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(4)
  expect(
    circuit.db.pcb_smtpad
      .list()
      .every((pad) => pad.is_covered_with_solder_mask),
  ).toBe(true)
  expect(circuit.db.pcb_solder_paste.list()).toHaveLength(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderMask: true,
  })
})
