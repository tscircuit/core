import { expect, test } from "bun:test"
import { CopperText, SilkscreenText } from "lib/components"

test("PCB text dimensions scale linearly with the font size in millimeters", () => {
  for (const TextComponent of [CopperText, SilkscreenText]) {
    const unitSize = new TextComponent({
      text: "BOARD",
      fontSize: 1,
    }).getPcbSize()

    for (const fontSize of [0.25, 0.5, 2]) {
      const size = new TextComponent({
        text: "BOARD",
        fontSize,
      }).getPcbSize()

      expect(size.width).toBeCloseTo(unitSize.width * fontSize)
      expect(size.height).toBeCloseTo(unitSize.height * fontSize)
      expect(size.height).toBe(fontSize)
    }
  }
})
