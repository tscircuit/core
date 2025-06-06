import * as Components from "./components"
import { TestPoint } from "./components/normal-components/TestPoint"
import { extendCatalogue } from "./fiber/catalogue"

// Register all components, generally you don't need to manually
// register a component, as long as it's exported from lib/components
// it'll automatically be registered!
extendCatalogue(Components)

// Aliases (only when class name is different than the name of the component)
extendCatalogue({
  Bug: Components.Chip,
  TestPoint: TestPoint,
})
