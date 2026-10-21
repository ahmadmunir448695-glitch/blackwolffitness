/**
 * ============================================================================
 *  TRAINING PROGRAMS (mock data)
 *
 *  This is the content for the Services menu, the programme cards and every
 *  service landing page. It is also the data contract for your future API:
 *  `GET /programs/` should return objects with this shape (or map them in
 *  src/services/api/programs.js → mapProgram).
 *
 *  Each page is built from its own `sections` list, so pages can have
 *  different structures. Available section types (see components/programs/sections):
 *    intro, focus, levels, session, belts, combos, ranges, feature,
 *    goalSteps, sampleWeek, skillLadder, ageGroups, support, safety,
 *    parentSteps, benefits, coaches, schedule, faq
 *
 *  Review all copy with the club before launch — especially anything that
 *  describes equipment, facilities, grading or competition.
 *  Keep this file free of imports other than ../media.js (Node reads it).
 * ============================================================================
 */
import { media } from '../media.js'

export const programs = [
  // ---------------------------------------------------------------------------
  {
    slug: 'taekwondo',
    name: 'Taekwondo',
    discipline: 'Taekwondo',
    tagline: 'Fast, precise kicking, flexibility and discipline, built belt by belt.',
    image: media.kickTraining,
    seo: {
      title: 'Taekwondo Training for Kids, Teens & Adults',
      description:
        'Learn Taekwondo at Black Wolf Fitness Club: kicking technique, flexibility, balance, forms, controlled sparring and optional competition preparation for beginners and advanced students.',
    },
    hero: {
      variant: 'split',
      image: media.kickTraining,
      title: 'Taekwondo',
      lead: 'A striking art built on fast, precise kicks. Train for fitness, focus and self-control, and prepare for competition if you choose to.',
      mark: 'belts',
    },
    sections: [
      {
        type: 'intro',
        heading: 'What Taekwondo training involves',
        paragraphs: [
          'Taekwondo is a Korean martial art best known for its kicking techniques: fast, high and precise. It is also a system of etiquette, patience and self-control that students practise in every class.',
          'Training combines technique drills, forms (set patterns of movement), pad work, stretching and controlled partner work. Students progress through coloured belts, so there is always a clear next step to work towards.',
        ],
        image: media.taekwondoPractice,
      },
      {
        type: 'focus',
        heading: 'The four foundations',
        intro: 'Every class works on each of these, at the level the student is ready for.',
        items: [
          { title: 'Kicking technique', text: 'Front, roundhouse, side and back kicks first, then turning, spinning and jumping kicks as control improves.' },
          { title: 'Flexibility', text: 'Dynamic and static stretching for hip mobility and kicking height, built up safely over months, not forced.' },
          { title: 'Balance', text: 'Stances, single-leg control and chambering, so every kick starts and finishes in a stable position.' },
          { title: 'Discipline', text: 'Bowing in, listening, respecting training partners and finishing what you start. Habits that carry beyond the class.' },
        ],
      },
      {
        type: 'belts',
        heading: 'The belt path',
        intro: 'Coloured belts mark progress in technique, forms and conduct. Students grade when their coach judges they are ready.',
        belts: [
          { name: 'White', hex: '#F4F4F4', text: 'Stances, basic blocks and the first kicks. Learning class etiquette.' },
          { name: 'Yellow', hex: '#F2C230', text: 'Cleaner kicks, the first form and basic combinations.' },
          { name: 'Green', hex: '#3E9B57', text: 'Kicking with speed and distance. Controlled partner drills begin.' },
          { name: 'Blue', hex: '#2F6FD6', text: 'Turning kicks, longer forms and introduction to sparring with protective gear.' },
          { name: 'Red', hex: '#D63A2F', text: 'Advanced combinations, spinning kicks and tactical sparring.' },
          { name: 'Black', hex: '#0B0B0D', text: 'A deep command of the fundamentals, and the beginning of advanced study.' },
        ],
        note: 'Belt colours, stripes and grading requirements follow the club syllabus. Ask a coach for the current grading dates.',
      },
      {
        type: 'levels',
        heading: 'Beginner to advanced',
        intro: 'You start at the beginning, whatever your age or fitness.',
        levels: [
          { name: 'Beginner', text: 'Learn how to stand, move, block and kick correctly.', points: ['Stances and footwork', 'Front, roundhouse and side kicks', 'First form', 'Safe partner work'] },
          { name: 'Intermediate', text: 'Build speed, accuracy and combinations.', points: ['Combination kicking', 'Distance and timing', 'Longer forms', 'Controlled sparring'] },
          { name: 'Advanced', text: 'Refine power, tactics and advanced techniques.', points: ['Spinning and jumping kicks', 'Advanced forms', 'Competition-style sparring', 'Helping newer students'] },
        ],
      },
      {
        type: 'feature',
        heading: 'Sparring and competition preparation',
        paragraphs: [
          'Sparring is introduced gradually, with protective equipment and clear rules. Beginners start with no-contact and light-contact drills; free sparring comes later and always under a coach’s supervision.',
          'Students who want to compete can work with their coach on scoring techniques, ring movement and match preparation. Competition is always optional. Many students train purely for fitness and personal progress.',
        ],
        points: ['Protective equipment for every sparring drill', 'Contact level matched to experience', 'Optional competition preparation'],
        image: media.beltTying,
      },
      {
        type: 'benefits',
        heading: 'What you gain',
        items: [
          { title: 'Leg strength and power', text: 'Kicking builds strong hips, legs and core.' },
          { title: 'Flexibility', text: 'Better hip and hamstring mobility, gained steadily.' },
          { title: 'Coordination', text: 'Faster reactions and better control of your body.' },
          { title: 'Focus', text: 'Forms and drills train patience and concentration.' },
          { title: 'Confidence', text: 'Each belt is visible proof of progress.' },
          { title: 'Fitness', text: 'Classes are active from warm-up to cool-down.' },
        ],
      },
      { type: 'coaches', heading: 'Taekwondo coaches' },
      { type: 'schedule', heading: 'Taekwondo class times' },
      {
        type: 'faq',
        heading: 'Taekwondo questions',
        items: [
          { q: 'Do I need to be flexible before I start?', a: 'No. Flexibility is something you build in class. Stretching is part of every session and progresses at your own pace.' },
          { q: 'What should I wear to my first class?', a: 'Comfortable sports clothes you can move and stretch in. Ask the club about uniforms once you decide to continue.' },
          { q: 'Is sparring compulsory?', a: 'No. Sparring is introduced gradually with protective gear, and your coach decides when you are ready. You can train without competing.' },
          { q: 'Can children and adults both learn Taekwondo?', a: 'Yes. Contact the club and we will suggest the right class for the student’s age and experience.' },
          { q: 'How does grading work?', a: 'Gradings check techniques, forms and conduct. Your coach tells you when you are ready to grade and what to practise beforehand.' },
        ],
      },
    ],
    cta: {
      heading: 'Start with a Taekwondo trial class',
      text: 'Tell us about your experience and goals, and we will suggest the right class to start in.',
      primaryLabel: 'Book a trial class',
    },
  },

  // ---------------------------------------------------------------------------
  {
    slug: 'boxing',
    name: 'Boxing',
    discipline: 'Boxing',
    tagline: 'Sharp hands, smart footwork and serious conditioning.',
    image: media.boxingSolo,
    seo: {
      title: 'Boxing Classes for Beginners & Experienced Boxers',
      description:
        'Boxing classes at Black Wolf Fitness Club: punching technique, combinations, footwork, defence and conditioning, with coached progression from your first session to advanced training.',
    },
    hero: {
      variant: 'full',
      image: media.boxingPair,
      title: 'Boxing',
      lead: 'Learn to punch correctly, move well and defend yourself, while getting fitter than you have been in years.',
      mark: 'numbers',
    },
    sections: [
      {
        type: 'intro',
        heading: 'Boxing, taught from the stance up',
        paragraphs: [
          'Good boxing starts long before the first punch: how you stand, how you hold your guard and how you move your feet. We teach those foundations first, then build combinations, defence and ring awareness on top of them.',
          'Every session includes real conditioning, so you improve your fitness while learning a skill that keeps you interested for years.',
        ],
        image: media.boxingGloves,
      },
      {
        type: 'combos',
        heading: 'Learn the language of the pads',
        intro: 'Boxers call punches by number. Once you know the six, your coach can call any combination in a single breath.',
        legend: [
          { key: '1', name: 'Jab' },
          { key: '2', name: 'Cross' },
          { key: '3', name: 'Lead hook' },
          { key: '4', name: 'Rear hook' },
          { key: '5', name: 'Lead uppercut' },
          { key: '6', name: 'Rear uppercut' },
        ],
        combos: [
          { sequence: ['1', '2'], name: 'The one-two', text: 'The first combination every boxer learns, and the one used most.' },
          { sequence: ['1', '1', '2'], name: 'Double jab, cross', text: 'The double jab closes distance and hides the cross.' },
          { sequence: ['1', '2', '3'], name: 'One-two-hook', text: 'Straight punches open the guard for the lead hook.' },
          { sequence: ['2', '3', '2'], name: 'Cross-hook-cross', text: 'Shifting weight side to side to keep punches flowing.' },
          { sequence: ['1', '6', '3', '2'], name: 'Jab, uppercut, hook, cross', text: 'Changing levels and angles in one sequence.' },
          { sequence: ['1', 'Slip', '2'], name: 'Jab, slip, cross', text: 'Defence built into offence: slip the counter, fire back.' },
        ],
        note: 'Numbering shown for an orthodox stance. Southpaws mirror the same system.',
      },
      {
        type: 'focus',
        heading: 'More than punching',
        items: [
          { title: 'Footwork', text: 'Moving in, out and around angles while staying balanced and ready to punch.' },
          { title: 'Defence', text: 'Guard, blocks, parries, slips and rolls, so you learn to avoid punches as well as throw them.' },
          { title: 'Coordination', text: 'Pad work and partner drills sharpen hand-eye coordination and timing.' },
          { title: 'Conditioning', text: 'Round-based work, skipping and core training for real boxing fitness.' },
        ],
      },
      {
        type: 'session',
        heading: 'How a boxing session runs',
        intro: 'Most classes follow this structure, adjusted by the coach for the group.',
        steps: [
          { name: 'Warm-up', text: 'Skipping, mobility and shadow boxing to get loose and focused.' },
          { name: 'Technique', text: 'One skill or combination broken down and drilled with feedback.' },
          { name: 'Pads and partner drills', text: 'Applying the technique with a partner or coach holding pads.' },
          { name: 'Bag rounds', text: 'Timed rounds to build output, rhythm and stamina.' },
          { name: 'Conditioning and cool-down', text: 'Core and strength work, then stretching.' },
        ],
      },
      {
        type: 'levels',
        heading: 'Beginner training to advanced development',
        levels: [
          { name: 'Beginner', text: 'The fundamentals, practised until they are automatic.', points: ['Stance and guard', 'The six punches', 'Basic footwork', 'Technique on pads'] },
          { name: 'Developing', text: 'Combinations, defence and counter-punching.', points: ['Three- and four-punch combinations', 'Slips, rolls and blocks', 'Counter-punching', 'Conditioning rounds'] },
          { name: 'Advanced', text: 'Ring craft and controlled sparring under supervision.', points: ['Controlled sparring', 'Ring movement and tactics', 'Fight-ready conditioning', 'Competition preparation if wanted'] },
        ],
      },
      {
        type: 'benefits',
        heading: 'Why people stay with boxing',
        items: [
          { title: 'Endurance', text: 'Rounds build serious cardiovascular fitness.' },
          { title: 'Upper-body and core strength', text: 'Every punch starts from the floor and turns through the core.' },
          { title: 'Faster reactions', text: 'Pad work trains you to see and respond quickly.' },
          { title: 'Stress relief', text: 'A focused, physical way to leave the day behind.' },
          { title: 'Confidence', text: 'Knowing how to move and defend yourself changes how you carry yourself.' },
          { title: 'Coordination', text: 'Hands, feet and breathing working together.' },
        ],
      },
      { type: 'coaches', heading: 'Boxing coaches' },
      { type: 'schedule', heading: 'Boxing class times' },
      {
        type: 'faq',
        heading: 'Boxing questions',
        items: [
          { q: 'Do I have to spar?', a: 'No. Sparring is optional and only introduced when your coach thinks you are ready. Many members box purely for fitness and skill.' },
          { q: 'Do I need my own gloves?', a: 'You will need gloves and hand wraps for regular training. Ask the club what is available for your first sessions.' },
          { q: 'I am not fit. Can I still start?', a: 'Yes. Beginners work at their own pace and the coach scales the conditioning for you.' },
          { q: 'Is boxing suitable for women?', a: 'Yes. Boxing technique and conditioning suit anyone. Ask us about the class that fits you best.' },
          { q: 'How often should I train?', a: 'Two or three sessions a week is a good start. Consistency matters more than intensity in the first months.' },
        ],
      },
    ],
    cta: {
      heading: 'Book your first boxing session',
      text: 'No experience needed. Tell us your goals and we will help you start in the right class.',
      primaryLabel: 'Book a trial session',
    },
  },

  // ---------------------------------------------------------------------------
  {
    slug: 'kickboxing',
    name: 'Kickboxing',
    discipline: 'Kickboxing',
    tagline: 'Punches and kicks combined into one complete striking system.',
    image: media.heavyBag,
    seo: {
      title: 'Kickboxing Training for Fitness & Technique',
      description:
        'Kickboxing training at Black Wolf Fitness Club: punch and kick combinations, conditioning, agility and coordination, with beginner-to-advanced coaching.',
    },
    hero: {
      variant: 'split-reverse',
      image: media.kickboxingCoach,
      title: 'Kickboxing',
      lead: 'The hands of boxing and the kicks of the martial arts, trained together. A complete striking workout and a real skill.',
      mark: 'none',
    },
    sections: [
      {
        type: 'intro',
        heading: 'Hands and feet, working as one',
        paragraphs: [
          'Kickboxing combines boxing punches with kicks, and in many styles knees. The challenge, and the fun, is linking them: a punch that sets up a kick, a kick that opens the way for a punch.',
          'Classes balance technique and conditioning. You learn proper form on the pads, then put it under pressure in rounds that build stamina, power and agility.',
        ],
        image: media.kickboxingWoman,
      },
      {
        type: 'combos',
        heading: 'Combinations you will drill',
        intro: 'Punch numbers stay the same as boxing. Kicks are called by name.',
        legend: [
          { key: '1', name: 'Jab' },
          { key: '2', name: 'Cross' },
          { key: '3', name: 'Lead hook' },
          { key: 'Low kick', abbr: 'LK', name: 'Kick to the thigh' },
          { key: 'Roundhouse', abbr: 'RH', name: 'Body or head kick' },
          { key: 'Teep', abbr: 'TP', name: 'Push kick' },
        ],
        combos: [
          { sequence: ['1', '2', 'Low kick'], name: 'One-two, low kick', text: 'Hands high draw the guard up, the kick lands low.' },
          { sequence: ['1', '2', 'Roundhouse'], name: 'One-two, rear roundhouse', text: 'The classic finish: rotate fully off the cross into the kick.' },
          { sequence: ['Teep', '2'], name: 'Teep, cross', text: 'Stop an opponent coming forward, then fire the cross.' },
          { sequence: ['3', 'Roundhouse'], name: 'Lead hook, body kick', text: 'The hook turns the head, the kick goes to the open side.' },
        ],
        note: 'Which techniques are allowed in sparring depends on the rule set your coach is preparing you for.',
      },
      {
        type: 'focus',
        heading: 'What kickboxing develops',
        items: [
          { title: 'Technique', text: 'Correct form for every punch and kick, so power comes without strain.' },
          { title: 'Conditioning', text: 'High-output rounds for stamina and strength endurance.' },
          { title: 'Agility', text: 'Footwork, switching stances and changing levels quickly.' },
          { title: 'Coordination', text: 'Linking hands and feet smoothly, on both sides of the body.' },
        ],
      },
      {
        type: 'levels',
        heading: 'Training options from beginner to advanced',
        intro: 'Start with the basics and move up when your coach sees you are ready.',
        levels: [
          { name: 'Beginner', text: 'Stance, guard, basic punches and kicks.', points: ['Stance and movement', 'Jab, cross, hooks', 'Roundhouse and teep', 'Pad work with a partner'] },
          { name: 'Intermediate', text: 'Combinations, defence and conditioning rounds.', points: ['Punch-kick combinations', 'Checking and blocking kicks', 'Counter-attacks', 'Timed rounds'] },
          { name: 'Advanced', text: 'Controlled sparring, tactics and preparation.', points: ['Controlled sparring', 'Ring strategy', 'Advanced combinations', 'Competition preparation if wanted'] },
        ],
      },
      {
        type: 'benefits',
        heading: 'Benefits',
        items: [
          { title: 'Full-body workout', text: 'Legs, core, shoulders and lungs all work hard.' },
          { title: 'Power and speed', text: 'Explosive movements trained with good technique.' },
          { title: 'Balance', text: 'Kicking trains single-leg strength and stability.' },
          { title: 'Self-confidence', text: 'Real skills that build belief in yourself.' },
        ],
      },
      { type: 'coaches', heading: 'Kickboxing coaches' },
      { type: 'schedule', heading: 'Kickboxing class times' },
      {
        type: 'faq',
        heading: 'Kickboxing questions',
        items: [
          { q: 'What is the difference between boxing and kickboxing?', a: 'Boxing uses punches only. Kickboxing adds kicks and, in some styles, knees, so you train your legs and balance as well as your hands.' },
          { q: 'Can complete beginners join?', a: 'Yes. Beginners learn the basics first and only move on to combinations and sparring when they are ready.' },
          { q: 'Will I get hit?', a: 'Not in beginner training. Contact is introduced gradually, with protective gear and under supervision, and sparring is optional.' },
          { q: 'What equipment do I need?', a: 'Gloves, hand wraps and later shin guards. Ask the club about what you need for your first sessions.' },
        ],
      },
    ],
    cta: {
      heading: 'Try a kickboxing class',
      text: 'Send us a message and we will help you pick the right starting class.',
      primaryLabel: 'Book a trial class',
    },
  },

  // ---------------------------------------------------------------------------
  {
    slug: 'mma',
    name: 'Mixed Martial Arts (MMA)',
    shortName: 'MMA',
    discipline: 'MMA',
    tagline: 'Striking, clinch and ground fundamentals, trained as one system.',
    image: media.mmaRing,
    seo: {
      title: 'MMA Training: Striking, Clinch & Ground Fundamentals',
      description:
        'Mixed Martial Arts training at Black Wolf Fitness Club: striking fundamentals, clinch work, ground training where offered, conditioning and technical development for all levels.',
    },
    hero: {
      variant: 'full',
      image: media.mmaExchange,
      title: 'Mixed Martial Arts',
      lead: 'MMA brings striking and grappling together. We focus on sound fundamentals, safe training and steady technical development.',
      mark: 'none',
    },
    sections: [
      {
        type: 'intro',
        heading: 'What MMA training covers',
        paragraphs: [
          'Mixed Martial Arts combines techniques from striking and grappling arts into one complete system. A good MMA athlete can strike at range, control the clinch and stay safe on the ground.',
          'Training is technical first and intense second. You learn each range separately, then practise the transitions between them, the part that makes MMA its own discipline.',
        ],
        image: media.mmaCage,
      },
      {
        type: 'ranges',
        heading: 'Three ranges, one game',
        intro: 'Select a range to see what you will work on.',
        ranges: [
          {
            name: 'Striking',
            text: 'The fundamentals of punching and kicking for mixed rules: a stance that defends takedowns, and strikes that keep you balanced.',
            skills: ['Stance and guard for MMA', 'Punches, kicks and knees', 'Distance management', 'Striking defence'],
          },
          {
            name: 'Clinch',
            text: 'The fight at close range: controlling your opponent, staying upright and creating openings.',
            skills: ['Hand fighting and control', 'Clinch position and pummelling', 'Off-balancing', 'Takedown defence'],
          },
          {
            name: 'Ground',
            text: 'Positions, escapes and control on the mat, built with safe, structured drills.',
            skills: ['Positions and transitions', 'Escapes from bottom positions', 'Getting back to your feet', 'Submission fundamentals'],
            // Remove this range (or edit the note) if the club does not currently offer ground training.
            availabilityNote: 'Ask the club about current grappling and ground-training sessions before enrolling.',
          },
        ],
      },
      {
        type: 'levels',
        heading: 'Technical development',
        levels: [
          { name: 'Fundamentals', text: 'Each range learned separately, with an emphasis on safety and control.', points: ['MMA stance and movement', 'Basic strikes and defence', 'Clinch basics', 'Breakfalls and safe drilling'] },
          { name: 'Development', text: 'Linking ranges and building positional awareness.', points: ['Striking to clinch transitions', 'Takedown defence', 'Positional drills', 'Situational sparring'] },
          { name: 'Advanced', text: 'Strategy, pressure testing and preparation.', points: ['Controlled sparring', 'Game planning', 'Advanced transitions', 'Competition preparation if wanted'] },
        ],
      },
      {
        type: 'feature',
        heading: 'Conditioning for mixed rules',
        paragraphs: [
          'MMA asks more of your body than almost any sport: explosive bursts, grip strength, and the endurance to keep working when you are tired.',
          'Conditioning is built into the program with round-based drills, strength work and mobility, so your fitness supports your technique instead of limiting it.',
        ],
        points: ['Round-based conditioning', 'Strength and power work', 'Mobility for injury prevention'],
        image: media.heavyBag,
      },
      {
        type: 'benefits',
        heading: 'Benefits',
        items: [
          { title: 'Complete skill set', text: 'Comfortable standing, in the clinch and in transitions.' },
          { title: 'Problem solving', text: 'Every exchange is a puzzle to work through calmly.' },
          { title: 'Total-body fitness', text: 'Strength, endurance and mobility in one program.' },
          { title: 'Composure', text: 'Learning to stay calm under physical pressure.' },
        ],
      },
      { type: 'coaches', heading: 'MMA coaches' },
      { type: 'schedule', heading: 'MMA class times' },
      {
        type: 'faq',
        heading: 'MMA questions',
        items: [
          { q: 'Do I need experience in another martial art first?', a: 'No. Fundamentals classes start from zero. Experience in boxing, kickboxing or Taekwondo helps, but it is not required.' },
          { q: 'Is MMA training full contact?', a: 'No. Most training is technical drilling. Sparring is controlled, supervised and introduced only when you are ready.' },
          { q: 'Do you teach ground fighting?', a: 'Please ask the club about current grappling and ground-training sessions, as availability may vary.' },
          { q: 'What do I need to bring?', a: 'Sports clothes, water and, as you progress, gloves and a mouthguard. The club will advise what you need.' },
        ],
      },
    ],
    cta: {
      heading: 'Start MMA with the fundamentals',
      text: 'Message us about your experience and we will recommend the right first class.',
      primaryLabel: 'Book a trial class',
    },
  },

  // ---------------------------------------------------------------------------
  {
    slug: 'general-fitness',
    name: 'General Fitness',
    discipline: 'Fitness',
    tagline: 'Strength, conditioning and mobility for everyday life.',
    image: media.barbellClass,
    seo: {
      title: 'General Fitness, Strength & Conditioning Training',
      description:
        'General fitness training at Black Wolf Fitness Club: strength and conditioning, functional training, mobility and beginner-friendly programs with goal setting and progress reviews.',
    },
    hero: {
      variant: 'split',
      image: media.barbellClass,
      title: 'General Fitness',
      lead: 'Get stronger, move better and build fitness that lasts, with structured training and coaches who know what you are working towards.',
      mark: 'none',
    },
    sections: [
      {
        type: 'intro',
        heading: 'Fitness with a plan behind it',
        paragraphs: [
          'General Fitness is for anyone who wants to feel stronger and fitter, whether you are starting from scratch, coming back after a break or supporting your martial arts training.',
          'Instead of random workouts, you train with structure: clear goals, a sensible progression and regular check-ins so you can see what is improving.',
        ],
        image: media.groupWorkout,
      },
      {
        type: 'focus',
        heading: 'What the program covers',
        items: [
          { title: 'Strength and conditioning', text: 'Compound lifts, bodyweight strength and conditioning circuits, scaled to your level.' },
          { title: 'Functional training', text: 'Movements that carry over to daily life: pushing, pulling, carrying, squatting and hinging.' },
          { title: 'Mobility and flexibility', text: 'Joint mobility and stretching to move freely and reduce stiffness.' },
          { title: 'General fitness', text: 'Better stamina, energy and body composition through consistent training.' },
        ],
      },
      {
        type: 'goalSteps',
        heading: 'From goal to progress',
        intro: 'Progress comes from knowing where you are starting, where you want to go and what to do in between.',
        steps: [
          { name: 'Talk it through', text: 'Tell a coach about your experience, any limitations and what you want to change.' },
          { name: 'Set a realistic goal', text: 'Something specific and achievable, like your first full push-up or running further without stopping.' },
          { name: 'Train with structure', text: 'Follow a program that progresses step by step instead of guessing each session.' },
          { name: 'Review and adjust', text: 'Check progress with your coach regularly and set the next target.' },
        ],
      },
      {
        type: 'sampleWeek',
        heading: 'A balanced training week',
        intro: 'An example of how sessions can be organised. Your coach adapts it to your goals and the time you have.',
        days: [
          { label: 'Session one', focus: 'Full-body strength', text: 'Squat, push, pull and core work with controlled technique.' },
          { label: 'Session two', focus: 'Conditioning', text: 'Intervals and circuits to build stamina and burn energy.' },
          { label: 'Session three', focus: 'Mobility and core', text: 'Stretching, joint mobility and trunk stability.' },
        ],
        note: 'Example structure only. This is not a class timetable.',
      },
      {
        type: 'feature',
        heading: 'New to training? Start here',
        paragraphs: [
          'Beginner sessions focus on learning movements correctly before adding load or speed. You will never be expected to keep up with someone who has trained for years.',
        ],
        points: ['Technique before intensity', 'Every exercise has an easier and a harder option', 'Coaches check form and give feedback'],
        image: media.boxJumps,
      },
      {
        type: 'benefits',
        heading: 'Benefits',
        items: [
          { title: 'Strength', text: 'Everyday tasks feel easier.' },
          { title: 'Energy', text: 'Regular training improves stamina and sleep.' },
          { title: 'Mobility', text: 'Less stiffness and better posture.' },
          { title: 'Consistency', text: 'Structure and goals keep you coming back.' },
        ],
      },
      { type: 'coaches', heading: 'Fitness coaches' },
      { type: 'schedule', heading: 'Fitness session times' },
      {
        type: 'faq',
        heading: 'General Fitness questions',
        items: [
          { q: 'Do I need to be fit to join?', a: 'No. The program is designed for every starting point, including complete beginners.' },
          { q: 'Will I get a plan built around my goals?', a: 'Coaches help you set a goal and adapt sessions to it. Ask the club about one-to-one or personalised options.' },
          { q: 'Can I combine fitness with martial arts?', a: 'Yes, and it is a great combination. Ask about memberships that include more than one program.' },
          { q: 'How do I track my progress?', a: 'Through simple benchmarks you set with your coach, such as lifts, reps, times or mobility tests, and regular reviews.' },
        ],
      },
    ],
    cta: {
      heading: 'Start your fitness plan',
      text: 'Tell us what you want to achieve and we will help you take the first step.',
      primaryLabel: 'Book a trial session',
    },
  },

  // ---------------------------------------------------------------------------
  {
    slug: 'gymnastics',
    name: 'Gymnastics',
    discipline: 'Gymnastics',
    tagline: 'Flexibility, balance and body control from the ground up.',
    image: media.gymnasticsBeam,
    seo: {
      title: 'Gymnastics Classes: Flexibility, Balance & Body Control',
      description:
        'Gymnastics at Black Wolf Fitness Club: flexibility, mobility, balance, coordination and foundational movement skills, taught through age-appropriate progressions.',
    },
    hero: {
      variant: 'split',
      image: media.gymnasticsLeap,
      title: 'Gymnastics',
      lead: 'Strength, flexibility and control, learned one skill at a time. The foundation that makes every other sport easier.',
      mark: 'none',
    },
    sections: [
      {
        type: 'intro',
        heading: 'Movement skills that last a lifetime',
        paragraphs: [
          'Gymnastics teaches the body to move with control: holding shapes, balancing, rolling, jumping and landing safely. These skills build strength and confidence that carry over into every sport.',
          'Skills are learned through small, safe progressions. Each gymnast moves on when they are ready, not when the calendar says so.',
        ],
        image: media.gymnasticsGroup,
      },
      {
        type: 'focus',
        heading: 'What gymnasts work on',
        items: [
          { title: 'Flexibility and mobility', text: 'Splits, bridges and shoulder mobility, developed gradually and safely.' },
          { title: 'Balance and coordination', text: 'Controlled holds, beam-style balance work and coordinated sequences.' },
          { title: 'Body control', text: 'Core strength and body tension to hold shapes like the hollow, arch and handstand.' },
          { title: 'Foundational movement', text: 'Rolling, jumping, landing and falling safely, the building blocks of every skill.' },
        ],
      },
      {
        type: 'skillLadder',
        heading: 'The skill ladder',
        intro: 'Every skill is built on the one before it. Gymnasts climb at their own pace.',
        rungs: [
          { stage: 'Foundations', text: 'Shapes, safe landings and first rolls.', skills: ['Tuck, pike and straddle shapes', 'Forward roll', 'Hollow and arch holds', 'Safe jumping and landing'] },
          { stage: 'Building blocks', text: 'Strength and balance for upside-down skills.', skills: ['Backward roll', 'Bridge', 'Cartwheel', 'Handstand against the wall'] },
          { stage: 'Linking skills', text: 'Combining skills into short sequences.', skills: ['Round-off', 'Free handstand holds', 'Walkover progressions', 'Simple routines'] },
        ],
        note: 'Skills are taught with progressions and coach spotting. No one is rushed to the next step.',
      },
      {
        type: 'ageGroups',
        heading: 'Age-appropriate training',
        intro: 'Training is matched to each age group’s stage of development.',
        groups: [
          { name: 'Early movers', ages: '', text: 'Play-based movement: balance, rolling, jumping and listening skills.' },
          { name: 'Juniors', ages: '', text: 'Structured skill learning, flexibility and strength through progressions.' },
          { name: 'Teens and adults', ages: '', text: 'Mobility, body control and skills, at whatever level you start from.' },
        ],
        note: 'Age groups and class availability are confirmed by the club.',
      },
      {
        type: 'benefits',
        heading: 'Benefits',
        items: [
          { title: 'Flexibility', text: 'Gradual, safe gains in range of motion.' },
          { title: 'Strength', text: 'Bodyweight strength, especially core and shoulders.' },
          { title: 'Coordination', text: 'Awareness of where the body is in space.' },
          { title: 'Confidence', text: 'Mastering a new skill is a real achievement.' },
        ],
      },
      { type: 'coaches', heading: 'Gymnastics coaches' },
      { type: 'schedule', heading: 'Gymnastics class times' },
      {
        type: 'faq',
        heading: 'Gymnastics questions',
        items: [
          { q: 'What age can my child start?', a: 'Please contact the club for the current age groups. We will suggest the right class for your child.' },
          { q: 'Does my child need any experience?', a: 'No. Beginners start with foundations and progress at their own pace.' },
          { q: 'How do you keep gymnasts safe?', a: 'Skills are taught through progressions, coaches spot where needed and nobody moves on before they are ready.' },
          { q: 'What should my child wear?', a: 'Fitted sports clothes without zips or buttons, with hair tied back. Jewellery should be removed.' },
          { q: 'Can adults do gymnastics too?', a: 'Ask the club about adult sessions. Gymnastics-style mobility and body control suit adults well.' },
        ],
      },
    ],
    cta: {
      heading: 'Book a gymnastics trial',
      text: 'Tell us the gymnast’s age and experience and we will find the right group.',
      primaryLabel: 'Book a trial class',
    },
  },

  // ---------------------------------------------------------------------------
  {
    slug: 'special-kids-training',
    name: 'Special Kids Training',
    discipline: 'Special Kids',
    featured: true,
    tagline: 'Structured, supportive physical activity with individualized support for every child.',
    image: media.kidsKata,
    seo: {
      title: 'Special Kids Training: Individualized Support for Children',
      description:
        'Special Kids Training at Black Wolf Fitness Club: structured physical activity, coordination, balance and motor-skill development with individualized support, supervision and parent consultation.',
    },
    hero: {
      variant: 'light',
      image: media.kidsKata,
      title: 'Special Kids Training',
      lead: 'Structured physical activity in a calm, encouraging environment, with individualized support for children who learn and move in their own way.',
      mark: 'none',
    },
    sections: [
      {
        type: 'intro',
        heading: 'A program built around your child',
        paragraphs: [
          'Special Kids Training gives children a structured, predictable session where they can move, play and build physical skills at their own pace. Coaches adapt each activity to the child’s needs, strengths and comfort level.',
          'We work closely with parents and guardians to set goals that make sense for each child, and we celebrate progress in whatever form it comes.',
        ],
        disclaimer:
          'Special Kids Training is a sports and physical activity program. It does not diagnose, treat or replace therapy for any medical or developmental condition. We are happy to work alongside guidance from your child’s doctor or therapist.',
        image: media.kidsTrampoline,
      },
      {
        type: 'focus',
        heading: 'What children work on',
        intro: 'Activities are chosen for the child, not the other way round.',
        items: [
          { title: 'Coordination', text: 'Throwing, catching, stepping and simple sequences that link movements together.' },
          { title: 'Balance', text: 'Standing, walking and moving with control on different surfaces and shapes.' },
          { title: 'Motor skills', text: 'Running, jumping, crawling and climbing patterns that build strength and body awareness.' },
          { title: 'Focus', text: 'Short, clear tasks with a beginning and an end, gradually extended as the child is ready.' },
          { title: 'Confidence', text: 'Small achievable goals, so children experience success often.' },
          { title: 'Social participation', text: 'Turn-taking, partner games and group activities at a comfortable pace.' },
        ],
      },
      {
        type: 'session',
        heading: 'What a session looks like',
        intro: 'Sessions follow a predictable routine, so children know what comes next.',
        steps: [
          { name: 'Welcome and settling in', text: 'A familiar greeting and time to get comfortable in the space.' },
          { name: 'Warm-up games', text: 'Fun movement games that get the body ready.' },
          { name: 'Skill stations', text: 'Balance, coordination and movement activities adapted for each child.' },
          { name: 'Group or partner activity', text: 'A simple shared game to practise taking turns and working together.' },
          { name: 'Calm-down and goodbye', text: 'Slow movements, breathing and praise for the effort made.' },
        ],
      },
      {
        type: 'support',
        heading: 'Individualized Support',
        paragraphs: [
          'Every child is different. Some need more time, some need fewer words, some need a quieter moment before trying again. Coaches adjust how they teach, not what they expect from the child.',
          'Children who need additional support are supervised by appropriately trained staff, and parents are part of the conversation from the first day.',
        ],
        points: [
          'Instruction adapted to each child’s pace',
          'Clear, simple instructions with demonstrations',
          'Breaks whenever a child needs them',
          'Goals agreed with parents and reviewed together',
          'Age-appropriate exercises matched to ability',
        ],
      },
      {
        type: 'safety',
        heading: 'Supervision and safety',
        intro: 'Parents should know exactly how their child is looked after. These are the standards every session follows.',
        items: [
          { title: 'Supervised at all times', text: 'Children are always supervised by coaches during the session.' },
          { title: 'Matched to the child', text: 'Activities are chosen for each child’s age, size and ability.' },
          { title: 'Trained supervision', text: 'Children who need extra support are looked after by appropriately trained staff.' },
          { title: 'Parents informed', text: 'You will be told what your child worked on and how they responded.' },
        ],
        // Fill in once confirmed by the club. Empty values show "Ask us" on the page.
        details: [
          { label: 'Group size', value: '' },
          { label: 'Coach-to-child ratio', value: '' },
          { label: 'Session length', value: '' },
          { label: 'Drop-off and pick-up', value: '' },
        ],
      },
      {
        type: 'parentSteps',
        heading: 'How to get started',
        intro: 'There is no pressure to commit. The first steps are about getting to know your child.',
        steps: [
          { name: 'Send an inquiry', text: 'Use the form or WhatsApp to tell us a little about your child.' },
          { name: 'Parent consultation', text: 'A conversation about your child’s interests, needs and what helps them feel comfortable.' },
          { name: 'Trial session', text: 'Your child tries a session so we can see what works for them.' },
          { name: 'Regular sessions', text: 'Ongoing sessions with regular feedback and goals reviewed with you.' },
        ],
      },
      { type: 'coaches', heading: 'Who will work with your child' },
      { type: 'schedule', heading: 'Session times' },
      {
        type: 'faq',
        heading: 'Questions from parents',
        items: [
          { q: 'Does my child need a diagnosis to join?', a: 'No. The program is open to children who benefit from a more individualized, supportive approach, with or without a diagnosis.' },
          { q: 'Is this a therapy program?', a: 'No. Special Kids Training is a physical activity and sports program. It does not treat any condition, but we are happy to follow guidance from your child’s doctor or therapist.' },
          { q: 'Can I stay during the session?', a: 'Talk to us during the parent consultation. We will agree an arrangement that helps your child settle.' },
          { q: 'What if my child becomes overwhelmed?', a: 'Coaches watch for signs that a child needs a break, slow things down and offer a calmer activity. You will always be told how the session went.' },
          { q: 'What should my child wear?', a: 'Comfortable clothes they can move in easily. Let us know about any sensory preferences and we will work with them.' },
          { q: 'What ages is the program for?', a: 'Please contact the club for current age groups and availability.' },
        ],
      },
    ],
    cta: {
      audience: 'parents',
      heading: 'Talk to us about your child',
      text: 'Parents and guardians can book a consultation and a trial session. Tell us a little about your child and we will get back to you.',
      primaryLabel: 'Request a parent consultation',
    },
  },
]

export const programSlugs = programs.map((p) => p.slug)
