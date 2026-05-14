import TrackingHero from '@/components/sections/tracking/TrackingHero'
import FAQ from '@/components/sections/FAQ'
import CustomerSupport from '@/components/sections/CustomerSupportClient'

export default function TrackingPage() {
  return (
    <main>
      <TrackingHero locale="en" />
      <FAQ locale="en" />
      <CustomerSupport />
    </main>
  )
}
