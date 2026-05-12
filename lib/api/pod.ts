import { cfg, http } from './config'
import { formatZipCode, validateURPTrackingNo } from '../utils/validation'

interface SignatureResponse {
  status: string
  data?: { signatures: string[] }
  ret_msg?: string
}

interface URPSignatureResponse {
  code: number
  data?: { images: string[] }
  ret_msg?: string
}

interface DownloadResponse {
  status: string
  data?: string
  ret_msg?: string
}

interface URPDownloadResponse {
  status: string
  data?: string
}

export async function fetchPodImages(tno: string, zip: string): Promise<string[]> {
  try {
    const { data } = await http.get<SignatureResponse>(
      `${cfg.dispatchApi}/orders/getsignaturenew/filter/barcode`,
      { params: { tno, zipcode: zip } },
    )
    if (data?.status === 'SUCCESS' && data.data?.signatures?.length) {
      return data.data.signatures
    }
  } catch {
    // fall through to URP API
  }

  if (validateURPTrackingNo(tno)) {
    const { data } = await http.get<URPSignatureResponse>(
      `${cfg.dispatchApi}/orders/getsignaturenew-urp`,
      { params: { tno, zipcode: formatZipCode(zip) } },
    )
    if (data?.code === 0 && data.data?.images) return data.data.images
    throw new Error(data?.ret_msg ?? 'POD not found')
  }

  throw new Error('POD not found')
}

export async function downloadPodPdf(tno: string, zip: string): Promise<{ data: string; filename: string }> {
  try {
    const { data } = await http.get<DownloadResponse>(
      `${cfg.dispatchApi}/orders/downloadpods`,
      { params: { tno, zipcode: zip }, timeout: 0 },
    )
    if (data?.status === 'SUCCESS' && data.data) {
      return { data: data.data, filename: 'POD.pdf' }
    }
  } catch {
    // fall through to URP API
  }

  if (validateURPTrackingNo(tno)) {
    const { data } = await http.get<URPDownloadResponse>(
      `${cfg.dispatchApi}/orders/downloadpods-urp`,
      { params: { tno, zipcode: formatZipCode(zip) } },
    )
    if (data?.status === 'SUCCESS' && data.data) {
      return { data: data.data, filename: `POD_${tno}.pdf` }
    }
  }

  throw new Error('Download failed')
}
