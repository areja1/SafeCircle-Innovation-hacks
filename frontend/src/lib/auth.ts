import { supabase } from './supabase'

export async function signUp(email: string, password: string, fullName: string, preferredLanguage: 'en' | 'es' = 'en') {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        preferred_language: preferredLanguage,
      },
    },
  })
  return { data, error }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (data.session) {
    localStorage.setItem('supabase_token', data.session.access_token)
  }
  return { data, error }
}

export async function signOut() {
  localStorage.removeItem('supabase_token')
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
