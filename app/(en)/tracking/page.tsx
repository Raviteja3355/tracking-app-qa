import PageContent from '@/components/sections/TrackingHero'
import FAQ from '@/components/sections/FAQ'
import CustomerSupport from '@/components/sections/CustomerSupportClient'
import Footer from '@/components/layout/Footer'

export default function TrackingPageEn() {
  return (
    <main>
      <PageContent locale="en" />
      <FAQ locale="en" />
      <CustomerSupport />
      <Footer locale="en" />
    </main>
  )
}
