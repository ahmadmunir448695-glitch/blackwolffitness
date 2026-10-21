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
    src: photo('taekwondo-kick'),
    alt: 'A taekwondo athlete throwing a high kick at a training partner',
    credit: 'Figma AI',
  },
  taekwondoPractice: {
    src: photo('taekwondo-sparring'),
    alt: 'Two taekwondo students in white uniforms practising kicks',
    credit: 'Canva AI',
  },
  beltTying: {
    src: photo('belt-tying'),
    alt: 'A martial artist in a white uniform tying a black belt',
    credit: 'Nguyen Hung / Unsplash via Canva',
  },

  // Boxing
  boxingGloves: {
    src: photo('boxing-gloves'),
    alt: 'Black leather boxing gloves resting together',
    credit: 'Bogdan Yukhymchuk / Unsplash via Canva',
  },
  boxingPair: {
    src: photo('boxing-pads'),
    alt: 'A boxer throwing a jab into focus mitts held by his coach',
    credit: 'Figma AI',
  },
  boxingSolo: {
    src: photo('boxing-pads'),
    alt: 'A boxer throwing a jab into focus mitts held by his coach',
    credit: 'Figma AI',
  },
  boxingGloveRed: {
    src: photo('glove-pads-red'),
    alt: 'A red boxing glove striking a focus pad',
    credit: 'engin akyurt / Unsplash via Canva',
  },
  punchingBags: {
    src: photo('boxing-drills'),
    alt: 'A woman in boxing gloves throwing a punch during a drill',
    credit: 'Anastase Maragos / Unsplash via Canva',
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
    src: photo('gym-floor'),
    alt: 'Racks of dumbbells on the gym floor',
    credit: 'Unsplash via Canva',
  },
  gymDark: {
    src: photo('gym-floor'),
    alt: 'Racks of dumbbells on the gym floor',
    credit: 'Unsplash via Canva',
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
    src: photo('kids-martial-arts'),
    alt: 'Children in martial arts uniforms practising a block with their coach',
    credit: 'Figma AI',
  },
  kidsKata: {
    src: photo('kids-martial-arts'),
    alt: 'Children in martial arts uniforms practising a block with their coach',
    credit: 'Figma AI',
  },
  kidsTrampoline: {
    src: photo('kids-gymnastics'),
    alt: 'Children practising handstands and balance with a coach in a gymnastics hall',
    credit: 'Figma AI',
  },
  groupInUniform: {
    src: photo('karate-beach'),
    alt: 'A group of students in martial arts uniforms training together at sunset',
    credit: 'Thao LEE / Unsplash via Canva',
  },
}
