'use client'

import Header from './Header'

export default function HeaderWrapper({ locale = 'en' }: { locale?: 'en' | 'fr' }) {
  return <Header locale={locale} />
}
