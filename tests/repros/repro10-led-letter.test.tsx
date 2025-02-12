import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const svgAlphabet = {
  "0": "M0.4544564813877358 0L0.2723441540828736 0.03592830447352719L0.1086847233315459 0.14528754990019965L0.020630545837255005 0.3040632652221331L0 0.5395277421960205L0.049259221760993496 0.7369487828466779L0.18080513776237842 0.9005494166306564L0.37036887043974215 0.9872116270037247L0.5864663759301132 1L0.8148695622827444 0.9332890276148733L0.9326583645506394 0.8113052246023419L1 0.4031281830668562L0.833288960385582 0.09886798567812842L0.6801767918233781 0.02483708485091681L0.4544564813877358 0",
  "1": "M 0.198 0.272 L 0.537 0 L 0.54 1",
  "2": "M0.069593147751606 0.19461498231706575L0.1039380353319058 0.1224291500164194L0.20543361884368308 0.05510832064153169L0.3717712794432549 0.009452970962689482L0.4785344452623127 0L0.663238590738758 0.008714098643339864L0.8017933618843684 0.04769189395915288L0.8775637379550322 0.10746757678258442L0.9047778372591005 0.17693069668193287L0.9029710920770878 0.2231347105796246L0.8704496788008566 0.30047744598157516L0.7292906538577354 0.4508486051631194L0.3737955032119913 0.7369006417749693L0 1L1 1",
  "3": "M0.03917438899874637 0.19855364635107545L0.15510940508963084 0.06745632622133718L0.37598645522339846 0L0.8486391893813088 0.0652271323161611L0.9782182415054349 0.21747394183735683L0.9213133780517754 0.3547560290117714L0.6504271515903481 0.4543436297681271L0.22975249764129613 0.48476611625264143L0.7659038682744629 0.5411919558122493L0.9258712987734741 0.6203185665660985L1 0.7458360609169667L0.8938813281118737 0.9059190913045964L0.6166890258875837 1L0.261528440153542 0.9874861530507921L0 0.8837289530851273",
  "4": "M0.7328897338403042 0L0 0.6684672518568535L1 0.6684672518568535M0.7243346007604563 0.4530722484807562L0.7243346007604563 1",
  "5": "M 0 0 L 0 0.4973 L 0.4262 0.4319 L 0.7305 0.4565 L 0.8516 0.5009 L 0.9357 0.5639 L 1 0.7356 L 0.9696 0.8248 L 0.8898 0.895 L 0.733 0.9602 L 0.5518 0.9945 L 0.3814 1 L 0.2379 0.9821 L 0.1219 0.947 L 0 0.8748 M 0 0 L 1 0",
  "6": "M0.6964601700926856 0L0.3639239026215478 0.0743562375769351L0.1415931962925719 0.21735490179786915L0.009977939399608712 0.46336322325406004L0.00029622007592593224 0.7083131475173043L0.09408885043224748 0.8746809149767036L0.3379247445101846 0.9876686500961888L0.7109203869569624 1L0.9260852957913362 0.9103558029693921L1 0.7716571969091733L0.9824294723385016 0.6390635485705886L0.7446504992867332 0.4733643097729175L0.31028858071607296 0.47578021640899115L0.1208702146816024 0.5481452483973847L0 0.6616669755788906",
  "7": "M0 0L1 0L0.9246479649697582 0.030539772727272752L0.8850302419354837 0.05075757575757579L0.7922946068548385 0.11079545454545457L0.7419268208165322 0.15213068181818185L0.6907258064516127 0.20202020202020204L0.6400666267641127 0.26122159090909086L0.5913243447580644 0.33049242424242414L0.5458740234374998 0.4105902777777778L0.5050907258064514 0.5022727272727272L0.4703495148689514 0.6062973484848484L0.43257456133442534 0.787133049242424L0.41612903225806447 1",
  "8": "M0.5143001078924863 0L0.16007477667923162 0.10731570786949331L0.14924628550868277 0.3146018498698755L0.2939585848842112 0.41617921794558677L0.8648302624811545 0.5385163833653317L1 0.7775820770511038L0.8180842915260376 0.9505845566922285L0.41968938540525413 1L0.08062381919779889 0.882831681184498L0 0.6936376947135333L0.17150171673893433 0.5188652309607817L0.6529263782780712 0.4242818653203618L0.8650205888491803 0.29644027376796367L0.8702067371119496 0.09910067291661573L0.5143001078924863 0",
  "9": "M1 0.25379591792994305L0.9514789771111742 0.11679361536614272L0.8702482473521467 0.05711741614054847L0.7327445265851579 0.015213872471965633L0.525248180711544 0L0.3292056884418538 0.012928195113745608L0.15997632037247655 0.058762870026191856L0.05266940041228321 0.12882439350476L0 0.2562067822770946L0.11316462894512366 0.4121335905917837L0.2403060136479954 0.4603365890068938L0.4097241967586011 0.4745978388276783L0.8642414300184816 0.420815170259988L0.9732054796346318 0.34537434075898393L1 0.25379591792994305M0.9647426784191072 0.35488595400360495L0.4756895081034974 1",
  A: "M0 1L0.4808333333333333 0L1 1M0.24250000000000002 0.6099439775910365L0.7341666666666666 0.6099439775910365",
  B: "M0 1L0 0.0117369978777208L0.30665717153513444 0L0.5874522807082946 0.03451403469442413L0.7766202217193218 0.15033936404895643L0.7471969743588041 0.31967962568332936L0.5246013359741988 0.4102978954282461L0.04378745314885416 0.44918617613783574L0.5112949594180156 0.469692928091109L0.8540266515643348 0.5552749498651879L1 0.6868463175009967L0.9880091196159324 0.8570018204672155L0.922301719975498 0.9321708046604659L0.7584266951758925 0.9932594737131338L0 1",
  C: "M1 0.23038928858890784L0.9328355511865092 0.12426412616785204L0.8096380839483327 0.04912601676267708L0.5763225801788256 0L0.4039037709527492 0.015028068281399815L0.2519579390951737 0.06533979308999706L0.10359458463139784 0.18146243506591617L0 0.4862728453971315L0.08129580872733055 0.792689266886982L0.20257034847159672 0.9160822255736587L0.3286572892798542 0.9738230826074175L0.5742878414421707 1L0.7883510303801312 0.9665431511195721L0.946851033994232 0.8689071500976585L1 0.7311049027121912",
  D: "M0 1L0.015604366822624637 0.020770988281483303L0.22564758265176144 0L0.3865476147957666 0.0024153386496795644L0.6479126635475078 0.051745644338731314L0.841191887805517 0.15827717679529366L0.9517008345536152 0.30172260586872185L0.9957536578687336 0.4504541551987709L1 0.5624359222498485L0.9798483279164735 0.6584121775234548L0.9386273319285215 0.7395945263504481L0.806292129480815 0.8624239259880274L0.6296239151398265 0.9406169638094516L0.3397492767598845 0.9954164354263132L0 1",
  E: "M0 0L0 1M0 0L1 0M0 0.5L0.7 0.5M0 1L1 1",
  F: "M0 0L0 1M0.011363636363636364 0.006802721088435374L1 0.006802721088435374M0.011363636363636364 0.4965986394557823L0.8409090909090909 0.4965986394557823",
  G: "M0.902666857540557 0.03860785012651126L0.6504261864675637 0L0.3838947267237336 0.015442305268228053L0.21293332876776194 0.07706794377239819L0.07799659974941617 0.1994951236187481L0 0.46380381528937314L0.04159964421546915 0.7502491408002389L0.13176692977834842 0.8535497868383203L0.2709176262273927 0.936767572377719L0.4386472596876406 0.9891638569283179L0.6145513562841309 1L0.7782254421419019 0.9585373611026471L0.9092650433859927 0.8540372997461425L1 0.5556012645283437L0.5583959277303046 0.55491741080559",
  H: "M0 0L0 1M0 0.4788732394366197L0.989010989010989 0.4788732394366197M1 0L1 1",
  I: "M0.5 0L0.5 1",
  J: "M0.9976457238788704 0L1 0.7396412315872798L0.9773931362096968 0.8322033314977973L0.9345115952458736 0.882296255506608L0.8743862896259549 0.9221331222466961L0.8024024079884948 0.9526431718061675L0.6443996712151668 0.9893997797356828L0.5035848940343224 1L0.3127211130319937 0.9877004749449337L0.17201910858386513 0.9539509911894274L0.10357419806379677 0.9212555066079295L0.053656568662899015 0.8816079295154184L0.020759483663648916 0.8360407488986785L0.003376206348523566 0.7855864537444934L0 0.7312775330396476",
  K: "M0 0L0 1M0.8787878787878788 0.06666666666666667L0 0.6148148148148148M0.3333333333333333 0.45925925925925926L1 0.9777777777777777",
  L: "M0 0L0 1L1 1",
  M: "M0 1L0 0L0.5 0.6512L1 0L1 1",
  N: "M0 1L0 0L1 1L0.9803729146221786 0",
  O: "M0.4718499217948183 1L0.2896765846490613 0.9606979309189402L0.12315162147934663 0.8411184486080473L0 0.4352399966492615L0.11730398524516283 0.13145645436014852L0.2612197451988078 0.04493357858878059L0.5104071592772554 0L0.7450113425917159 0.05393013710105273L0.882367950645524 0.15242300282020502L1 0.5224527406249126L0.9414597290654386 0.7560662329321755L0.8371289514446183 0.8910800547287298L0.6518259868433511 0.9830452628933628L0.4718499217948183 1",
  P: "M0 1L0 0.018871774228013626L0.29609603495819875 0L0.5609840637427541 0.011794858892508529L0.7332142696692472 0.04353904702296349L0.8102258645858864 0.0691965055027166L0.9330504315465442 0.14445061754775845L0.9876391714147118 0.22527816445836535L1 0.3434414070631638L0.9510549958116356 0.41772808046663146L0.8746646891596713 0.45879131862541683L0.7528523813396283 0.49171525113425024L0.5766919939969619 0.5153253033973054L0.33725744877712827 0.5284469008187558L0.025622667325582785 0.529905468802775",
  Q: "M0.4618887943546369 0.9755918167206952L0.28356128136544534 0.9372490397450218L0.12055179272160406 0.8205882753548176L0 0.4246165790405623L0.1148276047430244 0.12824784112887844L0.25570518844754375 0.043836831567190586L0.49963205786237674 0L0.7292835601228574 0.0526138004304122L0.8637404608452104 0.14870263423138746L0.9788892040030622 0.5097006183769648L0.9215847647858059 0.7376120297474734L0.8194564929275405 0.869330409436378L0.6380654214095985 0.9590509139448092L0.4618887943546369 0.9755918167206952M0.5824181120212351 0.6861805006946525L1 1",
  R: "M0 0.9928375167236815L0 0.02590227442068435L0.3611517274211098 0L0.6146286724700761 0.008660554424468435L0.7675462459194776 0.035269459580494614L0.831839975516866 0.056961676692569484L0.8847592491838954 0.08519560521497332L0.9238557535364527 0.120683646438422L0.9583303225312839 0.21691797435320384L0.955092470586235 0.3022616904894429L0.9198097669001631 0.3640573439322699L0.8564862239866702 0.40639258627024005L0.7691258543593579 0.43335506909190874L0.601775027203482 0.4539166070813109L0.023939064200217658 0.46997623755243123M0.5038084874863982 0.5108023922274467L1 1",
  S: "M0.8886929689221953 0.15146982162688968L0.7276173683050475 0.013780286031594946L0.34582323121005076 0L0.1318235250900008 0.09920162734298861L0.0444543935052531 0.2811287071349243L0.08064065829108809 0.3709571405906485L0.21603115127470426 0.4485505768228281L0.7525409135992945 0.5111160926769565L0.9330263665417677 0.5850732219351329L1 0.7129938124702524L0.9117772389978691 0.9130572743138187L0.6423187128058188 1L0.29586019579751677 0.9935291584506244L0.10638454191462794 0.9229845198431584L0 0.7570771288048773",
  T: "M0 0L1 0M0.5148514851485149 0L0.5148514851485149 1",
  U: "M0 0L0.0023103778751369115 0.5467447428390111L0.01823032542100219 0.6954785891481812L0.05895528135268338 0.8056480226151669L0.13703402031421133 0.8894445726483398L0.23918400876232196 0.9448524533417946L0.3917887458926616 0.9848674531975652L0.584341627875137 1L0.7194816196604602 0.9848501456716763L0.8303268115073934 0.9449411544119768L0.8966613970084885 0.898186315516197L0.9251437568455642 0.867453197565408L0.9687114937020809 0.7890904895145239L0.9890470974808324 0.6852857184065537L1 0.0014769088758762145",
  V: "M0 0L0.5348837209302325 1L1 0",
  W: "M0 0L0.23300090661831369 0.9873417721518988L0.49954669084315495 0.30081906180193585L0.7851314596554849 1L1 0.0215934475055845",
  X: "M0 0L0.9893617021276596 1M1 0L0.010638297872340425 1",
  Y: "M0 0L0.4860515021459227 0.44712562100780695M1 0.0014194464158977947L0.48927038626609437 0.44996451383960256L0.5075107296137339 1",
  Z: "M0 0L1 0L0 1L1 1",
  ".": "M 0.49 1 L 0.41 1",
  "*": "M 0.5 0.25 L 0.8 0.25 M 0.5 0.25 L 0.5927 0.4402 M 0.5 0.25 L 0.2573 0.3676 M 0.5 0.25 L 0.2573 0.1324 M 0.5 0.25 L 0.599 0.055",
  "(": "M0.75 0L0.25 0.5L0.25 0.5L0.75 1",
  ")": "M0.25 0L0.75 0.5L0.75 0.5L0.25 1",
  "-": "M0 0.5L1 0.5",
  "+": "M 0 0.5 L 1 0.5 M 0.5 0.125 L 0.5 0.875",
  "=": "M0 0.25L1 0.25M0 0.75L1 0.75",
  _: "M0 1 L1 1",
  "[": "M0.75 0L0.25 0L0.25 1L0.75 1",
  "]": "M0.25 0L0.75 0L0.75 1L0.25 1",
  "<": "M0.75 0L0.25 0.5L0.25 0.5L0.75 1",
  ">": "M0.25 0L0.75 0.5L0.75 0.5L0.25 1",
  "'": "M 0.5 0 L 0.5 0.5",
  '"': "M 0.25 0 L 0.25 0.5 M 0.75 0 L 0.75 0.5",
}

const lineAlphabet: Record<
  string,
  Array<{ x1: number; y1: number; x2: number; y2: number }>
> = {}
for (const letter in svgAlphabet) {
  lineAlphabet[letter] = []
  const segs = (svgAlphabet as any)[letter]
    .split("M")
    .slice(1)
    .map((seg: any) =>
      seg.split("L").map((pr: any) => pr.trim().split(" ").map(parseFloat)),
    )
  for (const seg of segs) {
    for (let i = 0; i < seg.length - 1; i++) {
      // We also flip the y axis to make it cartesian here
      lineAlphabet[letter].push({
        x1: seg[i][0],
        y1: 1 - seg[i][1],
        x2: seg[i + 1][0],
        y2: 1 - seg[i + 1][1],
      })
    }
  }
}

const getLedPositions = (letter = "w") => {
  const paths = lineAlphabet[letter.toUpperCase()]
  const positions = []
  const seen = new Set()

  for (const path of paths) {
    const x1 = path.x1
    const y1 = 1 - path.y1 // Flip vertically
    const x2 = path.x2
    const y2 = 1 - path.y2 // Flip vertically

    const dx = x2 - x1
    const dy = y2 - y1
    const length = Math.sqrt(dx * dx + dy * dy)
    const numLeds = Math.max(1, Math.round(length * 6))

    for (let i = 0; i < numLeds; i++) {
      const t = i / (numLeds - 1)
      const x = x1 + dx * t
      const y = y1 + dy * t
      const key = `${x.toFixed(1)},${y.toFixed(1)}`
      if (!seen.has(key)) {
        seen.add(key)
        positions.push({ x, y })
      }
    }
  }

  return positions
}

const LedLetter = (props) => {
  const ledPositions = getLedPositions(props.letter)
  const safeSpacing = 2 // Increased spacing to prevent collision

  return (
    <group subcircuit autorouter={{ serverCacheEnabled: true }} {...props}>
      <net name="GND" />
      <net name="VCC" />

      {ledPositions.map((pos, i) => (
        <group key={i}>
          <led
            name={`LED${i}`}
            footprint="0603"
            pcbX={`${pos.x * 40 - 20}mm`}
            pcbY={`${20 - pos.y * 40}mm`}
          />
          <resistor
            name={`R${i}`}
            resistance="100"
            footprint="0402"
            pcbX={`${pos.x * 40 - 20}mm`}
            pcbY={`${20 - pos.y * 40 - safeSpacing}mm`} // Resistor placed directly under LED
          />
          <trace from={`.LED${i} .pin1`} to={`.R${i} .pin1`} />
          <trace from={`.R${i} .pin2`} to="net.GND" />
          <trace from="net.VCC" to={`.LED${i} .pin2`} />
        </group>
      ))}
    </group>
  )
}

test.skip("led-letter first circuit", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="300mm" height="100mm">
      <LedLetter letter="I" pcbX={0} />
      <LedLetter letter="A" pcbX={60} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcb_traces = circuit
    .getCircuitJson()
    .filter((e) => e.type === "pcb_trace")

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
