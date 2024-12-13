'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { GrupoVotacion, Departamento, ResultadoVotacion } from '@/types'
import { supabase } from '@/lib/supabase'

export default function ProyeccionPage() {
  const [grupoActual, setGrupoActual] = useState<GrupoVotacion | null>(null)
  const [departamentoActivo, setDepartamentoActivo] = useState<Departamento | null>(null)
  const [resultados, setResultados] = useState<ResultadoVotacion | null>(null)
  const [tiempoRestante, setTiempoRestante] = useState<number>(0)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Obtener el grupo activo
        const { data: grupoData, error: grupoError } = await supabase
          .from('grupos_votacion')
          .select('*')
          .eq('activo', true)
          .single()

        if (grupoError) throw grupoError

        setGrupoActual(grupoData)

        if (grupoData) {
          // Obtener el departamento activo
          const departamentoActivo = grupoData.departamentos.find(d => d.activo)
          setDepartamentoActivo(departamentoActivo || null)

          if (departamentoActivo) {
            setTiempoRestante(departamentoActivo.tiempoVotacion * 60)
          }
        }

        // Suscribirse a cambios en tiempo real
        const gruposSubscription = supabase
          .channel('grupos_changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'grupos_votacion' }, handleGruposChange)
          .subscribe()

        const resultadosSubscription = supabase
          .channel('resultados_changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'resultados_votacion' }, handleResultadosChange)
          .subscribe()

        return () => {
          gruposSubscription.unsubscribe()
          resultadosSubscription.unsubscribe()
        }
      } catch (err) {
        console.error('Error al cargar datos:', err)
        setError('Error al cargar los datos de votación.')
      } finally {
        setCargando(false)
      }
    }

    cargarDatos()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (departamentoActivo && tiempoRestante > 0) {
      interval = setInterval(() => {
        setTiempoRestante(prev => Math.max(0, prev - 1))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [departamentoActivo, tiempoRestante])

  const handleGruposChange = (payload: any) => {
    console.log('Cambio en grupos:', payload)
    // Actualizar el estado según los cambios
    if (payload.new && payload.new.activo) {
      setGrupoActual(payload.new)
      const departamentoActivo = payload.new.departamentos.find((d: Departamento) => d.activo)
      setDepartamentoActivo(departamentoActivo || null)
      if (departamentoActivo) {
        setTiempoRestante(departamentoActivo.tiempoVotacion * 60)
      }
    }
  }

  const handleResultadosChange = (payload: any) => {
    console.log('Cambio en resultados:', payload)
    // Actualizar los resultados cuando se reciban nuevos datos
    if (payload.new) {
      setResultados(payload.new)
    }
  }

  if (cargando) {
    return <div className="container mx-auto p-4 text-center">Cargando datos de votación...</div>
  }

  if (error) {
    return <div className="container mx-auto p-4 text-center text-red-500">{error}</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Proyección de Votación</h1>
      {grupoActual && departamentoActivo && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{grupoActual.nombre} - {departamentoActivo.nombre}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold mb-4">Tiempo restante: {Math.floor(tiempoRestante / 60)}:{(tiempoRestante % 60).toString().padStart(2, '0')}</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidato</TableHead>
                  <TableHead>Cargo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departamentoActivo.candidatos.map((candidato) => (
                  <TableRow key={candidato.id}>
                    <TableCell>{candidato.nombre}</TableCell>
                    <TableCell>{candidato.cargoAsignado || 'Por asignar'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      {resultados && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados Finales</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidato</TableHead>
                  <TableHead>Votos</TableHead>
                  <TableHead>Cargo Asignado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultados.candidatos.map((candidato) => (
                  <TableRow key={candidato.id}>
                    <TableCell>{candidato.nombre}</TableCell>
                    <TableCell>{candidato.votos}</TableCell>
                    <TableCell>{candidato.cargoAsignado || 'No asignado'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

