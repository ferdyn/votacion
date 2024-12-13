import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { GrupoVotacion } from '@/types'
import { Trash2 } from 'lucide-react'

export function ControlVotaciones({ 
  grupos, 
  onActivarGrupo,
  onDesactivarGrupo,
  onActivarVotacion, 
  onFinalizarVotacion,
  onEliminarGrupo
}: { 
  grupos: GrupoVotacion[], 
  onActivarGrupo: (grupoId: string) => void,
  onDesactivarGrupo: (grupoId: string) => void,
  onActivarVotacion: (grupoId: string, departamentoId: string) => void,
  onFinalizarVotacion: (grupoId: string, departamentoId: string) => void,
  onEliminarGrupo: (grupoId: string) => void
}) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <Accordion 
        type="single" 
        collapsible 
        className="w-full"
        value={expandedGroup || undefined}
        onValueChange={(value) => setExpandedGroup(value)}
      >
        {grupos.map(grupo => (
          <AccordionItem key={grupo.id} value={grupo.id} className="border rounded-lg mb-4 overflow-hidden">
            <AccordionTrigger className="px-4 py-2 hover:no-underline bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">{grupo.nombre}</span>
                <span className={`text-sm px-2 py-1 rounded-full ${
                  grupo.activo ? 'bg-green-400 text-green-800' : 'bg-red-400 text-red-800'
                }`}>
                  {grupo.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-4 bg-gray-50">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Button 
                    onClick={() => grupo.activo ? onDesactivarGrupo(grupo.id) : onActivarGrupo(grupo.id)}
                    variant={grupo.activo ? "destructive" : "default"}
                    className="w-3/4"
                  >
                    {grupo.activo ? 'Desactivar Grupo' : 'Activar Grupo'}
                  </Button>
                  <Button
                    onClick={() => onEliminarGrupo(grupo.id)}
                    variant="outline"
                    className="w-1/5"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {grupo.departamentos?.map(departamento => (
                  <Card key={departamento.id} className="mt-2 border-2 border-gray-200">
                    <CardHeader className="py-2 px-4 bg-gray-100">
                      <CardTitle className="text-sm font-medium flex justify-between items-center">
                        {departamento.nombre}
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          departamento.activo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'
                        }`}>
                          {departamento.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-4">
                      <div className="flex space-x-2">
                        <Button 
                          onClick={() => onActivarVotacion(grupo.id, departamento.id)}
                          disabled={!grupo.activo || departamento.activo}
                          className="flex-1 bg-blue-500 hover:bg-blue-600"
                        >
                          Activar
                        </Button>
                        <Button 
                          onClick={() => onFinalizarVotacion(grupo.id, departamento.id)}
                          disabled={!departamento.activo}
                          variant="destructive"
                          className="flex-1"
                        >
                          Finalizar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

