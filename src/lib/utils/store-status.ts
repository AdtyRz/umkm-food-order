import { JAKARTA_TIMEZONE } from '@/constants'
import type { OperatingHour } from '@/types'

export interface StoreStatus {
  isOpen: boolean
  message: string
}

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const parts = timeStr.split(':')
  return { hours: parseInt(parts[0], 10), minutes: parseInt(parts[1], 10) }
}

function timeToMinutes(h: number, m: number): number {
  return h * 60 + m
}

export function calculateStoreStatus(hours: OperatingHour[]): StoreStatus {
  const now = new Date()
  const jakartaNow = new Date(now.toLocaleString('en-US', { timeZone: JAKARTA_TIMEZONE }))

  const dayOfWeek = jakartaNow.getDay()
  const currentMinutes = timeToMinutes(jakartaNow.getHours(), jakartaNow.getMinutes())

  const todayHours = hours.find((h) => h.day_of_week === dayOfWeek)

  if (!todayHours || !todayHours.is_open) {
    // Find next open day
    for (let i = 1; i <= 7; i++) {
      const nextDay = (dayOfWeek + i) % 7
      const nextHours = hours.find((h) => h.day_of_week === nextDay)
      if (nextHours?.is_open && nextHours.open_time) {
        const { hours: oh, minutes: om } = parseTime(nextHours.open_time)
        return {
          isOpen: false,
          message: i === 1
            ? `Buka kembali besok pukul ${String(oh).padStart(2, '0')}:${String(om).padStart(2, '0')}`
            : `Buka kembali hari ${['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][nextDay]}`,
        }
      }
    }
    return { isOpen: false, message: 'Toko sementara tutup' }
  }

  if (!todayHours.open_time || !todayHours.close_time) {
    return { isOpen: false, message: 'Jam operasional belum diatur' }
  }

  const { hours: openH, minutes: openM } = parseTime(todayHours.open_time)
  const { hours: closeH, minutes: closeM } = parseTime(todayHours.close_time)

  const openMinutes = timeToMinutes(openH, openM)
  const closeMinutes = timeToMinutes(closeH, closeM)

  // Handle overnight (e.g., 20:00 - 02:00)
  let isOpen: boolean
  if (closeMinutes < openMinutes) {
    isOpen = currentMinutes >= openMinutes || currentMinutes < closeMinutes
  } else {
    isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes
  }

  if (isOpen) {
    return {
      isOpen: true,
      message: `Buka sampai ${String(closeH).padStart(2, '0')}:${String(closeM).padStart(2, '0')}`,
    }
  } else {
    if (currentMinutes < openMinutes) {
      return {
        isOpen: false,
        message: `Buka kembali pukul ${String(openH).padStart(2, '0')}:${String(openM).padStart(2, '0')}`,
      }
    }
    // Find next open day
    for (let i = 1; i <= 7; i++) {
      const nextDay = (dayOfWeek + i) % 7
      const nextHours = hours.find((h) => h.day_of_week === nextDay)
      if (nextHours?.is_open && nextHours.open_time) {
        const { hours: oh, minutes: om } = parseTime(nextHours.open_time)
        return {
          isOpen: false,
          message: i === 1
            ? `Buka kembali besok pukul ${String(oh).padStart(2, '0')}:${String(om).padStart(2, '0')}`
            : `Buka kembali hari ${['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][nextDay]}`,
        }
      }
    }
    return { isOpen: false, message: 'Toko sementara tutup' }
  }
}
