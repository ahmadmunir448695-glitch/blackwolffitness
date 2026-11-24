/**
 * ============================================================================
 *  PHOTOGRAPHY — every image on the site is referenced from this file.
 *
 *  The files live in src/assets/photos/ and are bundled with the site, so
 *  nothing depends on an outside image host.
 *    - "Figma AI" images were generated in Figma for this site. They are
 *      illustrative stand-ins, not photos of the club.
 *    - "Unsplash via Canva" images are free Unsplash photos (Unsplash License)
 *      imported through Canva.
 *  Replace them with real photos of your club, coaches and members as soon as
 *  you have them: drop a JPG into src/assets/photos/ (about 1600px wide) and
 *  point the matching entry below at it. Update `alt` to describe the photo.
 *
 *  If an image fails to load, the site shows a branded fallback panel instead
 *  of a broken image.
 * ============================================================================
 */

// `new URL(…, import.meta.url)` lets Vite bundle the file, and still works when
// Node reads this module (scripts/check-content.mjs, postbuild).
const photo = (name) => new URL(`../assets/photos/${name}.jpg`, import.meta.url).href

export const media = {
  heroSparring: {
    src: photo('ring-sparring'),
    alt: 'Two boxers in headgear sparring inside a ring under a single spotlight',
    credit: 'Figma AI',
  },
  ringTraining: {
    src: photo('ring-training'),
    alt: 'Two fighters exchanging strikes inside a boxing ring',
    credit: 'Anastase Maragos / Unsplash via Canva',
  },

  // Taekwondo
  taekwondoSparring: {
    src: photo('taekwondo-kick'),
    alt: 'A taekwondo athlete throwing a high kick at a training partner',
    credit: 'Figma AI',
  },
  kickTraining: {
    src: photo('club-kid-high-kick'),
    alt: 'A young Black Wolf Taekwondo student throwing a high front kick in the training hall with his coach',
    credit: 'Black Wolf Fitness Club',
  },
  taekwondoPractice: {
    src: photo('club-kid-stretch'),
    alt: 'A young Taekwondo student stretching into a side split on the mats at Black Wolf Fitness Club',
    credit: 'Black Wolf Fitness Club',
  },
  beltTying: {
    src: photo('club-dobok-black-belt'),
    alt: 'A Taekwondo uniform (dobok) with an embroidered black belt on the training mats at Black Wolf Fitness Club',
    credit: 'Black Wolf Fitness Club',
  },

  // Boxing
  boxingGloves: {
    src: photo('club-wall-gloves'),
    alt: 'Boxing gloves mural with the words I CAN DO IT on the wall of Black Wolf Fitness Club',
    credit: 'Black Wolf Fitness Club',
  },
  boxingPair: {
    src: photo('club-kid-boxing'),
    alt: 'A young boxer in blue gloves throwing a jab in the Black Wolf Fitness Club training hall',
    credit: 'Black Wolf Fitness Club',
  },
  boxingSolo: {
    src: photo('club-kid-boxing'),
    alt: 'A young boxer in blue gloves throwing a jab in the Black Wolf Fitness Club training hall',
    credit: 'Black Wolf Fitness Club',
  },
  boxingGloveRed: {
    src: photo('glove-pads-red'),
    alt: 'A red boxing glove striking a focus pad',
    credit: 'engin akyurt / Unsplash via Canva',
  },
  punchingBags: {
    src: photo('club-hall-mirror-wide'),
    alt: 'The Black Wolf Fitness Club training hall with mats, a mirror, kick shields and NEVER GIVE UP on the wall',
    credit: 'Black Wolf Fitness Club',
  },

  // Kickboxing
  kickboxingCoach: {
    src: photo('kickboxing-pads'),
    alt: 'A kickboxer landing a roundhouse kick on pads held by a coach',
    credit: 'Figma AI',
  },
  heavyBag: {
    src: photo('heavy-bag-kick'),
    alt: 'A fighter kicking a heavy bag',
    credit: 'Anastase Maragos / Unsplash via Canva',
  },
  kickboxingWoman: {
    src: photo('kickboxing-guard'),
    alt: 'A woman in boxing gloves holding her guard during training',
    credit: 'Anastase Maragos / Unsplash via Canva',
  },

  // MMA
  mmaExchange: {
    src: photo('mma-clinch'),
    alt: 'Two mixed martial artists clinching against the cage',
    credit: 'Figma AI',
  },
  mmaRing: {
    src: photo('mma-cage'),
    alt: 'Two athletes grappling inside a cage',
    credit: 'Redd Francisco / Unsplash via Canva',
  },
  mmaCage: {
    src: photo('mma-cage'),
    alt: 'Two athletes grappling inside a cage',
    credit: 'Redd Francisco / Unsplash via Canva',
  },

  // General fitness
  barbellClass: {
    src: photo('strength-class'),
    alt: 'A strength class lifting barbells together',
    credit: 'Figma AI',
  },
  boxJumps: {
    src: photo('box-jumps'),
    alt: 'Two people performing box jumps on wooden boxes',
    credit: 'Meghan Holmes / Unsplash via Canva',
  },
  groupWorkout: {
    src: photo('group-bands'),
    alt: 'A group training with resistance bands',
    credit: 'Geert Pieters / Unsplash via Canva',
  },
  gymFloor: {
    src: photo('club-hall-flags-wide'),
    alt: 'The Black Wolf Fitness Club training hall in Bahria Town, Lahore, with the Pakistan and Korea flags above the mats',
    credit: 'Black Wolf Fitness Club',
  },
  gymDark: {
    src: photo('club-hall-flags-wide'),
    alt: 'The Black Wolf Fitness Club training hall in Bahria Town, Lahore, with the Pakistan and Korea flags above the mats',
    credit: 'Black Wolf Fitness Club',
  },

  // Gymnastics
  gymnasticsLeap: {
    src: photo('gymnast-beam'),
    alt: 'A gymnast in a split leap above the balance beam',
    credit: 'Figma AI',
  },
  gymnasticsBeam: {
    src: photo('gymnast-beam'),
    alt: 'A gymnast in a split leap above the balance beam',
    credit: 'Figma AI',
  },
  gymnasticsGroup: {
    src: photo('kids-gymnastics'),
    alt: 'Children practising handstands and balance with a coach in a gymnastics hall',
    credit: 'Figma AI',
  },

  // Special Kids Training
  kidsSparring: {
    src: photo('club-kid-cone-drill'),
    alt: 'A smiling child carrying a training cone during an agility drill at Black Wolf Fitness Club',
    credit: 'Black Wolf Fitness Club',
  },
  kidsKata: {
    src: photo('club-kid-cone-drill'),
    alt: 'A smiling child carrying a training cone during an agility drill at Black Wolf Fitness Club',
    credit: 'Black Wolf Fitness Club',
  },
  kidsTrampoline: {
    src: photo('club-kid-coordination'),
    alt: 'A coach supporting a smiling child through a coordination drill beside a training cone',
    credit: 'Black Wolf Fitness Club',
  },
  groupInUniform: {
    src: photo('club-team-photo'),
    alt: 'The Black Wolf Fitness Club coaches and athletes together at the club in Bahria Town, Lahore',
    credit: 'Black Wolf Fitness Club',
  },

  // Real club photos (Black Wolf Fitness Club, Bahria Town, Lahore)
  trophyWall: {
    src: photo('club-trophy-wall'),
    alt: 'Black Wolf Fitness Club Taekwondo wall with coloured belts, medals and trophies',
    credit: 'Black Wolf Fitness Club',
  },
  hallFlags: {
    src: photo('club-hall-flags'),
    alt: 'The Black Wolf Fitness Club training hall with the Pakistan and Korea flags above the mats',
    credit: 'Black Wolf Fitness Club',
  },
  hallMirror: {
    src: photo('club-hall-mirror'),
    alt: 'Training hall with mats, mirror, kick shields and NEVER GIVE UP and FOCUS ON on the wall',
    credit: 'Black Wolf Fitness Club',
  },
  clubSquad: {
    src: photo('club-team-kit'),
    alt: 'Black Wolf Fitness Club team members in matching kit',
    credit: 'Black Wolf Fitness Club',
  },
  clubBeltLineUp: {
    src: photo('club-belt-line-up'),
    alt: 'Five Black Wolf Taekwondo students in uniform with arms folded',
    credit: 'Black Wolf Fitness Club',
  },
  clubPack: {
    src: photo('club-the-pack'),
    alt: 'A large group of Black Wolf Fitness Club members smiling together',
    credit: 'Black Wolf Fitness Club',
  },
}
