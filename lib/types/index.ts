export interface DateTime {
  localTime: string
}

export interface SpathItem {
  state?: number
  pathInfo: string
  pathTime?: number
  pathAddress?: string
  dateTime?: DateTime
  lat?: string | number
  lng?: string | number
  warehouse?: number
  time?: string
  content?: string
  location?: string
}

export interface TrackingResult {
  tno: string
  new_tno?: string
  state: number
  country: string
  spath_list: SpathItem[]
  full_spath_info?: string
  urlType?: string
  events?: Array<{ pathInfo: string }>
  master_tno?: string
  orders_list?: TrackingResult[]
  delivered_count?: number
  selected_tno?: string
}

export interface EddDeliveryEstimate {
  estimated_delivery_date: string
  estimated_delivery_time_start: string
  estimated_delivery_time_end: string
  timezone?: string
}

export interface EddData {
  edd_enabled: boolean
  delivery_estimate?: EddDeliveryEstimate
}

export type EddMap = Record<string, EddData>

export interface ExportRow {
  tno: string
  city: string
  latestTime: string
  latestTrack: string
  trackingInfo: string
  eddDate: string
  eddTimeStart: string
  eddTimeEnd: string
}

export interface NoticeItem {
  title: string
  content: string
}

export interface PodModalState {
  open: boolean
  images: string[]
  currentIndex: number
  orderNo: string
  zipCode: string
  fromSecondAPI: boolean
  orderData: TrackingResult | null
}

export interface ZipModalState {
  open: boolean
  trackingIndex: number
  request: 'view' | 'download'
  errorMessage: string | null
}

export interface PiecesViewState {
  results: TrackingResult[]
  masterTno: string
  deliveredCount: number
  parentIndex: number
}
