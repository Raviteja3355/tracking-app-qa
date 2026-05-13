'use client'

import dynamic from 'next/dynamic'

const PageContent = dynamic(() => import('@/components/PageContent'), { ssr: false })

export default function TrackingPage() {
  return (
    <main>
      <PageContent />
    </main>
  )
}
