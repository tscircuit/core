import * as Components from "./components"
import {
  extendCatalogue,
  extendInternalCircuitCatalogue,
} from "./fiber/catalogue"

// Register all components, generally you don't need to manually
// register a component, as long as it's exported from lib/components
// it'll automatically be registered!
extendCatalogue(Components)

// Aliases (only when class name is different than the name of the component)
extendCatalogue({
  Bug: Components.Chip,
  "enclosure.cutoutaperture": Components.EnclosureCutoutAperture,
  "enclosure.fdm.box": Components.EnclosureFdmBox,
  Fanout: Components.Breakout,
  FanoutPoint: Components.BreakoutPoint,
})

extendInternalCircuitCatalogue({
  Mosfet: Components.InternalCircuitMosfet,
})
