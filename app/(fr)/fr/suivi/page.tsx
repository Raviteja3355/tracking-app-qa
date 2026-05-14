import TrackingHero from '@/components/sections/tracking/TrackingHero'
import FAQ from '@/components/sections/FAQ'
import CustomerSupport from '@/components/sections/CustomerSupportClient'

export default function TrackingPageFr() {
  return (
    <main>
      <TrackingHero locale="fr" />
      <FAQ locale="fr" />
      <CustomerSupport />
    </main>
  )
}
