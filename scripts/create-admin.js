/**
 * Admin/owner хэрэглэгч үүсгэх скрипт.
 * .env.local дээр ADMIN_EMAIL, ADMIN_PASSWORD тохируулна.
 * Ажиллуулах: node scripts/create-admin.js
 */
const path = require('path')
const fs = require('fs')

// .env.local ачаалах
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8')
  content.split('\n').forEach((line) => {
    const m = line.match(/^\s*([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  })
}

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const adminEmail = process.env.ADMIN_EMAIL
const adminPassword = process.env.ADMIN_PASSWORD

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Алдаа: NEXT_PUBLIC_SUPABASE_URL болон SUPABASE_SERVICE_ROLE_KEY .env.local дээр тохируулна уу.')
  process.exit(1)
}

if (!adminEmail || !adminPassword) {
  console.error('Алдаа: ADMIN_EMAIL болон ADMIN_PASSWORD .env.local дээр тохируулна уу.')
  process.exit(1)
}

async function main() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: user, error: createError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: { full_name: 'Admin' },
  })

  if (createError) {
    if (createError.message && createError.message.includes('already been registered')) {
      console.log('Энэ имэйлтэй хэрэглэгч аль хэдийн байна. Профайлыг owner болгож шинэчиллээ.')
      const { data: existing } = await supabase.auth.admin.listUsers()
      const existingUser = existing?.users?.find((u) => u.email === adminEmail)
      if (!existingUser) {
        console.error('Хэрэглэгч олдсонгүй.')
        process.exit(1)
      }
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'owner', updated_at: new Date().toISOString() })
        .eq('id', existingUser.id)
      if (updateError) {
        console.error('Профайл шинэчлэх алдаа:', updateError.message)
        process.exit(1)
      }
      console.log('Амжилттай. Owner ID:', existingUser.id)
      return
    }
    console.error('Хэрэглэгч үүсгэх алдаа:', createError.message)
    process.exit(1)
  }

  const userId = user?.user?.id
  if (!userId) {
    console.error('Хэрэглэгчийн ID олдсонгүй.')
    process.exit(1)
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'owner', updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (updateError) {
    console.error('Профайл owner болгох алдаа:', updateError.message)
    process.exit(1)
  }

  console.log('Admin (owner) хэрэглэгч амжилттай үүслээ.')
  console.log('  Имэйл:', adminEmail)
  console.log('  ID:', userId)
  console.log('  /login хуудаснаас энэ имэйл/нууц үгээр нэвтэрч /admin руу орно.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
