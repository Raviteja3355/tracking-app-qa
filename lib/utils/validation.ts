const URP_REGEX = /^UR\d{17}$/

export function validateURPTrackingNo(tno: string): boolean {
  if (!tno || typeof tno !== 'string') return false
  return URP_REGEX.test(tno)
}

export function formatZipCode(zip: string): string {
  if (!zip || typeof zip !== 'string') return zip
  const clean = zip.replace(/[^a-zA-Z0-9]/g, '')
  if (clean.length >= 6) return clean.substring(0, 3) + ' ' + clean.substring(3, 6)
  if (clean.length >= 3) return clean.substring(0, 3)
  return zip
}
