import type { NoticeItem } from '../types'
import { cfg, http } from './config'

interface NoticeResponse {
  biz_data?: NoticeItem[]
}

export async function fetchWarehouseNotices(
  warehouse: number,
  country: string,
): Promise<NoticeItem[]> {
  try {
    const endpoint = country === 'US' ? cfg.driverAppUs : cfg.driverAppCa
    const warehouseId = 100000 + warehouse
    const { data } = await http.get<NoticeResponse>(
      `${endpoint}/messages/inbox/${warehouseId}/3`,
    )
    return data?.biz_data ?? []
  } catch {
    return []
  }
}
