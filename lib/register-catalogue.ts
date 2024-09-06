import * as Components from "./components"
import { SilkscreenText } from "./components/normal-components/SilkscreenText"
import { extendCatalogue } from "./fiber/catalogue"
extendCatalogue(Components)
extendCatalogue({ SilkscreenText })

// Aliases
extendCatalogue({
  Bug: Components.Chip,
})
