import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("reproduces loss of named differential sections on an ESD net", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={50} height={48} routingDisabled schematicDisabled>
      <chip name="SOC" footprint="soic8" pcbX={-10} pcbY={10} />
      <chip name="ESD" footprint="soic8" pcbY={10} />
      <chip name="USB" footprint="soic8" pcbX={10} pcbY={10} />
      <resistor name="TP" resistance={1000} footprint="0402" pcbY={16} />
      <net name="USB_P" nominalTraceWidth={0.18} />
      <net name="USB_N" nominalTraceWidth={0.18} />
      <trace
        name="P_CPU"
        path={[".SOC > .pin8", ".ESD > .pin1", "net.USB_P"]}
      />
      <trace
        name="N_CPU"
        path={[".SOC > .pin7", ".ESD > .pin2", "net.USB_N"]}
      />
      <trace
        name="P_PORT"
        path={[".ESD > .pin1", ".USB > .pin1", "net.USB_P"]}
      />
      <trace
        name="N_PORT"
        path={[".ESD > .pin2", ".USB > .pin2", "net.USB_N"]}
      />
      <trace from="net.USB_P" to=".TP > .pin1" />
      <tracehint for=".SOC > .pin7" offset={{ x: 1, y: 0 }} />
      <tracehint for=".TP > .pin1" offset={{ x: 0, y: -1 }} />
      <differentialpair
        name="CPU_PAIR"
        positiveConnection="P_CPU"
        negativeConnection="N_CPU"
        maxLengthSkew={0.1}
        pcbTraceGap={0.15}
        maxUncoupledLength={0.5}
      />
      <differentialpair
        name="PORT_PAIR"
        positiveConnection="P_PORT"
        negativeConnection="N_PORT"
        maxLengthSkew={0.2}
        pcbTraceGap={0.2}
      />
      <pcbnotetext
        pcbY={21}
        text="Named USB pair sections on a shared net"
        fontSize={0.9}
      />
      <pcbnotetext
        pcbY={5}
        text="SOC -> ESD -> USB (placement only; routing is disabled)"
        fontSize={0.65}
      />
      <pcbnotetext
        pcbY={3}
        text="This test checks routing INPUT, before any copper is generated."
        fontSize={0.6}
      />
      {[
        "Relevant TSX (N_PORT follows the same pattern as P_PORT):",
        '<trace name="P_CPU"',
        '  path={[".SOC > .pin8", ".ESD > .pin1", "net.USB_P"]} />',
        '<trace name="N_CPU"',
        '  path={[".SOC > .pin7", ".ESD > .pin2", "net.USB_N"]} />',
        '<trace name="P_PORT"',
        '  path={[".ESD > .pin1", ".USB > .pin1", "net.USB_P"]} />',
        '<differentialpair name="CPU_PAIR"',
        '  positiveConnection="P_CPU" negativeConnection="N_CPU" />',
        "",
        "EXPECTED: keep SOC-to-ESD and ESD-to-USB as separate pair sections.",
        "TRIGGER: both P sections also belong to the shared net.USB_P.",
        "ACTUAL: combining the net drops P_CPU from the routing requests.",
        "ERROR: Could not find an SRJ connection for trace name or port selector",
        '"P_CPU" in differential pair "CPU_PAIR"',
      ].map((text, index) =>
        text ? (
          <pcbnotetext
            key={index}
            pcbX={-22}
            pcbY={-index * 1.5}
            anchorAlignment="top_left"
            text={text}
            fontSize={0.65}
          />
        ) : null,
      )}
    </board>,
  )
  circuit.render()
  expect(() =>
    getSimpleRouteJsonFromCircuitJson({
      db: circuit.db,
      subcircuitComponent: circuit.firstChild!,
    }),
  ).toThrow(
    'Could not find an SRJ connection for trace name or port selector "P_CPU" in differential pair "CPU_PAIR"',
  )
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1200,
    height: 1200,
  })
})
