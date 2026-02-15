import { test, expect } from "bun:test"
import React from "react"
import { Board, RootCircuit } from "../index"

// Invalid usage test removed

test("chip with nested cadmodel should respect showAsTranslucentModel", async () => {
  const project = new RootCircuit()
  const board = new Board({
    width: "10mm",
    height: "10mm",
  })
  project.add(board)

  board.add(
    <chip
      name="U1"
      footprint="soic8"
      cadModel={
        <cadmodel
          modelUrl="https://modelcdn.tscircuit.com/jscad_models/soic8.glb"
          showAsTranslucentModel
        />
      }
    />,
  )

  project.render()

  const cadComponent = project.db.cad_component.list()[0]

  expect(cadComponent).toBeDefined()
  expect(cadComponent.show_as_translucent_model).toBe(true)
})
