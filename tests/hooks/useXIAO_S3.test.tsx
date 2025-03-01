import { test, expect } from "bun:test"
import { createUseComponent } from "lib/hooks/create-use-component" // Adjust the path as necessary
import { RootCircuit } from "lib/RootCircuit" // Adjust the path as necessary

// Define the necessary props and pin labels
interface CommonLayoutProps {
  name: string
}

interface Props extends CommonLayoutProps {}

const pinLabels = {
  pin1: "D0",
  pin2: "D1",
  pin3: "D2",
  pin4: "D3",
  pin5: "D4",
  pin6: "D5",
  pin7: "D6",
  pin8: "D7",
  pin9: "D8",
  pin10: "D9",
  pin11: "D10",
  pin12: "VCC",
  pin13: "GND",
  pin14: "VUSB",
  pin15: "BATPLUS",
  pin16: "BATMINUS",
  pin17: "MTDI",
  pin18: "MTDO",
  pin19: "EN",
  pin20: "GND2",
  pin21: "MTMS",
  pin22: "MTCK",
  pin23: "DPLUS",
  pin24: "DMINUS",
} as const

const pinNames = Object.values(pinLabels)

const xiaoFootprint = (
  <footprint>
    <silkscreentext text="XIAO S3" fontSize="1mm" pcbX={2} pcbY={-6} />
    {/* Include necessary footprint details here */}
  </footprint>
)

const XIAO_S3 = (props: Props) => {
  return <chip {...props} footprint={xiaoFootprint} pinLabels={pinLabels} />
}

const useXIAO_S3 = createUseComponent(XIAO_S3, pinNames)

test("useXIAO_S3 creates a component with correct props and traces", () => {
  const Xiao = useXIAO_S3("XI")

  test("useXIAO_S3 creates a component with correct props and traces", () => {
    const Xiao = useXIAO_S3("XI")

    const circuit = new RootCircuit()

    circuit.add(
      <board width="25mm" height="30mm">
        <Xiao />
        <net name="GND" />
        <trace from={Xiao.DMINUS} to="net.GND" />
        {/* Add other necessary traces and components */}
      </board>,
    )

    circuit.render()

    // Check if the Xiao component was created correctly
    const xiaoComponent = circuit.selectOne("XI")
    expect(xiaoComponent).not.toBeNull()

    // Check if traces were created correctly
    const traces = circuit.selectAll("trace")
    expect(traces.length).toBeGreaterThan(0)

    const trace1 = traces.find((t) => t.props.from === ".XI > .DMINUS")
    expect(trace1).not.toBeNull()
    expect(trace1?.props.to).toBe("net.GND")
    expect(trace1).toHaveProperty("props.from", "XI > .DMINUS")
    expect(trace1).toHaveProperty("props.to", "net.GND")
  })
})
