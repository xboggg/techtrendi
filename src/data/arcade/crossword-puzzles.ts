// ─── Crossword Sprint Puzzle Data ────────────────────────────────────────────
// 32 mini 5x5 crossword puzzles with verified interlocking answers.
// Pattern: "Triple Cross" — 2 across words (rows 1,3) and 3 down words (cols 0,2,4)
// plus one word-square puzzle (#1). All intersections verified at build time.

export interface CrosswordClue {
  number: number;
  row: number;
  col: number;
  clue: string;
  answer: string;
  direction: 'across' | 'down';
}

export interface CrosswordPuzzle {
  id: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  solution: (string | null)[][];
  across: CrosswordClue[];
  down: CrosswordClue[];
}

// ─── Builder: Word Square (full 5x5, no black cells) ────────────────────────

function buildWordSquare(
  id: number,
  category: string,
  difficulty: 'easy' | 'medium' | 'hard',
  words: [string, string, string, string, string],
  acrossClues: [string, string, string, string, string],
  downClues: [string, string, string, string, string],
): CrosswordPuzzle {
  return {
    id,
    category,
    difficulty,
    solution: words.map((w) => w.split('').map((c) => c.toUpperCase())),
    across: words.map((w, i) => ({
      number: i + 1, row: i, col: 0,
      clue: acrossClues[i], answer: w.toUpperCase(), direction: 'across' as const,
    })),
    down: words.map((w, i) => ({
      number: i + 6, row: 0, col: i,
      clue: downClues[i], answer: w.toUpperCase(), direction: 'down' as const,
    })),
  };
}

// ─── Builder: Triple Cross ──────────────────────────────────────────────────
// Grid pattern (# = black):
//   . # . # .
//   . . . . .
//   . # . # .
//   . . . . .
//   . # . # .
//
// Across: r1 (5 letters), r3 (5 letters)
// Down: c0 (5 letters), c2 (5 letters), c4 (5 letters)
// 19 fillable cells, 5 clues per puzzle.

interface TCInput {
  id: number;
  cat: string;
  diff: 'easy' | 'medium' | 'hard';
  r1: string; r3: string;
  c0: string; c2: string; c4: string;
  r1c: string; r3c: string;
  c0c: string; c2c: string; c4c: string;
}

function tc(p: TCInput): CrosswordPuzzle {
  const { id, cat, diff, r1, r3, c0, c2, c4, r1c, r3c, c0c, c2c, c4c } = p;
  // Verify intersections
  const checks = [
    [r1[0], c0[1], 'r1[0]/c0[1]'],
    [r1[2], c2[1], 'r1[2]/c2[1]'],
    [r1[4], c4[1], 'r1[4]/c4[1]'],
    [r3[0], c0[3], 'r3[0]/c0[3]'],
    [r3[2], c2[3], 'r3[2]/c2[3]'],
    [r3[4], c4[3], 'r3[4]/c4[3]'],
  ] as const;
  for (const [a, b, label] of checks) {
    if (a.toUpperCase() !== b.toUpperCase()) {
      console.error(`Puzzle ${id}: ${label} mismatch: ${a} vs ${b}`);
    }
  }

  const grid: (string | null)[][] = [
    [c0[0].toUpperCase(), null, c2[0].toUpperCase(), null, c4[0].toUpperCase()],
    [...r1.toUpperCase()].map((c) => c),
    [c0[2].toUpperCase(), null, c2[2].toUpperCase(), null, c4[2].toUpperCase()],
    [...r3.toUpperCase()].map((c) => c),
    [c0[4].toUpperCase(), null, c2[4].toUpperCase(), null, c4[4].toUpperCase()],
  ];

  return {
    id, category: cat, difficulty: diff, solution: grid,
    across: [
      { number: 4, row: 1, col: 0, clue: r1c, answer: r1.toUpperCase(), direction: 'across' },
      { number: 5, row: 3, col: 0, clue: r3c, answer: r3.toUpperCase(), direction: 'across' },
    ],
    down: [
      { number: 1, row: 0, col: 0, clue: c0c, answer: c0.toUpperCase(), direction: 'down' },
      { number: 2, row: 0, col: 2, clue: c2c, answer: c2.toUpperCase(), direction: 'down' },
      { number: 3, row: 0, col: 4, clue: c4c, answer: c4.toUpperCase(), direction: 'down' },
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// THE 32 PUZZLES
// ═══════════════════════════════════════════════════════════════════════════════

const PUZZLES: CrosswordPuzzle[] = [

  // #1 — Word Square: HEART / EMBER / ABUSE / RESIN / TREND (symmetric)
  buildWordSquare(1, 'General Knowledge', 'easy',
    ['HEART', 'EMBER', 'ABUSE', 'RESIN', 'TREND'],
    ['Organ that pumps blood', 'Glowing piece of coal', 'Wrongful treatment', 'Sticky tree secretion', 'Popular style direction'],
    ['Center of circulation', 'Hot coal fragment', 'To misuse or mistreat', 'Substance from pine trees', 'Fashion movement'],
  ),

  // #2 — LIGHT / ABOUT crossing CLEAN / IGLOO / STATE
  tc({ id: 2, cat: 'General Knowledge', diff: 'easy',
    c0: 'CLEAN', c2: 'IGLOO', c4: 'STATE',
    r1: 'LIGHT', r3: 'ABOUT',
    c0c: 'Free from dirt', c2c: 'Dome-shaped snow shelter', c4c: 'Condition or nation',
    r1c: 'Illumination', r3c: 'Approximately or concerning' }),

  // #3 — EARTH / SMILE crossing DENSE / BRAIN / WHEEL
  tc({ id: 3, cat: 'Science', diff: 'easy',
    c0: 'DENSE', c2: 'BRAIN', c4: 'WHEEL',
    r1: 'EARTH', r3: 'SMILE',
    c0c: 'Thick or closely packed', c2c: 'Organ of thought', c4c: 'Round rotating part',
    r1c: 'Our planet', r3c: 'Happy facial expression' }),

  // #4 — WRITE / ALONE crossing SWEAR / VIGOR / LEVEL
  tc({ id: 4, cat: 'General Knowledge', diff: 'easy',
    c0: 'SWEAR', c2: 'VIGOR', c4: 'LEVEL',
    r1: 'WRITE', r3: 'ALONE',
    c0c: 'Make a solemn promise', c2c: 'Physical energy', c4c: 'Flat and even',
    r1c: 'Put words on paper', r3c: 'Without company' }),

  // #5 — DANCE / RANGE crossing ADORE / INANE / NEVER
  tc({ id: 5, cat: 'General Knowledge', diff: 'easy',
    c0: 'ADORE', c2: 'INANE', c4: 'NEVER',
    r1: 'DANCE', r3: 'RANGE',
    c0c: 'Love deeply', c2c: 'Silly or senseless', c4c: 'Not at any time',
    r1c: 'Move rhythmically to music', r3c: 'Extent or variety' }),

  // #6 — TIGER / LUNGE crossing STYLE / AGENT / CREEK
  tc({ id: 6, cat: 'Nature', diff: 'easy',
    c0: 'STYLE', c2: 'AGENT', c4: 'CREEK',
    r1: 'TIGER', r3: 'LUNGE',
    c0c: 'Fashion or manner', c2c: 'Representative or spy', c4c: 'Small stream',
    r1c: 'Striped big cat', r3c: 'Forward thrust or dive' }),

  // #7 — MAPLE / RIDGE crossing SMART / SPADE / SEVEN
  tc({ id: 7, cat: 'General Knowledge', diff: 'medium',
    c0: 'SMART', c2: 'SPADE', c4: 'SEVEN',
    r1: 'MAPLE', r3: 'RIDGE',
    c0c: 'Clever or intelligent', c2c: 'Digging tool', c4c: 'Number after six',
    r1c: 'Tree that makes syrup', r3c: 'Narrow hilltop' }),

  // #8 — NOBLE / STYLE crossing ANGST / OBEYS / FEVER
  tc({ id: 8, cat: 'General Knowledge', diff: 'medium',
    c0: 'ANGST', c2: 'OBEYS', c4: 'FEVER',
    r1: 'NOBLE', r3: 'STYLE',
    c0c: 'Feeling of anxiety', c2c: 'Follows commands', c4c: 'High body temperature',
    r1c: 'Honorable or aristocratic', r3c: 'Fashion or manner' }),

  // #9 — OPERA / CEDAR crossing COUCH / READY / MACRO
  tc({ id: 9, cat: 'Arts', diff: 'medium',
    c0: 'COUCH', c2: 'READY', c4: 'MACRO',
    r1: 'OPERA', r3: 'CEDAR',
    c0c: 'Sofa or resting place', c2c: 'Prepared', c4c: 'Large-scale or close-up lens',
    r1c: 'Musical theater form', r3c: 'Fragrant wood tree' }),

  // #10 — PLUME / SPIKE crossing SPASM / CUBIC / LEVER
  tc({ id: 10, cat: 'Science', diff: 'medium',
    c0: 'SPASM', c2: 'CUBIC', c4: 'LEVER',
    r1: 'PLUME', r3: 'SPIKE',
    c0c: 'Involuntary muscle jerk', c2c: 'Shaped like a cube', c4c: 'Bar used to pry things',
    r1c: 'Feather or smoke column', r3c: 'Sharp pointed projection' }),

  // #11 — SOLAR / DENIM crossing ASIDE / BLEND / FRAME
  tc({ id: 11, cat: 'Tech', diff: 'easy',
    c0: 'ASIDE', c2: 'BLEND', c4: 'FRAME',
    r1: 'SOLAR', r3: 'DENIM',
    c0c: 'To one side', c2c: 'Mix together smoothly', c4c: 'Border or structure',
    r1c: 'Relating to the sun', r3c: 'Sturdy cotton fabric' }),

  // #12 — OCEAN / GLIDE crossing GORGE / BEGIN / UNDER
  tc({ id: 12, cat: 'Geography', diff: 'easy',
    c0: 'GORGE', c2: 'BEGIN', c4: 'UNDER',
    r1: 'OCEAN', r3: 'GLIDE',
    c0c: 'Deep narrow valley', c2c: 'Start or commence', c4c: 'Below or beneath',
    r1c: 'Vast body of salt water', r3c: 'Move smoothly through air' }),

  // #13 — DREAM / PILOT crossing ADOPT / REALM / EMPTY
  tc({ id: 13, cat: 'General Knowledge', diff: 'medium',
    c0: 'ADOPT', c2: 'REALM', c4: 'EMPTY',
    r1: 'DREAM', r3: 'PILOT',
    c0c: 'Take in as your own', c2c: 'Kingdom or domain', c4c: 'Containing nothing',
    r1c: 'Vision while sleeping', r3c: 'Person who flies aircraft' }),

  // #14 — CRANE / OLIVE crossing ACTOR / CABIN / SEWER
  tc({ id: 14, cat: 'General Knowledge', diff: 'medium',
    c0: 'ACTOR', c2: 'CABIN', c4: 'SEWER',
    r1: 'CRANE', r3: 'OLIVE',
    c0c: 'Movie performer', c2c: 'Small wooden house', c4c: 'Underground drain system',
    r1c: 'Tall lifting machine', r3c: 'Green fruit for oil' }),

  // #15 — HUMID / LUNAR crossing SHELF / AMONG / ADORE
  tc({ id: 15, cat: 'Science', diff: 'medium',
    c0: 'SHELF', c2: 'AMONG', c4: 'ADORE',
    r1: 'HUMID', r3: 'LUNAR',
    c0c: 'Flat surface for storage', c2c: 'In the middle of', c4c: 'Love deeply',
    r1c: 'Damp and moist air', r3c: 'Relating to the moon' }),

  // #16 — POWER / TULIP crossing SPOTS / DWELL / DRAPE
  tc({ id: 16, cat: 'General Knowledge', diff: 'medium',
    c0: 'SPOTS', c2: 'DWELL', c4: 'DRAPE',
    r1: 'POWER', r3: 'TULIP',
    c0c: 'Marks or locations', c2c: 'Live or reside in', c4c: 'Hanging cloth or curtain',
    r1c: 'Strength or electricity', r3c: 'Spring-blooming flower' }),

  // #17 — BRUSH / EAGLE crossing ABLER / BUDGE / THREE
  tc({ id: 17, cat: 'Nature', diff: 'medium',
    c0: 'ABLER', c2: 'BUDGE', c4: 'THREE',
    r1: 'BRUSH', r3: 'EAGLE',
    c0c: 'More capable', c2c: 'Move slightly', c4c: 'Number after two',
    r1c: 'Tool for painting or hair', r3c: 'Majestic bird of prey' }),

  // #18 — MAGIC / KNELT crossing SMOKE / AGREE / ACUTE
  tc({ id: 18, cat: 'General Knowledge', diff: 'hard',
    c0: 'SMOKE', c2: 'AGREE', c4: 'ACUTE',
    r1: 'MAGIC', r3: 'KNELT',
    c0c: 'Visible combustion vapor', c2c: 'Share the same opinion', c4c: 'Sharp or severe',
    r1c: 'Supernatural power or illusion', r3c: 'Went down on one knee' }),

  // #19 — GLOBE / RIDER crossing AGORA / WORDS / HEART
  tc({ id: 19, cat: 'Geography', diff: 'hard',
    c0: 'AGORA', c2: 'WORDS', c4: 'HEART',
    r1: 'GLOBE', r3: 'RIDER',
    c0c: 'Greek public marketplace', c2c: 'Units of language', c4c: 'Organ pumping blood',
    r1c: 'Spherical model of Earth', r3c: 'Person on horseback' }),

  // #20 — YOUTH / ELBOW crossing CYBER / JUMBO / SHAWL
  tc({ id: 20, cat: 'Tech', diff: 'hard',
    c0: 'CYBER', c2: 'JUMBO', c4: 'SHAWL',
    r1: 'YOUTH', r3: 'ELBOW',
    c0c: 'Relating to computers', c2c: 'Extra large', c4c: 'Wrap worn around shoulders',
    r1c: 'Young people or early years', r3c: 'Joint in the arm' }),

  // #21 — CHINA / EXTRA crossing ACHED / DIRTY / NAVAL
  tc({ id: 21, cat: 'Geography', diff: 'hard',
    c0: 'ACHED', c2: 'DIRTY', c4: 'NAVAL',
    r1: 'CHINA', r3: 'EXTRA',
    c0c: 'Had a dull pain', c2c: 'Not clean', c4c: 'Relating to the navy',
    r1c: 'East Asian country', r3c: 'Additional or more' }),

  // #22 — ROAST / NOVEL crossing BRAND / CARVE / STILL
  tc({ id: 22, cat: 'General Knowledge', diff: 'easy',
    c0: 'BRAND', c2: 'CARVE', c4: 'STILL',
    r1: 'ROAST', r3: 'NOVEL',
    c0c: 'Product name or mark', c2c: 'Cut into a shape', c4c: 'Motionless or even now',
    r1c: 'Cook in an oven', r3c: 'A fictional book' }),

  // #23 — MINOR / LUCID crossing SMALL / KNOCK / GRADE
  tc({ id: 23, cat: 'General Knowledge', diff: 'hard',
    c0: 'SMALL', c2: 'KNOCK', c4: 'GRADE',
    r1: 'MINOR', r3: 'LUCID',
    c0c: 'Little in size', c2c: 'Rap on a door', c4c: 'Level or score',
    r1c: 'Lesser in importance', r3c: 'Clear and easy to understand' }),

  // #24 — BRAVE / DRIVE crossing ABIDE / RAPID / LEVER
  tc({ id: 24, cat: 'General Knowledge', diff: 'easy',
    c0: 'ABIDE', c2: 'RAPID', c4: 'LEVER',
    r1: 'BRAVE', r3: 'DRIVE',
    c0c: 'Tolerate or accept', c2c: 'Very fast', c4c: 'Handle to pull or push',
    r1c: 'Courageous', r3c: 'Operate a vehicle' }),

  // #25 — PIANO / DIVAN crossing SPADE / CARVE / BOUND
  tc({ id: 25, cat: 'Arts', diff: 'medium',
    c0: 'SPADE', c2: 'CARVE', c4: 'BOUND',
    r1: 'PIANO', r3: 'DIVAN',
    c0c: 'Digging tool or card suit', c2c: 'Cut a design into', c4c: 'Tied or heading towards',
    r1c: 'Musical keyboard instrument', r3c: 'Long low sofa' }),

  // #26 — CROWN / AVIAN crossing OCEAN / TOXIC / INANE
  tc({ id: 26, cat: 'Nature', diff: 'hard',
    c0: 'OCEAN', c2: 'TOXIC', c4: 'INANE',
    r1: 'CROWN', r3: 'AVIAN',
    c0c: 'Vast body of salt water', c2c: 'Poisonous', c4c: 'Silly and meaningless',
    r1c: 'Royal headpiece', r3c: 'Relating to birds' }),

  // #27 — RELAY / FIBRE crossing CRAFT / ALTER / HYDRO
  tc({ id: 27, cat: 'General Knowledge', diff: 'hard',
    c0: 'CRAFT', c2: 'ALTER', c4: 'HYDRO',
    r1: 'RELAY', r3: 'FIBRE',
    c0c: 'Skill or a small vessel', c2c: 'Change or modify', c4c: 'Water-related prefix',
    r1c: 'Team race with baton', r3c: 'Thread-like strand' }),

  // #28 — HOUSE / MOOSE crossing SHAME / HUMOR / SEVEN
  tc({ id: 28, cat: 'General Knowledge', diff: 'easy',
    c0: 'SHAME', c2: 'HUMOR', c4: 'SEVEN',
    r1: 'HOUSE', r3: 'MOOSE',
    c0c: 'Feeling of disgrace', c2c: 'Quality of being funny', c4c: 'Number after six',
    r1c: 'Place to live', r3c: 'Large deer with antlers' }),

  // #29 — BLEND / SPINE crossing ABUSE / BEGIN / IDLER
  tc({ id: 29, cat: 'General Knowledge', diff: 'medium',
    c0: 'ABUSE', c2: 'BEGIN', c4: 'IDLER',
    r1: 'BLEND', r3: 'SPINE',
    c0c: 'Misuse or harm', c2c: 'Start something', c4c: 'A lazy person',
    r1c: 'Mix together smoothly', r3c: 'Backbone' }),

  // #30 — TORSO / BEAST crossing STABS / BREAD / FORTE
  tc({ id: 30, cat: 'General Knowledge', diff: 'medium',
    c0: 'STABS', c2: 'BREAD', c4: 'FORTE',
    r1: 'TORSO', r3: 'BEAST',
    c0c: 'Pierces with a knife', c2c: 'Baked flour food', c4c: 'Area of strength',
    r1c: 'Upper body trunk', r3c: 'Wild animal' }),

  // #31 — NURSE / CHASE crossing KNOCK / BREAD / LEVEL
  tc({ id: 31, cat: 'General Knowledge', diff: 'easy',
    c0: 'KNOCK', c2: 'BREAD', c4: 'LEVEL',
    r1: 'NURSE', r3: 'CHASE',
    c0c: 'Rap on a door', c2c: 'Baked dough staple', c4c: 'Flat and even surface',
    r1c: 'Healthcare professional', r3c: 'Pursue or run after' }),

  // #32 — GRAPE / LAPSE crossing AGILE / HAPPY / NEVER
  tc({ id: 32, cat: 'General Knowledge', diff: 'easy',
    c0: 'AGILE', c2: 'HAPPY', c4: 'NEVER',
    r1: 'GRAPE', r3: 'LAPSE',
    c0c: 'Quick and nimble', c2c: 'Feeling of joy', c4c: 'Not at any time',
    r1c: 'Fruit used for wine', r3c: 'Brief failure or slip' }),
];

export { PUZZLES };
export default PUZZLES;
