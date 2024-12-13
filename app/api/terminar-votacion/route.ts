import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  const { departamento } = await req.json()

  try {
    const { error } = await supabase
      .from('votaciones')
      .update({ activa: false })
      .eq('departamento', departamento)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al terminar votación:', error)
    return NextResponse.json({ success: false, error: 'Error al terminar votación' }, { status: 500 })
  }
}

