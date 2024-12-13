'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GestionGrupos } from '@/components/anfitrion/GestionGrupos'
import { GestionCodigos } from '@/components/anfitrion/GestionCodigos'
import { ControlVotaciones } from '@/components/anfitrion/ControlVotaciones'
import { Resultados } from '@/components/anfitrion/Resultados'
import { GrupoVotacion, CodigoAcceso, ResultadoVotacion } from '@/types'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/use-toast'
import { v4 as uuidv4 } from 'uuid'

export default function AnfitrionPage() {
  const [gruposVotacion, setGruposVotacion] = useState<GrupoVotacion[]>([])
  const [codigosAcceso, setCodigosAcceso] = useState<CodigoAcceso[]>([])
  const [resultados, setResultados] = useState<ResultadoVotacion[]>([])

  useEffect(() => {
    fetchGruposVotacion()
    fetchCodigosAcceso()
    fetchResultados()

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('grupos_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'grupos_votacion'
        }, 
        () => {
          fetchGruposVotacion()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchGruposVotacion = async () => {
    try {
      const { data, error } = await supabase
        .from('grupos_votacion')
        .select('*')
        .order('id', { ascending: false })
      if (error) throw error
      setGruposVotacion(data || [])
    } catch (error) {
      console.error('Error fetching grupos:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los grupos de votación. Por favor, intente de nuevo.",
        variant: "destructive",
      })
    }
  }

  const fetchCodigosAcceso = async () => {
    try {
      const { data, error } = await supabase
        .from('codigos_acceso')
        .select('*')
        .order('codigo', { ascending: true })
      if (error) throw error
      setCodigosAcceso(data || [])
    } catch (error) {
      console.error('Error fetching códigos:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los códigos de acceso. Por favor, intente de nuevo.",
        variant: "destructive",
      })
    }
  }

  const fetchResultados = async () => {
    try {
      const { data, error } = await supabase
        .from('resultados_votacion')
        .select('*')
      if (error) throw error
      setResultados(data || [])
    } catch (error) {
      console.error('Error fetching resultados:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los resultados de votación. Por favor, intente de nuevo.",
        variant: "destructive",
      })
    }
  }

  const handleCrearGrupo = async (nuevoGrupo: GrupoVotacion) => {
    try {
      const grupoConId = {
        ...nuevoGrupo,
        id: uuidv4(),
        activo: false
      }

      const { data, error } = await supabase
        .from('grupos_votacion')
        .insert([grupoConId])
        .select()
      if (error) throw error
      
      await fetchGruposVotacion()
      
      toast({
        title: "Éxito",
        description: "Grupo de votación creado correctamente.",
      })
    } catch (error) {
      console.error('Error creating grupo:', error)
      toast({
        title: "Error",
        description: "No se pudo crear el grupo de votación. Por favor, intente de nuevo.",
        variant: "destructive",
      })
    }
  }

  const handleActualizarGrupo = async (grupoActualizado: GrupoVotacion) => {
    try {
      const { error } = await supabase
        .from('grupos_votacion')
        .update(grupoActualizado)
        .eq('id', grupoActualizado.id)
      if (error) throw error
      
      await fetchGruposVotacion()
      
      toast({
        title: "Éxito",
        description: "Grupo de votación actualizado correctamente.",
      })
    } catch (error) {
      console.error('Error updating grupo:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el grupo de votación. Por favor, intente de nuevo.",
        variant: "destructive",
      })
    }
  }

  const handleEliminarGrupo = async (grupoId: string) => {
    try {
      // Eliminar códigos asociados
      const { error: codigosError } = await supabase
        .from('codigos_acceso')
        .delete()
        .eq('grupo_id', grupoId)
      if (codigosError) throw codigosError

      // Obtener departamentos del grupo
      const grupo = gruposVotacion.find(g => g.id === grupoId)
      if (grupo && grupo.departamentos) {
        const departamentoIds = grupo.departamentos.map(d => d.id)
        
        // Eliminar resultados asociados a los departamentos
        const { error: resultadosError } = await supabase
          .from('resultados_votacion')
          .delete()
          .in('departamentoId', departamentoIds)
        if (resultadosError) throw resultadosError
      }

      // Eliminar el grupo
      const { error: grupoError } = await supabase
        .from('grupos_votacion')
        .delete()
        .eq('id', grupoId)
      if (grupoError) throw grupoError

      await Promise.all([
        fetchGruposVotacion(),
        fetchCodigosAcceso(),
        fetchResultados()
      ])

      toast({
        title: "Éxito",
        description: "Grupo de votación y datos asociados eliminados correctamente.",
      })
    } catch (error) {
      console.error('Error deleting grupo:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el grupo de votación. Por favor, intente de nuevo.",
        variant: "destructive",
      })
    }
  }

  const handleActivarGrupo = async (grupoId: string) => {
    try {
      // Desactivar todos los otros grupos primero
      const { error: desactivarError } = await supabase
        .from('grupos_votacion')
        .update({ activo: false })
        .neq('id', grupoId)
      if (desactivarError) throw desactivarError

      // Activar el grupo seleccionado
      const { error: activarError } = await supabase
        .from('grupos_votacion')
        .update({ activo: true })
        .eq('id', grupoId)
      if (activarError) throw activarError

      await fetchGruposVotacion()

      toast({
        title: "Éxito",
        description: "Grupo activado correctamente.",
      })
    } catch (error) {
      console.error('Error activating grupo:', error)
      toast({
        title: "Error",
        description: "No se pudo activar el grupo. Por favor, intente de nuevo.",
        variant: "destructive",
      })
    }
  }

  const handleDesactivarGrupo = async (grupoId: string) => {
    try {
      const grupo = gruposVotacion.find(g => g.id === grupoId)
      if (!grupo) throw new Error('Grupo no encontrado')

      // Desactivar todos los departamentos
      const departamentosActualizados = grupo.departamentos.map(d => ({
        ...d,
        activo: false
      }))

      const { error } = await supabase
        .from('grupos_votacion')
        .update({ 
          activo: false,
          departamentos: departamentosActualizados
        })
        .eq('id', grupoId)
      if (error) throw error

      await fetchGruposVotacion()

      toast({
        title: "Éxito",
        description: "Grupo desactivado correctamente.",
      })
    } catch (error) {
      console.error('Error deactivating grupo:', error)
      toast({
        title: "Error",
        description: "No se pudo desactivar el grupo. Por favor, intente de nuevo.",
        variant: "destructive",
      })
    }
  }

  const handleActivarVotacion = async (grupoId: string, departamentoId: string) => {
    try {
      const grupo = gruposVotacion.find(g => g.id === grupoId)
      if (!grupo) throw new Error('Grupo no encontrado')

      // Desactivar todos los departamentos y activar solo el seleccionado
      const departamentosActualizados = grupo.departamentos.map(d => ({
        ...d,
        activo: d.id === departamentoId
      }))

      const { error } = await supabase
        .from('grupos_votacion')
        .update({ departamentos: departamentosActualizados })
        .eq('id', grupoId)
      if (error) throw error

      await fetchGruposVotacion()

      toast({
        title: "Éxito",
        description: "Votación activada correctamente.",
      })
    } catch (error) {
      console.error('Error activating votación:', error)
      toast({
        title: "Error",
        description: "No se pudo activar la votación. Por favor, intente de nuevo.",
        variant: "destructive",
      })
    }
  }

  const handleFinalizarVotacion = async (grupoId: string, departamentoId: string) => {
    try {
      const grupo = gruposVotacion.find(g => g.id === grupoId)
      if (!grupo) throw new Error('Grupo no encontrado')

      // Desactivar el departamento seleccionado
      const departamentosActualizados = grupo.departamentos.map(d => 
        d.id === departamentoId ? { ...d, activo: false } : d
      )

      const { error } = await supabase
        .from('grupos_votacion')
        .update({ departamentos: departamentosActualizados })
        .eq('id', grupoId)
      if (error) throw error

      await fetchGruposVotacion()

      toast({
        title: "Éxito",
        description: "Votación finalizada correctamente.",
      })
    } catch (error) {
      console.error('Error finalizing votación:', error)
      toast({
        title: "Error",
        description: "No se pudo finalizar la votación. Por favor, intente de nuevo.",
        variant: "destructive",
      })
    }
  }

  const handleGenerarCodigos = async (cantidad: number, grupoId: string) => {
    try {
      const nuevosCodigos: CodigoAcceso[] = Array.from({ length: cantidad }, () => ({
        codigo: Math.random().toString(36).substr(2, 6).toUpperCase(),
        estado: 'pendiente',
        grupo_id: grupoId
      }))
      const { data, error } = await supabase
        .from('codigos_acceso')
        .insert(nuevosCodigos)
        .select()
      if (error) throw error
      
      await fetchCodigosAcceso()
      
      toast({
        title: "Éxito",
        description: `${cantidad} códigos de acceso generados correctamente.`,
      })
    } catch (error) {
      console.error('Error generating códigos:', error)
      toast({
        title: "Error",
        description: "No se pudieron generar los códigos de acceso. Por favor, intente de nuevo.",
        variant: "destructive",
      })
    }
  }

  const handleEliminarCodigos = async (codigosIds: string[]) => {
    try {
      const { error } = await supabase
        .from('codigos_acceso')
        .delete()
        .in('codigo', codigosIds)
      if (error) throw error
      
      await fetchCodigosAcceso()
      
      toast({
        title: "Éxito",
        description: "Códigos de acceso eliminados correctamente.",
      })
    } catch (error) {
      console.error('Error deleting códigos:', error)
      toast({
        title: "Error",
        description: "No se pudieron eliminar los códigos de acceso. Por favor, intente de nuevo.",
        variant: "destructive",
      })
    }
  }

  const handleDesactivarCodigos = async (codigosIds: string[]) => {
    try {
      const { error } = await supabase
        .from('codigos_acceso')
        .update({ estado: 'desactivado' })
        .in('codigo', codigosIds)
      if (error) throw error
      
      await fetchCodigosAcceso()
      
      toast({
        title: "Éxito",
        description: "Códigos de acceso desactivados correctamente.",
      })
    } catch (error) {
      console.error('Error deactivating códigos:', error)
      toast({
        title: "Error",
        description: "No se pudieron desactivar los códigos de acceso. Por favor, intente de nuevo.",
        variant: "destructive",
      })
    }
  }

  const handleActivarCodigos = async (codigosIds: string[]) => {
    try {
      const { error } = await supabase
        .from('codigos_acceso')
        .update({ estado: 'activo' })
        .in('codigo', codigosIds)
      if (error) throw error
      
      await fetchCodigosAcceso()
      
      toast({
        title: "Éxito",
        description: "Códigos de acceso activados correctamente.",
      })
    } catch (error) {
      console.error('Error activating códigos:', error)
      toast({
        title: "Error",
        description: "No se pudieron activar los códigos de acceso. Por favor, intente de nuevo.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center text-gray-800">Panel del Anfitrión</h1>
        <Tabs defaultValue="grupos" className="space-y-6">
          <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 gap-2 p-1 h-auto bg-white rounded-lg shadow">
            <TabsTrigger value="grupos" className="py-2.5 text-sm md:text-base">Grupos</TabsTrigger>
            <TabsTrigger value="codigos" className="py-2.5 text-sm md:text-base">Códigos</TabsTrigger>
            <TabsTrigger value="votaciones" className="py-2.5 text-sm md:text-base">Votaciones</TabsTrigger>
            <TabsTrigger value="resultados" className="py-2.5 text-sm md:text-base">Resultados</TabsTrigger>
          </TabsList>
          
          <TabsContent value="grupos">
            <Card className="border-0 shadow-lg">
              <CardHeader className="space-y-1.5 p-6 bg-gradient-to-r from-blue-500 to-purple-500">
                <CardTitle className="text-2xl md:text-3xl font-bold text-white">Gestión de Grupos y Departamentos</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <GestionGrupos 
                  grupos={gruposVotacion} 
                  onCrearGrupo={handleCrearGrupo} 
                  onActualizarGrupo={handleActualizarGrupo}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="codigos">
            <Card className="border-0 shadow-lg">
              <CardHeader className="space-y-1.5 p-6 bg-gradient-to-r from-green-500 to-teal-500">
                <CardTitle className="text-2xl md:text-3xl font-bold text-white">Gestión de Códigos de Acceso</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <GestionCodigos 
                  codigos={codigosAcceso} 
                  grupos={gruposVotacion}
                  onGenerarCodigos={handleGenerarCodigos}
                  onEliminarCodigos={handleEliminarCodigos}
                  onDesactivarCodigos={handleDesactivarCodigos}
                  onActivarCodigos={handleActivarCodigos}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="votaciones">
            <Card className="border-0 shadow-lg">
              <CardHeader className="space-y-1.5 p-6 bg-gradient-to-r from-orange-500 to-red-500">
                <CardTitle className="text-2xl md:text-3xl font-bold text-white">Control de Votaciones</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ControlVotaciones 
                  grupos={gruposVotacion} 
                  onActivarGrupo={handleActivarGrupo}
                  onDesactivarGrupo={handleDesactivarGrupo}
                  onActivarVotacion={handleActivarVotacion}
                  onFinalizarVotacion={handleFinalizarVotacion}
                  onEliminarGrupo={handleEliminarGrupo}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resultados">
            <Card className="border-0 shadow-lg">
              <CardHeader className="space-y-1.5 p-6 bg-gradient-to-r from-purple-500 to-pink-500">
                <CardTitle className="text-2xl md:text-3xl font-bold text-white">Resultados de Votaciones</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Resultados resultados={resultados} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

