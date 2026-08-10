import { Microcontroller_RP2040 } from "@tscircuit/common"
import { schematicSheets } from "./config"

/**
 * @tscircuit/common owns the RP2040 controller, clock, debug, and programming
 * sub-sections, so they remain one reusable controller subsystem here.
 */
export const ControllerSections = () => (
  <Microcontroller_RP2040
    name="MCU"
    autorouter="auto_local"
    schAutoLayoutEnabled
    schSheetName={schematicSheets.controller}
    pcbX={-25}
    schX={-3.1}
    schY={8.5}
  />
)
