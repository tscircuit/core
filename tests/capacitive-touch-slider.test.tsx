import { test, expect } from "bun:test"
import { Circuit } from "../lib/Circuit"

// Capacitive Touch Slider Test
// This test demonstrates polygon smtpads with solder mask for capacitive touch

test("capacitive touch slider with polygon smtpads and solder mask", () => {
  const circuit = new Circuit()
  
  circuit.add(
    <board width="30mm" height="10mm">
      {/* Capacitive touch slider with 5 segments */}
      <group>
        {/* Segment 1 */}
        <smtpad
          name="slider_1"
          shape="polygon"
          points={[
            { x: 0, y: 0 },
            { x: 5, y: 0 },
            { x: 5, y: 8 },
            { x: 0, y: 8 },
          ]}
          layer="top"
          coveredWithSolderMask={true}
          solderMaskMargin={0.1}
        />
        {/* Segment 2 */}
        <smtpad
          name="slider_2"
          shape="polygon"
          points={[
            { x: 5.5, y: 0 },
            { x: 10.5, y: 0 },
            { x: 10.5, y: 8 },
            { x: 5.5, y: 8 },
          ]}
          layer="top"
          coveredWithSolderMask={true}
          solderMaskMargin={0.1}
        />
        {/* Segment 3 */}
        <smtpad
          name="slider_3"
          shape="polygon"
          points={[
            { x: 11, y: 0 },
            { x: 16, y: 0 },
            { x: 16, y: 8 },
            { x: 11, y: 8 },
          ]}
          layer="top"
          coveredWithSolderMask={true}
          solderMaskMargin={0.1}
        />
        {/* Segment 4 */}
        <smtpad
          name="slider_4"
          shape="polygon"
          points={[
            { x: 16.5, y: 0 },
            { x: 21.5, y: 0 },
            { x: 21.5, y: 8 },
            { x: 16.5, y: 8 },
          ]}
          layer="top"
          coveredWithSolderMask={true}
          solderMaskMargin={0.1}
        />
        {/* Segment 5 */}
        <smtpad
          name="slider_5"
          shape="polygon"
          points={[
            { x: 22, y: 0 },
            { x: 27, y: 0 },
            { x: 27, y: 8 },
            { x: 22, y: 8 },
          ]}
          layer="top"
          coveredWithSolderMask={true}
          solderMaskMargin={0.1}
        />
      </group>
    </board>
  )
  
  circuit.render()
  
  // Get PCB elements
  const pcbElements = circuit.getCircuitJson()
  
  // Check for smtpad elements
  const smtpads = pcbElements.filter((el: any) => el.type === "pcb_smtpad")
  expect(smtpads.length).toBe(5)
  
  // Check that all smtpads have coveredWithSolderMask
  for (const smtpad of smtpads) {
    expect(smtpad.shape).toBe("polygon")
    expect(smtpad.is_covered_with_solder_mask).toBe(true)
    expect(smtpad.soldermask_margin).toBe(0.1)
  }
  
  // Generate snapshot for visual verification
  expect(circuit.getCircuitJson()).toMatchSnapshot("capacitive-touch-slider")
})
