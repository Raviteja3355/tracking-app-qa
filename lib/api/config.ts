import axios from 'axios'

export const cfg = {
  deliveryApi: process.env.NEXT_PUBLIC_DELIVERY_API as string,
  dispatchApi: process.env.NEXT_PUBLIC_DISPATCH_API as string,
  driverAppCa: process.env.NEXT_PUBLIC_DRIVER_APP_CA as string,
  driverAppUs: process.env.NEXT_PUBLIC_DRIVER_APP_US as string,
  eddApiUrl: process.env.NEXT_PUBLIC_EDD_API_URL as string,
  eddApiKey: process.env.NEXT_PUBLIC_EDD_API_KEY as string,
  trackingApiKey: process.env.NEXT_PUBLIC_TRACKING_API_KEY as string,
}

export const http = axios.create({ timeout: 30_000 })
