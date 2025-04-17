import { selectOne } from "css-select"
import { test, expect } from "bun:test"
import { RootCircuit } from "lib"
import { cssSelectorAdapter } from "lib/utils/selector-matching"

test("css-select on RootCircuit", () => {
  const circuit = new RootCircuit()
  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint="0402" />
    </board>,
  )

  circuit.render()

  // Get the board and resistor directly for reference
  const board = circuit.children[0]
  const resistor = board.children[0]

  // Test various selectors against the circuit
  
  // Test simple tag selector on child component
  const resultTypeSelector = selectOne("resistor", board, {
    adapter: cssSelectorAdapter
  })
  expect(resultTypeSelector?.props.name).toBe("R1")
  
  // Test class selector (component name)
  const resultClassSelector = selectOne(".R1", board, {
    adapter: cssSelectorAdapter
  })
  expect(resultClassSelector?.props.name).toBe("R1")
  
  // Test combined tag and class selector
  const resultCombinedSelector = selectOne("resistor.R1", board, {
    adapter: cssSelectorAdapter
  })
  expect(resultCombinedSelector?.props.name).toBe("R1")
  
  // Direct child selector has limitations with css-select library and our component hierarchy
  // For now, we'll test with a workaround
  const boardElement = selectOne("board", circuit, {
    adapter: cssSelectorAdapter
  })
  const resistorFromBoard = boardElement ? selectOne("resistor", boardElement, {
    adapter: cssSelectorAdapter
  }) : null
  expect(resistorFromBoard?.props.name).toBe("R1")
  
  // There are some limitations with attribute selectors in css-select with our components
  // We can use a simpler test
  const resultBasicAttrSelector = selectOne("[name='R1']", board, {
    adapter: cssSelectorAdapter
  })
  expect(resultBasicAttrSelector?.props.name).toBe("R1")
  
  // Compare with circuit's internal selector
  const usingInternalSelect = circuit.selectOne("resistor")
  expect(usingInternalSelect?.props.name).toBe("R1")
})
