import { expect, test } from "bun:test"
import {
  RootCircuit,
  assembly,
  checkCircuitJsonAssemblyExplosionCollisions,
  getAssemblyExplosion,
  getCircuitJsonAssemblyExplosion,
  jscad,
} from "lib"
import type { CadComponent } from "circuit-json"

const BearingRing = ({ zCenter }: { zCenter: number }) => (
  <jscad.subtract>
    <jscad.cylinder height={4} radius={5} center={[0, 0, zCenter]} />
    <jscad.cylinder height={5} radius={2.5} center={[0, 0, zCenter]} />
  </jscad.subtract>
)

const SplitAxleRest = () => (
  <jscad.union>
    <jscad.cylinder height={40} radius={2.2} center={[0, 0, 20]} />
    <jscad.cylinder height={2} radius={2.8} center={[0, 0, 2]} />
  </jscad.union>
)

const SplitAxleCompressed = () => (
  <jscad.union>
    <jscad.cylinder height={40} radius={2.2} center={[0, 0, 20]} />
    <jscad.cylinder height={2} radius={2.35} center={[0, 0, 2]} />
  </jscad.union>
)

test("rigid split axle pulled through 6 5mm bearing bores reports all 6 retention contacts", async () => {
  const circuit = new RootCircuit()
  const bearingZs = [6, 12, 18, 24, 30, 36]
  circuit.add(
    <board width="40mm" height="40mm">
      <assembly.device name="GEARBOX">
        {bearingZs.map((z, idx) => (
          <assembly.printedpart
            key={`bearing_${idx + 1}`}
            name={`bearing_${idx + 1}`}
            jscad={<BearingRing zCenter={z} />}
          />
        ))}
        <assembly.printedpart name="axle" jscad={<SplitAxleRest />} />
        <assembly.explosion.stage name="extract-axle">
          <assembly.explosion.move targetRefs={["axle"]} offZ={40} />
        </assembly.explosion.stage>
      </assembly.device>
    </board>,
  )
  await circuit.renderUntilSettled()

  const check = await checkCircuitJsonAssemblyExplosionCollisions(
    circuit.getCircuitJson(),
  )
  expect(check.status).toBe("checked")
  expect(check.verificationCategory).toBe("unexpected_collision")
  expect(check.errors).toHaveLength(6)
  expect(check.annotatedContacts).toHaveLength(0)
})

test("authored compressed geometry state clears 5mm bearing bore and still catches tiny unrelated obstacle", async () => {
  const circuit = new RootCircuit()
  circuit.add(
    <board width="40mm" height="40mm">
      <assembly.device name="MOUNT">
        <assembly.printedpart
          name="bearing"
          jscad={<BearingRing zCenter={8} />}
        />
        <assembly.printedpart
          name="axle"
          jscad={<SplitAxleRest />}
          {...({
            geometryStates: {
              "retaining-ears-compressed": <SplitAxleCompressed />,
            },
          } as Record<string, unknown>)}
        />
        <assembly.explosion.stage
          name="compress-ears"
          {...({
            displayName: "Compress retaining ears",
            instructions:
              "Pinch the split axle retaining ears inward before pulling through the 5 mm bearing bore.",
          } as Record<string, unknown>)}
        >
          <assembly.explosion.move
            targetRefs={["axle"]}
            {...({
              geometryState: "retaining-ears-compressed",
            } as Record<string, unknown>)}
          />
        </assembly.explosion.stage>
        <assembly.explosion.stage
          name="pull-through-bore"
          prevStageRef="compress-ears"
        >
          <assembly.explosion.move
            targetRefs={["axle"]}
            offZ={15}
            {...({
              geometryState: "retaining-ears-compressed",
            } as Record<string, unknown>)}
          />
        </assembly.explosion.stage>
        <assembly.explosion.stage
          name="release-ears"
          prevStageRef="pull-through-bore"
        >
          <assembly.explosion.move
            targetRefs={["axle"]}
            {...({
              geometryState: "rest",
            } as Record<string, unknown>)}
          />
        </assembly.explosion.stage>
      </assembly.device>
    </board>,
  )
  await circuit.renderUntilSettled()

  const nominalJson = circuit.getCircuitJson()
  const check = await checkCircuitJsonAssemblyExplosionCollisions(nominalJson)
  expect(check.status).toBe("checked")
  expect(check.verificationCategory).toBe("verified_clear")
  expect(check.errors).toHaveLength(0)
  expect(check.warnings).toHaveLength(0)

  // Deterministic forward/backward stage scrubbing and Reset without changing part identity or nominal print geometry
  const nominalAxle = nominalJson.find(
    (el): el is CadComponent =>
      el.type === "cad_component" &&
      (el as unknown as Record<string, unknown>).geometry_states !== undefined,
  )!
  expect(nominalAxle).toBeDefined()

  const duringPull = getAssemblyExplosion(circuit, {
    throughStageRef: "MOUNT.pull-through-bore",
    stageProgress: 0.5,
  })
  const pulledAxle = duringPull.circuitJson.find(
    (el): el is CadComponent =>
      el.type === "cad_component" &&
      el.cad_component_id === nominalAxle.cad_component_id,
  )!
  expect(
    (pulledAxle as unknown as Record<string, unknown>).active_geometry_state,
  ).toBe("retaining-ears-compressed")
  expect(pulledAxle.source_component_id).toBe(nominalAxle.source_component_id)
  expect(pulledAxle.model_jscad).not.toEqual(nominalAxle.model_jscad)

  const afterRelease = getCircuitJsonAssemblyExplosion(nominalJson, {
    throughStageRef: "MOUNT.release-ears",
    stageProgress: 1,
  })
  const releasedAxle = afterRelease.circuitJson.find(
    (el): el is CadComponent =>
      el.type === "cad_component" &&
      el.cad_component_id === nominalAxle.cad_component_id,
  )!
  expect(
    (releasedAxle as unknown as Record<string, unknown>).active_geometry_state,
  ).toBe("rest")
  expect(releasedAxle.model_jscad).toEqual(nominalAxle.model_jscad)

  const resetView = getCircuitJsonAssemblyExplosion(nominalJson, {
    throughStageRef: "MOUNT.compress-ears",
    stageProgress: 0,
  })
  const resetAxle = resetView.circuitJson.find(
    (el): el is CadComponent =>
      el.type === "cad_component" &&
      el.cad_component_id === nominalAxle.cad_component_id,
  )!
  expect(resetAxle.model_jscad).toEqual(nominalAxle.model_jscad)

  // Unrelated obstacle with a tiny overlap volume (~0.01 mm^3 << 1.21 mm^3 ear-bore overlap) still fails
  const withTinyObstacle = new RootCircuit()
  withTinyObstacle.add(
    <board width="40mm" height="40mm">
      <assembly.device name="MOUNT">
        <assembly.printedpart
          name="bearing"
          jscad={<BearingRing zCenter={8} />}
        />
        <assembly.printedpart
          name="tiny_burr"
          jscad={<jscad.cube size={[0.1, 0.1, 1]} center={[2.15, 0, 42]} />}
        />
        <assembly.printedpart
          name="axle"
          jscad={<SplitAxleRest />}
          {...({
            geometryStates: {
              "retaining-ears-compressed": <SplitAxleCompressed />,
            },
          } as Record<string, unknown>)}
        />
        <assembly.explosion.stage name="pull-through-bore">
          <assembly.explosion.move
            targetRefs={["axle"]}
            offZ={15}
            {...({
              geometryState: "retaining-ears-compressed",
            } as Record<string, unknown>)}
          />
        </assembly.explosion.stage>
      </assembly.device>
    </board>,
  )
  await withTinyObstacle.renderUntilSettled()
  const burrCheck = await checkCircuitJsonAssemblyExplosionCollisions(
    withTinyObstacle.getCircuitJson(),
  )
  expect(burrCheck.status).toBe("checked")
  expect(burrCheck.verificationCategory).toBe("unexpected_collision")
  expect(burrCheck.errors).toHaveLength(1)
})

test("endpoint-only state swap, missing state name, or frame-changing state reports incomplete check", async () => {
  const circuit = new RootCircuit()
  circuit.add(
    <board width="40mm" height="40mm">
      <assembly.device name="MOUNT">
        <assembly.printedpart
          name="bearing"
          jscad={<BearingRing zCenter={8} />}
        />
        <assembly.printedpart
          name="axle"
          jscad={<SplitAxleRest />}
          {...({
            geometryStates: {
              "retaining-ears-compressed": <SplitAxleCompressed />,
              "shifted-frame": {
                model_jscad: {
                  type: "cube",
                  size: [1, 1, 1],
                },
                position: { x: 5, y: 0, z: 0 },
              },
            },
          } as Record<string, unknown>)}
        />
        <assembly.explosion.stage name="pull-through-bore">
          <assembly.explosion.move
            targetRefs={["axle"]}
            offZ={15}
            {...({
              stateTransitions: [
                {
                  targetRef: "axle",
                  fromState: "rest",
                  toState: "retaining-ears-compressed",
                  transitionVerification: "endpoint_only",
                },
              ],
            } as Record<string, unknown>)}
          />
        </assembly.explosion.stage>
      </assembly.device>
    </board>,
  )
  await circuit.renderUntilSettled()

  const endpointCheck = await checkCircuitJsonAssemblyExplosionCollisions(
    circuit.getCircuitJson(),
  )
  expect(endpointCheck.status).toBe("incomplete")
  expect(endpointCheck.verificationCategory).toBe("incomplete")
  expect(endpointCheck.warnings.length).toBeGreaterThan(0)

  // Missing state name produces incomplete coverage
  const missingStateJson = structuredClone(circuit.getCircuitJson()).map(
    (record) => {
      if (record.type !== "cad_explosion_move") return record
      return {
        ...record,
        state_transitions: [{ targetRef: "axle", toState: "unknown-state" }],
      }
    },
  )
  const missingStateCheck =
    await checkCircuitJsonAssemblyExplosionCollisions(missingStateJson)
  expect(missingStateCheck.status).toBe("incomplete")
  expect(missingStateCheck.verificationCategory).toBe("incomplete")

  // Frame-changing state produces incomplete coverage
  const frameChangeJson = structuredClone(circuit.getCircuitJson()).map(
    (record) => {
      if (record.type !== "cad_explosion_move") return record
      return {
        ...record,
        state_transitions: [{ targetRef: "axle", toState: "shifted-frame" }],
      }
    },
  )
  const frameChangeCheck =
    await checkCircuitJsonAssemblyExplosionCollisions(frameChangeJson)
  expect(frameChangeCheck.status).toBe("incomplete")
  expect(frameChangeCheck.verificationCategory).toBe("incomplete")
})
