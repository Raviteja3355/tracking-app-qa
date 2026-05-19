import TrackingHero from '@/components/sections/tracking/TrackingHero'
import FAQ from '@/components/sections/FAQ'
import CustomerSupport from '@/components/sections/CustomerSupportClient'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

function SupportUnavailable() {
  return (
    <section className="w-full py-15 px-8 text-center">
      <p className="text-[15px] text-uni-black">
        Customer support form is temporarily unavailable.
        Please use the chat widget at the bottom of the page to reach us.
      </p>
    </section>
  )
}

export default function TrackingPage() {
  return (
    <main>
      <TrackingHero locale="en" />
      <ErrorBoundary>
        <FAQ locale="en" />
      </ErrorBoundary>
      <ErrorBoundary fallback={<SupportUnavailable />}>
        <CustomerSupport />
      </ErrorBoundary>
    </main>
  )
}
