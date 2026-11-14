import { expect, test } from "bun:test"
import {
  RootCircuit,
  assembly,
  checkCircuitJsonAssemblyExplosionCollisions,
  evaluateExplosionCollisionPolicy,
  getAssemblyExplosion,
  jscad,
} from "lib"

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

test("scoped contact annotation classifies expected snap-release contact as annotated_unverified_contact and preserves policy rules", async () => {
  const circuit = new RootCircuit()
  circuit.add(
    <board width="40mm" height="40mm">
      <assembly.device name="MOUNT">
        <assembly.printedpart
          name="bearing_1"
          jscad={<BearingRing zCenter={8} />}
        />
        <assembly.printedpart name="axle" jscad={<SplitAxleRest />} />
        <assembly.explosion.stage
          name="extract-axle"
          {...({
            displayName: "Extract split axle",
            instructions: "Pull the split axle straight up through bearing 1.",
          } as Record<string, unknown>)}
        >
          <assembly.explosion.move
            targetRefs={["axle"]}
            offZ={15}
            {...({
              contactAnnotations: [
                {
                  cad_explosion_contact_annotation_id: "axle-bearing-1-snap",
                  movingTargetRef: "axle",
                  obstacleTargetRef: "bearing_1",
                  region: {
                    frame: "world",
                    min: { x: -3.2, y: -3.2, z: 5.5 },
                    max: { x: 3.2, y: 3.2, z: 10.5 },
                  },
                  progressRange: [0.1, 0.7],
                  maxSweptVolumeMm3: 50,
                  operation: "snap-fit-release",
                  rationale:
                    "Split axle retaining ears compress radially while passing through the 5 mm bearing bore",
                },
              ],
            } as Record<string, unknown>)}
          />
        </assembly.explosion.stage>
      </assembly.device>
    </board>,
  )
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const check = await checkCircuitJsonAssemblyExplosionCollisions(circuitJson)
  expect(check.status).toBe("checked")
  expect(check.verificationCategory).toBe("annotated_unverified_contact")
  expect(check.errors).toHaveLength(0)
  expect(check.warnings).toHaveLength(0)
  expect(check.annotatedContacts).toHaveLength(1)
  expect(check.annotatedContacts[0]?.annotationId).toBe("axle-bearing-1-snap")
  expect(check.annotatedContacts[0]?.operation).toBe("snap-fit-release")

  // Render-phase status and persisted Circuit JSON diagnostics
  const view = getAssemblyExplosion(circuit)
  expect(view.collisionCheckStatus).toBe("checked")
  const persistedDiagnostics = circuitJson.filter(
    (el) => el.type === "cad_explosion_collision_error",
  ) as unknown as Record<string, unknown>[]
  expect(persistedDiagnostics).toHaveLength(1)
  expect(persistedDiagnostics[0]?.verification_status).toBe(
    "annotated_unverified_contact",
  )
  expect(persistedDiagnostics[0]?.is_annotated_contact).toBe(true)
  expect(persistedDiagnostics[0]?.contact_annotation_id).toBe(
    "axle-bearing-1-snap",
  )

  // Default policy fails on unverified contact; opt-in allowAnnotatedUnverifiedContacts passes
  const strictPolicy = evaluateExplosionCollisionPolicy(check)
  expect(strictPolicy.passed).toBe(false)
  expect(strictPolicy.verificationCategory).toBe("annotated_unverified_contact")

  const optInPolicy = evaluateExplosionCollisionPolicy(check, {
    allowAnnotatedUnverifiedContacts: true,
  })
  expect(optInPolicy.passed).toBe(true)
  expect(optInPolicy.blockingErrors).toHaveLength(0)
})

test("contact outside annotated region, progressRange, volume limit, move, or obstacle still fails as unexpected_collision", async () => {
  const circuit = new RootCircuit()
  circuit.add(
    <board width="40mm" height="40mm">
      <assembly.device name="MOUNT">
        <assembly.printedpart
          name="bearing_1"
          jscad={<BearingRing zCenter={8} />}
        />
        <assembly.printedpart
          name="bearing_2"
          jscad={<BearingRing zCenter={18} />}
        />
        <assembly.printedpart name="axle" jscad={<SplitAxleRest />} />
        <assembly.explosion.stage name="extract-stage-1">
          <assembly.explosion.move targetRefs={["axle"]} offZ={12} />
        </assembly.explosion.stage>
        <assembly.explosion.stage
          name="extract-stage-2"
          prevStageRef="extract-stage-1"
        >
          <assembly.explosion.move targetRefs={["axle"]} offZ={12} />
        </assembly.explosion.stage>
      </assembly.device>
    </board>,
  )
  await circuit.renderUntilSettled()
  const baseJson = circuit.getCircuitJson()

  // 1. Annotating only bearing_1 in stage 1 still fails because bearing_2 in stage 2 is unannotated
  const partialCheck = await checkCircuitJsonAssemblyExplosionCollisions(
    baseJson,
    {
      contactAnnotations: [
        {
          cad_explosion_contact_annotation_id: "stage-1-only",
          stageRef: "MOUNT.extract-stage-1",
          movingTargetRef: "axle",
          obstacleTargetRef: "bearing_1",
          region: {
            frame: "world",
            min: { x: -3.2, y: -3.2, z: 5.5 },
            max: { x: 3.2, y: 3.2, z: 10.5 },
          },
          rationale: "Stage 1 bearing 1 retention ear release",
        },
      ],
    },
  )
  expect(partialCheck.status).toBe("checked")
  expect(partialCheck.verificationCategory).toBe("unexpected_collision")
  expect(partialCheck.annotatedContacts).toHaveLength(1)
  expect(partialCheck.errors).toHaveLength(1)
  expect(
    evaluateExplosionCollisionPolicy(partialCheck, {
      allowAnnotatedUnverifiedContacts: true,
    }).passed,
  ).toBe(false)

  // 2. Contact outside the annotated spatial region still fails
  const wrongRegionCheck = await checkCircuitJsonAssemblyExplosionCollisions(
    baseJson,
    {
      contactAnnotations: [
        {
          stageRef: "MOUNT.extract-stage-1",
          movingTargetRef: "axle",
          obstacleTargetRef: "bearing_1",
          region: {
            frame: "world",
            min: { x: 10, y: 10, z: 10 },
            max: { x: 20, y: 20, z: 20 },
          },
          rationale: "Mismatched spatial region",
        },
      ],
    },
  )
  expect(wrongRegionCheck.annotatedContacts).toHaveLength(0)
  expect(wrongRegionCheck.errors.length).toBeGreaterThanOrEqual(2)

  // 3. Contact outside the annotated progressRange still fails
  const wrongProgressCheck = await checkCircuitJsonAssemblyExplosionCollisions(
    baseJson,
    {
      contactAnnotations: [
        {
          stageRef: "MOUNT.extract-stage-1",
          movingTargetRef: "axle",
          obstacleTargetRef: "bearing_1",
          region: {
            frame: "world",
            min: { x: -3.2, y: -3.2, z: 5.5 },
            max: { x: 3.2, y: 3.2, z: 10.5 },
          },
          progressRange: [0.0, 0.15],
          rationale: "Retention happens mid-stroke, not in [0, 0.15]",
        },
      ],
    },
  )
  expect(wrongProgressCheck.annotatedContacts).toHaveLength(0)
  expect(wrongProgressCheck.verificationCategory).toBe("unexpected_collision")

  // 4. Contact exceeding maxSweptVolumeMm3 still fails
  const exceededVolumeCheck = await checkCircuitJsonAssemblyExplosionCollisions(
    baseJson,
    {
      contactAnnotations: [
        {
          stageRef: "MOUNT.extract-stage-1",
          movingTargetRef: "axle",
          obstacleTargetRef: "bearing_1",
          region: {
            frame: "world",
            min: { x: -3.2, y: -3.2, z: 5.5 },
            max: { x: 3.2, y: 3.2, z: 10.5 },
          },
          maxSweptVolumeMm3: 0.05,
          rationale: "Volume guard smaller than swept ear-bore overlap",
        },
      ],
    },
  )
  expect(exceededVolumeCheck.annotatedContacts).toHaveLength(0)
  expect(exceededVolumeCheck.verificationCategory).toBe("unexpected_collision")
})

test("annotations reject wildcards/missing rationale and never relabel missing/invalid geometry as expected contact", async () => {
  const circuit = new RootCircuit()
  circuit.add(
    <board width="40mm" height="40mm">
      <assembly.device name="MOUNT">
        <assembly.printedpart
          name="bearing_1"
          jscad={<BearingRing zCenter={8} />}
        />
        <assembly.printedpart name="axle" jscad={<SplitAxleRest />} />
        <assembly.explosion.stage name="extract-axle">
          <assembly.explosion.move targetRefs={["axle"]} offZ={15} />
        </assembly.explosion.stage>
      </assembly.device>
    </board>,
  )
  await circuit.renderUntilSettled()
  const baseJson = circuit.getCircuitJson()

  // Missing rationale is rejected
  await expect(
    checkCircuitJsonAssemblyExplosionCollisions(baseJson, {
      contactAnnotations: [
        {
          stageRef: "MOUNT.extract-axle",
          movingTargetRef: "axle",
          obstacleTargetRef: "bearing_1",
          region: {
            min: { x: -4, y: -4, z: 0 },
            max: { x: 4, y: 4, z: 20 },
          },
          rationale: "   ",
        },
      ],
    }),
  ).rejects.toThrow(/requires a non-empty rationale/)

  // Missing obstacle (wildcard) is rejected
  await expect(
    checkCircuitJsonAssemblyExplosionCollisions(baseJson, {
      contactAnnotations: [
        {
          stageRef: "MOUNT.extract-axle",
          movingTargetRef: "axle",
          region: {
            min: { x: -4, y: -4, z: 0 },
            max: { x: 4, y: 4, z: 20 },
          },
          rationale: "Wildcard obstacle not allowed",
        },
      ],
    }),
  ).rejects.toThrow(/must specify obstacle_cad_component_id/)

  // Missing/unsupported geometry on a part with a contact annotation stays incomplete, never relabeled
  const missingGeometryJson = structuredClone(baseJson).map((record) => {
    if (record.type !== "cad_component") return record
    const { model_jscad: _ignored, ...rest } = record as unknown as Record<
      string,
      unknown
    >
    return rest as unknown as typeof record
  })
  const incompleteCheck = await checkCircuitJsonAssemblyExplosionCollisions(
    missingGeometryJson,
    {
      contactAnnotations: [
        {
          stageRef: "MOUNT.extract-axle",
          movingTargetRef: "axle",
          obstacleTargetRef: "bearing_1",
          region: {
            min: { x: -4, y: -4, z: 0 },
            max: { x: 4, y: 4, z: 20 },
          },
          rationale: "Annotated contact cannot mask missing geometry",
        },
      ],
    },
  )
  expect(incompleteCheck.status).toBe("incomplete")
  expect(incompleteCheck.verificationCategory).toBe("incomplete")
  expect(incompleteCheck.annotatedContacts).toHaveLength(0)
})
