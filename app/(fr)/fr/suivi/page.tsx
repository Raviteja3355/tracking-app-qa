import TrackingHero from '@/components/sections/tracking/TrackingHero'
import FAQ from '@/components/sections/FAQ'
import CustomerSupport from '@/components/sections/CustomerSupportClient'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

function SupportUnavailable() {
  return (
    <section className="w-full py-15 px-8 text-center">
      <p className="text-[15px] text-uni-black">
        Le formulaire d&apos;assistance est temporairement indisponible.
        Veuillez utiliser le widget de chat en bas de page pour nous contacter.
      </p>
    </section>
  )
}

export default function TrackingPageFr() {
  return (
    <main>
      <TrackingHero locale="fr" />
      <ErrorBoundary>
        <FAQ locale="fr" />
      </ErrorBoundary>
      <ErrorBoundary fallback={<SupportUnavailable />}>
        <CustomerSupport />
      </ErrorBoundary>
    </main>
  )
}
