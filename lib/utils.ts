import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number): string {
  return `${amount.toLocaleString()}₮`
}

export function getStatusText(status: string): string {
  const map: Record<string, string> = {
    pending: 'Хүлээгдэж буй',
    paid: 'Төлөгдсөн',
    processing: 'Бэлтгэж буй',
    shipped: 'Илгээгдсэн',
    delivered: 'Хүргэгдсэн',
    cancelled: 'Цуцлагдсан',
    failed: 'Амжилтгүй',
  }
  return map[status] ?? status
}

export function getCategoryName(slug: string): string {
  const map: Record<string, string> = {
    skincare: 'Арьс арчилгаа',
    makeup: 'Гоо сайхан',
    hair: 'Үс',
    masks: 'Маск',
  }
  return map[slug] ?? slug
}
