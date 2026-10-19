// Icônes pixel : remplacent les emojis à l'affichage, pour un rendu identique sur Windows, Mac, Linux et téléphone.
// Le code du jeu garde ses emojis (textes, listes de succès...) : ils servent de clés. Au moment de l'affichage,
// - dans la page, chaque emoji connu devient un <i class="px ..."> (petit dessin 12 x 12 agrandi sans flou) ;
// - sur le canvas, fillText / measureText dessinent et mesurent l'icône à la place de l'emoji.
// Un emoji absent de EMOJI_ICONE reste affiché tel quel (test : outils/test_icones.py le signale).

// couleurs des dessins (une lettre = une couleur, « . » = transparent, « x » = couleur du texte)
const PALETTE_ICONES = {
  k: '#15151f', w: '#ffffff', l: '#c9cfdb', g: '#8b93a5', d: '#4b5263',
  r: '#e53935', R: '#9e1c1c', p: '#ff8a80', o: '#ff9800', O: '#c25e00',
  y: '#ffd740', Y: '#c79100', G: '#4caf50', D: '#1b6e20', L: '#a5d66b',
  b: '#2f7bff', B: '#1a3a8f', c: '#40c4ff', C: '#b3e5fc',
  v: '#9c4dcc', V: '#d1a3ff', n: '#a0693a', N: '#5d3a1a', s: '#ffcc99', S: '#d9965b'
};

// 12 lignes de 12 caractères par icône
const DESSINS_ICONES = {
  menu: `
............
............
.xxxxxxxxxx.
.xxxxxxxxxx.
............
.xxxxxxxxxx.
.xxxxxxxxxx.
............
.xxxxxxxxxx.
.xxxxxxxxxx.
............
............`,
  coeur: `
............
..kkk..kkk..
.krrrkkrrrk.
krpprrrrrrRk
krprrrrrrrRk
krrrrrrrrrRk
.krrrrrrrRk.
..krrrrrRk..
...krrrRk...
....krRk....
.....kk.....
............`,
  cible: `
...kkkkkk...
..krrrrrrk..
.krwwwwwwrk.
krwwrrrrwwrk
krwrrwwrrwrk
krwrwrrwrwrk
krwrwrrwrwrk
krwrrwwrrwrk
krwwrrrrwwrk
.krwwwwwwrk.
..krrrrrrk..
...kkkkkk...`,
  bouclier: `
kkkkkkkkkkkk
kwllllllllgk
klbbbbbbbbgk
klbcbbbbbbgk
klbcbbbbbbgk
klbbbbbbbbgk
.klbbbbbbgk.
.klbbbbbbgk.
..klbbbbgk..
...klbbgk...
....klgk....
.....kk.....`,
  fusee: `
.....kk.....
....kwlk....
...kwwllk...
...kwcclk...
...kwcclk...
...kwwllk...
..krwwllrk..
.krrwwllrrk.
.krkkkkkkrk.
.kk.kyok.kk.
....kyok....
.....oo.....`,
  trophee: `
.kkkkkkkkkk.
kkywyyyyyYkk
kykwyyyyyYky
kykyyyyyyYky
.kkyyyyyyYk.
..kyyyyyYk..
...kyyyYk...
....kyYk....
....kyYk....
...kyyyYk...
..kyyyyyYk..
..kkkkkkkk..`,
  toque: `
............
.....kk.....
...kkggkk...
.kkggllggkk.
kggllllllggk
.kkggggggkky
...kddddk.ky
...kddddk.ky
...kddddk.yy
....kkkk....
............
............`,
  globe: `
...kkkkkk...
..kbbGGbbk..
.kbGGGbbbbk.
kbbGGbbbGGbk
kbbbGbbGGGbk
kbbbbbbGGbbk
kbbGGbbbbbbk
kbGGGGbbbbbk
kbbGGGbbGbbk
.kbbGbbbbbk.
..kbbbbbbk..
...kkkkkk...`,
  pistolet: `
............
............
.kkkkkkkkk..
kgllllllllkk
kgggggggglck
kddddddddkkk
.kddkkkkkk..
.kddk.......
.kddk.......
kdddk.......
kkkkk.......
............`,
  joystick: `
....kkkk....
...krrrrk...
...krprrk...
...krrrrk...
....kkkk....
.....kgk....
.....kgk....
..kkkkgkkkk.
.kllllllllk.
klrllllllllk
kggggggggggk
.kkkkkkkkkk.`,
  pause: `
............
..xxx..xxx..
..xxx..xxx..
..xxx..xxx..
..xxx..xxx..
..xxx..xxx..
..xxx..xxx..
..xxx..xxx..
..xxx..xxx..
..xxx..xxx..
..xxx..xxx..
............`,
  fiole: `
...kkkkkk...
....kwlk....
....kwlk....
....kwlk....
...kwlllk...
...kwlllk...
..kwvvvvvk..
..kvVvvvvk..
.kvvvvVvvvk.
.kvvvvvvvvk.
kvvVvvvvvvvk
.kkkkkkkkkk.`,
  question: `
............
...xxxxxx...
..xxx..xxx..
..xx....xx..
........xx..
.......xxx..
.....xxxx...
.....xx.....
.....xx.....
............
.....xx.....
.....xx.....`,
  doigt: `
....kk......
...kssk.....
...kssk.....
...ksskkkk..
.kkksskssSk.
kssksssssSk.
kssssssssSk.
kssssssssSk.
.kssssssSk..
..kssssSSk..
..ksssssSk..
..kkkkkkkk..`,
  explosion: `
.k...kk...k.
.kk.kyyk.kk.
.kokyyyykok.
..koyyyyyok.
kkoyywwyyokk
koyywwwwyyok
.koywwwwyok.
kkoyywwyyokk
..koyyyyok..
.kokoyyokok.
.kk.koook.kk
.k...kk...k.`,
  manette: `
............
............
..kkkkkkkk..
.kggggggggk.
kggwggggrggk
kgwwwggrgbgk
kggwggggyggk
kgggkkkkgggk
kggk....kggk
.kk......kk.
............
............`,
  alerte: `
.....kk.....
....kyyk....
....kyyk....
...kyyyyk...
...kykkyk...
..kyykkyyk..
..kyykkyyk..
.kyyykkyyyk.
.kyyyyyyyyk.
kyyyykkyyyyk
kyyyyyyyyyyk
kkkkkkkkkkkk`,
  rembobiner: `
............
............
.....x....x.
....xx...xx.
...xxx..xxx.
..xxxx.xxxx.
..xxxx.xxxx.
...xxx..xxx.
....xx...xx.
.....x....x.
............
............`,
  serpent: `
.....kkkk...
....kGGGGk..
....kGwkGk..
....kGGGGkr.
.kkkkGGGkk.r
kGGGGGGk....
kGGkkkk.....
kGGGGGGGkk..
.kkkkkkGGGk.
.kkkkkkkGGk.
.kGGGGGGGk..
..kkkkkkk...`,
  envahisseur: `
............
............
..V......V..
...V....V...
..VVVVVVVV..
.VVkVVVVkVV.
VVVVVVVVVVVV
V.VVVVVVVV.V
V.V......V.V
...VV..VV...
............
............`,
  eclair: `
......kkkk..
.....kyyyk..
....kyyyk...
...kyyyk....
..kyyyykkkk.
.kyyyyyyyyk.
.kkkkyyyyk..
....kyyyk...
...kyyyk....
..kyyk......
.kyk........
.kk.........`,
  sac: `
...kk..kk...
....kyyk....
....kOOk....
...kyyyyk...
..kyyyyyyk..
.kyyyYYyyyk.
.kyyYyyyyyk.
kyyyyYYyyyyk
kyyyyyyYyyyk
kyyyYYYyyyYk
.kyyyyyyyYk.
..kkkkkkkk..`,
  coche: `
............
..........x.
.........xx.
........xxx.
.x.....xxx..
.xx...xxx...
.xxx.xxx....
..xxxxx.....
...xxx......
....x.......
............
............`,
  valide: `
kkkkkkkkkkkk
kGGGGGGGGGGk
kGGGGGGGGwGk
kGGGGGGGwwGk
kGwGGGGwwGGk
kGwwGGwwGGGk
kGGwwwwGGGGk
kGGGwwGGGGGk
kGGGGGGGGGGk
kDDDDDDDDDDk
kkkkkkkkkkkk
............`,
  croix: `
............
.xx......xx.
.xxx....xxx.
..xxx..xxx..
...xxxxxx...
....xxxx....
....xxxx....
...xxxxxx...
..xxx..xxx..
.xxx....xxx.
.xx......xx.
............`,
  duo: `
..kkk.......
.kssk.kkk...
.kssk.kssk..
..kk..kssk..
.kbbk..kk...
kbbbbkkrrk..
kbbbbkrrrrk.
kbbbbkrrrrk.
kbbbbkrrrrk.
kkkkkkkkkkk.
............
............`,
  joueur: `
............
....kkkk....
...kssssk...
...kssssk...
...kssssk...
....kkkk....
...kbbbbk...
..kbbbbbbk..
..kbbbbbbk..
..kbbbbbbk..
..kkkkkkkk..
............`,
  pastille: `
....kkkk....
..kkGGGGkk..
.kGLLGGGGGk.
.kLLGGGGGGk.
kGLGGGGGGGDk
kGGGGGGGGGDk
kGGGGGGGGGDk
kGGGGGGGGGDk
.kGGGGGGGDk.
.kGGGGGGDDk.
..kkDDDDkk..
....kkkk....`,
  flocon: `
.....cc.....
..c..cc..c..
...c.cc.c...
....cccc....
.c..cwwc..c.
cccccwwccccc
cccccwwccccc
.c..cwwc..c.
....cccc....
...c.cc.c...
..c..cc..c..
.....cc.....`,
  glacon: `
............
.kkkkkkkkkk.
.kwwCCCCCCk.
.kwCCCCCCck.
.kCCCCCCCck.
.kCCCCCCCck.
.kCCCCCCCck.
.kCCCCCCCck.
.kCCCCCCCck.
.kCCCCCccck.
.kkkkkkkkkk.
............`,
  etincelles: `
...y........
...y.....y..
..yyy...yyy.
yyywyyy..y..
..yyy.......
...y........
...y....y...
........y...
......yywyy.
........y...
........y...
............`,
  ampoule: `
...kkkkkk...
..kyywyyyk..
.kyywyyyyyk.
.kywyyyyyyk.
.kyyyyyyyyk.
.kyyyyyyyyk.
..kyyyyyyk..
...kyyyyk...
...kllllk...
...kggggk...
...kllllk...
....kkkk....`,
  lecture: `
............
..x.........
..xx........
..xxx.......
..xxxx......
..xxxxx.....
..xxxxx.....
..xxxx......
..xxx.......
..xx........
..x.........
............`,
  equerre: `
kk..........
kyk.........
kyyk........
kykyk.......
kyykyk......
kyyykyk.....
kyyyykyk....
kyykkkkyk...
kyyyyyyyyk..
kykykykyyyk.
kyyyyyyyyyyk
kkkkkkkkkkkk`,
  regle: `
............
............
............
kkkkkkkkkkkk
kyyyyyyyyyyk
kykykykykyyk
kykyyykyyyyk
kyyyyyyyyyyk
kkkkkkkkkkkk
............
............
............`,
  pomme: `
.....kk.kk..
....kNkkGGk.
....kNkGGk..
..kkkNkkkk..
.krrrrrrrrk.
krwwrrrrrrRk
krwrrrrrrrRk
krrrrrrrrrRk
krrrrrrrrRRk
.krrrrrrRRk.
..krRkkRRk..
...kk..kk...`,
  couronne: `
............
............
k....kk....k
kk..kyyk..kk
kyk.kyyk.kyk
kyykyyyykyyk
kyyyyyyyyyyk
kyyryyyybyyk
kyyyyyyyyyyk
kYYYYYYYYYYk
kkkkkkkkkkkk
............`,
  chrono: `
.....kk.....
....kllk....
...kkkkkk...
..kwwwwwwk..
.kwwwkwwwwk.
.kwwwkwwwwk.
.kwwwkkkwwk.
.kwwwwwwwwk.
.kwwwwwwwlk.
..kwwwwwlk..
...kkkkkk...
............`,
  crane: `
............
...kkkkkk...
..kwwwwwwk..
.kwwwwwwwwk.
.kwkkwwkkwk.
.kwkkwwkkwk.
.kwwwwwwwwk.
..kwwkkwwk..
...kwwwwk...
...kwkwkwk..
....kkkkk...
............`,
  fete: `
..y.r...b...
r....b..y..r
...y.....b..
.b...rk.....
....kkyk..y.
y..kyyrk....
..kyrryk.r..
.kyyyyyk....
kryyrrk.....
kyyyyk......
kkkkk.......
............`,
  feu_artifice: `
.....p......
.p...p...p..
..p..r..p...
...p.r.p....
....ryr.....
pprrryrrrpp.
....ryr.....
...p.r.p....
..p..r..p...
.p...p...p..
.....p......
............`,
  palette: `
............
...kkkkkk...
..ksssssskk.
.ksrrssbbssk
kssrrssbbssk
kssskkssssk.
ksyykskGGsk.
ksyysssGGsk.
.kssssssssk.
..kkksssskk.
.....kkkk...
............`,
  oursin: `
.v...vv...v.
..v..vv..v..
...kkkkkk...
vvkVVvvvvkvv
..kVvvvvvk..
vvkvkvvkvkvv
..kvvvvvvk..
vvkvvvvvvkvv
...kkkkkk...
..v..vv..v..
.v...vv...v.
............`,
  chauve_souris: `
............
............
....v..v....
v...vvvv...v
vv.vrvvrv.vv
vvvvvvvvvvvv
vvvvvwwvvvvv
.vvvvvvvvvv.
.vv.vvvv.vv.
.v...vv...v.
............
............`,
  fantome: `
...kkkkkk...
..kwwwwwwk..
.kwwwwwwwwk.
.kwkkwwkkwk.
.kwkkwwkkwk.
.kwwwwwwwwk.
.kwwwkkwwwk.
.kwwwkkwwwk.
.kwwwwwwwwk.
.kwwwwwwwwk.
.kwwkwwkwwk.
.kk.k..k.kk.`,
  engrenage: `
.....kk.....
..k.kllk.k..
.klkllllklk.
..kllllllk..
.kllkkkkllk.
klllk..klllk
klllk..klllk
.kllkkkkllk.
..kllllllk..
.klkllllklk.
..k.kllk.k..
.....kk.....`,
  son: `
............
.....kk.....
....kllk..w.
kkkkllllk..w
kllllllk.w.w
kllllllk.w.w
kllllllk.w.w
kllllllk.w.w
kkkkllllk..w
....kllk..w.
.....kk.....
............`,
  muet: `
............
.....kk.....
....kllk....
kkkkllllk...
kllllllkr..r
kllllllk.rr.
kllllllk.rr.
kllllllkr..r
kkkkllllk...
....kllk....
.....kk.....
............`,
  livre: `
............
............
.kkkk..kkkk.
kwwwwkkwwwwk
kwggwkkwggwk
kwwwwkkwwwwk
kwggwkkwggwk
kwwwwkkwwwwk
kwggwkkwggwk
kwwwwkkwwwwk
kbbbbkkbbbbk
.kkkk..kkkk.`,
  recommencer: `
............
.x..xxxx....
.xxxx..xxx..
.xxx.....xx.
.xxxx....xx.
..........xx
..........xx
.xx......xx.
.xx......xx.
..xxx..xxx..
....xxxx....
............`,
  presse_papier: `
....kkkk....
..kkkllkkk..
.knnkkkknnk.
.knwwwwwwnk.
.knwggggwnk.
.knwwwwwwnk.
.knwgggwwnk.
.knwwwwwwnk.
.knwggggwnk.
.knwwwwwwnk.
.knnnnnnnnk.
.kkkkkkkkkk.`,
  graphique: `
............
.kkkkkkkkkk.
.kwwwwwwwwk.
.kwwwwwwrwk.
.kwwwwwwrwk.
.kwwwbwwrwk.
.kwwwbwwrwk.
.kwGwbwwrwk.
.kwGwbwwrwk.
.kwGwbwwrwk.
.kwwwwwwwwk.
.kkkkkkkkkk.`,
  cadenas: `
....kkkk....
...kllllk...
..klk..klk..
..klk..klk..
..klk..klk..
.kkkkkkkkkk.
.kyyyyyyyYk.
.kyyykkyyYk.
.kyyykkyyYk.
.kyyyykyyYk.
.kYYYYYYYYk.
.kkkkkkkkkk.`,
  cadenas_ouvert: `
......kkkk..
.....kllllk.
....klk..klk
....klk..klk
....klk.....
.kkkkkkkkkk.
.kyyyyyyyYk.
.kyyykkyyYk.
.kyyykkyyYk.
.kyyyykyyYk.
.kYYYYYYYYk.
.kkkkkkkkkk.`,
  bras: `
............
...kkk......
..ksssk.....
..kssSk..kk.
..kssk..kssk
..kssk.kssSk
..ksskksssSk
..ksssssssSk
..kssssssSk.
...kssssSk..
....kkkkk...
............`,
  deux_fleches: `
...x........
..xxx.......
.xxxxx......
...x....x...
...x....x...
...x....x...
...x....x...
...x....x...
...x....x...
......xxxxx.
.......xxx..
........x...`,
  chariot: `
kk..........
.k..........
.kkkkkkkkkkk
.kggggggggk.
..kggggggk..
..kggggggk..
...kkkkkkk..
...k........
...kkkkkkkk.
....kk...kk.
....kk...kk.
............`,
  sablier: `
.kkkkkkkkkk.
..kyyyyyyk..
..kyyyyyyk..
...kyyyyk...
....kyyk....
.....kk.....
.....kk.....
....k..k....
...k.yy.k...
..k.yyyy.k..
..kyyyyyyk..
.kkkkkkkkkk.`,
  aimant: `
............
.kkkk..kkkk.
.kwwk..kwwk.
.kwwk..kwwk.
.krrk..krrk.
.krrk..krrk.
.krrk..krrk.
.krrrkkrrrk.
..krrrrrrk..
...kkkkkk...
............
............`,
  exporter: `
.....kk.....
....kbbk....
...kbbbbk...
..kbbbbbbk..
..kkkbbkkk..
....kbbk....
kl..kbbk..lk
kl..kkkk..lk
kllllllllllk
kggggggggggk
kkkkkkkkkkkk
............`,
  disquette: `
kkkkkkkkkkk.
kbbklllkbbk.
kbbklldkbbkk
kbbklllkbbbk
kbbkkkkkbbbk
kbbbbbbbbbbk
kbkkkkkkkkbk
kbkwwwwwwkbk
kbkwggggwkbk
kbkwwwwwwkbk
kbkwggggwkbk
kkkkkkkkkkkk`,
  importer: `
....kkkk....
....kbbk....
....kbbk....
..kkkbbkkk..
..kbbbbbbk..
...kbbbbk...
kl..kbbk..lk
kl...kk...lk
kllllllllllk
kggggggggggk
kkkkkkkkkkkk
............`,
  tortue: `
............
............
....kkkk....
...kGDDGkkk.
..kGDGGDGkLk
.kGDGGGGDkLk
.kkkkkkkkkk.
.kLk....kLk.
.kk.....kk..
............
............
............`,
  fleche: `
.....xx.....
....xxxx....
...xxxxxx...
..xxxxxxxx..
.xxx.xx.xxx.
.xx..xx..xx.
.....xx.....
.....xx.....
.....xx.....
.....xx.....
.....xx.....
............`,
  clavier: `
............
............
............
kkkkkkkkkkkk
kwgwgwgwgwgk
kggggggggggk
kgwgwgwgwggk
kggggggggggk
kgwgwwwwwgwk
kggggggggggk
kkkkkkkkkkkk
............`,
  telephone: `
..kkkkkkkk..
..kggggggk..
..kgwCCCgk..
..kgCCCCgk..
..kgCCCCgk..
..kgCCCCgk..
..kgCCCCgk..
..kgCCCCgk..
..kggggggk..
..kggwwggk..
..kggggggk..
..kkkkkkkk..`,
  croix_pad: `
............
....xxxx....
....xxxx....
....xxxx....
.xxxxxxxxxx.
.xxxxxxxxxx.
.xxxxxxxxxx.
.xxxxxxxxxx.
....xxxx....
....xxxx....
....xxxx....
............`,
  souris: `
.....kk.....
...kkkkkk...
..kwwkkwwk..
..kwwkkwwk..
..kkkkkkkk..
..kllllllk..
..kllllllk..
..kllllllk..
..kllllllk..
...kllllk...
....kkkk....
............`,
  colere: `
............
...r....r...
...rr..rr...
rr..r..r..rr
.rr......rr.
............
............
.rr......rr.
rr..r..r..rr
...rr..rr...
...r....r...
............`,
  brique: `
kkkkkkkkkkkk
krrrrrgrrrrk
kRRRRRgRRRRk
kggggggggggk
krrgrrrrrgrk
kRRgRRRRRgRk
kggggggggggk
krrrrrgrrrrk
kRRRRRgRRRRk
kggggggggggk
krrgrrrrrgrk
kkkkkkkkkkkk`,
  poussin: `
............
....kkkk....
...kyyyyk...
..kyykyyyk..
..kyyyyyook.
..kyyyyyyk..
.kkwkkkkwkk.
.kwwwwwwwwk.
.kwwwwwwwlk.
..kwwwwwlk..
...kkkkkk...
............`,
  feu: `
......k.....
.....kok....
.....koOk...
....koooOk..
...kooyooOk.
..koooyyooOk
..kooyyyyook
.kooyywyyook
.kooywwwyook
.kooywwwyok.
..koyyyyok..
...kkkkkk...`,
  etoile: `
.....kk.....
....kyyk....
....kyyk....
kkkkyyyykkkk
kyyyywyyyyyk
.kyyyyyyyyk.
..kyyyyyyk..
..kyyyyyyk..
.kyyykkyyyk.
.kyyk..kyyk.
.kyk....kyk.
.kk......kk.`,
  pansement: `
............
............
............
..kkkkkkkk..
.ksskllkssk.
kssskllksssk
kssskllksssk
.ksskllkssk.
..kkkkkkkk..
............
............
............`,
  pousse: `
............
.kkk...kkk..
kLLLk.kGGGk.
kLLLLkGGGGk.
.kLLLkGGGk..
..kkkDkkk...
.....Dk.....
....kDk.....
..kkkDkkk...
.kNNNNNNNk..
.kNNNNNNNk..
..kkkkkkk...`,
  arcenciel: `
............
...rrrrrr...
..roooooor..
.royyyyyyor.
royGGGGGGyor
royGbbbbGyor
royGb..bGyor
royGb..bGyor
royGb..bGyor
............
............
............`,
  dragon: `
...k..k.....
..kGk.kGk...
..kGGkGGGk..
.kGGGGGGGGk.
.kGwkGGGGGGk
.kGkkGGGGGGk
.kGGGGGGkwkw
.kGGGGGGGGGk
..kGGGGrrrrk
...kGGGkkkk.
...kGGk.....
...kkk......`,
  coureur: `
.......ss...
.......ss...
.....bbb....
....b.bbb.s.
...s..bbbb..
......bb....
.....bbbb...
....bb..bb..
...bb....b..
..bb.....b..
.rr......rr.
............`,
  diamant: `
............
..kkkkkkkk..
.kwCCCccbbk.
kwCCCCccccbk
kbbbbbbbbbbk
.kCwCCcccbk.
..kCCccbbk..
...kCccbk...
....kcbk....
.....kk.....
............
............`,
  bobine: `
............
.kkkkkkkkkk.
.knnnnnnnnk.
..krrrrrrk..
..krRrrRrk..
..krrrrrrk..
..krRrrRrk..
..krrrrrrk..
..krRrrRrk..
.knnnnnnnnk.
.kkkkkkkkkk.
............`,
  arc: `
........gggg
.........ggg
........g.gg
.......n...g
......n.....
.....n......
....n.......
...n........
r.n.........
.rr.........
rrr.........
............`,
  telescope: `
............
........kkk.
.......kbbbk
......kbbbbk
.....kbbbbk.
...kkbbbbk..
..kbbbbkk...
.kbbbk.k....
..kk..k.k...
.....k...k..
....k.....k.
............`,
  colombe: `
............
............
............
.kwwk...kk..
.kwwwk.kwwk.
..kwwwkkwkwo
..kwwwwwwwk.
...kwwwwwwk.
kkkwwwwwwk..
.kwwwwwwk...
..kkkkkk....
............`,
  medaille: `
..kk....kk..
..krk..kbk..
...krkkbk...
...kkkkkk...
..kyyyyyyk..
.kyywyyyyYk.
.kywyyyyyYk.
.kyyyyyyyYk.
.kyyyyyyyYk.
..kyyyyyYk..
...kkkkkk...
............`,
  moai: `
..kkkkkkkk..
..kggggggk..
..kddggddk..
..kgkggkgk..
..kggggggk..
..kgggdggk..
..kggddggk..
..kggggggk..
..kgddddgk..
..kggggggk..
..kggggggk..
..kkkkkkkk..`,
  miam: `
...kkkkkk...
..kyyyyyyk..
.kyyyyyyyyk.
kyykyyyykyyk
kyykyyyykyyk
kyyyyyyyyyyk
kykyyyyyykyk
kyykkkkkkyyk
.kyyyyrryyk.
..kyyyyyyk..
...kkkkkk...
............`,
  piece: `
............
...kkkkkk...
..kyyyyyyk..
.kyYYYYYYyk.
.kyYyyyyYyk.
.kyYyYYyYyk.
.kyYyYYyYyk.
.kyYyyyyYyk.
.kyYYYYYYyk.
..kyyyyyyk..
...kkkkkk...
............`,
  rattrape: `
.......kkk..
......kyywk.
......kyyyk.
.......kkk..
....s.......
...s..ss....
..s..ssss...
.....bbb.s..
....bbbb....
....bb.bb...
...bb...bb..
..rr.....rr.`,
  cadeau: `
............
...krkkrk...
..krrkkrrk..
.kkkkkkkkkk.
.kbbbrrbbbk.
.kkkkrrkkkk.
..kbbrrbbk..
..kbbrrbbk..
..kbbrrbbk..
..kbbrrbbk..
..kkkkkkkk..
............`,
  spirale: `
............
...bbbbbb...
..b......b..
.b..bbbb..b.
.b.b....b.b.
.b.b.bb.b.b.
.b.b..b.b.b.
.b..bb..b.b.
..b....b..b.
...bbbb...b.
.........b..
.......bb...`,
  cassette: `
............
............
kkkkkkkkkkkk
kggggggggggk
kgwwwwwwwwgk
kgwkwwwwkwgk
kgwwwwwwwwgk
kggggggggggk
kgggkkkkgggk
kkkkkkkkkkkk
............
............`,
  sommet: `
......r.....
......rr....
......k.....
.....kwk....
....kwwwk...
...kwgwggk..
..kgggggggk.
.kggdgggdggk
kgdddgdddggk
kddddddddddk
kkkkkkkkkkkk
............`,
  valise: `
............
....kkkk....
....k..k....
.kkkkkkkkkk.
.knnnnnnnnk.
.knNnnnnNnk.
.knNnnnnNnk.
.knNnnnnNnk.
.knNnnnnNnk.
.knnnnnnnnk.
.kkkkkkkkkk.
..k......k..`,
  boussole: `
...kkkkkk...
..kwwwwwwk..
.kwwwrrwwwk.
kwwwwrrwwwwk
kwwwrrrrwwwk
kwwwwkkwwwwk
kwwwwkkwwwwk
kwwwggggwwwk
.kwwwggwwwk.
..kwwggwwk..
...kkkkkk...
............`,
  volcan: `
...r..o.....
....ro.r....
.....oo.....
....kook....
...knrrnk...
..knnrnnnk..
..knnnrnnk..
.knnnnnnnnk.
.knnnnnnnnk.
knnnnnnnnnnk
kkkkkkkkkkkk
............`,
  poignee: `
............
............
............
kkk......kkk
kbbkkkkkkbbk
kbbsssssSbbk
kbbsksksSbbk
kbbsssssSbbk
kkkksssSkkkk
....kkkk....
............
............`,
  travaux: `
............
............
kkkkkkkkkkkk
kwwooowwoook
kwooowwooowk
koowwwooowwk
kkkkkkkkkkkk
.kl......lk.
.kl......lk.
.kl......lk.
kkkk....kkkk
............`,
  antenne: `
.kk.........
.kwk....w...
.kwlk..w.w..
.kwllk.w..w.
.kwlllkk....
..kwllkgk...
...kwlllk...
....kkkkk...
.....kgk....
.....kgk....
...kkkkkkk..
...kgggggk..`,
  losange: `
.....kk.....
....kCCk....
...kCwCbk...
..kCwCCcbk..
.kCwCCCccbk.
kCCCCCccccbk
kbCCCccccbBk
.kbCCccccBk.
..kbCcccBk..
...kbccBk...
....kbBk....
.....kk.....`,
  bombe: `
.........y..
........o.y.
.......kk...
......kgk...
...kkkkkk...
..kddddddk..
.kddwdddddk.
.kdwddddddk.
.kddddddddk.
.kddddddddk.
..kddddddk..
...kkkkkk...`,
  ecran: `
............
kkkkkkkkkkkk
kggggggggggk
kgCwCCCCCCgk
kgwCCCCCCCgk
kgCCCCCCCCgk
kgCCCCCCCCgk
kggggggggggk
kkkkkkkkkkkk
....kggk....
..kggggggk..
..kkkkkkkk..`,
  meduse: `
....VVVV....
..VVVVVVVV..
.VVwVVVVVVV.
.VwVVVVVVVV.
VVVkVVVVkVVV
VVVVVVVVVVVV
vvvvvvvvvvvv
.v.v.v.v.v.v
.V.V.V.V.V..
..V.V.V.V.V.
.V.V.V.V.V..
..V...V...V.`,
  oeil: `
...kkkkkk...
..kwwwwwwk..
.kwrwwwwwwk.
kwwwwbbbwwrk
kwwwbbbbbwwk
kwrwbbkkbwwk
kwwwbbkkbwwk
kwwwbbbbbwrk
kwwwwbbbwwwk
.kwrwwwwwwk.
..kwwwwwwk..
...kkkkkk...`,
  robot: `
....llll....
.....gg.....
.gggggggggg.
.gllllllllg.
.glkkkkkklg.
.glkckkcklg.
.glkkkkkklg.
.gllllllllg.
.glllGllllg.
.gggggggggg.
..g......g..
............`,
  araignee: `
............
..g......g..
...g.vv.g...
g..vvvvvv..g
.g.vwvvwv.g.
..gvvvvvvg..
g..vvvvvv..g
.gvvvrrvvvg.
..vvvrrvvv..
.g.vvvvvv.g.
g...vvvv...g
............`,
  crabe: `
............
.rr......rr.
r.r......r.r
rrr.w..w.rrr
.r..k..k..r.
.r.rrrrrr.r.
..rrrrrrrr..
.rrrrrrrrrr.
.rrrkrrkrrr.
r.rRRRRRRr.r
.r.r....r.r.
............`,
  citrouille: `
.....GG.....
......G.....
..oOooooOo..
.oOooOOooOo.
oOoyyooyyoOo
oOooyooyooOo
oOooooooooOo
oOyyyyyyyyOo
oOoyoyyoyoOo
.oOooOOooOo.
..oOooooOo..
............`,
  champignon: `
....rrrr....
..rrwwrrrr..
.rrwwwrrwwr.
.rrrrrrrwwr.
rrwwrrrrrrrr
rwwwrrrwwrrr
RRRRRRRRRRRR
...ssssss...
...skssks...
...ssssss...
...ssssss...
....ssss....`,
  touche: `
kkkkkkkkkkkk
kccccccccccB
kcbbbbbbbbbB
kcbbbbbbbbbB
kcbbbbbbbbbB
kcbbbbbbbbbB
kcbbbbbbbbbB
kcbbbbbbbbbB
kcbbbbbbbbbB
kcbbbbbbbbbB
kBBBBBBBBBBB
kkkkkkkkkkkk`
};

// chiffres 3 x 5 dessinés sur la touche bleue (4️⃣, 5️⃣...)
const CHIFFRES_ICONES = {
  '0': ['xxx', 'x.x', 'x.x', 'x.x', 'xxx'], '1': ['.x.', 'xx.', '.x.', '.x.', 'xxx'],
  '2': ['xxx', '..x', 'xxx', 'x..', 'xxx'], '3': ['xxx', '..x', '.xx', '..x', 'xxx'],
  '4': ['x.x', 'x.x', 'xxx', '..x', '..x'], '5': ['xxx', 'x..', 'xxx', '..x', 'xxx'],
  '6': ['xxx', 'x..', 'xxx', 'x.x', 'xxx'], '7': ['xxx', '..x', '.x.', '.x.', '.x.'],
  '8': ['xxx', 'x.x', 'xxx', 'x.x', 'xxx'], '9': ['xxx', 'x.x', 'xxx', '..x', 'xxx']
};

// icônes tirées d'une autre : couleurs échangées ou dessin tourné d'un quart de tour (sens horaire)
const VARIANTES_ICONES = {
  serpent_corail: {de: 'serpent', couleurs: {G: 'r', r: 'y'}},
  serpent_tigre: {de: 'serpent', couleurs: {G: 'o'}},
  serpent_galaxie: {de: 'serpent', couleurs: {G: 'v', r: 'C'}},
  coeur_vide: {de: 'coeur', couleurs: {k: 'g', r: 'd', p: 'd', R: 'd'}},
  pastille_jaune: {de: 'pastille', couleurs: {G: 'y', L: 'w', D: 'Y'}},
  pastille_rouge: {de: 'pastille', couleurs: {G: 'r', L: 'p', D: 'R'}},
  pastille_bleue: {de: 'pastille', couleurs: {G: 'b', L: 'c', D: 'B'}},
  pomme_verte: {de: 'pomme', couleurs: {r: 'L', R: 'G', w: 'w'}},
  fleche_droite: {de: 'fleche', tours: 1},
  fleche_bas: {de: 'fleche', tours: 2},
  fleche_gauche: {de: 'fleche', tours: 3},
  retour: {de: 'lecture', tours: 2},
  haut: {de: 'lecture', tours: 3},
  bas: {de: 'lecture', tours: 1}
};

// emoji (sans le sélecteur de variante FE0F) -> nom de l'icône
const EMOJI_ICONE = {
  '☰': 'menu', '❤': 'coeur', '♥': 'coeur', '🖤': 'coeur_vide', '🎯': 'cible', '🛡': 'bouclier', '🚀': 'fusee',
  '🏆': 'trophee', '🎓': 'toque', '🌐': 'globe', '🔫': 'pistolet', '🕹': 'joystick', '⏸': 'pause',
  '🧪': 'fiole', '❓': 'question', '❔': 'question', '👆': 'doigt', '💥': 'explosion', '🎮': 'manette',
  '⚠': 'alerte', '⏪': 'rembobiner', '🐍': 'serpent', '👾': 'envahisseur', '⚡': 'eclair', '💰': 'sac',
  '✔': 'coche', '✓': 'coche', '✅': 'valide', '👥': 'duo', '👤': 'joueur', '🟢': 'pastille',
  '🟡': 'pastille_jaune', '🔴': 'pastille_rouge', '🔵': 'pastille_bleue', '❄': 'flocon', '🧊': 'glacon',
  '✨': 'etincelles', '💡': 'ampoule', '▶': 'lecture', '◀': 'retour', '▲': 'haut', '▼': 'bas',
  '📐': 'equerre', '📏': 'regle', '✖': 'croix', '❌': 'croix', '🍎': 'pomme', '🍏': 'pomme_verte',
  '👑': 'couronne', '⏱': 'chrono', '💀': 'crane', '☠': 'crane', '🎉': 'fete', '🎆': 'feu_artifice',
  '🎨': 'palette', '🦔': 'oursin', '🦇': 'chauve_souris', '👻': 'fantome', '🪼': 'meduse', '👁': 'oeil', '🤖': 'robot', '🕷': 'araignee', '🦀': 'crabe', '🎃': 'citrouille', '🍄': 'champignon', '⚙': 'engrenage',
  '🔊': 'son', '🔇': 'muet', '📖': 'livre', '↺': 'recommencer', '📋': 'presse_papier', '📊': 'graphique',
  '🔒': 'cadenas', '🔓': 'cadenas_ouvert', '💪': 'bras', '⇅': 'deux_fleches', '📥': 'importer', '📤': 'exporter', '🛒': 'chariot', '⏳': 'sablier', '🧲': 'aimant', '💾': 'disquette',
  '🐢': 'tortue', '↑': 'fleche', '⬆': 'fleche', '→': 'fleche_droite', '➡': 'fleche_droite',
  '↓': 'fleche_bas', '⬇': 'fleche_bas', '←': 'fleche_gauche', '⬅': 'fleche_gauche',
  '⌨': 'clavier', '📱': 'telephone', '✛': 'croix_pad', '🖱': 'souris', '💢': 'colere', '🧱': 'brique',
  '🐣': 'poussin', '🔥': 'feu', '⭐': 'etoile', '🩹': 'pansement', '🌱': 'pousse', '🐉': 'dragon',
  '🏃': 'coureur', '💎': 'diamant', '🧵': 'bobine', '🏹': 'arc', '🔭': 'telescope', '🕊': 'colombe',
  '🏅': 'medaille', '🥇': 'medaille', '🗿': 'moai', '😋': 'miam', '🪙': 'piece', '🤾': 'rattrape',
  '🎁': 'cadeau', '🌀': 'spirale', '📼': 'cassette', '🧗': 'sommet', '🧳': 'valise', '🧭': 'boussole',
  '🌋': 'volcan', '🤝': 'poignee', '🚧': 'travaux', '📡': 'antenne', '💠': 'losange', '💣': 'bombe', '🖥': 'ecran', '💻': 'ecran',
  '🪸': 'serpent_corail', '🐯': 'serpent_tigre', '🌌': 'serpent_galaxie', '🌈': 'arcenciel'
};
for (let i = 0; i <= 9; i++) EMOJI_ICONE[i + '⃣'] = 'touche_' + i;

// une seule expression pour tout trouver : les plus longs d'abord, FE0F facultatif après chaque caractère
const regexIcones = new RegExp(Object.keys(EMOJI_ICONE).sort((a, b) => b.length - a.length)
  .map(e => Array.from(e).map(ch => ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\uFE0F?').join(''))
  .join('|'), 'gu');

function nomIcone(emoji) {
  return EMOJI_ICONE[emoji.replace(/️/g, '')];
}

function lignesIcone(nom) {
  if (DESSINS_ICONES[nom]) return DESSINS_ICONES[nom].trim().split(/\s+/);
  const chiffre = /^touche_(\d)$/.exec(nom);
  if (chiffre) {
    const lignes = lignesIcone('touche').map(l => l.split(''));
    CHIFFRES_ICONES[chiffre[1]].forEach((l, y) => l.split('').forEach((ch, x) => {
      // chiffre agrandi x2 en largeur sur 2 colonnes : 6 x 5 + une ligne d'épaisseur pour la lisibilité
      if (ch === 'x') { lignes[3 + y][3 + x * 2] = 'w'; lignes[3 + y][4 + x * 2] = 'w'; }
    }));
    return lignes.map(l => l.join(''));
  }
  const v = VARIANTES_ICONES[nom];
  if (!v) return null;
  let lignes = lignesIcone(v.de);
  if (v.couleurs) lignes = lignes.map(l => l.replace(/./g, ch => v.couleurs[ch] || ch));
  for (let t = 0; t < (v.tours || 0); t++) {
    lignes = lignes[0].split('').map((_, x) => lignes.map((_, y) => lignes[lignes.length - 1 - y][x]).join(''));
  }
  return lignes;
}

// icône -> petit canvas 12 x 12 (couleur « x » donnée, blanc par défaut). Mis en cache.
const cacheIcones = {};
function canvasIcone(nom, couleurTexte) {
  const cle = nom + '|' + (couleurTexte || '');
  if (cacheIcones[cle]) return cacheIcones[cle];
  const lignes = lignesIcone(nom);
  if (!lignes) return null;
  const c = document.createElement('canvas');
  c.width = 12;
  c.height = 12;
  const g = c.getContext('2d');
  lignes.forEach((l, y) => l.split('').forEach((ch, x) => {
    const coul = ch === 'x' ? (couleurTexte || '#ffffff') : PALETTE_ICONES[ch];
    if (!coul) return;
    g.fillStyle = coul;
    g.fillRect(x, y, 1, 1);
  }));
  cacheIcones[cle] = c;
  return c;
}

function iconeMonochrome(nom) {
  return lignesIcone(nom).join('').indexOf('x') >= 0;
}

// --- dans la page : une classe CSS par icône, les monochromes prennent la couleur du texte (masque) ---
(function installerStyleIcones() {
  const noms = new Set(Object.values(EMOJI_ICONE));
  let css = '.px{display:inline-block;width:1.2em;height:1.2em;vertical-align:-0.22em;flex-shrink:0;' +
    'background:no-repeat center/contain;image-rendering:pixelated;font-style:normal}\n' +
    '.px.px-mono{background:currentColor;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;' +
    '-webkit-mask-position:center;mask-position:center;-webkit-mask-size:contain;mask-size:contain}\n';
  noms.forEach(nom => {
    const url = 'url(' + canvasIcone(nom).toDataURL() + ')';
    css += iconeMonochrome(nom)
      ? '.px-' + nom + '{-webkit-mask-image:' + url + ';mask-image:' + url + '}\n'
      : '.px-' + nom + '{background-image:' + url + '}\n';
  });
  const style = document.createElement('style');
  style.id = 'styleIcones';
  style.textContent = css;
  document.head.appendChild(style);
})();

// HTML d'une icône, pour les endroits qui veulent en placer une directement
function htmlIcone(emoji) {
  const nom = nomIcone(emoji);
  if (!nom) return emoji;
  return '<i class="px px-' + nom + (iconeMonochrome(nom) ? ' px-mono' : '') + '" data-emoji="' + emoji + '"></i>';
}

const BALISES_SANS_ICONES = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'OPTION', 'TITLE', 'CANVAS']);

function remplacerEmojisTexte(noeud) {
  const texte = noeud.nodeValue;
  regexIcones.lastIndex = 0;
  if (!texte || !regexIcones.test(texte)) return;
  const parent = noeud.parentNode;
  if (!parent || BALISES_SANS_ICONES.has(parent.nodeName) || parent.isContentEditable) return;
  const frag = document.createDocumentFragment();
  let debut = 0;
  texte.replace(regexIcones, (emoji, pos) => {
    if (pos > debut) frag.appendChild(document.createTextNode(texte.slice(debut, pos)));
    const nom = nomIcone(emoji);
    const i = document.createElement('i');
    i.className = 'px px-' + nom + (iconeMonochrome(nom) ? ' px-mono' : '');
    i.dataset.emoji = emoji;
    i.setAttribute('aria-hidden', 'true');
    frag.appendChild(i);
    debut = pos + emoji.length;
  });
  if (debut < texte.length) frag.appendChild(document.createTextNode(texte.slice(debut)));
  parent.replaceChild(frag, noeud);
}

function remplacerEmojis(racine) {
  if (racine.nodeType === 3) return remplacerEmojisTexte(racine);
  if (racine.nodeType !== 1 || BALISES_SANS_ICONES.has(racine.nodeName)) return;
  const marcheur = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT);
  const textes = [];
  while (marcheur.nextNode()) textes.push(marcheur.currentNode);
  textes.forEach(remplacerEmojisTexte);
}

// toute la page maintenant, puis tout ce que le jeu y écrira ensuite
remplacerEmojis(document.body);
new MutationObserver(mutations => mutations.forEach(m => {
  if (m.type === 'characterData') remplacerEmojisTexte(m.target);
  else m.addedNodes.forEach(remplacerEmojis);
})).observe(document.body, {childList: true, subtree: true, characterData: true});

// --- sur le canvas : fillText et measureText comprennent les emojis ---
(function installerIconesCanvas() {
  const proto = CanvasRenderingContext2D.prototype;
  const fillTextOrigine = proto.fillText;
  const measureTextOrigine = proto.measureText;

  function taillePolice(ctx) {
    const m = /(\d+(?:\.\d+)?)px/.exec(ctx.font);
    return m ? parseFloat(m[1]) : 10;
  }

  // découpe le texte en morceaux { texte } / { icone }, avec la largeur de chacun
  function morceaux(ctx, texte) {
    const cote = Math.round(taillePolice(ctx) * 1.15);
    const liste = [];
    let debut = 0;
    let largeur = 0;
    const ajouterTexte = t => {
      if (!t) return;
      const l = measureTextOrigine.call(ctx, t).width;
      liste.push({texte: t, largeur: l});
      largeur += l;
    };
    texte.replace(regexIcones, (emoji, pos) => {
      ajouterTexte(texte.slice(debut, pos));
      liste.push({icone: nomIcone(emoji), largeur: cote * 1.08});
      largeur += cote * 1.08;
      debut = pos + emoji.length;
    });
    ajouterTexte(texte.slice(debut));
    return {liste, largeur, cote};
  }

  proto.fillText = function (texte, x, y, largeurMax) {
    texte = String(texte);
    regexIcones.lastIndex = 0;
    if (!regexIcones.test(texte)) {
      return largeurMax === undefined ? fillTextOrigine.call(this, texte, x, y) : fillTextOrigine.call(this, texte, x, y, largeurMax);
    }
    const {liste, largeur, cote} = morceaux(this, texte);
    const align = this.textAlign;
    const base = this.textBaseline;
    let depart = x;
    if (align === 'center') depart = x - largeur / 2;
    else if (align === 'right' || align === 'end') depart = x - largeur;
    let haut = y - cote * 0.85;
    if (base === 'middle') haut = y - cote / 2;
    else if (base === 'top' || base === 'hanging') haut = y;
    else if (base === 'bottom' || base === 'ideographic') haut = y - cote;
    const couleur = typeof this.fillStyle === 'string' ? this.fillStyle : '#ffffff';
    this.save();
    if (largeurMax !== undefined && largeur > largeurMax) {
      this.translate(depart, 0);
      this.scale(largeurMax / largeur, 1);
      this.translate(-depart, 0);
    }
    this.textAlign = 'left';
    this.imageSmoothingEnabled = false;
    let cx = depart;
    liste.forEach(m => {
      if (m.icone) {
        const img = canvasIcone(m.icone, iconeMonochrome(m.icone) ? couleur : null);
        this.drawImage(img, Math.round(cx + (m.largeur - cote) / 2), Math.round(haut), cote, cote);
      } else {
        fillTextOrigine.call(this, m.texte, cx, y);
      }
      cx += m.largeur;
    });
    this.restore();
  };

  proto.measureText = function (texte) {
    texte = String(texte);
    regexIcones.lastIndex = 0;
    if (!regexIcones.test(texte)) return measureTextOrigine.call(this, texte);
    const sansIcones = measureTextOrigine.call(this, texte.replace(regexIcones, ''));
    const {largeur, cote} = morceaux(this, texte);
    return {
      width: largeur,
      actualBoundingBoxLeft: sansIcones.actualBoundingBoxLeft,
      actualBoundingBoxRight: largeur,
      actualBoundingBoxAscent: Math.max(sansIcones.actualBoundingBoxAscent || 0, cote * 0.85),
      actualBoundingBoxDescent: Math.max(sansIcones.actualBoundingBoxDescent || 0, cote * 0.15),
      fontBoundingBoxAscent: sansIcones.fontBoundingBoxAscent,
      fontBoundingBoxDescent: sansIcones.fontBoundingBoxDescent
    };
  };
})();
