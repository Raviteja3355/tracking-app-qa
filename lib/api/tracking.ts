import type { TrackingResponse } from '../types'
import { cfg, http } from './config'

export async function fetchTracking(ids: string): Promise<TrackingResponse> {
  const { data } = await http.get<TrackingResponse>(
    `${cfg.deliveryApi}/cargo/trackinguniuninew`,
    { params: { id: ids, key: cfg.trackingApiKey } },
  )
  return data
}
