import type { TrackingResult } from '../types'
import { cfg, http } from './config'

interface TrackingResponse {
  status: string
  data: {
    valid_tno: TrackingResult[]
    invalid_tno?: string
  }
}

export async function fetchTracking(ids: string): Promise<TrackingResponse> {
  const { data } = await http.get<TrackingResponse>(
    `${cfg.deliveryApi}/cargo/trackinguniuninew`,
    { params: { id: ids, key: cfg.trackingApiKey } },
  )
  return data
}
