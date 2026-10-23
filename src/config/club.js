/**
 * ============================================================================
 *  CLUB INFORMATION — the single file for contact details, location, hours
 *  and social links. Everything on the site that mentions these reads from
 *  here (header, footer, contact page, WhatsApp buttons, SEO structured data).
 *
 *  Empty strings / empty arrays are treated as "not provided yet": the site
 *  shows a clearly marked placeholder and hides links that would not work.
 *  Run `npm run check:content` to list everything that is still missing.
 *
 *  Keep this file plain JavaScript (no imports, no import.meta) — the build
 *  scripts read it in Node to generate per-page metadata and the sitemap.
 * ============================================================================
 */

export const club = {
  name: 'Black Wolf Fitness Club',
  shortName: 'Black Wolf',
  tagline: 'Train Strong. Fight Smart. Become Unstoppable.',
  /** One or two sentences used in the footer and default SEO description. */
  summary:
    'A combat sports and fitness club offering coached Taekwondo, Boxing, Kickboxing, MMA, General Fitness, Gymnastics and Special Kids Training for beginners and experienced athletes.',

  contact: {
    /** Display format, e.g. '+92 300 1234567'. */
    phone: '0305 4486950',
    /** Optional second number, shown next to the main one. */
    phoneAlt: '0309 9350206',
    /**
     * WhatsApp number in international format, digits only, no + or spaces,
     * e.g. '923001234567'. TODO: add the club WhatsApp number.
     * WhatsApp buttons stay hidden on the live site until this is set.
     */
    whatsapp: '03054486950',
    email: 'blackwolffitness@gmail.com',
    /** Default text pre-filled when someone taps a WhatsApp button. */
    whatsappGreeting: 'Hi Black Wolf Fitness Club, I would like to know more about your training programs.',
  },

  location: {
    /** TODO: street address lines, e.g. ['Building name, Street', 'Area'] */
    addressLines: [],
    city: '',
    region: '',
    postalCode: '',
    country: '',
    /**
     * Google Maps embed URL (Share → Embed a map → copy the src="" value).
     * TODO: paste the embed URL once the address is confirmed.
     */
    mapEmbedUrl: '',
    /** Normal Google Maps link for "Get directions". */
    mapLink: '',
  },

  /**
   * Opening hours. TODO: replace with real hours.
   * Example: [{ days: 'Monday – Saturday', hours: '6:00 am – 10:00 pm' }, { days: 'Sunday', hours: 'Closed' }]
   */
  hours: [
    { days: 'Special Kids (ADHD)', hours: '9:00 am – 2:00 pm' },
    { days: 'Classes', hours: '4:00 pm – 8:00 pm' },
  ],

  /**
   * Club timetable, shown on the Membership page and each program page.
   * Times are 24-hour 'HH:MM'. `programs` uses the program slugs.
   */
  timetable: {
    specialKids: {
      start: '09:00',
      end: '14:00',
      session: 'One-to-one sessions, 1 hour each',
    },
    classes: [
      { start: '16:00', end: '17:00', programs: ['taekwondo'] },
      { start: '17:00', end: '18:00', programs: ['taekwondo'] },
      { start: '18:00', end: '19:00', programs: ['boxing', 'taekwondo'] },
      { start: '19:00', end: '20:00', programs: ['boxing', 'mma'] },
    ],
  },

  /** Full profile URLs. Leave empty to hide an icon. */
  socials: {
    instagram: 'https://www.instagram.com/blackwolffitness/',
    facebook: '',
    youtube: '',
    tiktok: 'https://www.tiktok.com/@blackwolffitness',
  },
}

/** Human labels for the social networks above. */
export const socialLabels = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  tiktok: 'TikTok',
}
