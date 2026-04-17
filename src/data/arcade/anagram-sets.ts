// ─── Anagram Blitz — Letter Sets & Dictionary ─────────────────────────────────
// Each set has 7 letters and a curated list of valid 3-7 letter words that can
// be formed using only those letters (each letter used at most once per word).

export interface AnagramSet {
  letters: string[];
  validWords: string[];
}

export const ANAGRAM_SETS: AnagramSet[] = [
  {
    letters: ['S', 'T', 'A', 'R', 'E', 'D', 'N'],
    validWords: [
      'and', 'ant', 'are', 'art', 'ate', 'den', 'ear', 'eat', 'end', 'era',
      'net', 'ran', 'rat', 'red', 'sad', 'sat', 'sea', 'set', 'tan', 'tar',
      'tea', 'ten', 'ants', 'arts', 'dare', 'darn', 'dart', 'date', 'dear',
      'dens', 'dent', 'earn', 'ears', 'east', 'eats', 'ends', 'nest', 'nets',
      'rant', 'rate', 'rats', 'read', 'rend', 'rent', 'rest', 'sand', 'sane',
      'send', 'sent', 'star', 'tare', 'tars', 'tear', 'tens', 'tend', 'tern',
      'darts', 'dates', 'deans', 'earns', 'nears', 'rants', 'rated', 'rates',
      'reads', 'rents', 'stand', 'stare', 'stern', 'tears', 'tends', 'terns',
      'trade', 'trend', 'strand', 'trades', 'trends', 'stander',
    ],
  },
  {
    letters: ['P', 'L', 'A', 'N', 'E', 'T', 'S'],
    validWords: [
      'ale', 'ant', 'ape', 'apt', 'ate', 'eat', 'lap', 'let', 'net', 'pal',
      'pan', 'pat', 'pea', 'pen', 'pet', 'sat', 'sea', 'set', 'tan', 'tap',
      'tea', 'ten', 'ants', 'eats', 'lane', 'last', 'late', 'lean', 'lent',
      'lest', 'lets', 'nest', 'nets', 'pale', 'pane', 'pant', 'past', 'peal',
      'peat', 'pelt', 'pens', 'pest', 'plan', 'plea', 'salt', 'sane', 'seal',
      'sent', 'slap', 'slat', 'step', 'tale', 'tape', 'taps', 'tens',
      'lanes', 'leapt', 'least', 'panel', 'pants', 'paste', 'petal', 'plane',
      'plans', 'plant', 'plate', 'tales', 'tapes', 'panels', 'pastel',
      'planet', 'plants', 'plates', 'planets',
    ],
  },
  {
    letters: ['C', 'R', 'E', 'A', 'T', 'I', 'N'],
    validWords: [
      'ace', 'act', 'air', 'ant', 'arc', 'are', 'art', 'ate', 'can', 'car',
      'cat', 'ear', 'eat', 'era', 'ice', 'ire', 'net', 'nit', 'ran', 'rat',
      'tan', 'tar', 'tea', 'ten', 'tie', 'tin', 'acne', 'acre', 'ante', 'cart',
      'cane', 'care', 'cite', 'earn', 'irate', 'nice', 'race', 'rain', 'rant',
      'rate', 'rein', 'rent', 'rice', 'rite', 'tear', 'tern', 'tier', 'tire',
      'tine', 'cater', 'crane', 'crate', 'enact', 'inter', 'irate', 'trace',
      'train', 'trice', 'carnet', 'certain', 'cretin',
    ],
  },
  {
    letters: ['M', 'A', 'S', 'T', 'E', 'R', 'D'],
    validWords: [
      'ads', 'arm', 'art', 'ate', 'dam', 'ear', 'eat', 'era', 'mad', 'mar',
      'mat', 'met', 'ram', 'rat', 'red', 'sad', 'sat', 'sea', 'set', 'tar',
      'tea', 'arms', 'arts', 'dame', 'dams', 'dare', 'dart', 'date', 'dear',
      'dram', 'east', 'eats', 'made', 'mare', 'mars', 'mast', 'mate', 'mead',
      'mesa', 'raft', 'rams', 'rate', 'rats', 'read', 'ream', 'rest', 'seam',
      'star', 'stem', 'tame', 'tars', 'team', 'tear', 'term', 'darts', 'dates',
      'dream', 'mated', 'mates', 'rated', 'reads', 'smart', 'stare', 'steam',
      'tamed', 'teams', 'terms', 'trade', 'dreams', 'master', 'stream',
      'trades', 'masters',
    ],
  },
  {
    letters: ['G', 'A', 'R', 'D', 'E', 'N', 'S'],
    validWords: [
      'age', 'and', 'are', 'den', 'ear', 'end', 'era', 'nag', 'rag', 'ran',
      'red', 'sad', 'sag', 'sea', 'aged', 'ages', 'dens', 'drag', 'earn',
      'ears', 'ends', 'gears', 'nags', 'near', 'rags', 'rang', 'read', 'rend',
      'sage', 'sand', 'sane', 'sang', 'snag', 'darn', 'dare', 'dean', 'dens',
      'grade', 'grand', 'range', 'reads', 'sander', 'garden', 'danger',
      'gander', 'grands', 'grades', 'ranges', 'gardens', 'dangers',
    ],
  },
  {
    letters: ['F', 'L', 'O', 'W', 'E', 'R', 'S'],
    validWords: [
      'few', 'foe', 'for', 'low', 'ore', 'owe', 'owl', 'row', 'sew', 'woe',
      'flew', 'flow', 'fore', 'fowl', 'lore', 'lose', 'lows', 'oles', 'ores',
      'owes', 'owls', 'role', 'rose', 'rows', 'self', 'slew', 'slow', 'sole',
      'sore', 'wore', 'woes', 'wolf', 'flows', 'force', 'fowls', 'lore',
      'lover', 'lower', 'roles', 'worse', 'flower', 'lowers', 'wolves',
      'flowers',
    ],
  },
  {
    letters: ['B', 'R', 'I', 'G', 'H', 'T', 'S'],
    validWords: [
      'big', 'bit', 'gig', 'gist', 'grit', 'his', 'hit', 'its', 'rib', 'rig',
      'sir', 'sit', 'brig', 'gist', 'grit', 'girth', 'grits', 'hits', 'ribs',
      'rigs', 'sigh', 'stir', 'this', 'birth', 'girth', 'girls', 'grits',
      'shirt', 'sight', 'tight', 'births', 'bright', 'brights',
    ],
  },
  {
    letters: ['W', 'I', 'N', 'T', 'E', 'R', 'S'],
    validWords: [
      'inn', 'ire', 'its', 'net', 'new', 'nit', 'set', 'sew', 'sin', 'sir',
      'sit', 'ten', 'tie', 'tin', 'wet', 'win', 'wire', 'wise', 'wit', 'wren',
      'inns', 'nest', 'nets', 'news', 'rent', 'rest', 'rise', 'rite', 'sent',
      'sewn', 'site', 'stew', 'stir', 'tens', 'tern', 'ties', 'tins', 'tire',
      'twin', 'went', 'west', 'wine', 'wins', 'wires', 'wrist', 'write',
      'inter', 'rents', 'rinse', 'stern', 'twins', 'wines', 'wires', 'wrist',
      'writes', 'winter', 'sister', 'twiner', 'winters',
    ],
  },
  {
    letters: ['S', 'P', 'O', 'R', 'T', 'E', 'D'],
    validWords: [
      'doe', 'dot', 'ore', 'opt', 'pet', 'pod', 'pot', 'pro', 'red', 'rod',
      'rot', 'set', 'sod', 'sot', 'toe', 'top', 'does', 'dope', 'dose',
      'dots', 'drop', 'odes', 'opts', 'ore', 'pert', 'pest', 'pets', 'poet',
      'pore', 'port', 'pose', 'post', 'pots', 'prod', 'reps', 'rest', 'rode',
      'rods', 'rope', 'rose', 'rote', 'spot', 'step', 'stop', 'toes', 'tops',
      'tore', 'depot', 'dopes', 'drops', 'poets', 'pored', 'pores', 'ports',
      'posed', 'prods', 'roped', 'ropes', 'sport', 'store', 'depot', 'deport',
      'deports', 'sported',
    ],
  },
  {
    letters: ['L', 'I', 'G', 'H', 'T', 'E', 'N'],
    validWords: [
      'gel', 'get', 'hen', 'hit', 'leg', 'let', 'lie', 'lit', 'net', 'nil',
      'nit', 'ten', 'the', 'tie', 'tin', 'gent', 'glen', 'hilt', 'hint',
      'tile', 'tile', 'thin', 'tine', 'ling', 'line', 'lien', 'lite', 'nine',
      'then', 'tight', 'light', 'linen', 'lithe', 'night', 'thing', 'eight',
      'length', 'lighten',
    ],
  },
  {
    letters: ['D', 'A', 'N', 'C', 'E', 'R', 'S'],
    validWords: [
      'ace', 'and', 'arc', 'are', 'can', 'car', 'den', 'ear', 'end', 'era',
      'ran', 'red', 'sad', 'sea', 'aced', 'aces', 'acne', 'acre', 'arcs',
      'cane', 'cans', 'card', 'care', 'cars', 'case', 'dane', 'dare', 'darn',
      'dean', 'dear', 'dens', 'earn', 'ears', 'ends', 'near', 'race', 'raced',
      'sand', 'sane', 'scan', 'scar', 'send', 'acres', 'canes', 'cards',
      'cared', 'crane', 'dance', 'dares', 'darns', 'deans', 'earns', 'nears',
      'races', 'reads', 'rinse', 'sander', 'dancer', 'cranes', 'dances',
      'dancers',
    ],
  },
  {
    letters: ['T', 'H', 'U', 'N', 'D', 'E', 'R'],
    validWords: [
      'den', 'due', 'dun', 'end', 'hen', 'her', 'hue', 'hut', 'net', 'nut',
      'red', 'run', 'rut', 'ten', 'the', 'dent', 'dune', 'hurt', 'herd',
      'hunt', 'rend', 'rent', 'rude', 'rune', 'tend', 'tern', 'then', 'true',
      'tune', 'turn', 'under', 'tuned', 'turns', 'trend', 'hunter', 'turned',
      'thunder',
    ],
  },
  {
    letters: ['S', 'H', 'A', 'R', 'P', 'E', 'N'],
    validWords: [
      'ape', 'are', 'ash', 'ear', 'era', 'her', 'nap', 'pan', 'par', 'pea',
      'pen', 'per', 'ran', 'rap', 'sea', 'apes', 'earn', 'ears', 'hare',
      'harp', 'heap', 'hear', 'hens', 'nape', 'naps', 'near', 'pane', 'pans',
      'pare', 'pars', 'pear', 'peas', 'pens', 'raps', 'rash', 'reap', 'sane',
      'sear', 'snap', 'span', 'spare', 'hares', 'harps', 'heaps', 'hears',
      'nears', 'panes', 'pares', 'pears', 'reaps', 'shape', 'share', 'sharp',
      'snare', 'spear', 'shaper', 'sharpen',
    ],
  },
  {
    letters: ['C', 'L', 'O', 'U', 'D', 'E', 'S'],
    validWords: [
      'cod', 'cue', 'doe', 'due', 'duo', 'led', 'ode', 'old', 'sol', 'sue',
      'use', 'clod', 'clue', 'code', 'cold', 'cole', 'cued', 'cues', 'does',
      'dole', 'dose', 'douse', 'duel', 'dues', 'lode', 'lose', 'loud', 'louse',
      'odes', 'ogle', 'sloe', 'sole', 'sold', 'soul', 'used', 'close', 'closed',
      'cloud', 'clods', 'clued', 'clues', 'codes', 'colds', 'dolls', 'doles',
      'duels', 'locus', 'lodes', 'souls', 'clouds', 'closed', 'cloused',
    ],
  },
  {
    letters: ['B', 'R', 'E', 'A', 'K', 'I', 'N'],
    validWords: [
      'air', 'are', 'ark', 'ban', 'bar', 'bin', 'ear', 'era', 'ink', 'ire',
      'irk', 'kin', 'nab', 'ran', 'rib', 'bake', 'bane', 'bank', 'bare',
      'bark', 'barn', 'beak', 'bean', 'bear', 'bike', 'bran', 'earn', 'knit',
      'near', 'rain', 'rake', 'rank', 'rein', 'rink', 'baker', 'brake',
      'break', 'brain', 'crane', 'drink', 'inker', 'baker', 'brink',
      'ranking', 'breaking',
    ],
  },
  {
    letters: ['M', 'O', 'U', 'N', 'T', 'E', 'D'],
    validWords: [
      'den', 'doe', 'don', 'dot', 'due', 'dun', 'duo', 'end', 'men', 'met',
      'mod', 'mud', 'mum', 'net', 'nod', 'not', 'nut', 'ode', 'one', 'out',
      'ten', 'toe', 'ton', 'dent', 'demo', 'dome', 'done', 'dote', 'dune',
      'duet', 'dune', 'mend', 'menu', 'mode', 'mole', 'mote', 'mound', 'mount',
      'mute', 'node', 'note', 'nude', 'omen', 'tend', 'tone', 'toned', 'tune',
      'undo', 'unit', 'demon', 'mound', 'mount', 'noted', 'toned', 'tuned',
      'mounted',
    ],
  },
  {
    letters: ['S', 'I', 'L', 'V', 'E', 'R', 'N'],
    validWords: [
      'ire', 'lie', 'nil', 'sir', 'sin', 'vie', 'evil', 'lien', 'lies',
      'line', 'live', 'rein', 'rise', 'vein', 'vile', 'vine', 'rile', 'sire',
      'liven', 'liner', 'lines', 'liver', 'lives', 'reins', 'rinse', 'riven',
      'river', 'veins', 'vines', 'liners', 'silver', 'sliver', 'livers',
    ],
  },
  {
    letters: ['P', 'I', 'C', 'T', 'U', 'R', 'E'],
    validWords: [
      'cup', 'cur', 'cut', 'ice', 'ire', 'per', 'pet', 'pie', 'pit', 'put',
      'rip', 'rut', 'tie', 'tip', 'cite', 'cure', 'epic', 'pier', 'pure',
      'rice', 'ripe', 'rite', 'ripe', 'tier', 'tire', 'trip', 'true', 'trice',
      'truce', 'erupt', 'price', 'ripen', 'cuter', 'recoup', 'recipe',
      'picture',
    ],
  },
  {
    letters: ['D', 'R', 'A', 'W', 'I', 'N', 'G'],
    validWords: [
      'aid', 'air', 'and', 'dig', 'din', 'gin', 'nag', 'rag', 'ran', 'raw',
      'rid', 'rig', 'wag', 'war', 'wig', 'win', 'arid', 'darn', 'drag',
      'draw', 'grin', 'grid', 'rain', 'rang', 'rind', 'ring', 'wand', 'warn',
      'wind', 'wing', 'drain', 'grain', 'grind', 'wading', 'wiring',
      'drawing',
    ],
  },
  {
    letters: ['H', 'A', 'M', 'M', 'E', 'R', 'S'],
    validWords: [
      'arm', 'ash', 'ear', 'era', 'ham', 'has', 'hem', 'her', 'mar', 'ram',
      'sea', 'she', 'arms', 'ears', 'hams', 'hare', 'harm', 'hare', 'hear',
      'hers', 'mare', 'mars', 'mash', 'mesh', 'rams', 'rash', 'ream', 'seam',
      'sham', 'harem', 'harms', 'mares', 'marsh', 'reams', 'shame', 'share',
      'shear', 'hammer', 'harems', 'shammer', 'hammers',
    ],
  },
  {
    letters: ['T', 'R', 'A', 'V', 'E', 'L', 'S'],
    validWords: [
      'ale', 'are', 'art', 'ate', 'ear', 'eat', 'era', 'let', 'rat', 'sat',
      'sea', 'set', 'tar', 'tea', 'vet', 'ales', 'arts', 'east', 'eats',
      'last', 'late', 'lest', 'rate', 'rats', 'rave', 'real', 'rest', 'salt',
      'save', 'seal', 'slat', 'star', 'tale', 'tare', 'tars', 'tear', 'vale',
      'vase', 'vast', 'vest', 'alert', 'alter', 'avert', 'later', 'ravel',
      'salve', 'slave', 'stale', 'stare', 'steal', 'tales', 'tears', 'valet',
      'travel', 'travels',
    ],
  },
  {
    letters: ['S', 'T', 'R', 'I', 'K', 'E', 'N'],
    validWords: [
      'ink', 'ire', 'irk', 'its', 'kin', 'kit', 'net', 'nit', 'set', 'sin',
      'sir', 'sit', 'ski', 'ten', 'tie', 'tin', 'inks', 'kite', 'kits',
      'nest', 'nets', 'nits', 'rent', 'rest', 'rink', 'rise', 'rite', 'sent',
      'sink', 'site', 'skin', 'skit', 'stir', 'tens', 'tern', 'ties', 'tins',
      'tire', 'inert', 'inter', 'kites', 'rents', 'rinse', 'rinks', 'stern',
      'tires', 'strike', 'stinker', 'strikes', 'reknits', 'stinker',
    ],
  },
  {
    letters: ['O', 'R', 'A', 'N', 'G', 'E', 'S'],
    validWords: [
      'age', 'ago', 'are', 'ear', 'ego', 'era', 'nag', 'nor', 'oar', 'one',
      'ore', 'rag', 'ran', 'roe', 'sea', 'son', 'ages', 'ears', 'earn',
      'goes', 'gone', 'gore', 'nags', 'near', 'nose', 'oars', 'ones', 'ores',
      'rags', 'rang', 'sage', 'sane', 'sang', 'sear', 'snag', 'soar', 'sore',
      'anger', 'earns', 'goers', 'goner', 'gorge', 'nears', 'range', 'snare',
      'snore', 'anger', 'orange', 'ranges', 'reason', 'oranges',
    ],
  },
  {
    letters: ['C', 'H', 'A', 'N', 'G', 'E', 'S'],
    validWords: [
      'ace', 'age', 'ash', 'can', 'gas', 'has', 'hen', 'nag', 'sag', 'sea',
      'she', 'aces', 'acne', 'ages', 'cage', 'cane', 'cans', 'case', 'each',
      'gash', 'hens', 'nags', 'sage', 'sane', 'sang', 'scan', 'snag',
      'aches', 'cages', 'canes', 'chase', 'gangs', 'range', 'change',
      'changes',
    ],
  },
  {
    letters: ['P', 'A', 'I', 'N', 'T', 'E', 'R'],
    validWords: [
      'air', 'ant', 'ape', 'apt', 'are', 'art', 'ate', 'ear', 'eat', 'era',
      'ire', 'nap', 'net', 'nit', 'pan', 'par', 'pat', 'pea', 'pen', 'per',
      'pet', 'pie', 'pin', 'pit', 'rain', 'ran', 'rap', 'rat', 'rip', 'tan',
      'tap', 'tar', 'tea', 'ten', 'tie', 'tin', 'tip', 'ante', 'pane', 'pant',
      'pare', 'part', 'pear', 'peat', 'pine', 'pint', 'rain', 'rant', 'rate',
      'rein', 'rent', 'ripe', 'tape', 'tare', 'tear', 'tern', 'tier', 'tine',
      'tire', 'trap', 'trip', 'irate', 'inter', 'paint', 'panic', 'pater',
      'pear', 'print', 'ripen', 'taper', 'train', 'painter', 'repaint',
    ],
  },
  {
    letters: ['S', 'O', 'L', 'D', 'I', 'E', 'R'],
    validWords: [
      'die', 'doe', 'ire', 'led', 'lid', 'lie', 'ode', 'oil', 'old', 'ore',
      'red', 'rid', 'rod', 'roe', 'sir', 'die', 'does', 'dole', 'dose',
      'idle', 'idol', 'lied', 'lode', 'lore', 'lose', 'odes', 'oils', 'oiled',
      'oldie', 'olds', 'ores', 'ride', 'rile', 'rise', 'rode', 'rods', 'role',
      'rose', 'side', 'silo', 'sire', 'slid', 'slim', 'sod', 'soil', 'sold',
      'sole', 'sore', 'doles', 'idler', 'idles', 'lodes', 'oiled', 'older',
      'rides', 'riled', 'roles', 'slide', 'slider', 'soiled', 'soldier',
    ],
  },
  {
    letters: ['L', 'E', 'A', 'D', 'I', 'N', 'G'],
    validWords: [
      'age', 'aid', 'ale', 'and', 'den', 'die', 'dig', 'din', 'end', 'gal',
      'gel', 'gin', 'lad', 'lag', 'led', 'leg', 'lid', 'lie', 'nag', 'nil',
      'aged', 'aide', 'dale', 'dean', 'deal', 'dial', 'dine', 'gale', 'gild',
      'glad', 'glen', 'glide', 'idea', 'idle', 'lain', 'land', 'lane', 'lead',
      'lean', 'lend', 'lied', 'lien', 'line', 'nail', 'align', 'angel',
      'angle', 'glide', 'ideal', 'lined', 'aligned', 'dealing', 'leading',
    ],
  },
  {
    letters: ['M', 'A', 'R', 'K', 'E', 'T', 'S'],
    validWords: [
      'are', 'ark', 'arm', 'art', 'ate', 'ear', 'eat', 'era', 'mar', 'mat',
      'met', 'ram', 'rat', 'sat', 'sea', 'set', 'tar', 'tea', 'arms', 'arts',
      'eats', 'make', 'mare', 'mark', 'mars', 'mask', 'mast', 'mate', 'mesa',
      'rake', 'rams', 'rate', 'rats', 'ream', 'rest', 'sake', 'seam', 'soak',
      'star', 'stem', 'take', 'tame', 'tare', 'tars', 'task', 'team', 'tear',
      'term', 'maker', 'makes', 'marks', 'mates', 'rates', 'reams', 'skate',
      'smart', 'stake', 'stare', 'steak', 'steam', 'takes', 'tamer', 'tears',
      'terms', 'market', 'master', 'stream', 'markets',
    ],
  },
  {
    letters: ['W', 'A', 'R', 'N', 'I', 'N', 'G'],
    validWords: [
      'air', 'gin', 'inn', 'nag', 'rag', 'ran', 'raw', 'rig', 'wag', 'war',
      'wig', 'win', 'gain', 'grin', 'rain', 'rang', 'ring', 'wand', 'warn',
      'wing', 'grain', 'waning', 'wiring', 'warning',
    ],
  },
  {
    letters: ['S', 'C', 'R', 'E', 'E', 'N', 'D'],
    validWords: [
      'den', 'end', 'ere', 'red', 'see', 'dens', 'deer', 'ends', 'need',
      'rend', 'seed', 'seen', 'send', 'seer', 'cede', 'cedes', 'creed',
      'dense', 'needs', 'rends', 'scene', 'scree', 'seeds', 'sneer',
      'screen', 'secede', 'screened',
    ],
  },
  {
    letters: ['P', 'O', 'W', 'E', 'R', 'F', 'U'],
    validWords: [
      'few', 'foe', 'for', 'for', 'fur', 'ore', 'our', 'owe', 'per', 'pow',
      'pro', 'pew', 'row', 'rue', 'woe', 'woe', 'fore', 'four', 'pour',
      'pure', 'rope', 'wore', 'woke', 'power', 'prove', 'tower',
      'powerful',
    ],
  },
  {
    letters: ['B', 'A', 'T', 'T', 'L', 'E', 'S'],
    validWords: [
      'ale', 'ate', 'bat', 'bet', 'eat', 'lab', 'last', 'late', 'let', 'sat',
      'sea', 'set', 'tab', 'tea', 'able', 'bale', 'base', 'bats', 'beat',
      'bell', 'belt', 'best', 'beta', 'blast', 'east', 'eats', 'labs', 'last',
      'late', 'least', 'salt', 'seat', 'slab', 'slat', 'stable', 'stale',
      'state', 'steal', 'table', 'tales', 'taste', 'battle', 'stable',
      'tables', 'battles',
    ],
  },
  {
    letters: ['H', 'U', 'N', 'T', 'I', 'N', 'G'],
    validWords: [
      'gin', 'gun', 'gut', 'hug', 'hun', 'hut', 'inn', 'nit', 'nit', 'nut',
      'tin', 'tug', 'hint', 'hung', 'hunt', 'unit', 'night', 'thing', 'tight',
      'tuning', 'hunting',
    ],
  },
  {
    letters: ['J', 'U', 'M', 'P', 'I', 'N', 'G'],
    validWords: [
      'gig', 'gin', 'gum', 'gun', 'jig', 'jug', 'mug', 'nip', 'nun', 'peg',
      'pig', 'pin', 'pug', 'pun', 'gimp', 'jump', 'ping', 'pimp', 'jumps',
      'jumping',
    ],
  },
  {
    letters: ['C', 'R', 'O', 'W', 'N', 'E', 'D'],
    validWords: [
      'cod', 'con', 'cow', 'den', 'dew', 'doe', 'don', 'end', 'new', 'nod',
      'nor', 'now', 'ode', 'one', 'ore', 'owe', 'own', 'red', 'rod', 'roe',
      'row', 'wed', 'woe', 'won', 'wore', 'wren', 'code', 'cone', 'cord',
      'core', 'corn', 'crew', 'crow', 'done', 'down', 'drew', 'once', 'owed',
      'rode', 'worn', 'crone', 'crown', 'drown', 'owned', 'owner', 'rowed',
      'wonder', 'crowned',
    ],
  },
  {
    letters: ['S', 'E', 'C', 'U', 'R', 'E', 'D'],
    validWords: [
      'cue', 'cur', 'due', 'ere', 'red', 'rue', 'see', 'sue', 'use', 'cede',
      'cure', 'cues', 'deer', 'dues', 'rude', 'rues', 'ruse', 'seed', 'seer',
      'sure', 'used', 'user', 'crude', 'creed', 'cured', 'cures', 'curse',
      'reuse', 'scree', 'secure', 'reduce', 'secured',
    ],
  },
  {
    letters: ['S', 'T', 'R', 'A', 'I', 'N', 'G'],
    validWords: [
      'air', 'ant', 'art', 'gin', 'its', 'nag', 'nit', 'rag', 'ran', 'rat',
      'rig', 'sag', 'sat', 'sin', 'sir', 'sit', 'tag', 'tan', 'tar', 'tin',
      'airs', 'ants', 'arts', 'gain', 'gait', 'gist', 'grin', 'grit', 'rain',
      'rang', 'rant', 'rats', 'ring', 'sang', 'sign', 'sing', 'stag', 'star',
      'stir', 'tans', 'tars', 'gains', 'grains', 'grant', 'grins', 'grits',
      'rains', 'rants', 'rings', 'saint', 'satin', 'sting', 'stair', 'train',
      'grains', 'rating', 'strain', 'string', 'trains', 'staring', 'ratings',
    ],
  },
  {
    letters: ['F', 'I', 'G', 'H', 'T', 'E', 'R'],
    validWords: [
      'fig', 'fit', 'get', 'her', 'hit', 'ire', 'rig', 'the', 'tie', 'fire',
      'fir', 'gig', 'gift', 'girth', 'grit', 'heir', 'hire', 'rift', 'right',
      'rite', 'the', 'their', 'thief', 'tiger', 'tight', 'tire', 'trig',
      'fight', 'eight', 'fright', 'figure', 'fighter',
    ],
  },
  {
    letters: ['S', 'P', 'R', 'I', 'N', 'T', 'E'],
    validWords: [
      'ire', 'its', 'net', 'nip', 'nit', 'pen', 'per', 'pet', 'pie', 'pin',
      'pit', 'rip', 'set', 'sin', 'sip', 'sir', 'sit', 'ten', 'tie', 'tin',
      'tip', 'inert', 'insert', 'nest', 'nets', 'nips', 'nits', 'pens', 'pert',
      'pest', 'pets', 'pine', 'pins', 'pint', 'rein', 'rent', 'rest', 'ripe',
      'rise', 'rite', 'sent', 'site', 'siren', 'snipe', 'spine', 'spite',
      'step', 'stir', 'tens', 'tern', 'ties', 'tins', 'tire', 'tips', 'trip',
      'inter', 'pines', 'pints', 'print', 'reins', 'rents', 'rinse', 'stern',
      'tires', 'trips', 'prints', 'sprint', 'stripe',
    ],
  },
  {
    letters: ['E', 'N', 'G', 'I', 'N', 'E', 'S'],
    validWords: [
      'gin', 'inn', 'see', 'sin', 'gins', 'genie', 'inns', 'nine', 'seen',
      'sign', 'sine', 'sing', 'nines', 'seeing', 'engine', 'engines',
    ],
  },
  {
    letters: ['L', 'A', 'U', 'N', 'C', 'H', 'E'],
    validWords: [
      'ace', 'ale', 'can', 'cue', 'hen', 'hue', 'lace', 'lane', 'lean',
      'each', 'clan', 'clue', 'haul', 'heal', 'lace', 'lane', 'lean', 'lunch',
      'uncle', 'clean', 'lance', 'leach', 'lunch', 'launch',
    ],
  },
  {
    letters: ['D', 'I', 'S', 'C', 'O', 'V', 'E'],
    validWords: [
      'cod', 'die', 'dis', 'doe', 'ice', 'ode', 'vie', 'code', 'cove', 'dice',
      'dies', 'disc', 'dive', 'does', 'dose', 'dove', 'iced', 'ides', 'odes',
      'side', 'vice', 'void', 'codes', 'coves', 'dices', 'disco', 'dives',
      'doves', 'vices', 'video', 'voice', 'videos', 'voices', 'advise',
      'discover',
    ],
  },
  {
    letters: ['R', 'E', 'S', 'P', 'O', 'N', 'D'],
    validWords: [
      'den', 'doe', 'don', 'end', 'nod', 'nor', 'ode', 'one', 'ore', 'pen',
      'per', 'pod', 'pro', 'red', 'rod', 'roe', 'son', 'sod', 'dens', 'does',
      'done', 'dope', 'dose', 'drop', 'ends', 'nods', 'node', 'nope', 'nose',
      'odes', 'ones', 'open', 'ores', 'pens', 'pond', 'pore', 'pose', 'prod',
      'rend', 'rode', 'rods', 'rope', 'rose', 'send', 'snore', 'drone',
      'drones', 'nodes', 'opens', 'ponds', 'pored', 'posed', 'prods', 'prone',
      'ropes', 'spend', 'spore', 'snored', 'person', 'ponder', 'respond',
    ],
  },
  {
    letters: ['C', 'A', 'P', 'T', 'U', 'R', 'E'],
    validWords: [
      'ace', 'act', 'ape', 'apt', 'arc', 'are', 'art', 'ate', 'cap', 'car',
      'cat', 'cup', 'cur', 'cut', 'ear', 'eat', 'era', 'par', 'pat', 'pea',
      'per', 'pet', 'put', 'rap', 'rat', 'rut', 'tap', 'tar', 'tea', 'acre',
      'cape', 'care', 'carp', 'cart', 'crate', 'cute', 'pace', 'pare', 'part',
      'pear', 'peat', 'pure', 'race', 'rape', 'rate', 'reap', 'tape', 'tare',
      'tear', 'trap', 'true', 'caper', 'cater', 'crate', 'erupt', 'trace',
      'carpet', 'capture',
    ],
  },
  {
    letters: ['V', 'O', 'L', 'U', 'M', 'E', 'S'],
    validWords: [
      'elm', 'emu', 'lov', 'mum', 'muse', 'mole', 'move', 'mule', 'muse',
      'oles', 'oven', 'oval', 'lose', 'love', 'louse', 'moles', 'mouse',
      'moves', 'mules', 'solve', 'value', 'voles', 'volume', 'volumes',
    ],
  },
  {
    letters: ['S', 'W', 'I', 'T', 'C', 'H', 'E'],
    validWords: [
      'hit', 'ice', 'its', 'set', 'sew', 'she', 'sit', 'the', 'tie', 'wet',
      'wich', 'wit', 'chew', 'cite', 'etch', 'hewn', 'hiss', 'hits', 'ices',
      'itch', 'site', 'stew', 'this', 'west', 'whit', 'wick', 'wise', 'wish',
      'wits', 'chest', 'chews', 'heist', 'stitch', 'switch', 'twitch',
      'witches',
    ],
  },
  {
    letters: ['B', 'R', 'I', 'D', 'G', 'E', 'S'],
    validWords: [
      'bed', 'bid', 'big', 'dig', 'ire', 'red', 'rib', 'rid', 'rig', 'sir',
      'beg', 'beds', 'bids', 'bird', 'dire', 'digs', 'gird', 'grid', 'ride',
      'ribs', 'rids', 'rigs', 'rise', 'side', 'sire', 'birds', 'bride',
      'dirge', 'grids', 'rides', 'ridge', 'brides', 'bridge', 'ridges',
      'bridges',
    ],
  },
  {
    letters: ['C', 'O', 'M', 'P', 'U', 'T', 'E'],
    validWords: [
      'cop', 'cot', 'cup', 'cut', 'met', 'mop', 'mut', 'opt', 'out', 'pet',
      'pot', 'put', 'toe', 'top', 'come', 'comp', 'cope', 'coup', 'cute',
      'mope', 'mote', 'mute', 'poem', 'poet', 'tempo', 'comet', 'compute',
    ],
  },
  {
    letters: ['N', 'E', 'T', 'W', 'O', 'R', 'K'],
    validWords: [
      'net', 'new', 'nor', 'not', 'now', 'one', 'ore', 'owe', 'own', 'row',
      'ten', 'toe', 'ton', 'too', 'tow', 'two', 'wet', 'woe', 'wok', 'won',
      'woe', 'wore', 'woke', 'work', 'woke', 'wren', 'knot', 'knew', 'know',
      'note', 'rent', 'rote', 'tone', 'tore', 'torn', 'town', 'trek', 'trow',
      'went', 'woke', 'wore', 'work', 'worm', 'worn', 'note', 'tower', 'token',
      'wrote', 'worker', 'network',
    ],
  },
  {
    letters: ['P', 'R', 'O', 'B', 'L', 'E', 'M'],
    validWords: [
      'elm', 'lob', 'mob', 'mop', 'ore', 'orb', 'per', 'pro', 'rob', 'roe',
      'role', 'bore', 'lobe', 'lore', 'mole', 'more', 'pole', 'pore', 'prey',
      'robe', 'role', 'rope', 'moper', 'probe', 'problem',
    ],
  },
  {
    letters: ['T', 'E', 'A', 'C', 'H', 'E', 'R'],
    validWords: [
      'ace', 'act', 'arc', 'are', 'art', 'ate', 'car', 'cat', 'ear', 'eat',
      'era', 'hat', 'her', 'rat', 'tar', 'tea', 'the', 'acre', 'arch', 'care',
      'cart', 'char', 'chat', 'each', 'etch', 'hare', 'hate', 'hear', 'heat',
      'here', 'race', 'rate', 'reach', 'tare', 'tear', 'tree', 'cheat',
      'crate', 'earth', 'heart', 'reach', 'teach', 'trace', 'three', 'cheer',
      'create', 'heater', 'reheat', 'teacher',
    ],
  },
  {
    letters: ['E', 'X', 'P', 'L', 'O', 'R', 'E'],
    validWords: [
      'eel', 'lop', 'ore', 'per', 'pro', 'roe', 'lore', 'lope', 'peel',
      'peer', 'pole', 'pore', 'reel', 'role', 'rope', 'repel', 'eloper',
      'explore',
    ],
  },
  {
    letters: ['D', 'E', 'F', 'E', 'N', 'C', 'E'],
    validWords: [
      'den', 'end', 'fed', 'fee', 'fen', 'feed', 'fend', 'need', 'fence',
      'fiend', 'defend', 'defence',
    ],
  },
];

// ─── Built-in Dictionary for validation (~5000 common words, 3-7 letters) ────
// We use the existing WORD_LIST plus the valid words from all sets to build a
// comprehensive Set for O(1) lookups.

import { WORD_LIST } from './wordlist';

// Build a master dictionary Set from the existing word list + all anagram set words
const _allWords = new Set<string>();

// Add all words from the main word list that are 3-7 letters
for (const w of WORD_LIST) {
  if (w.length >= 3 && w.length <= 7) {
    _allWords.add(w.toLowerCase());
  }
}

// Add all valid words from anagram sets (ensures they are always recognized)
for (const set of ANAGRAM_SETS) {
  for (const w of set.validWords) {
    _allWords.add(w.toLowerCase());
  }
}

// Additional common 3-7 letter words to fill gaps
const EXTRA_WORDS = [
  'ace','act','add','age','ago','aid','aim','air','all','and','ant','any','ape',
  'apt','arc','are','ark','arm','art','ash','ask','ate','awe','axe','bad','bag',
  'ban','bar','bat','bay','bed','bee','bet','bid','big','bin','bit','bow','box',
  'boy','bud','bug','bun','bus','but','buy','cab','cam','can','cap','car','cat',
  'cop','cow','cry','cub','cud','cue','cup','cur','cut','dab','dad','dam','day',
  'den','dew','did','die','dig','dim','din','dip','doe','dog','don','dot','dry',
  'dub','dud','due','dug','dun','duo','dye','ear','eat','eel','egg','ego','elm',
  'emu','end','era','eve','ewe','eye','fad','fan','far','fat','fax','fed','fee',
  'fen','few','fig','fin','fir','fit','fix','fly','foe','fog','for','fox','fry',
  'fun','fur','gag','gal','gap','gas','gel','gem','get','gig','gin','gnu','god',
  'got','gum','gun','gut','guy','gym','had','ham','has','hat','hay','hen','her',
  'hid','him','hip','his','hit','hob','hog','hop','hot','how','hub','hue','hug',
  'hum','hut','ice','icy','ill','imp','ink','inn','ion','ire','irk','its','ivy',
  'jab','jag','jam','jar','jaw','jay','jet','jig','job','jog','jot','joy','jug',
  'jut','keg','ken','key','kid','kin','kit','lab','lad','lag','lap','law','lay',
  'led','leg','let','lid','lie','lip','lit','log','lot','low','lug','mad','man',
  'map','mar','mat','maw','may','men','met','mid','mix','mob','mod','mom','mop',
  'mow','mud','mug','mum','nab','nag','nap','net','new','nil','nip','nit','nod',
  'nor','not','now','nun','nut','oak','oar','oat','odd','ode','off','oft','ohm',
  'oil','old','one','opt','orb','ore','our','out','owe','owl','own','pad','pal',
  'pan','par','pat','paw','pay','pea','peg','pen','pep','per','pet','pew','pie',
  'pig','pin','pit','ply','pod','pop','pot','pow','pro','pry','pub','pug','pun',
  'pup','pus','put','rag','ram','ran','rap','rat','raw','ray','red','ref','rib',
  'rid','rig','rim','rip','rob','rod','roe','rot','row','rub','rug','rum','run',
  'rut','rye','sac','sad','sag','sap','sat','saw','say','sea','set','sew','she',
  'shy','sin','sip','sir','sis','sit','six','ski','sky','sly','sob','sod','sol',
  'son','sop','sot','sow','soy','spa','spy','sty','sub','sue','sum','sun','sup',
  'tab','tad','tag','tan','tap','tar','tat','tax','tea','ten','the','tie','tin',
  'tip','toe','ton','too','top','tot','tow','toy','try','tub','tug','tun','two',
  'urn','use','van','vat','vet','via','vie','vim','vow','wad','wag','war','was',
  'wax','way','web','wed','wet','who','why','wig','win','wit','woe','wok','won',
  'woo','wow','yak','yam','yap','yaw','yea','yes','yet','yew','you','zap','zen',
  'zip','zoo',
  'able','also','arch','area','army','aunt','baby','back','bake','bald','bale',
  'ball','band','bane','bank','bare','bark','barn','base','bath','bead','beak',
  'beam','bean','bear','beat','beef','been','beer','bell','belt','bend','bent',
  'best','bias','bike','bill','bind','bird','bite','blow','blue','blur','boat',
  'body','bold','bolt','bomb','bond','bone','book','boom','boot','bore','born',
  'boss','both','bowl','bulk','bull','bump','burn','busy','cage','cake','calm',
  'came','camp','cane','cape','card','care','carp','cart','case','cash','cast',
  'cave','cell','cent','chat','chef','chin','chip','chop','cite','city','clad',
  'claim','clam','clan','clap','claw','clay','clip','clod','clog','clop','clue',
  'clue','coal','coat','code','coil','coin','cold','cole','colt','comb','come',
  'cone','cook','cool','cope','copy','cord','core','cork','corn','cost','cosy',
  'coup','cove','crew','crop','crow','crud','cube','cued','cure','curl','cute',
  'dale','dame','damp','dare','dark','darn','dart','dash','data','date','dawn',
  'dead','deaf','deal','dean','dear','debt','deck','deed','deem','deep','deer',
  'demo','dent','deny','desk','dial','dice','diet','dime','dine','dire','dirt',
  'disc','dish','disk','dive','dock','does','dole','dome','done','doom','door',
  'dope','dose','down','doze','drab','drag','dram','draw','drew','drip','drop',
  'drug','drum','dual','duel','dull','dumb','dump','dune','dung','dunk','dust',
  'duty','dyed','each','earn','ease','east','easy','edge','edit','else','emit',
  'ends','epic','even','ever','evil','exam','exec','exit','eyed','face','fact',
  'fade','fail','fair','fake','fall','fame','fang','fare','farm','fast','fate',
  'fawn','fear','feat','feed','feel','feet','fell','felt','fend','fern','file',
  'fill','film','find','fine','fire','firm','fish','fist','flag','flap','flat',
  'flaw','flea','fled','flew','flip','flit','flog','flow','foam','foil','fold',
  'folk','fond','font','fool','foot','ford','fore','fork','form','fort','foul',
  'four','fowl','free','frog','from','fuel','full','fume','fund','fury','fuse',
  'fuss','gait','gale','gall','game','gang','gape','garb','gash','gasp','gate',
  'gave','gaze','gear','gene','gift','gild','gill','girl','gist','give','glad',
  'glen','glow','glue','gnaw','goal','goat','goes','gold','golf','gone','good',
  'gore','grab','grim','grin','grip','grit','grow','gulf','gust','guts','hack',
  'hail','hair','hale','half','hall','halt','hand','hang','hard','hare','harm',
  'harp','hate','haul','have','haze','hazy','head','heal','heap','hear','heat',
  'heed','heel','held','helm','help','herb','herd','here','hero','hide','high',
  'hike','hill','hilt','hind','hint','hire','hold','hole','holy','home','hood',
  'hook','hope','horn','host','hour','howl','huge','hull','hump','hung','hunt',
  'hurl','hurt','hush','hymn','icon','idea','idle','inch','into','iron','isle',
  'item','jack','jade','jail','jaws','jazz','jean','jerk','jest','jobs','join',
  'joke','jolt','jump','june','jury','just','keen','keep','kept','kick','kill',
  'kind','king','kiss','kite','knack','knee','knew','knit','knob','knot','know',
  'lace','lack','lacy','laid','lake','lame','lamp','land','lane','laps','lard',
  'lash','lass','last','late','lawn','lazy','lead','leaf','leak','lean','leap',
  'left','lend','lens','lent','liar','lied','lien','lieu','life','lift','like',
  'limb','lime','limp','line','link','lion','lips','list','live','load','loaf',
  'loam','loan','lock','lode','loft','logo','lone','long','look','loom','loop',
  'loot','lord','lore','lose','loss','lost','lots','loud','love','luck','lump',
  'lung','lure','lurk','lush','lust','made','maid','mail','main','make','male',
  'mall','malt','mane','many','mare','mark','mars','mash','mask','mass','mast',
  'mate','math','maze','mead','meal','mean','meat','meet','meld','melt','memo',
  'mend','menu','mere','mesa','mesh','mess','mild','mile','milk','mill','mime',
  'mind','mine','mint','miss','mist','mite','moan','moat','mock','mode','mold',
  'mole','mood','moon','moor','more','moss','most','moth','move','much','mule',
  'muse','mush','must','mute','myth','nail','name','nape','navy','near','neat',
  'neck','need','nest','news','next','nice','nick','nine','node','none','noon',
  'norm','nose','note','noun','nude','null','numb','oath','obey','odds','odor',
  'once','only','onto','ooze','open','orca','ores','oven','over','pace','pack',
  'page','paid','pail','pain','pair','pale','palm','pane','pang','pant','pare',
  'park','part','pass','past','path','pave','pawn','peak','peal','pear','peat',
  'peck','peel','peer','pelt','pend','pens','perk','pest','pick','pier','pile',
  'pill','pine','pink','pint','pipe','plan','play','plea','plod','plot','plow',
  'ploy','plug','plum','plus','pock','poem','poet','poke','pole','poll','polo',
  'pomp','pond','pool','poor','pope','pork','port','pose','post','pour','pray',
  'prey','prod','prop','pros','prow','pull','pulp','pump','pun','punk','pure',
  'push','race','rack','raft','rage','raid','rail','rain','rake','ramp','rang',
  'rank','rant','rare','rash','rasp','rate','rave','raze','read','real','ream',
  'reap','rear','reed','reef','reel','rein','rely','rend','rent','rest','rib',
  'rice','rich','ride','rift','rile','rill','rime','rind','ring','rink','riot',
  'ripe','rise','risk','rite','road','roam','roar','robe','rock','rode','role',
  'roll','roof','room','root','rope','rose','rosy','rote','rout','rove','rude',
  'ruin','rule','rump','rune','rung','runt','rush','rust','ruse','sack','safe',
  'sage','said','sail','sake','sale','salt','same','sand','sane','sang','sank',
  'sash','save','seal','seam','sear','seat','seed','seek','seem','seen','seer',
  'self','sell','send','sent','sept','sewn','shed','shim','shin','ship','shoe',
  'shoo','shop','shot','show','shut','sick','side','sift','sigh','sign','silk',
  'sill','silo','silt','sing','sink','site','size','skim','skin','skip','skit',
  'slab','slag','slam','slap','slat','slaw','sled','slew','slid','slim','slip',
  'slit','slot','slow','slug','slum','slur','smog','snap','snag','snip','snob',
  'snot','snow','snub','snug','soak','soap','soar','sock','soda','sofa','soft',
  'soil','sold','sole','some','song','soon','soot','sore','sort','soul','sour',
  'span','spar','spec','sped','spin','spit','spot','spry','spur','stab','stag',
  'star','stay','stem','step','stew','stir','stop','stub','stud','stun','such',
  'suit','sulk','sung','sunk','sure','surf','swan','swap','sway','swim','tabs',
  'tack','tact','tail','take','tale','talk','tall','tame','tang','tank','tape',
  'taps','tare','task','taxi','teak','teal','team','tear','tell','temp','tend',
  'tens','tent','term','tern','test','text','than','that','them','then','they',
  'thin','this','thou','thud','thus','tick','tide','tidy','tied','tier','tile',
  'till','tilt','time','tine','tiny','tire','toad','toil','told','toll','tomb',
  'tone','took','tool','tops','tore','torn','toss','tour','town','toys','trap',
  'tray','tree','trek','trim','trio','trip','trod','trot','true','tube','tuck',
  'tuft','tune','turn','turf','tusk','twig','twin','type','ugly','undo','unit',
  'unto','upon','urge','used','user','vain','vale','vane','vary','vase','vast',
  'veil','vein','vent','verb','very','vest','veto','vice','view','vile','vine',
  'visa','void','volt','vote','wade','wage','wail','wait','wake','walk','wall',
  'wand','wane','ward','warm','warn','warp','wart','wary','wash','wasp','wave',
  'wavy','waxy','weak','wean','wear','weed','week','weep','well','welt','went',
  'were','west','what','when','whim','whip','whom','wick','wide','wife','wild',
  'will','wilt','wily','wimp','wind','wine','wing','wink','wipe','wire','wise',
  'wish','wisp','with','wits','woke','wolf','womb','wont','wood','wool','word',
  'wore','work','worm','worn','wove','wrap','wren','writ','yank','yard','yarn',
  'year','yell','yoga','yoke','your','zeal','zero','zinc','zone','zoom',
  'alert','align','angel','angle','angry','aside','begun','below','birth',
  'blade','blame','blank','blast','blaze','bleed','blend','bless','blind',
  'block','bloom','blown','blunt','board','boast','bonus','boost','bound',
  'brace','brain','brand','brave','bread','break','breed','brick','bride',
  'brief','bring','broad','broke','brook','brown','brush','build','bunch',
  'burst','cabin','chain','chair','chalk','champ','chaos','charm','chase',
  'cheap','cheat','check','cheek','cheer','chess','chest','chief','child',
  'chill','china','chunk','civil','claim','clash','clasp','class','clean',
  'clear','clerk','cliff','climb','cling','clips','clock','clone','close',
  'cloth','cloud','coach','coast','count','court','cover','crack','craft',
  'crane','crash','crate','crawl','craze','crazy','cream','creek','creep',
  'crest','crime','crisp','cross','crowd','crown','crude','cruel','crush',
  'curve','cycle','daily','dance','debut','decay','decoy','delay','dense',
  'depot','depth','devil','diary','dirty','dizzy','dodge','doubt','dough',
  'draft','drain','drake','drama','drank','drape','drawn','dread','dream',
  'dress','dried','drift','drill','drink','drive','drown','drunk','dusty',
  'dwarf','dwell','eager','eagle','early','earth','eight','elect','elite',
  'empty','enact','enemy','enjoy','enter','entry','equal','equip','erase',
  'error','essay','evade','event','every','exact','exalt','exile','exist',
  'extra','fable','faith','false','fancy','fatal','fault','feast','fence',
  'fetch','fever','fiber','field','fiery','fifth','fifty','fight','final',
  'flame','flash','fleet','flesh','flick','fling','float','flock','flood',
  'floor','flour','fluid','flush','focus','force','forge','found','frame',
  'frank','fraud','fresh','front','frost','froze','fruit','fully','ghost',
  'giant','given','glare','glass','gleam','glide','globe','gloom','glory',
  'gloss','glove','going','grace','grade','grain','grand','grant','grape',
  'grasp','grass','grave','graze','great','greed','green','greet','grief',
  'grill','grind','groan','gross','group','grove','growl','grown','guard',
  'guess','guide','guild','guilt','guise','harsh','haste','haven','heart',
  'heavy','honor','horse','hotel','house','human','humor','hurry','ideal',
  'image','imply','index','indie','inner','input','inter','issue','ivory',
  'jewel','joint','judge','juice','knack','kneel','knife','knock','known',
  'label','lance','large','laser','later','laugh','layer','learn','lease',
  'least','leave','legal','lemon','level','light','limit','linen','liver',
  'local','lodge','logic','login','loose','lover','lower','lucky','lunar',
  'lunch','major','maker','manor','maple','march','mercy','merit','metal',
  'midst','might','minor','minus','model','money','month','moral','motor',
  'mount','mouse','mouth','moved','movie','mound','music','nerve','never',
  'newly','night','noble','noise','north','noted','novel','nurse','ocean',
  'offer','often','olive','orbit','order','organ','other','outer','owner',
  'oxide','ozone','panic','party','patch','pause','peace','peach','pearl',
  'penny','perch','phase','phone','photo','piano','piece','pilot','pinch',
  'pitch','pixel','pizza','place','plain','plane','plant','plate','plaza',
  'plead','pluck','plumb','plume','plump','plunge','point','polar','pouch',
  'pound','power','press','price','pride','prime','print','prior','prize',
  'probe','prone','proof','proud','prove','prune','punch','pupil','purse',
  'quest','queue','quick','quiet','quite','quota','quote','radar','radio',
  'raise','rally','ranch','range','rapid','ratio','reach','react','realm',
  'rebel','refer','reign','relax','reply','rider','ridge','rifle','right',
  'rigid','ripen','risen','risky','rival','river','roast','robot','rocky',
  'rouge','rough','round','route','royal','ruler','rural','saint','salad',
  'salve','sandy','sauce','scale','scare','scene','scent','scope','score',
  'scout','scrap','serve','seven','shade','shake','shall','shame','shape',
  'share','shark','sharp','shave','sheep','sheer','sheet','shelf','shell',
  'shift','shine','shirt','shock','shoot','shore','short','shout','shove',
  'sight','sigma','since','sixth','sixty','skate','skill','skull','slate',
  'slave','sleep','slice','slide','slope','smell','smile','smoke','snake',
  'solar','solid','solve','sonic','sorry','sound','south','space','spare',
  'spark','speak','spear','speed','spell','spend','spice','spine','spite',
  'split','spoke','spoon','sport','spray','squad','stack','staff','stage',
  'stain','stake','stale','stalk','stall','stamp','stand','stare','stark',
  'start','state','stave','steak','steal','steam','steel','steep','steer',
  'stern','stick','stiff','still','sting','stock','stole','stone','stood',
  'stool','store','storm','story','stout','stove','straw','stray','strip',
  'stuck','study','stuff','stump','stung','stunt','style','sugar','suite',
  'sunny','super','surge','swamp','swear','sweat','sweet','swept','swift',
  'swing','sword','swore','swung','table','taste','teach','teeth','their',
  'theme','there','these','thick','thief','thing','think','third','thorn',
  'those','three','threw','throw','thumb','tiger','tight','timer','toast',
  'token','total','touch','tough','tower','toxic','trace','track','trade',
  'trail','train','trait','trash','treat','trend','trial','tribe','trick',
  'tried','troop','truck','truly','trunk','trust','truth','tumor','twist',
  'ultra','uncle','under','union','unite','unity','until','upper','upset',
  'urban','usage','usual','utter','valid','value','vapor','vault','verse',
  'video','vigor','viral','visit','vital','vivid','vocal','vodka','voice',
  'voter','wagon','waste','watch','water','weary','weave','wedge','weigh',
  'weird','wheel','where','which','while','whine','white','whole','whose',
  'widen','width','witch','woman','world','worry','worse','worst','worth',
  'would','wound','wrath','write','wrong','wrote','yield','young','youth',
  'golden','grains','grants','handle','happen','harbor','impose',
  'launch','master','stream','strand','string','strong','trader',
  'dancer','garden','market','travel','winter','hunter','flower',
  'bridge','silver','battle','spider','powder','wonder','letter',
  'finger','ginger','hammer','sister','mister','foster','plaster',
  'painter','capture','chapter','teacher','explore','soldier',
  'network','problem','compute','trigger','shelter','monster',
  'chamber','thunder','crowned','respond','mounted','sported',
  'secured','sharpen','lighten','screened','discover','powerful',
  'breaking','stinker','sounding','climbing',
];

for (const w of EXTRA_WORDS) {
  _allWords.add(w.toLowerCase());
}

/** Master dictionary Set — O(1) word validation */
export const DICTIONARY: ReadonlySet<string> = _allWords;

/**
 * Check if a word can be formed from the given letters.
 * Each letter in the set can only be used once.
 */
export function canFormWord(word: string, letters: string[]): boolean {
  const available = letters.map(l => l.toLowerCase());
  for (const ch of word.toLowerCase()) {
    const idx = available.indexOf(ch);
    if (idx === -1) return false;
    available.splice(idx, 1);
  }
  return true;
}

/**
 * Validate a word: must be in dictionary AND formable from letters.
 */
export function isValidWord(word: string, letters: string[]): boolean {
  const lower = word.toLowerCase().trim();
  if (lower.length < 3 || lower.length > 7) return false;
  if (!DICTIONARY.has(lower)) return false;
  return canFormWord(lower, letters);
}

/**
 * Get points for a word based on its length.
 */
export function getWordPoints(word: string): number {
  switch (word.length) {
    case 3: return 100;
    case 4: return 200;
    case 5: return 400;
    case 6: return 800;
    case 7: return 1600;
    default: return 0;
  }
}
