'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GrupoVotacion, Departamento } from '@/types'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/use-toast'

interface PageProps {
  params: {
    grupoId: string
  }
}

export default function VotacionPage({ params }: PageProps) {
  const [codigo, setCodigo] = useState('')
  const [grupoVotacion, setGrupoVotacion] = useState<GrupoVotacion | null>(null)
  const [departamentoActivo, setDepartamentoActivo] = useState<Departamento | null>(null)
  const [candidatoSeleccionado, setCandidatoSeleccionado] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState('')
  const [tiempoRestante, setTiempoRestante] = useState(0)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    const storedCodigo = localStorage.getItem('codigoVotante')
    if (storedCodigo) {
      setCodigo(storedCodigo)
      verificarCodigo(storedCodigo)
    }

    // Suscripción a cambios en el grupo de votación
    const grupoSubscription = supabase
      .channel('grupos_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'grupos_votacion',
          filter: `id=eq.${params.grupoId}`
        }, 
        handleGrupoChange
      )
      .subscribe()

    return () => {
      grupoSubscription.unsubscribe()
    }
  }, [params.grupoId])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (departamentoActivo && tiempoRestante > 0) {
      interval = setInterval(() => {
        setTiempoRestante((prevTiempo) => {
          if (prevTiempo <= 1) {
            clearInterval(interval)
            setDepartamentoActivo(null)
            setMensaje('El tiempo de votación ha terminado.')
            return 0
          }
          return prevTiempo - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [departamentoActivo, tiempoRestante])

  const handleGrupoChange = (payload: any) => {
    console.log('Cambio detectado en el grupo:', payload)
    if (payload.new) {
      const nuevoGrupo = payload.new as GrupoVotacion
      setGrupoVotacion(nuevoGrupo)
      
      // Actualizar el departamento activo si ha cambiado
      const nuevoDepartamentoActivo = nuevoGrupo.departamentos.find(d => d.activo)
      if (nuevoDepartamentoActivo) {
        setDepartamentoActivo(nuevoDepartamentoActivo)
        setTiempoRestante(nuevoDepartamentoActivo.tiempoVotacion * 60)
        setMensaje(`Votación activada para ${nuevoDepartamentoActivo.nombre}`)
        toast({
          title: "Votación Activada",
          description: `Se ha activado la votación para ${nuevoDepartamentoActivo.nombre}`,
        })
      } else if (departamentoActivo) {
        setDepartamentoActivo(null)
        setMensaje('La votación ha sido desactivada')
        toast({
          title: "Votación Desactivada",
          description: "La votación actual ha sido desactivada",
          variant: "destructive",
        })
      }
    }
  }

  const verificarCodigo = async (codigoInput: string) => {
    setCargando(true)
    setMensaje('Verificando código...')
    try {
      // Verificar si el código existe y está activo
      const { data: codigoData, error: codigoError } = await supabase
        .from('codigos_acceso')
        .select('*')
        .eq('codigo', codigoInput)
        .eq('grupo_id', params.grupoId)
        .single()

      if (codigoError || !codigoData) {
        throw new Error('Código inválido o no encontrado')
      }

      if (codigoData.estado !== 'activo') {
        throw new Error('Este código de acceso ya no está activo')
      }

      // Verificar si el grupo existe y está activo
      const { data: grupoData, error: grupoError } = await supabase
        .from('grupos_votacion')
        .select('*')
        .eq('id', params.grupoId)
        .single()

      if (grupoError || !grupoData) {
        throw new Error('El grupo de votación no existe o ha sido eliminado')
      }

      if (!grupoData.activo) {
        throw new Error('El grupo de votación no está activo en este momento')
      }

      setGrupoVotacion(grupoData)
      localStorage.setItem('codigoVotante', codigoInput)
      
      const departamentoActivo = grupoData.departamentos.find(d => d.activo)
      if (departamentoActivo) {
        setDepartamentoActivo(departamentoActivo)
        setTiempoRestante(departamentoActivo.tiempoVotacion * 60)
        setMensaje(`Votación activa para ${departamentoActivo.nombre}`)
      } else {
        setMensaje('Código válido. Esperando que se active la votación.')
      }

    } catch (error) {
      console.error('Error al verificar el código:', error)
      setMensaje(error instanceof Error ? error.message : 'Error al verificar el código')
      setGrupoVotacion(null)
      localStorage.removeItem('codigoVotante')
    } finally {
      setCargando(false)
    }
  }

  const enviarVoto = async () => {
    if (!departamentoActivo || !candidatoSeleccionado || !codigo) return

    setCargando(true)
    try {
      // Verificar nuevamente que el código sigue siendo válido
      const { data: codigoData, error: codigoError } = await supabase
        .from('codigos_acceso')
        .select('*')
        .eq('codigo', codigo)
        .eq('estado', 'activo')
        .single()

      if (codigoError || !codigoData) {
        throw new Error('El código ya no es válido o ha sido utilizado')
      }

      // Registrar el voto
      const { error: votoError } = await supabase.rpc('incrementar_voto', {
        p_departamento: departamentoActivo.id,
        p_candidato: candidatoSeleccionado
      })

      if (votoError) throw votoError

      // Marcar el código como utilizado
      const { error: updateError } = await supabase
        .from('codigos_acceso')
        .update({ estado: 'utilizado' })
        .eq('codigo', codigo)

      if (updateError) throw updateError

      setMensaje('Su voto ha sido registrado correctamente. Gracias por su participación.')
      setDepartamentoActivo(null)
      setCandidatoSeleccionado(null)
      setCodigo('')
      
      // Limpiar localStorage
      localStorage.removeItem('codigoVotante')

      toast({
        title: "Éxito",
        description: "Su voto ha sido registrado correctamente.",
      })
    } catch (error) {
      console.error('Error al enviar el voto:', error)
      setMensaje(error instanceof Error ? error.message : 'Error al enviar el voto')
      toast({
        title: "Error",
        description: "No se pudo registrar su voto. Por favor, intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-4 text-center">Votación de la Iglesia</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-xl">
            {!grupoVotacion ? 'Ingresar Código de Acceso' : 
             !departamentoActivo ? 'Esperando Activación de Votación' : 'Emitir Voto'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!grupoVotacion ? (
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Ingrese el código de acceso"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                className="text-center"
                disabled={cargando}
              />
              <Button 
                onClick={() => verificarCodigo(codigo)} 
                className="w-full"
                disabled={!codigo || cargando}
              >
                {cargando ? 'Verificando...' : 'Verificar Código'}
              </Button>
            </div>
          ) : !departamentoActivo ? (
            <div className="space-y-4">
              <h3 className="text-center font-semibold">{grupoVotacion.nombre}</h3>
              <p className="text-center">Esperando que se active la votación...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-center font-semibold">{departamentoActivo.nombre}</h3>
              <p className="text-center">
                Tiempo restante: {Math.floor(tiempoRestante / 60)}:
                {(tiempoRestante % 60).toString().padStart(2, '0')}
              </p>
              <div className="grid grid-cols-1 gap-2">
                {departamentoActivo.candidatos.map((candidato) => (
                  <Button
                    key={candidato.id}
                    onClick={() => setCandidatoSeleccionado(candidato.id)}
                    variant={candidatoSeleccionado === candidato.id ? 'default' : 'outline'}
                    className="w-full"
                    disabled={cargando}
                  >
                    {candidato.nombre}
                  </Button>
                ))}
              </div>
              <Button 
                onClick={enviarVoto} 
                className="w-full"
                disabled={!candidatoSeleccionado || cargando}
              >
                {cargando ? 'Enviando voto...' : 'Enviar Voto'}
              </Button>
            </div>
          )}
          {mensaje && (
            <p className={`mt-4 text-center ${
              mensaje.includes('Error') ? 'text-red-600' : 'text-green-600'
            }`}>
              {mensaje}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

