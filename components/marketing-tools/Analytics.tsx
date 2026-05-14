"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;
const HUBSPOT_ID = process.env.NEXT_PUBLIC_HUBSPOT_ID;

function subscribe(cb: () => void) {
  window.addEventListener("cookie-consent-updated", cb);
  return () => window.removeEventListener("cookie-consent-updated", cb);
}
function getSnapshot() {
  return localStorage.getItem("cookie_consent") === "accepted";
}
function getServerSnapshot() {
  return false; // SSG: no window → always false, matches client initial render
}

export default function Analytics() {
  const accepted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!accepted) return null;

  return (
    <>
      {GA4_ID && (
        <Script id="ga4-config" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('config', '${GA4_ID}', {
            link_attribution: true,
            anonymize_ip: true,
            send_page_view: false
          });
        `}</Script>
      )}
      {GTM_ID && (
        <>
          <Script id="gtm" strategy="afterInteractive">{`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `}</Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        </>
      )}
      {HUBSPOT_ID && (
        <Script
          id="hubspot"
          src={`//js.hs-scripts.com/${HUBSPOT_ID}.js`}
          strategy="lazyOnload"
        />
      )}
    </>
  );
}
