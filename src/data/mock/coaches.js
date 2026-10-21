/**
 * ============================================================================
 *  COACH PROFILES (mock data) — edit this one file to add, remove or update
 *  coaches. The Coaches page, coach profile pages, the home page and each
 *  service page all read from here (or from GET /coaches/ once the API is on).
 *
 *  Ahmad Munir's, Haidar Ali's and Muhammad Inaam Ul Haq's profiles are real
 *  (supplied by the club). The others are
 *  PLACEHOLDER profiles: no people or qualifications are invented. Replace
 *  each with real details, or delete it.
 *
 *  Fields
 *    slug            URL of the profile page: /coaches/<slug>   (lowercase, dashes)
 *    name            Full name. Empty = shows "Name to be announced".
 *    role            Position, e.g. 'Boxing Coach'.
 *    specializations Used by the filters on the Coaches page.
 *                    Use: 'Taekwondo', 'Boxing', 'Kickboxing', 'MMA',
 *                         'Fitness', 'Gymnastics', 'Special Kids'
 *    programs        Program slugs this coach teaches (see programs.js).
 *    photo           { src, alt } or null for the branded placeholder.
 *    bio             One or more paragraphs.
 *    experience      e.g. '8 years coaching'. Empty = hidden.
 *    certifications  List of strings. Empty = "To be added".
 *    achievements    List of strings. Empty = hidden.
 *    facts           Optional [{ label, value }] shown as tiles (rank, license…).
 *    coaching        Optional list: what this coach teaches.
 *    clubs           Optional list: clubs and schools coached at.
 *    education       Optional list of qualifications.
 *    publications    Optional list of research papers (full citations).
 *    whatsapp        Optional. The coach's own WhatsApp; their profile's
 *                    WhatsApp button chats with this number.
 *    languages       e.g. ['English', 'Urdu'].
 *    placeholder     true while this profile is not real yet.
 * ============================================================================
 */

export const coaches = [
  {
    slug: 'ahmad-munir',
    name: 'Ahmad Munir',
    role: 'Taekwondo, Boxing & MMA Coach',
    specializations: ['Taekwondo', 'Boxing', 'MMA', 'Fitness', 'Gymnastics', 'Special Kids'],
    programs: ['taekwondo', 'boxing', 'mma', 'general-fitness', 'gymnastics', 'special-kids-training'],
    photo: {
      src: new URL('../../assets/photos/coach-ahmad-munir.jpg', import.meta.url).href,
      alt: 'Ahmad Munir in a green Pakistan Taekwondo Foundation blazer',
    },
    bio: [
      'Ahmad Munir is a Pakistani Taekwondo black belt (South Korea) who also coaches boxing and MMA. He competes in the men’s −58 kg category and has won gold at the Thailand International Championship and bronze at the Asian Championship (G3) in Pakistan.',
      'As a coach he teaches punching and kicking technique, gymnastics, combat fitness, and speed, agility and reaction training, for individuals and groups. He has coached at Alpha Fitness Club, MatchFit, Paths Taekwondo Club, Sports University and Step Ahead High School.',
      'Ahmad also works with special-needs children, including children with ADHD and hyperactivity, using Taekwondo, balance, coordination and reaction exercises to build focus and confidence.',
    ],
    experience: 'Coaching at Alpha Fitness Club, MatchFit, Paths Taekwondo Club, Sports University and Step Ahead High School / Step Schools',
    facts: [
      { label: 'Rank', value: 'Black Belt, South Korea' },
      { label: 'License', value: 'WTF / Global License' },
      { label: 'Category', value: 'Men’s −58 kg' },
      { label: 'Nationality', value: 'Pakistani' },
    ],
    certifications: ['Taekwondo Black Belt, South Korea', 'WTF / Global License'],
    achievements: [
      'Thailand International Championship: Gold Medal',
      'Asian Championship, Pakistan (G3): Bronze Medal',
      'National Taekwondo Championships: Medalist',
      'Punjab Taekwondo Championship: Gold and Silver Medals',
      'District Lahore Championship: Gold Medal',
      'Online International Championship: 2 Gold Medals and 1 Silver Medal',
    ],
    coaching: [
      'Taekwondo coaching and technical training',
      'Boxing and combat fitness training',
      'MMA fundamentals and conditioning',
      'Gymnastics: flexibility, balance and body control',
      'Special-needs children’s fitness and Taekwondo coaching',
      'Training children with ADHD and hyperactivity',
      'Speed punching, balance, coordination and reaction exercises',
      'Individual and group fitness training',
    ],
    clubs: ['Alpha Fitness Club', 'MatchFit', 'Paths Taekwondo Club', 'Sports University', 'Step Ahead High School / Step Schools'],
    /** Coach's own WhatsApp (local or international format). */
    whatsapp: '03054486950',
    languages: [],
    placeholder: false,
  },
  {
    slug: 'haidar-ali',
    name: 'Haidar Ali',
    role: 'Taekwondo Coach & Fitness Trainer',
    specializations: ['Taekwondo', 'Boxing', 'Kickboxing', 'Gymnastics', 'Fitness', 'Special Kids'],
    programs: ['taekwondo', 'boxing', 'kickboxing', 'gymnastics', 'general-fitness', 'special-kids-training'],
    photo: {
      src: new URL('../../assets/photos/coach-haidar-ali.jpg', import.meta.url).href,
      alt: 'Haidar Ali in a white Taekwondo uniform with a black belt, holding a medal',
    },
    bio: [
      'Haidar Ali is a Taekwondo coach, sports teacher and fitness trainer with a 1st Dan black belt from Kukkiwon, South Korea. He is a dedicated, energetic coach who brings teamwork and discipline to every session.',
      'He has taught sport at Unique School and Step School in Lahore and at The Quaid-e-Azam School, Shamki Bhatia, and coached at Paths Tiger Taekwondo Club. He completed the 9th WT Online PTP coaching course (2021) and has travelled to Saudi Arabia for sport.',
      'His sessions build strength, coordination, flexibility, speed and agility, with injury prevention built in. He also coaches special kids’ fitness and children’s motor skills.',
    ],
    experience: 'Sports teacher and Taekwondo coach at schools and clubs in Lahore and Shamki Bhatia',
    facts: [
      { label: 'Rank', value: 'Black Belt 1st Dan, Kukkiwon' },
      { label: 'Coaching course', value: '9th WT Online PTP, 2021' },
      { label: 'Fitness', value: 'Level 1 Fitness Trainer' },
      { label: 'Languages', value: 'English, Urdu, Punjabi, Arabic' },
    ],
    certifications: [
      'Black Belt 1st Dan, Kukkiwon (South Korea)',
      '9th WT Online PTP Course, 2021 (online coaching certificate)',
      'Level 1 Fitness Trainer',
    ],
    achievements: [
      'Online Taekwondo Lover Championship 2025: Gold Medal',
      'Punjab Inter-College: Gold Medal',
      'Punjab Inter-College: Silver Medal',
      'Lahore District Event: 2 Gold Medals',
      'SA Garden National Championship: Certificate',
      'All Punjab Taekwondo Championship: Certificate',
      'FSB National Championship, Multan: Certificate',
    ],
    coaching: [
      'Personal sports and fitness training',
      'Special kids’ fitness',
      'Kids’ motor skills',
      'Strength, coordination, flexibility, speed and agility',
      'Injury prevention and safety',
      'Motivation and mental skills',
    ],
    clubs: [
      'Unique School, Lahore (Sports Teacher)',
      'Paths Tiger Taekwondo Club (Taekwondo & Sports Coach)',
      'Step School, Lahore (Sports Teacher)',
      'The Quaid-e-Azam School, Shamki Bhatia (Sports Teacher)',
    ],
    education: ['Intermediate, FA (Humanities), Punjab College, Lahore (in progress)', 'Matric (Arts), Pak Army Public School'],
    languages: ['English', 'Urdu', 'Punjabi', 'Arabic'],
    placeholder: false,
  },
  {
    slug: 'muhammad-inaam-ul-haq',
    name: 'Muhammad Inaam Ul Haq',
    role: 'Sports & Fitness Trainer · Taekwondo Coach',
    specializations: ['Taekwondo', 'Fitness'],
    programs: ['taekwondo', 'general-fitness'],
    photo: {
      src: new URL('../../assets/photos/coach-inaam-ul-haq.jpg', import.meta.url).href,
      alt: 'Muhammad Inaam Ul Haq in a black tracksuit with his arms folded',
    },
    bio: [
      'Muhammad Inaam Ul Haq is a sports sciences graduate with expertise in physiology, anatomy, sports training and sports psychology. He holds a 1st Dan black belt from Kukkiwon (World Taekwondo Headquarters, Korea) and is a NAVTTC-certified Level 2 Sports & Fitness Trainer.',
      'He currently lectures in Physical Education at Concordia Colleges, Manga Mandi. He has also been a sports teacher at Unique Group of Institutions in Lahore, Taekwondo coach at Paths Tiger Taekwondo Club and a personal sports and fitness trainer.',
      'His training covers strength, coordination, flexibility, speed and agility, injury prevention and mental skills. As sports president at the University of Education, Lahore, he also organised sports events and led volunteer teams.',
    ],
    experience: 'Lecturer in Physical Education, sports teacher, Taekwondo coach and personal trainer',
    facts: [
      { label: 'Rank', value: '1st Dan, Kukkiwon Korea' },
      { label: 'Certification', value: 'NAVTTC Level 2 Trainer' },
      { label: 'Degree', value: 'BS Sport Sciences' },
      { label: 'Currently', value: 'PE Lecturer, Concordia Colleges' },
    ],
    certifications: [
      'Certified Sports & Fitness Trainer, Level 2 (NAVTTC)',
      '1st Dan, Kukkiwon, World Taekwondo Headquarters, Korea (2019–2021)',
      '9th World Taekwondo Online Poomsae Training Program Course, 2021',
      'Event certificates: National Taekwondo Championship 2020, Inter-Collegiate 2020, Inter-Club Championship 2023, Forman Olympiad 2025, University of Education Sports Gala 2025, Forman Azadi Sports Fest 2025',
      'Volunteer, Punjab Police internship program (Batch 29)',
    ],
    achievements: [
      'Lahore Marathon 2026, 5 km: Finisher (Gold Medal)',
      'Inter-Collegiate: Gold Medal (Taekwondo)',
      'Inter-Club Championship 2023: Gold Medal (Taekwondo)',
      'Forman Azadi Sports Fest 2025: Runner-up (Basketball)',
    ],
    coaching: [
      'Personal sports and fitness training',
      'Strength, coordination, flexibility, speed and agility',
      'Injury prevention and safety',
      'Motivation and mental skills',
      'Sports event organisation and team coordination',
    ],
    clubs: [
      'Concordia Colleges, Manga Mandi (Lecturer, Physical Education, current)',
      'Unique Group of Institutions, Lahore (Sports Teacher)',
      'University of Education, Lahore (Sports President & Event Manager)',
      'Paths Tiger Taekwondo Club (Taekwondo Coach)',
      'Sports & Fitness Home Trainer (Personal Trainer)',
    ],
    education: [
      'BS Physical Education & Sport Sciences, University of Education, Lahore (2022–2026), CGPA 3.35',
      'Intermediate, FA (Humanities), Govt. Graduate College, Pattoki (2020–2022), 1st Division',
      'Matric (Biology Science), Govt. High School Nathey Khalsa (2018–2020), 2nd Division',
    ],
    publications: [
      'Inaam Ul Haq, M., Asghar, M., Burki, M. H. K., & Asif, H. B. “Role of Media in Developing Sports Culture in Society: An Empirical Study of University Students.” AL-JAMEI Research Journal 4, no. 1 (2026): 274–284.',
      'Khan, A., Butt, Z. I., Asif, H. B., Inaam Ul Haq, M., Naqvi, S. A. H., & Javed, A. “Social Media and Its Influence on Body Image, Self-Esteem, and Mental Health of University Student Athletes.”',
      'Asif, H. B., Burki, M. H. K., Mubarik, F., Inaam Ul Haq, M., Tariq, A., & Asghar, M. “Effect of Social Environment on Sports Participation of University Students: A Cross-Sectional Survey Study.” AL-JAMEI Research Journal 4, no. 1 (2026): 128–142.',
      'Asif, H. B., Khan, A., Butt, M. Z. I., Inaam Ul Haq, M., Javed, A., & Javaid, A. “Effect of Emotional Intelligence (EI) on the Performance of University Student Athletes.” Research Consortium Archive 3, no. 4 (2025): 1520–1528.',
    ],
    languages: ['English', 'Urdu', 'Punjabi'],
    placeholder: false,
  },
  {
    slug: 'boxing-coach',
    name: '',
    role: 'Boxing Coach',
    specializations: ['Boxing', 'Fitness'],
    programs: ['boxing', 'general-fitness'],
    photo: null,
    bio: [
      'Placeholder profile. Add the coach’s boxing background, coaching style and the classes they lead.',
    ],
    experience: '',
    certifications: [],
    achievements: [],
    languages: [],
    placeholder: true,
  },
  {
    slug: 'kickboxing-mma-coach',
    name: '',
    role: 'Kickboxing & MMA Coach',
    specializations: ['Kickboxing', 'MMA'],
    programs: ['kickboxing', 'mma'],
    photo: null,
    bio: [
      'Placeholder profile. Add the coach’s striking and grappling background and what their classes focus on.',
    ],
    experience: '',
    certifications: [],
    achievements: [],
    languages: [],
    placeholder: true,
  },
  {
    slug: 'strength-conditioning-coach',
    name: '',
    role: 'Strength & Conditioning Coach',
    specializations: ['Fitness'],
    programs: ['general-fitness', 'mma'],
    photo: null,
    bio: [
      'Placeholder profile. Add the coach’s fitness background, training approach and the members they work with.',
    ],
    experience: '',
    certifications: [],
    achievements: [],
    languages: [],
    placeholder: true,
  },
  {
    slug: 'gymnastics-coach',
    name: '',
    role: 'Gymnastics Coach',
    specializations: ['Gymnastics'],
    programs: ['gymnastics'],
    photo: null,
    bio: [
      'Placeholder profile. Add the coach’s gymnastics background and the age groups they teach.',
    ],
    experience: '',
    certifications: [],
    achievements: [],
    languages: [],
    placeholder: true,
  },
  {
    slug: 'special-kids-program-lead',
    name: '',
    role: 'Special Kids Training Lead',
    specializations: ['Special Kids', 'Gymnastics'],
    programs: ['special-kids-training', 'gymnastics'],
    photo: null,
    bio: [
      'Placeholder profile. Add this coach’s experience working with children, their approach to individualized support and any relevant training they hold.',
    ],
    experience: '',
    certifications: [],
    achievements: [],
    languages: [],
    placeholder: true,
  },
]

/** Filter chips on the Coaches page, in display order. */
export const coachSpecializations = ['Taekwondo', 'Boxing', 'Kickboxing', 'MMA', 'Fitness', 'Gymnastics', 'Special Kids']
