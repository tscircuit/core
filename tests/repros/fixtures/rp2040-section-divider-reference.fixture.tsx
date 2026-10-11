// Reduced from imrishabh18/rp2040-motor-controller@1.0.42, motor_driver.
// Schematic-world points: +X right and +Y up, in schematic units.
export const Rp2040SectionDividerReferenceFixture = () => (
  <board routingDisabled>
    <schematicsection name="driver" displayName="Driver section" />
    <schematicsection name="output" displayName="Motor output" />
    <resistor
      name="R_DRV_ENABLE_PU"
      resistance="10k"
      schX={7.97}
      schY={-11.42}
      schOrientation="vertical"
      schSectionName="driver"
    />
    <chip
      name="J1"
      pinLabels={{}}
      schX={10.7}
      schY={-11.42}
      schWidth={1.2}
      schHeight={1}
      schSectionName="output"
    />
  </board>
)
