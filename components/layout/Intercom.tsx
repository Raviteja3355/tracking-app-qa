'use client'

import { useEffect } from 'react'

const APP_ID = process.env.NEXT_PUBLIC_INTERCOM_APP_ID

declare global {
  interface Window {
    Intercom?: (...args: unknown[]) => void
    intercomSettings?: Record<string, unknown>
  }
}

export default function IntercomWidget() {
  useEffect(() => {
    if (!APP_ID) return

    window.intercomSettings = { app_id: APP_ID }

    const w = window
    const ic = w.Intercom
    if (typeof ic === 'function') {
      ic('reattach_activator')
      ic('update', w.intercomSettings)
    } else {
      const s = document.createElement('script')
      s.type = 'text/javascript'
      s.async = true
      s.src = `https://widget.intercom.io/widget/${APP_ID}`
      const x = document.getElementsByTagName('script')[0]
      x.parentNode?.insertBefore(s, x)
    }

    window.Intercom?.('boot', { app_id: APP_ID })

    return () => {
      window.Intercom?.('shutdown')
    }
  }, [])

  return null
}
