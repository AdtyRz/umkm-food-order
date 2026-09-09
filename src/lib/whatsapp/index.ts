import { buildWhatsAppUrl } from '@/lib/utils'

export function ownerWhatsAppMessage(): string {
  return 'Halo, saya ingin bertanya mengenai menu/pesanan di toko.'
}

export function orderWhatsAppMessage(
  orderNumber: string,
  customerName: string,
  total: number
): string {
  return `Halo, saya ingin menanyakan pesanan ${orderNumber}.
Nama: ${customerName}
Total: Rp${total.toLocaleString('id-ID')}`
}

export function bugReportMessage(currentPage: string): string {
  return `Halo Developer, saya menemukan masalah pada aplikasi.

Halaman: ${currentPage}

Deskripsi: `
}

export function buildOwnerWhatsApp(ownerPhone: string): string {
  return buildWhatsAppUrl(ownerPhone, ownerWhatsAppMessage())
}

export function buildOrderWhatsApp(
  ownerPhone: string,
  orderNumber: string,
  customerName: string,
  total: number
): string {
  return buildWhatsAppUrl(ownerPhone, orderWhatsAppMessage(orderNumber, customerName, total))
}

export function buildDeveloperWhatsApp(devPhone: string, currentPage: string): string {
  return buildWhatsAppUrl(devPhone, bugReportMessage(currentPage))
}
