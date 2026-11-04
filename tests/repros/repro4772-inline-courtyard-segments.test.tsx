import { expect, test } from "bun:test"
import { InvalidProps } from "lib/errors/InvalidProps"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("two-point courtyard outlines fail props validation before placement checks", async () => {
  const { circuit } = getTestFixture()
  let renderError: Error | undefined
  try {
    circuit.add(
      <board width="10mm" height="10mm">
        <chip
          name="U1"
          footprint={
            <footprint>
              <smtpad
                portHints={["1"]}
                pcbX={-1}
                pcbY={0}
                width={0.6}
                height={0.4}
                shape="rect"
              />
              <smtpad
                portHints={["2"]}
                pcbX={1}
                pcbY={0}
                width={0.6}
                height={0.4}
                shape="rect"
              />
              <courtyardoutline
                outline={[
                  { x: -1.5, y: 0.5 },
                  { x: 1.5, y: 0.5 },
                ]}
                layer="top"
              />
              <courtyardoutline
                outline={[
                  { x: 1.5, y: 0.5 },
                  { x: 1.5, y: -0.5 },
                ]}
                layer="top"
              />
              <courtyardoutline
                outline={[
                  { x: 1.5, y: -0.5 },
                  { x: -1.5, y: -0.5 },
                ]}
                layer="top"
              />
              <courtyardoutline
                outline={[
                  { x: -1.5, y: -0.5 },
                  { x: -1.5, y: 0.5 },
                ]}
                layer="top"
              />
            </footprint>
          }
        />
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={3} />
        <trace from=".U1 > .pin2" to=".R1 > .pin1" />
      </board>,
    )
    await circuit.renderUntilSettled()
  } catch (error) {
    if (!(error instanceof Error)) throw error
    renderError = error
  }

  let snapshotCircuit = circuit
  if (renderError) {
    // Invalid props produce no PCB output. This board is explicitly an error
    // reference, carrying the genuine validation message rather than geometry.
    snapshotCircuit = getTestFixture().circuit
    snapshotCircuit.add(
      <board width="10mm" height="10mm" routingDisabled>
        <pcbnotetext
          text="NO PCB OUTPUT / PROPS VALIDATION"
          pcbY={2}
          fontSize={0.4}
        />
        <pcbnotetext text={renderError.message} pcbY={-2} fontSize={0.25} />
      </board>,
    )
  }
  await expect(snapshotCircuit).toMatchPcbSnapshot(import.meta.path, {
    showCourtyards: true,
    shouldDrawErrors: true,
  })
  expect(renderError).toBeInstanceOf(InvalidProps)
  expect(renderError?.message).toContain("outline")
  expect(renderError?.message).toContain("at least 3")
  expect(circuit.db.pcb_courtyard_outline.list()).toHaveLength(0)
  expect(circuit.db.pcb_placement_error.list()).toHaveLength(0)
})
