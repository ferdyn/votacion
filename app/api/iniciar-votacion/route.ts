import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  const { departamento, codigo } = await req.json()

  try {
    const { data, error } = await supabase
      .from('votaciones')
      .insert({
        departamento,
        codigo,
        activa: true,
        votos: {}
      })
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error al iniciar votación:', error)
    return NextResponse.json({ success: false, error: 'Error al iniciar votación' }, { status: 500 })
  }
}

