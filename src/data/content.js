/**
 * ============================================================================
 *  SITE COPY that is not tied to a program: home "why us" points, About page
 *  mission/vision/values and the training-environment gallery.
 *  Edit freely. No awards, numbers or achievements are claimed here.
 * ============================================================================
 */
import { media } from './media.js'

export const whyBlackWolf = [
  { title: 'Professional coaching', text: 'Coaches who teach technique properly, explain the why and correct you as you go.' },
  { title: 'Structured programs', text: 'Every program has a clear progression, so you always know what you are working on next.' },
  { title: 'Fitness and strength', text: 'Training that builds real conditioning, strength and mobility alongside skill.' },
  { title: 'Discipline and confidence', text: 'Respect, routine and steady progress that carry into life outside the club.' },
  { title: 'Beginner-friendly', text: 'You start at the beginning. No experience or fitness level is needed for your first session.' },
  { title: 'Individual attention', text: 'Coaches track your progress and adjust training to your level and goals.' },
]

export const about = {
  intro: [
    'Black Wolf Fitness Club is a combat sports and fitness club for people who want to train with purpose. We teach Taekwondo, Boxing, Kickboxing, Mixed Martial Arts, General Fitness and Gymnastics, and run a dedicated Special Kids Training program for children who benefit from individualized support.',
    'Whatever brings you through the door, whether it is fitness, self-defence, competition or confidence, you will be coached with care, trained with structure and pushed at a level that is right for you.',
  ],
  // TODO: Add the club's story — when and why it started, and who founded it.
  story: '',
  mission:
    'To give every member, from first-timers to experienced athletes, structured, professional coaching that builds strength, skill, discipline and confidence.',
  vision:
    'A club where every member is part of the pack: training hard, supporting each other and growing stronger together, inside the gym and out.',
  philosophy: [
    { title: 'Technique before intensity', text: 'We teach movements correctly first. Intensity is added once the foundation is safe and solid.' },
    { title: 'Progress you can see', text: 'Clear levels, regular feedback and goals you set with your coach.' },
    { title: 'Respect in every session', text: 'For coaches, training partners and yourself. It is what keeps hard training safe.' },
  ],
  values: [
    { name: 'Discipline', text: 'Showing up, doing the work and doing it properly.' },
    { name: 'Respect', text: 'For every coach, partner and member, whatever their level.' },
    { name: 'Confidence', text: 'Earned through skill, progress and effort.' },
    { name: 'Consistency', text: 'Small sessions repeated over time beat occasional big ones.' },
    { name: 'Growth', text: 'Always one more skill to learn, one more level to reach.' },
  ],
}

/** Training environment gallery (home + about). Replace with club photos. */
export const gallery = [
  { image: media.punchingBags, caption: 'Boxing drills', size: 'wide' },
  { image: media.beltTying, caption: 'Martial arts', size: 'tall' },
  { image: media.barbellClass, caption: 'Strength training', size: 'square' },
  { image: media.boxingGloves, caption: 'Boxing', size: 'square' },
  { image: media.gymnasticsBeam, caption: 'Gymnastics', size: 'tall' },
  { image: media.kickboxingWoman, caption: 'Kickboxing', size: 'square' },
  { image: media.boxJumps, caption: 'Conditioning', size: 'square' },
  { image: media.groupInUniform, caption: 'Club activities', size: 'wide' },
]

/** Home hero slideshow: photo + the program it shows. */
export const heroSlides = [
  { image: media.heroSparring, label: 'Boxing', to: '/services/boxing', position: '62% 30%' },
  { image: media.kickboxingCoach, label: 'Kickboxing', to: '/services/kickboxing', position: '55% 35%' },
  { image: media.taekwondoSparring, label: 'Taekwondo', to: '/services/taekwondo', position: '50% 30%' },
  { image: media.mmaExchange, label: 'MMA', to: '/services/mma', position: '50% 40%' },
]

/**
 * Facts shown in the home stats band. Keep these strictly true: they count
 * what the club offers, not members or results.
 */
export const clubFacts = [
  { value: 7, label: 'Coached programs' },
  { value: 4, label: 'Combat disciplines' },
  { value: 1, label: 'Dedicated special kids program' },
  { value: 0, label: 'Experience needed to start' },
]
