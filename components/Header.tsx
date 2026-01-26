'use client'

import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { useState } from 'react'

export default function Header() {
  const { getItemCount } = useCart()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="bg-gray-100 py-2">
        <div className="container mx-auto px-5">
          <div className="flex justify-between items-center text-xs">
            <div className="flex gap-5">
              <Link href="#signin" className="hover:text-primary transition">Нэвтрэх / Бүртгүүлэх</Link>
              <Link href="#orders" className="hover:text-primary transition">Захиалга хянах</Link>
              <Link href="#wishlist" className="hover:text-primary transition">Хүслийн жагсаалт</Link>
            </div>
            <div className="flex gap-3">
              <select className="px-2 py-1 border border-gray-300 rounded text-xs">
                <option value="mn">Монгол</option>
                <option value="en">English</option>
              </select>
              <select className="px-2 py-1 border border-gray-300 rounded text-xs">
                <option value="mnt">₮ MNT</option>
                <option value="usd">$ USD</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="py-4">
        <div className="container mx-auto px-5">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-3xl font-bold text-primary">AZ BEAUTY</Link>
            
            <nav className="hidden md:flex gap-8">
              <Link href="/" className="font-medium hover:text-primary transition">Нүүр</Link>
              <div className="relative group">
                <Link href="/products?category=skincare" className="font-medium hover:text-primary transition">
                  Гоо сайхан
                </Link>
                <div className="absolute top-full left-0 mt-2 w-96 bg-white shadow-lg rounded p-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <h4 className="font-semibold mb-2">Бүтээгдэхүүн</h4>
                      <Link href="/products?category=skincare" className="block py-1 text-sm text-gray-600 hover:text-primary">Бүх гоо сайхны бүтээгдэхүүн</Link>
                      <Link href="/products?category=moisturizers" className="block py-1 text-sm text-gray-600 hover:text-primary">Чийгшүүлэгч</Link>
                      <Link href="/products?category=cleansers" className="block py-1 text-sm text-gray-600 hover:text-primary">Цэвэрлэгч</Link>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Арьсны төрөл</h4>
                      <Link href="/products?skin=normal" className="block py-1 text-sm text-gray-600 hover:text-primary">Хэвийн</Link>
                      <Link href="/products?skin=oily" className="block py-1 text-sm text-gray-600 hover:text-primary">Тослог</Link>
                      <Link href="/products?skin=dry" className="block py-1 text-sm text-gray-600 hover:text-primary">Хуурай</Link>
                    </div>
                  </div>
                </div>
              </div>
              <Link href="/products?category=makeup" className="font-medium hover:text-primary transition">Нүүрний будаг</Link>
              <Link href="/products?category=hair" className="font-medium hover:text-primary transition">Үсний бүтээгдэхүүн</Link>
              <Link href="/products?category=masks" className="font-medium hover:text-primary transition">Маск</Link>
              <Link href="/products?category=suncare" className="font-medium hover:text-primary transition">Нарнаас хамгаалах</Link>
            </nav>

            <div className="flex items-center gap-5">
              <div className="hidden md:flex items-center border border-gray-300 rounded-full px-4 py-2 bg-gray-50">
                <input type="text" placeholder="Хайх..." className="bg-transparent outline-none w-40 text-sm" />
                <button className="text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
              <Link href="/cart" className="relative">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {getItemCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                    {getItemCount()}
                  </span>
                )}
              </Link>
              <button className="hidden md:block">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
