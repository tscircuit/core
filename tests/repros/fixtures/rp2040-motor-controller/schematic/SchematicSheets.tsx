import { schematicSections, schematicSheets } from "./config"

export const SchematicSheets = () => (
  <>
    <schematicsheet
      name={schematicSheets.controller}
      displayName="RP2040 Controller"
      sheetIndex={1}
    />

    <schematicsheet
      name={schematicSheets.programming}
      displayName="Programming USB-C & QSPI"
      sheetIndex={2}
    >
      <schematicsection
        name="MCU__usb"
        displayName="USB-C, QSPI Flash & 3.3V Power"
      />
    </schematicsheet>

    <schematicsheet
      name={schematicSheets.motorDriver}
      displayName="Dual Motor Driver"
      sheetIndex={3}
    >
      <schematicsection
        name={schematicSections.driverCore}
        displayName="H-Bridge, Power & Control"
      />
      <schematicsection
        name={schematicSections.motorOutputs}
        displayName="Motor Outputs"
      />
    </schematicsheet>

    <schematicsheet
      name={schematicSheets.motorPower}
      displayName="USB-C PD Motor Power"
      sheetIndex={4}
    >
      <schematicsection
        name={schematicSections.pdNegotiation}
        displayName="USB-C PD Negotiation"
      />
      <schematicsection
        name={schematicSections.pdFiltering}
        displayName="Power Filtering"
      />
    </schematicsheet>
  </>
)
