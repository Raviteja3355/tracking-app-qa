import type { EddMap, EddResponseItem } from '../types'
import { cfg, http } from './config'

export async function fetchEdd(tnos: string[]): Promise<EddMap> {
  try {
    const { data } = await http.post<{ status: string; data: EddResponseItem[] }>(
      cfg.eddApiUrl,
      { key: cfg.eddApiKey, tnos },
    )
    if (data?.status !== 'SUCCESS' || !Array.isArray(data.data)) return {}
    return Object.fromEntries(
      data.data.map((item) => [
        item.tno,
        { edd_enabled: item.edd_enabled, delivery_estimate: item.delivery_estimate },
      ]),
    )
  } catch {
    return {}
  }
}
