import { test, expect } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import { 
  FakeFootprintServer, 
  createSoic4FootprintJson,
  createCustomFootprintJson 
} from "tests/fixtures/fake-footprint-server"
import { clearFootprintCache } from "lib/utils/async-footprint-loader"

test("async footprint - basic integration", async () => {
  const server = new FakeFootprintServer()
  server.addFootprint("/soic4", createSoic4FootprintJson())
  
  const { port } = await server.start()
  const footprintUrl = `http://localhost:${port}/soic4`

  try {
    clearFootprintCache()
    
    const project = new RootCircuit()

    project.add(
      <board width="10mm" height="10mm">
        <chip 
          name="U1" 
          footprint={footprintUrl}
          pcbX={0}
          pcbY={0}
        />
      </board>
    )

    // Wait for async footprint loading to complete
    await project.renderUntilSettled()

    const circuitJson = project.getCircuitJson()
    
    // Verify that the component was created
    const sourceComponent = circuitJson.find(el => 
      el.type === "source_component" && el.name?.includes("U1")
    )
    expect(sourceComponent).toBeTruthy()

    // Verify the component renders without error
    expect(circuitJson.length).toBeGreaterThan(0)

  } finally {
    server.stop()
  }
})

test("async footprint - mixed sync and async", async () => {
  const server = new FakeFootprintServer()
  server.addFootprint("/async-soic4", createSoic4FootprintJson())
  
  const { port } = await server.start()

  try {
    clearFootprintCache()
    
    const project = new RootCircuit()

    project.add(
      <board width="20mm" height="10mm">
        {/* Sync footprint using footprinter */}
        <chip 
          name="U1" 
          footprint="soic4"
          pcbX={-5}
          pcbY={0}
        />
        {/* Async footprint from URL */}
        <chip 
          name="U2" 
          footprint={`http://localhost:${port}/async-soic4`}
          pcbX={5}
          pcbY={0}
        />
      </board>
    )

    await project.renderUntilSettled()

    const circuitJson = project.getCircuitJson()
    
    // Both components should have been created successfully
    const sourceComponents = circuitJson.filter(el => 
      el.type === "source_component" && 
      (el.name?.includes("U1") || el.name?.includes("U2"))
    )
    expect(sourceComponents.length).toBeGreaterThanOrEqual(2)

  } finally {
    server.stop()
  }
})

test("async footprint - handles server delay", async () => {
  const server = new FakeFootprintServer({ delay: 50 }) // 50ms delay
  server.addFootprint("/delayed-soic4", createSoic4FootprintJson())
  
  const { port } = await server.start()
  const footprintUrl = `http://localhost:${port}/delayed-soic4`

  try {
    clearFootprintCache()
    
    const project = new RootCircuit()

    const startTime = Date.now()

    project.add(
      <board width="10mm" height="10mm">
        <chip 
          name="U1" 
          footprint={footprintUrl}
          pcbX={0}
          pcbY={0}
        />
      </board>
    )

    await project.renderUntilSettled()
    
    const endTime = Date.now()
    const duration = endTime - startTime

    // Verify that it took at least the delay time
    expect(duration).toBeGreaterThanOrEqual(45) // Allow some tolerance

    const circuitJson = project.getCircuitJson()
    const sourceComponent = circuitJson.find(el => 
      el.type === "source_component" && el.name?.includes("U1")
    )
    expect(sourceComponent).toBeTruthy()

  } finally {
    server.stop()
  }
})

test("async footprint - handles 404 errors gracefully", async () => {
  const server = new FakeFootprintServer()
  // Don't add any footprints, so all requests will 404
  
  const { port } = await server.start()
  const footprintUrl = `http://localhost:${port}/nonexistent`

  try {
    clearFootprintCache()
    
    const project = new RootCircuit()

    project.add(
      <board width="10mm" height="10mm">
        <chip 
          name="U1" 
          footprint={footprintUrl}
          pcbX={0}
          pcbY={0}
        />
      </board>
    )

    await project.renderUntilSettled()

    const circuitJson = project.getCircuitJson()
    
    // Component should still be created even if footprint fails to load
    const sourceComponent = circuitJson.find(el => 
      el.type === "source_component" && el.name?.includes("U1")
    )
    expect(sourceComponent).toBeTruthy()

  } finally {
    server.stop()
  }
})

test("async footprint - multiple components with different async footprints", async () => {
  const server = new FakeFootprintServer()
  server.addFootprint("/soic4", createSoic4FootprintJson())
  server.addFootprint("/custom", createCustomFootprintJson())
  
  const { port } = await server.start()

  try {
    clearFootprintCache()
    
    const project = new RootCircuit()

    project.add(
      <board width="20mm" height="10mm">
        <chip 
          name="U1" 
          footprint={`http://localhost:${port}/soic4`}
          pcbX={-5}
          pcbY={0}
        />
        <chip 
          name="U2" 
          footprint={`http://localhost:${port}/custom`}
          pcbX={5}
          pcbY={0}
        />
      </board>
    )

    await project.renderUntilSettled()

    const circuitJson = project.getCircuitJson()
    
    // Both components should have been created
    const sourceComponents = circuitJson.filter(el => 
      el.type === "source_component" && 
      (el.name?.includes("U1") || el.name?.includes("U2"))
    )
    expect(sourceComponents).toHaveLength(2)

  } finally {
    server.stop()
  }
})