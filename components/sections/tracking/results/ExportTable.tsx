'use client'

import '@/lib/i18n'
import { useTranslation } from 'react-i18next'
import type { ExportRow } from '@/lib/types'

interface Props {
  rows: ExportRow[]
}

export default function ExportTable({ rows }: Props) {
  const { t } = useTranslation()
  return (
    <table id="excel-table" className="hidden">
      <thead id="excel-table-head">
        <tr>
          <th>{t('colTrackingNumber')}</th>
          <th>{t('colLatestCity')}</th>
          <th>{t('colLatestUpdateTime')}</th>
          <th>{t('colLatestTracking')}</th>
          <th>{t('colTrackingInfo')}</th>
          <th>{t('colEstimatedDeliveryDate')}</th>
          <th>{t('colEstimatedDeliveryTimeStart')}</th>
          <th>{t('colEstimatedDeliveryTimeEnd')}</th>
        </tr>
      </thead>
      <tbody id="excel-table-body">
        {rows.map((row, i) => (
          <tr key={i}>
            <td>{row.tno}</td>
            <td>{row.city}</td>
            <td>{row.latestTime}</td>
            <td>{row.latestTrack}</td>
            <td>{row.trackingInfo}</td>
            <td>{row.eddDate}</td>
            <td>{row.eddTimeStart}</td>
            <td>{row.eddTimeEnd}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
