import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const leftSignals = [
  [9, "PRU0_MII_TX_CLK1"],
  [12, "PRU0_MII_TX_CLK2"],
  [14, "PRU0_MII_TX_EN1"],
  [8, "PRU0_MII_TX_EN2"],
  [13, "PRU0_MII_TX_D0_1"],
  [7, "PRU0_MII_TX_D0_2"],
  [10, "PRU0_MII_TX_D1_1"],
  [11, "PRU0_MII_TX_D1_2"],
  [17, "PRU0_MII_TX_D2_1"],
  [18, "PRU0_MII_TX_D2_2"],
  [15, "PRU0_MII_TX_D3_1"],
  [16, "PRU0_MII_TX_D3_2"],
  [29, "PRU0_MII_RXER1"],
  [32, "PRU0_MII_RXER2"],
  [21, "PRU0_MII_RXDV1"],
  [19, "PRU0_MII_RXDV2"],
  [26, "PRU0_MII_RX_CLK1"],
  [31, "PRU0_MII_RX_CLK2"],
  [22, "PRU0_MII_RX_D0_1"],
  [30, "PRU0_MII_RX_D0_2"],
  [27, "PRU0_MII_RX_D1_1"],
  [28, "PRU0_MII_RX_D1_2"],
  [20, "PRU0_MII_RX_D2_1"],
  [23, "PRU0_MII_RX_D2_2"],
  [24, "PRU0_MII_RX_D3_1"],
  [25, "PRU0_MII_RX_D3_2"],
] as const

const rightSignals = [
  [40, "PRU0_MII_RXLINK1"],
  [38, "PRU0_MII_RXLINK2"],
  [35, "PRU0_MDC"],
  [39, "PRU0_MDIO"],
  [34, "PRU0_MII_INH1"],
  [36, "PRU0_MII_INH2"],
  [41, "PRU0_MII_INT1"],
  [33, "PRU0_MII_INT2"],
  [42, "PRU0_MII_RESETn1"],
  [37, "PRU0_MII_RESETn2"],
] as const

const allSignals = [...leftSignals, ...rightSignals]
const dataTopLevelPinLabels = Object.fromEntries(
  allSignals.map(([pinNumber, signalName]) => [`pin${pinNumber}`, signalName]),
)

test("dense single-port nets use inline labeled stubs", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="18mm" height="18mm" routingDisabled>
      <chip
        name="U1_T1_Data_Top_Level"
        manufacturerPartNumber="T1_Data_Top_Level.SchDoc"
        pinLabels={dataTopLevelPinLabels}
        schX={0}
        schY={0}
        schWidth={4.2}
        schHeight={6.2}
        schPinArrangement={{
          leftSide: {
            pins: leftSignals.map(([pinNumber]) => pinNumber),
            direction: "top-to-bottom",
          },
          rightSide: {
            pins: rightSignals.map(([pinNumber]) => pinNumber),
            direction: "top-to-bottom",
          },
        }}
      />

      {allSignals.map(([pinNumber, signalName]) => (
        <Fragment key={signalName}>
          <trace
            schDisplayLabel={`NET_${signalName}`}
            from={`.U1_T1_Data_Top_Level > .pin${pinNumber}`}
            to={`net.NET_${signalName}`}
          />
        </Fragment>
      ))}
    </board>,
  )

  await circuit.renderUntilSettled()

  const expectedLabels = allSignals.map(([, signalName]) => `NET_${signalName}`)
  const inlineTexts = circuit.db.schematic_text
    .list()
    .filter((text) => expectedLabels.includes(text.text))

  expect(inlineTexts).toHaveLength(expectedLabels.length)
  expect(inlineTexts.every((text) => text.source_trace_id)).toBe(true)
  expect(
    new Set(
      inlineTexts
        .filter((text) => text.position.x < 0)
        .map((text) => text.anchor),
    ),
  ).toEqual(new Set(["right"]))
  expect(
    new Set(
      inlineTexts
        .filter((text) => text.position.x > 0)
        .map((text) => text.anchor),
    ),
  ).toEqual(new Set(["left"]))
  expect(
    circuit.db.schematic_net_label
      .list()
      .filter((label) => expectedLabels.includes(label.text)),
  ).toHaveLength(0)
  expect(circuit.db.schematic_trace.list()).toHaveLength(expectedLabels.length)

  const stubEdges = circuit.db.schematic_trace
    .list()
    .flatMap((trace) => trace.edges)
  const leftStubEndXs = stubEdges
    .filter((edge) => edge.to.x < edge.from.x)
    .map((edge) => edge.to.x.toFixed(6))
  const rightStubEndXs = stubEdges
    .filter((edge) => edge.to.x > edge.from.x)
    .map((edge) => edge.to.x.toFixed(6))
  expect(new Set(leftStubEndXs).size).toBe(1)
  expect(new Set(rightStubEndXs).size).toBe(1)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {})
})
