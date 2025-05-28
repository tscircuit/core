import { test, expect } from "bun:test"
import { 
  isFootprintUrl, 
  loadFootprintFromUrl, 
  clearFootprintCache 
} from "lib/utils/async-footprint-loader"
import { FakeFootprintServer, createSoic4FootprintJson } from "tests/fixtures/fake-footprint-server"

test("isFootprintUrl - identifies HTTP URLs", () => {
  expect(isFootprintUrl("http://example.com/footprint")).toBe(true)
  expect(isFootprintUrl("https://example.com/footprint")).toBe(true)
  expect(isFootprintUrl("soic4")).toBe(false)
  expect(isFootprintUrl("./local/path")).toBe(false)
  expect(isFootprintUrl("")).toBe(false)
})

test("loadFootprintFromUrl - loads circuit JSON from URL", async () => {
  const server = new FakeFootprintServer()
  const circuitJson = createSoic4FootprintJson()
  server.addFootprint("/test-footprint", circuitJson)
  
  const { port } = await server.start()
  const url = `http://localhost:${port}/test-footprint`
  
  try {
    clearFootprintCache()
    
    const result = await loadFootprintFromUrl(url)
    
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
    expect(result[0]).toHaveProperty("type")
    
    // Check that we got the expected source component
    const sourceComponent = result.find(el => el.type === "source_component")
    expect(sourceComponent).toBeTruthy()
    expect(sourceComponent?.name).toBe("SOIC4")
  } finally {
    server.stop()
  }
})

test("loadFootprintFromUrl - caches results", async () => {
  const server = new FakeFootprintServer()
  const circuitJson = createSoic4FootprintJson()
  server.addFootprint("/cached-footprint", circuitJson)
  
  const { port } = await server.start()
  const url = `http://localhost:${port}/cached-footprint`
  
  try {
    clearFootprintCache()
    
    const result1 = await loadFootprintFromUrl(url)
    const result2 = await loadFootprintFromUrl(url)
    
    // Both results should be the same reference (cached)
    expect(result1).toBe(result2)
  } finally {
    server.stop()
  }
})

test("loadFootprintFromUrl - handles 404 errors", async () => {
  const server = new FakeFootprintServer()
  const { port } = await server.start()
  const url = `http://localhost:${port}/nonexistent`
  
  try {
    clearFootprintCache()
    
    await expect(loadFootprintFromUrl(url)).rejects.toThrow()
  } finally {
    server.stop()
  }
})

test("loadFootprintFromUrl - validates response format", async () => {
  const server = new FakeFootprintServer()
  // Add invalid JSON (not an array)
  server.addFootprint("/invalid", { not: "an array" } as any)
  
  const { port } = await server.start()
  const url = `http://localhost:${port}/invalid`
  
  try {
    clearFootprintCache()
    
    await expect(loadFootprintFromUrl(url)).rejects.toThrow("expected array")
  } finally {
    server.stop()
  }
})