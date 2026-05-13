'use client'

import Script from 'next/script'

const APP_ID = process.env.NEXT_PUBLIC_INTERCOM_APP_ID

declare global {
  interface Window {
    Intercom?: (...args: unknown[]) => void
    intercomSettings?: Record<string, unknown>
  }
}

export default function IntercomWidget() {
  if (!APP_ID) return null

  return (
    <Script
      id="intercom"
      src={`https://widget.intercom.io/widget/${APP_ID}`}
      strategy="lazyOnload"
      onLoad={() => {
        window.intercomSettings = { app_id: APP_ID }
        window.Intercom?.('boot', { app_id: APP_ID })
      }}
    />
  )
}
