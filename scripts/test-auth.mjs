/**
 * Auth smoke test — run with optional credentials:
 *   node scripts/test-auth.mjs
 *   TEST_ADMIN_EMAIL=you@example.com TEST_ADMIN_PASSWORD=secret node scripts/test-auth.mjs
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL ?? 'https://hokjllnnbfstvjyvurgd.supabase.co'
const key =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_nRoJzXoCSvLivf4nl7hvxg_xVK9i_eT'

const supabase = createClient(url, key)

let passed = 0
let failed = 0

function ok(label, detail = '') {
  passed++
  console.log(`✓ ${label}${detail ? ` — ${detail}` : ''}`)
}

function fail(label, detail = '') {
  failed++
  console.error(`✗ ${label}${detail ? ` — ${detail}` : ''}`)
}

// 1) Bad credentials rejected
const bad = await supabase.auth.signInWithPassword({
  email: 'not-a-real-user@example.com',
  password: 'wrong-password-123',
})
if (bad.error?.message) {
  ok('Invalid credentials rejected', bad.error.message)
} else {
  fail('Invalid credentials should fail')
}

// 2) is_admin without session
await supabase.auth.signOut()
const anonAdmin = await supabase.rpc('is_admin')
if (!anonAdmin.error && anonAdmin.data === false) {
  ok('is_admin() returns false when signed out')
} else {
  fail('is_admin() anonymous check', anonAdmin.error?.message ?? String(anonAdmin.data))
}

// 3) Optional real admin login
const email = process.env.TEST_ADMIN_EMAIL
const password = process.env.TEST_ADMIN_PASSWORD

if (email && password) {
  const signIn = await supabase.auth.signInWithPassword({ email, password })
  if (signIn.error) {
    fail('Admin sign-in', signIn.error.message)
  } else {
    ok('Admin sign-in succeeded', signIn.data.user.email)

    const admin = await supabase.rpc('is_admin')
    if (admin.error) {
      fail('is_admin() after sign-in', admin.error.message)
    } else if (admin.data === true) {
      ok('is_admin() returns true for seeded admin')
    } else {
      fail(
        'is_admin() returned false — seed admin_users',
        `insert into public.admin_users (user_id) values ('${signIn.data.user.id}');`,
      )
    }

    const { count, error: profilesError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
    if (!profilesError) {
      ok('Admin can query profiles', `count head ok`)
    } else {
      fail('Admin profiles query', profilesError.message)
    }

    await supabase.auth.signOut()
    ok('Sign-out succeeded')
  }
} else {
  console.log('\nℹ Skipping live admin login (set TEST_ADMIN_EMAIL + TEST_ADMIN_PASSWORD to verify end-to-end).')
}

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
