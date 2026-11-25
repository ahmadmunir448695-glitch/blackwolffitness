import PDFDocument from 'pdfkit'
import { config } from '../config.js'

const EMBER = '#f7860f'
const INK = '#111111'
const GREY = '#666666'

const label = (s) => String(s ?? '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
const money = (amount, currency) => `${currency} ${Number(amount || 0).toLocaleString('en-US')}`

/**
 * Registration confirmation PDF.
 * `entry` is the full registration detail returned by loadRegistration().
 */
export function confirmationPdf(res, entry) {
  const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: `Registration ${entry.code}`, Author: config.siteName } })
  res.set('Content-Type', 'application/pdf')
  res.set('Content-Disposition', `attachment; filename="registration-${entry.code}.pdf"`)
  res.set('Cache-Control', 'private, no-store')
  doc.pipe(res)

  const width = doc.page.width - 100

  // Header band
  doc.rect(0, 0, doc.page.width, 92).fill(INK)
  doc.fillColor(EMBER).fontSize(9).font('Helvetica-Bold').text(config.siteName.toUpperCase(), 50, 30, { characterSpacing: 2 })
  doc.fillColor('#ffffff').fontSize(20).text('Registration Confirmation', 50, 46)
  doc.fillColor(INK).font('Helvetica')

  doc.y = 116
  doc.fontSize(10).fillColor(GREY).text('Registration ID')
  doc.fontSize(22).fillColor(INK).font('Helvetica-Bold').text(entry.code)
  doc.font('Helvetica').fontSize(10).fillColor(GREY)
  doc.text(`Status: ${label(entry.status)}    Payment: ${label(entry.payment_status)}    Fee: ${money(entry.fee_amount, entry.currency)}`)
  doc.moveDown(1.2)

  const section = (title) => {
    doc.moveDown(0.6)
    doc.fillColor(EMBER).font('Helvetica-Bold').fontSize(10).text(title.toUpperCase(), { characterSpacing: 1.5 })
    const y = doc.y + 3
    doc.moveTo(50, y).lineTo(50 + width, y).lineWidth(0.5).strokeColor('#dddddd').stroke()
    doc.moveDown(0.6)
    doc.fillColor(INK).font('Helvetica').fontSize(10.5)
  }
  const row = (k, v) => {
    if (v === null || v === undefined || v === '') return
    const y = doc.y
    doc.fillColor(GREY).text(k, 50, y, { width: 150 })
    doc.fillColor(INK).text(String(v), 200, y, { width: width - 150 })
    doc.moveDown(0.35)
  }

  const e = entry.event
  section('Championship')
  row('Event', e.name)
  row('Organizer', [e.organizer, e.federation].filter(Boolean).join(' · '))
  row('Dates', e.start_date === e.end_date ? e.start_date : `${e.start_date} to ${e.end_date}`)
  row('Venue', [e.venue_name, e.venue_address, e.city, e.country].filter(Boolean).join(', '))

  section('Entry')
  row('Category', entry.category.name)
  row('Weight category', entry.weight_division?.name)
  row('Team', `${entry.team.name} (${entry.team.code})`)
  row('Club', entry.club.name)
  row('Coach', entry.coach?.full_name)
  row('Submitted', entry.submitted_at ? new Date(entry.submitted_at).toUTCString() : 'Not submitted yet (draft)')

  section(entry.athletes.length > 1 ? 'Athletes' : 'Athlete')
  for (const a of entry.athletes) {
    doc.font('Helvetica-Bold').fillColor(INK).text(`${a.full_name}  `, { continued: true })
    doc.font('Helvetica').fillColor(GREY).text(a.code)
    row('Date of birth', a.dob)
    row('Gender', label(a.gender))
    row('Belt / Dan', a.entry_belt || a.belt)
    row('Weight', a.entry_weight_kg ?? a.weight_kg ? `${a.entry_weight_kg ?? a.weight_kg} kg` : null)
    row('Nationality', a.nationality)
    doc.moveDown(0.3)
  }

  if (entry.review_note) {
    section('Note from the organizer')
    doc.text(entry.review_note, { width })
  }

  doc.moveDown(2)
  doc.fontSize(8.5).fillColor(GREY).text(
    `Generated ${new Date().toUTCString()} by the ${config.siteName} championship portal. ` +
      'Bring this confirmation and the athlete’s original ID to accreditation. ' +
      'Final eligibility is confirmed at weigh-in and by the organizing committee.',
    50,
    doc.y,
    { width },
  )
  doc.end()
}
