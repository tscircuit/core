import * as Components from "./components"
import { extendCatalogue } from "./fiber/catalogue"
extendCatalogue(Components)

// Aliases
extendCatalogue({
  Bug: Components.Chip,
})
