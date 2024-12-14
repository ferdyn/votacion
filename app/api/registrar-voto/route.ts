import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl!, supabaseKey!)

export async function POST(req: Request) {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ success: false, message: 'Server configuration error' }, { status: 500 })
  }

  try {
    const { departamentoId, candidatoId, codigo } = await req.json()

    // Verificar el código de acceso
    const { data: codigoData, error: codigoError } = await supabase
      .from('codigos_acceso')
      .select('*')
      .eq('codigo', codigo)
      .eq('estado', 'activo')
      .single()

    if (codigoError || !codigoData) {
      return NextResponse.json({ success: false, message: 'Código inválido o ya utilizado' }, { status: 400 })
    }

    // Registrar el voto
    const { data, error: votoError } = await supabase.rpc('incrementar_voto', {
      p_departamento: departamentoId,
      p_candidato: candidatoId
    })

    if (votoError) {
      console.error('Error al registrar voto:', votoError)
      return NextResponse.json({ success: false, message: 'Error al registrar el voto: ' + votoError.message }, { status: 500 })
    }

    // Marcar el código como utilizado
    const { error: updateError } = await supabase
      .from('codigos_acceso')
      .update({ estado: 'utilizado' })
      .eq('codigo', codigo)

    if (updateError) {
      console.error('Error al actualizar código:', updateError)
      return NextResponse.json({ success: false, message: 'Error al actualizar el estado del código: ' + updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Voto registrado correctamente' })
  } catch (error) {
    console.error('Error en el servidor:', error)
    return NextResponse.json({ success: false, message: 'Error interno del servidor: ' + (error instanceof Error ? error.message : String(error)) }, { status: 500 })
  }
}

