import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { GrupoVotacion, Departamento, Candidato, Cargo } from '@/types'

export function GestionGrupos({ grupos, onCrearGrupo, onActualizarGrupo }: { 
  grupos: GrupoVotacion[], 
  onCrearGrupo: (grupo: GrupoVotacion) => void,
  onActualizarGrupo: (grupoActualizado: GrupoVotacion) => void
}) {
  const [nuevoGrupo, setNuevoGrupo] = useState<GrupoVotacion>({
    id: '',
    nombre: '',
    departamentos: [],
    activo: false
  })
  const [nuevoDepartamento, setNuevoDepartamento] = useState<Departamento>({
    id: '',
    nombre: '',
    cargos: [],
    candidatos: [],
    tiempoVotacion: 5,
    activo: false
  })
  const [nuevoCandidato, setNuevoCandidato] = useState<Candidato>({
    id: '',
    nombre: '',
    votos: 0
  })
  const [nuevoCargo, setNuevoCargo] = useState<Cargo>({
    id: '',
    nombre: '',
    orden: 0
  })

  const handleCrearGrupo = () => {
    if (nuevoGrupo.nombre) {
      const id = Date.now().toString();
      onCrearGrupo({ ...nuevoGrupo, id, activo: false })
      setNuevoGrupo({ id: '', nombre: '', departamentos: [], activo: false })
    }
  }

  const handleCrearDepartamento = (grupoId: string) => {
    if (nuevoDepartamento.nombre) {
      const grupoActualizado = grupos.find(g => g.id === grupoId)
      if (grupoActualizado) {
        grupoActualizado.departamentos.push({
          ...nuevoDepartamento,
          id: Date.now().toString()
        })
        onActualizarGrupo(grupoActualizado)
        setNuevoDepartamento({
          id: '',
          nombre: '',
          cargos: [],
          candidatos: [],
          tiempoVotacion: 5,
          activo: false
        })
      }
    }
  }

  const handleAgregarCandidato = (grupoId: string, departamentoId: string) => {
    if (nuevoCandidato.nombre) {
      const grupoActualizado = grupos.find(g => g.id === grupoId)
      if (grupoActualizado) {
        const departamentoActualizado = grupoActualizado.departamentos.find(d => d.id === departamentoId)
        if (departamentoActualizado) {
          departamentoActualizado.candidatos.push({
            ...nuevoCandidato,
            id: Date.now().toString()
          })
          onActualizarGrupo(grupoActualizado)
          setNuevoCandidato({ id: '', nombre: '', votos: 0 })
        }
      }
    }
  }

  const handleAgregarCargo = (grupoId: string, departamentoId: string) => {
    if (nuevoCargo.nombre) {
      const grupoActualizado = grupos.find(g => g.id === grupoId)
      if (grupoActualizado) {
        const departamentoActualizado = grupoActualizado.departamentos.find(d => d.id === departamentoId)
        if (departamentoActualizado) {
          departamentoActualizado.cargos.push({
            ...nuevoCargo,
            id: Date.now().toString(),
            orden: departamentoActualizado.cargos.length + 1
          })
          onActualizarGrupo(grupoActualizado)
          setNuevoCargo({ id: '', nombre: '', orden: 0 })
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border shadow-sm">
        <CardHeader className="p-4">
          <CardTitle className="text-lg font-semibold">Crear Nuevo Grupo</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex flex-col space-y-3">
            <Input
              placeholder="Nombre del nuevo grupo"
              value={nuevoGrupo.nombre}
              onChange={(e) => setNuevoGrupo({ ...nuevoGrupo, nombre: e.target.value })}
              className="w-full"
            />
            <Button 
              onClick={handleCrearGrupo}
              className="w-full"
              disabled={!nuevoGrupo.nombre}
            >
              Crear Grupo
            </Button>
          </div>
        </CardContent>
      </Card>

      <Accordion type="single" collapsible className="w-full space-y-2">
        {grupos.map(grupo => (
          <AccordionItem key={grupo.id} value={grupo.id} className="border rounded-lg shadow-sm">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <span className="font-medium">{grupo.nombre}</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium">URL de acceso:</p>
                  <a 
                    href={`${typeof window !== 'undefined' ? window.location.origin : ''}/votacion/${grupo.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline break-all"
                  >
                    {`${typeof window !== 'undefined' ? window.location.origin : ''}/votacion/${grupo.id}`}
                  </a>
                </div>

                <div className="space-y-3">
                  <Input
                    placeholder="Nombre del nuevo departamento"
                    value={nuevoDepartamento.nombre}
                    onChange={(e) => setNuevoDepartamento({ ...nuevoDepartamento, nombre: e.target.value })}
                    className="w-full"
                  />
                  <Input
                    type="number"
                    placeholder="Tiempo de votación (minutos)"
                    value={nuevoDepartamento.tiempoVotacion}
                    onChange={(e) => setNuevoDepartamento({ ...nuevoDepartamento, tiempoVotacion: Number(e.target.value) })}
                    className="w-full"
                  />
                  <Button 
                    onClick={() => handleCrearDepartamento(grupo.id)} 
                    className="w-full"
                    disabled={!nuevoDepartamento.nombre}
                  >
                    Crear Departamento
                  </Button>
                </div>

                {grupo.departamentos.length > 0 && (
                  <div className="mt-4 space-y-4">
                    <h4 className="font-semibold text-sm">Departamentos:</h4>
                    {grupo.departamentos.map(dep => (
                      <Card key={dep.id} className="p-4 bg-muted">
                        <h5 className="font-semibold mb-2">{dep.nombre} (Tiempo: {dep.tiempoVotacion} minutos)</h5>
                        
                        <div className="space-y-3 mb-4">
                          <Input
                            placeholder="Nombre del nuevo candidato"
                            value={nuevoCandidato.nombre}
                            onChange={(e) => setNuevoCandidato({ ...nuevoCandidato, nombre: e.target.value })}
                            className="w-full"
                          />
                          <Button 
                            onClick={() => handleAgregarCandidato(grupo.id, dep.id)} 
                            className="w-full"
                            disabled={!nuevoCandidato.nombre}
                          >
                            Agregar Candidato
                          </Button>
                        </div>

                        {dep.candidatos.length > 0 && (
                          <div className="mb-4">
                            <h6 className="font-semibold text-sm mb-2">Candidatos:</h6>
                            <ul className="list-disc pl-5 space-y-1">
                              {dep.candidatos.map(candidato => (
                                <li key={candidato.id}>{candidato.nombre}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="space-y-3 mb-4">
                          <Input
                            placeholder="Nombre del nuevo cargo"
                            value={nuevoCargo.nombre}
                            onChange={(e) => setNuevoCargo({ ...nuevoCargo, nombre: e.target.value })}
                            className="w-full"
                          />
                          <Button 
                            onClick={() => handleAgregarCargo(grupo.id, dep.id)} 
                            className="w-full"
                            disabled={!nuevoCargo.nombre}
                          >
                            Agregar Cargo
                          </Button>
                        </div>

                        {dep.cargos.length > 0 && (
                          <div>
                            <h6 className="font-semibold text-sm mb-2">Cargos:</h6>
                            <ul className="list-disc pl-5 space-y-1">
                              {dep.cargos.map(cargo => (
                                <li key={cargo.id}>{cargo.nombre} (Orden: {cargo.orden})</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

