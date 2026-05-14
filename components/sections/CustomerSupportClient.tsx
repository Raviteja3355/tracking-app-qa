'use client'

import dynamic from 'next/dynamic'

const CustomerSupport = dynamic(() => import('./CustomerSupport'), { ssr: false })

export default function CustomerSupportClient() {
  return <CustomerSupport />
}
