'use client'

import Link from 'next/link'

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Тохиргоо</h1>
      <p className="text-gray-600 mb-4">
        Owner bootstrap: эхний нэвтэрсэн хэрэглэгчийг owner болгохын тулд POST /api/auth/bootstrap-owner
        илгээнэ (Authorization: Bearer &lt;access_token&gt;).
      </p>
      <p className="text-sm text-gray-500">
        Supabase, Resend, QPay тохиргоог .env файлд тохируулна.
      </p>
    </div>
  )
}
