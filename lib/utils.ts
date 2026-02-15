export function formatPrice(price: number): string {
  return new Intl.NumberFormat('mn-MN').format(price) + '₮'
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function getStatusText(status: string): string {
  const map: Record<string, string> = {
    pending: 'Хүлээгдэж буй',
    paid: 'Төлөгдсөн',
    processing: 'Бэлтгэж байна',
    shipped: 'Илгээсэн',
    delivered: 'Хүргэгдсэн',
    cancelled: 'Цуцлагдсан',
    failed: 'Амжилтгүй',
  }
  return map[status] ?? status
}

export function getCategoryName(category: string): string {
  const map: Record<string, string> = {
    skincare: 'Арьс арчилгаа',
    makeup: 'Нүүрний будаг',
    hair: 'Үсний бүтээгдэхүүн',
    masks: 'Маск',
    suncare: 'Нарнаас хамгаалах',
    body: 'Биеийн арчилгаа',
  }
  return map[category] ?? category
}
