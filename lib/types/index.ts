// ── i18n ─────────────────────────────────────────────────────────────────────

export type Locale = "en" | "fr";

// ── Tracking domain ───────────────────────────────────────────────────────────

export interface DateTime {
  localTime: string;
}

export interface SpathItem {
  state?: number;
  pathInfo: string;
  pathTime?: number;
  pathAddress?: string;
  dateTime?: DateTime;
  lat?: string | number;
  lng?: string | number;
  warehouse?: number;
  time?: string;
  content?: string;
  location?: string;
}

export interface TrackingResult {
  tno: string;
  new_tno?: string;
  state: number;
  country: string;
  spath_list: SpathItem[];
  full_spath_info?: string;
  urlType?: string;
  events?: Array<{ pathInfo: string }>;
  master_tno?: string;
  orders_list?: TrackingResult[];
  delivered_count?: number;
  selected_tno?: string;
}

// ── EDD ───────────────────────────────────────────────────────────────────────

export interface EddDeliveryEstimate {
  estimated_delivery_date: string;
  estimated_delivery_time_start: string;
  estimated_delivery_time_end: string;
  timezone?: string;
}

export interface EddData {
  edd_enabled: boolean;
  delivery_estimate?: EddDeliveryEstimate;
}

export type EddMap = Record<string, EddData>;

// ── Export ────────────────────────────────────────────────────────────────────

export interface ExportRow {
  tno: string;
  city: string;
  latestTime: string;
  latestTrack: string;
  trackingInfo: string;
  eddDate: string;
  eddTimeStart: string;
  eddTimeEnd: string;
}

// ── Modal state ───────────────────────────────────────────────────────────────

export interface NoticeItem {
  title: string;
  content: string;
}

export interface PodModalState {
  open: boolean;
  images: string[];
  currentIndex: number;
  orderNo: string;
  zipCode: string;
  fromSecondAPI: boolean;
  orderData: TrackingResult | null;
}

export interface ZipModalState {
  open: boolean;
  trackingIndex: number;
  request: "view";
  errorMessage: string | null;
}

export interface PiecesViewState {
  results: TrackingResult[];
  masterTno: string;
  deliveredCount: number;
  parentIndex: number;
}

// ── API responses ─────────────────────────────────────────────────────────────

export interface TrackingResponse {
  status: string;
  data: {
    valid_tno: TrackingResult[];
    invalid_tno?: string;
  };
}

export interface EddResponseItem {
  tno: string;
  edd_enabled: boolean;
  delivery_estimate?: EddData["delivery_estimate"];
}

export interface SignatureResponse {
  status: string;
  data?: { signatures: string[] };
  ret_msg?: string;
}

export interface URPSignatureResponse {
  code: number;
  data?: { images: string[] };
  ret_msg?: string;
}

export interface DownloadResponse {
  status: string;
  data?: string;
  ret_msg?: string;
}

export interface URPDownloadResponse {
  status: string;
  data?: string;
}

export interface NoticeResponse {
  biz_data?: NoticeItem[];
}

// ── UI ────────────────────────────────────────────────────────────────────────

export interface SelectOption {
  value: string;
  label: string;
}

export type ContactReason =
  | ""
  | "Address Correction"
  | "Complaint (Delivery)"
  | "Complaint (Driver)"
  | "Delivery Inquiry"
  | "Lost Parcel"
  | "Second Delivery";

// ── Utilities ─────────────────────────────────────────────────────────────────

export interface WatermarkData {
  dateTime: string;
  coordinates: { latitude: string; longitude: string };
}
