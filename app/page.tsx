'use client'

import { useEffect } from 'react'
import { supabase } from '@/libs/supabaseClient'

export default function Home() {

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    const { data, error } = await supabase.from('test').select('*')

    console.log('DATA:', data)
    console.log('ERROR:', error)
  }

  return <div>Servora funcionando 🚀</div>
}