import * as Components from "./components"
import { extendCatalogue } from "./fiber/catalogue"

// Register all components, generally you don't need to manually
// register a component, as long as it's exported from lib/components
// it'll automatically be registered!
extendCatalogue(Components)

// Aliases
extendCatalogue({
  Bug: Components.Chip,
})
