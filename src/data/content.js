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

const clubPhoto = (name) => new URL(`../assets/photos/${name}.jpg`, import.meta.url).href

/** Club moments slideshow on the home page: real photos from the club and its coaches. */
export const clubMoments = [
  { src: clubPhoto('club-thailand-gold'), caption: 'Gold in Thailand', detail: 'International championship', alt: 'Black Wolf athlete with a gold medal beside the referee at an international championship in Thailand' },
  { src: clubPhoto('club-kids-trophies'), caption: 'Trophies for the kids', detail: 'Junior championship', alt: 'Young Black Wolf students with trophies and certificates' },
  { src: clubPhoto('club-team-thailand'), caption: 'With Team Thailand', detail: 'International competition', alt: 'Black Wolf athlete with members of the Thailand Taekwondo team' },
  { src: clubPhoto('club-belt-certificates'), caption: 'Belt grading day', detail: 'Certificates and medals', alt: 'Students holding belt certificates and medals with their coach' },
  { src: clubPhoto('club-pakistan-flag'), caption: 'Flying the flag', detail: 'Team Pakistan spirit', alt: 'Two Taekwondo athletes holding the Pakistan flag at an event' },
  { src: clubPhoto('club-podium'), caption: 'Top of the podium', detail: 'Championship', alt: 'Young student on the top step of the podium with a medal and certificate' },
  { src: clubPhoto('club-black-belts'), caption: 'International black belts', detail: 'Training camp', alt: 'Three Taekwondo black belts together at an international training camp' },
  { src: clubPhoto('club-national-champion'), caption: 'National champion', detail: 'Gold medal', alt: 'Young student holding a national championship medal with his coach' },
  { src: clubPhoto('club-team-kit'), caption: 'The squad', detail: 'Club team', alt: 'Club team members in matching kit' },
  { src: clubPhoto('club-medal-selfie'), caption: 'Medal day', detail: 'Gold and bronze', alt: 'Black Wolf athlete wearing gold and bronze medals at a competition venue' },
  { src: clubPhoto('club-blue-belt'), caption: 'Promoted to blue belt', detail: 'Belt promotion', alt: 'Student receiving a blue belt and certificate from her coach' },
  { src: clubPhoto('club-korean-ambassador'), caption: 'Korean Ambassador Championship', detail: 'Junior national event', alt: 'Young students with a certificate at the Korean Ambassador junior championship' },
  { src: clubPhoto('club-trophy-black-dobok'), caption: 'Trophy winner', detail: 'Championship', alt: 'Coach in a black uniform holding a trophy' },
  { src: clubPhoto('club-inter-school-gold'), caption: 'Inter-school gold', detail: 'Inter school and college games', alt: 'Two students with gold medals and a certificate beside their coach' },
  { src: clubPhoto('club-young-champion'), caption: 'Our young champion', detail: 'Silver medal and certificate', alt: 'Young Black Wolf student with a silver medal and certificate' },
  { src: clubPhoto('club-team-trophy'), caption: 'Team trophy', detail: 'Club championship win', alt: 'The club team celebrating with a trophy and medals' },
  { src: clubPhoto('club-fight-day'), caption: 'Fight day', detail: 'Ready to compete', alt: 'Student in sparring gear smiling with his coach' },
  { src: clubPhoto('club-international-athlete'), caption: 'Training with the best', detail: 'International athletes', alt: 'Black Wolf athlete with an international Taekwondo athlete' },
  { src: clubPhoto('club-belt-grading'), caption: 'Belt grading', detail: 'Certificates and promotions', alt: 'Large group of students in uniforms after a belt grading' },
  { src: clubPhoto('club-interclub'), caption: 'Inter-Club Championship', detail: 'Kids Warrior event', alt: 'Coach receiving an award at an inter-club Taekwondo championship' },
  { src: clubPhoto('club-belt-line-up'), caption: 'Black and blue belts', detail: 'Club line-up', alt: 'Five students in Taekwondo uniforms with arms folded' },
  { src: clubPhoto('club-trophy'), caption: 'Trophy day', detail: 'Championship win', alt: 'Black Wolf athlete receiving a trophy' },
  { src: clubPhoto('club-azadi-combat'), caption: 'Azadi Combat', detail: 'Belt promotion and medals', alt: 'Young student showing his medal with two coaches' },
  { src: clubPhoto('club-tkd-lovers'), caption: 'National TKD Lovers Championship', detail: 'Silver medal', alt: 'Two athletes with a medal at a national Taekwondo championship' },
  { src: clubPhoto('club-belt-promotion'), caption: 'Belt promotion day', detail: 'Medals and certificates', alt: 'Two young students with medals, certificates and new belts' },
  { src: clubPhoto('club-black-belts-selfie'), caption: 'Black belt family', detail: 'Training camp', alt: 'Selfie of three Taekwondo black belts at a training camp' },
  { src: clubPhoto('club-korean-certificate'), caption: 'Certificate of participation', detail: 'Korean Ambassador Championship', alt: 'Young student with a certificate beside a Korean coach' },
  { src: clubPhoto('club-crew'), caption: 'The crew', detail: 'Club family', alt: 'Club members standing together with arms folded' },
  { src: clubPhoto('club-red-belt'), caption: 'Red belt, ready', detail: 'Student spotlight', alt: 'Young student in a white uniform and red belt in guard stance' },
  { src: clubPhoto('club-coach-portrait'), caption: 'Leading the pack', detail: 'Our coaches', alt: 'Coach in a club jacket' },
  { src: clubPhoto('club-certificate'), caption: 'Recognised for coaching', detail: 'Certificate of appreciation', alt: 'Black Wolf coach receiving a certificate of appreciation' },
  { src: clubPhoto('club-the-pack'), caption: 'The pack', detail: 'More than a club', alt: 'Large group of club members smiling together' },
  { src: clubPhoto('club-road-trip'), caption: 'On the road', detail: 'Travelling to compete', alt: 'Club members together on the bus to a competition' },
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
  { value: 6, label: 'Years of experience in all sports' },
]
