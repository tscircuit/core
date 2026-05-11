import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("simple route json usb-c", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <chip
        name="USB1"
        footprint={
          <footprint>
            <hole
              pcbX="-2.899918mm"
              pcbY="0.9055672mm"
              diameter="0.7500112mm"
            />
            <hole pcbX="2.899918mm" pcbY="0.9055672mm" diameter="0.7500112mm" />
            <platedhole
              portHints={["pin2"]}
              pcbX="4.325112mm"
              pcbY="-2.7741308mm"
              holeWidth="0.7999984mm"
              holeHeight="1.3999972mm"
              outerWidth="1.1999976mm"
              outerHeight="1.7999964mm"
              shape="pill"
            />
            <platedhole
              portHints={["pin1"]}
              pcbX="4.325112mm"
              pcbY="1.4056932mm"
              holeWidth="0.7999984mm"
              holeHeight="1.5999968mm"
              outerWidth="1.1999976mm"
              outerHeight="1.999996mm"
              shape="pill"
            />
            <platedhole
              portHints={["pin4"]}
              pcbX="-4.325112mm"
              pcbY="1.4056932mm"
              holeWidth="0.7999984mm"
              holeHeight="1.5999968mm"
              outerWidth="1.1999976mm"
              outerHeight="1.999996mm"
              shape="pill"
            />
            <platedhole
              portHints={["pin3"]}
              pcbX="-4.325112mm"
              pcbY="-2.7741308mm"
              holeWidth="0.7999984mm"
              holeHeight="1.3999972mm"
              outerWidth="1.1999976mm"
              outerHeight="1.7999964mm"
              shape="pill"
            />
            <smtpad
              portHints={["pin5"]}
              pcbX="-1.75006mm"
              pcbY="2.1740432mm"
              width="0.2999994mm"
              height="1.2999974mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin6"]}
              pcbX="-1.249934mm"
              pcbY="2.1740432mm"
              width="0.2999994mm"
              height="1.2999974mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin7"]}
              pcbX="-0.750062mm"
              pcbY="2.1740432mm"
              width="0.2999994mm"
              height="1.2999974mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin8"]}
              pcbX="-0.249936mm"
              pcbY="2.1740432mm"
              width="0.2999994mm"
              height="1.2999974mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin9"]}
              pcbX="0.249936mm"
              pcbY="2.1740432mm"
              width="0.2999994mm"
              height="1.2999974mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin10"]}
              pcbX="0.750062mm"
              pcbY="2.1740432mm"
              width="0.2999994mm"
              height="1.2999974mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin11"]}
              pcbX="1.24968mm"
              pcbY="2.1740432mm"
              width="0.2999994mm"
              height="1.2999974mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin12"]}
              pcbX="1.75006mm"
              pcbY="2.1740432mm"
              width="0.2999994mm"
              height="1.2999974mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin13"]}
              points={[
                { x: "-2.8999688mm", y: "1.524108mm" },
                { x: "-2.8999688mm", y: "2.8241308mm" },
                { x: "-2.8999688mm", y: "2.8241308mm" },
                { x: "-3.1999682mm", y: "2.8241308mm" },
                { x: "-3.1999682mm", y: "2.8241308mm" },
                { x: "-3.1999682mm", y: "2.8239784mm" },
                { x: "-3.1999682mm", y: "2.8239784mm" },
                { x: "-3.4999422mm", y: "2.8239784mm" },
                { x: "-3.4999422mm", y: "2.8239784mm" },
                { x: "-3.4999422mm", y: "1.5239556mm" },
                { x: "-3.4999422mm", y: "1.5239556mm" },
                { x: "-3.1999428mm", y: "1.5239556mm" },
                { x: "-3.1999428mm", y: "1.5239556mm" },
                { x: "-3.1999428mm", y: "1.524108mm" },
                { x: "-3.1999428mm", y: "1.524108mm" },
                { x: "-2.8999688mm", y: "1.524108mm" },
              ]}
              shape="polygon"
            />
            <smtpad
              portHints={["pin14"]}
              points={[
                { x: "2.8999942mm", y: "2.8241308mm" },
                { x: "2.8999942mm", y: "1.5241588mm" },
                { x: "2.8999942mm", y: "1.5241588mm" },
                { x: "3.1999936mm", y: "1.5241588mm" },
                { x: "3.1999936mm", y: "1.5241588mm" },
                { x: "3.200019mm", y: "1.5241588mm" },
                { x: "3.200019mm", y: "1.5241588mm" },
                { x: "3.5000184mm", y: "1.5241588mm" },
                { x: "3.5000184mm", y: "1.5241588mm" },
                { x: "3.5000184mm", y: "2.8241308mm" },
                { x: "3.5000184mm", y: "2.8241308mm" },
                { x: "3.200019mm", y: "2.8241308mm" },
                { x: "3.200019mm", y: "2.8241308mm" },
                { x: "3.1999936mm", y: "2.8241308mm" },
                { x: "3.1999936mm", y: "2.8241308mm" },
                { x: "2.8999942mm", y: "2.8241308mm" },
              ]}
              shape="polygon"
            />
            <smtpad
              portHints={["pin15"]}
              points={[
                { x: "2.7001724mm", y: "1.5241588mm" },
                { x: "2.7001724mm", y: "2.8241308mm" },
                { x: "2.7001724mm", y: "2.8241308mm" },
                { x: "2.400173mm", y: "2.8241308mm" },
                { x: "2.400173mm", y: "2.8241308mm" },
                { x: "2.4001476mm", y: "2.8241308mm" },
                { x: "2.4001476mm", y: "2.8241308mm" },
                { x: "2.1001482mm", y: "2.8241308mm" },
                { x: "2.1001482mm", y: "2.8241308mm" },
                { x: "2.1001482mm", y: "1.5241588mm" },
                { x: "2.1001482mm", y: "1.5241588mm" },
                { x: "2.4001476mm", y: "1.5241588mm" },
                { x: "2.4001476mm", y: "1.5241588mm" },
                { x: "2.400173mm", y: "1.5241588mm" },
                { x: "2.400173mm", y: "1.5241588mm" },
                { x: "2.7001724mm", y: "1.5241588mm" },
              ]}
              shape="polygon"
            />
            <smtpad
              portHints={["pin16"]}
              points={[
                { x: "-2.0999704mm", y: "1.5240064mm" },
                { x: "-2.0999704mm", y: "2.8239784mm" },
                { x: "-2.0999704mm", y: "2.8239784mm" },
                { x: "-2.3999952mm", y: "2.8239784mm" },
                { x: "-2.3999952mm", y: "2.8239784mm" },
                { x: "-2.3999952mm", y: "2.823953mm" },
                { x: "-2.3999952mm", y: "2.823953mm" },
                { x: "-2.6999438mm", y: "2.823953mm" },
                { x: "-2.6999438mm", y: "2.823953mm" },
                { x: "-2.6999438mm", y: "1.523981mm" },
                { x: "-2.6999438mm", y: "1.523981mm" },
                { x: "-2.399919mm", y: "1.523981mm" },
                { x: "-2.399919mm", y: "1.523981mm" },
                { x: "-2.399919mm", y: "1.5240064mm" },
                { x: "-2.399919mm", y: "1.5240064mm" },
                { x: "-2.0999704mm", y: "1.5240064mm" },
              ]}
              shape="polygon"
            />
            <silkscreenpath
              route={[
                { x: -4.4689776000000165, y: -1.6757585999999947 },
                { x: -4.4689776000000165, y: 0.18715359999987413 },
              ]}
            />
            <silkscreenpath
              route={[
                { x: 4.471009600000116, y: -5.394140800000059 },
                { x: -4.4689776000000165, y: -5.394140800000059 },
                { x: -4.4689776000000165, y: -3.91283820000001 },
              ]}
            />
            <silkscreenpath
              route={[
                { x: 4.471009600000116, y: -1.676114200000029 },
                { x: 4.471009600000116, y: 0.18750920000002225 },
              ]}
            />
            <silkscreenpath
              route={[
                { x: 4.471009600000116, y: -5.394140800000059 },
                { x: 4.471009600000116, y: -3.912482600000203 },
              ]}
            />
            <silkscreentext
              text="{NAME}"
              pcbX="0.002794mm"
              pcbY="3.8286012mm"
              anchorAlignment="center"
              fontSize="1mm"
            />
            <courtyardoutline
              outline={[
                { x: -5.174805999999876, y: 3.0786011999998664 },
                { x: 5.180394000000092, y: 3.0786011999998664 },
                { x: 5.180394000000092, y: -5.650998800000025 },
                { x: -5.174805999999876, y: -5.650998800000025 },
                { x: -5.174805999999876, y: 3.0786011999998664 },
              ]}
            />
          </footprint>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
  })

  const obstacles = simpleRouteJson.obstacles
  expect(obstacles).toHaveLength(18)
})
