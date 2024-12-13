import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  const { departamento, codigo, candidato } = await req.json()

  try {
    // Verificar si la votación está activa y el código es válido
    const { data: votacion, error: votacionError } = await supabase
      .from('votaciones')
      .select('*')
      .eq('departamento', departamento)
      .eq('codigo', codigo)
      .eq('activa', true)
      .single()

    if (votacionError || !votacion) {
      return NextResponse.json({ success: false, message: 'Votación no válida o código incorrecto' }, { status: 400 })
    }

    // Registrar el voto
    const { error: votoError } = await supabase
      .rpc('incrementar_voto', {
        p_departamento: departamento,
        p_candidato: candidato
      })

    if (votoError) throw votoError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al enviar voto:', error)
    return NextResponse.json({ success: false, error: 'Error al enviar voto' }, { status: 500 })
  }
}

