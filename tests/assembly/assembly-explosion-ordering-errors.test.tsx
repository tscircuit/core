import { expect, test } from "bun:test"
import { assembly, getAssemblyExplosion } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("invalid ordering and targets fail with named diagnostics even outside the selected view", async () => {
  const scenarios = [
    {
      stages: (
        <>
          <assembly.explosion.stage name="first" nextStageRef="missing" />
        </>
      ),
      error: 'references unknown stage "missing"',
    },
    {
      stages: (
        <>
          <assembly.explosion.stage name="first" nextStageRef="second" />
          <assembly.explosion.stage name="second" nextStageRef="first" />
        </>
      ),
      error: "Explosion stage ordering cycle",
    },
    {
      stages: (
        <>
          <assembly.explosion.stage name="first" />
          <assembly.explosion.stage name="first" />
        </>
      ),
      error: 'Duplicate explosion stage "DEVICE.first"',
    },
    {
      stages: (
        <>
          <assembly.explosion.stage name="first" nextStageRef="first" />
        </>
      ),
      error: "Explosion stage ordering cycle",
    },
    {
      stages: (
        <>
          <assembly.explosion.stage name="first" />
          <assembly.explosion.stage name="second">
            <assembly.explosion.move targetRef="missing" offZ="1mm" />
          </assembly.explosion.stage>
        </>
      ),
      error: 'target "missing" matched 0 assembly parts',
    },
  ]
  for (const scenario of scenarios) {
    const { circuit } = getTestFixture()
    circuit.add(
      <assembly.device name="DEVICE">{scenario.stages}</assembly.device>,
    )
    await circuit.renderUntilSettled()
    expect(() =>
      getAssemblyExplosion(circuit, {
        throughStageRef: "DEVICE.first",
        stageProgress: 0,
      }),
    ).toThrow(scenario.error)
  }
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device name="DEVICE">
      <assembly.explosion.stage name="last" prevStageRef="first" />
      <assembly.explosion.stage name="first" nextStageRef="last" />
      <assembly.explosion.stage name="middle" />
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  // Repeated descriptions of the same edge do not double-count indegrees.
  expect(getAssemblyExplosion(circuit).stages).toEqual([
    "DEVICE.first",
    "DEVICE.last",
    "DEVICE.middle",
  ])
  expect(() =>
    getAssemblyExplosion(circuit, { throughStageRef: "DEVICE.missing" }),
  ).toThrow('Unknown explosion stage "DEVICE.missing"')
  for (const stageProgress of [-1, 2, Number.NaN])
    expect(() => getAssemblyExplosion(circuit, { stageProgress })).toThrow(
      "progress must be between 0 and 1",
    )
})
