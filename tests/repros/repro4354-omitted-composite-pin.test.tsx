import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing(
  "a trace to omitted pin2 reports a missing-pin error",
  async () => {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width={18} height={10} routingDisabled>
        <chip name="U1" schPinArrangement={{ rightSide: ["pin1"] }}>
          <footprint>
            <platedhole
              portHints={["pin2"]}
              pcbX={-2}
              shape="circle"
              holeDiameter={0.8}
              outerDiameter={1.4}
            />
            <platedhole
              portHints={["pin2"]}
              pcbX={2}
              shape="circle"
              holeDiameter={0.8}
              outerDiameter={1.4}
            />
          </footprint>
        </chip>
        <trace from="U1.pin2" to="net.GND" />
        <pcbnotetext text="U1.pin2 to GND" pcbY={3.4} fontSize={0.7} />
        <pcbnotetext
          text="Both holes belong to the omitted pin2"
          pcbY={1.65}
          fontSize={0.55}
        />
      </board>,
    )

    await circuit.renderUntilSettled()
    expect(circuit.db.pcb_plated_hole.list()).toHaveLength(2)

    const missingPinSelectors = circuit.db.source_trace_not_connected_error
      .list()
      .flatMap((error) => error.selectors_not_found ?? [])

    await expect(circuit).toMatchPcbSnapshot(import.meta.path)
    expect(missingPinSelectors).toEqual(["U1.pin2"])
  },
)
