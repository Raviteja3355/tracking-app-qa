import PageContent from '@/components/sections/TrackingHero'
import FAQ from '@/components/sections/FAQ'
import CustomerSupport from '@/components/sections/CustomerSupportClient'
import Footer from '@/components/layout/Footer'

export default function TrackingPageFr() {
  return (
    <main>
      <PageContent locale="fr" />
      <FAQ locale="fr" />
      <CustomerSupport />
      <Footer locale="fr" />
    </main>
  )
}
