import * as Components from "./components"
import { extendCatalogue } from "./fiber/catalogue"
import { SilkscreenText } from "./components/normal-components/SilkscreenText"

extendCatalogue(Components)

// Aliases
extendCatalogue({
  Bug: Components.Chip,
  SilkscreenText: SilkscreenText,
})
