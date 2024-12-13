import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CodigoAcceso, GrupoVotacion } from '@/types'

interface GestionCodigosProps {
  codigos: CodigoAcceso[]
  grupos: GrupoVotacion[]
  onGenerarCodigos: (cantidad: number, grupoId: string) => void
  onEliminarCodigos: (codigosIds: string[]) => void
  onDesactivarCodigos: (codigosIds: string[]) => void
  onActivarCodigos: (codigosIds: string[]) => void
}

export function GestionCodigos({
  codigos,
  grupos,
  onGenerarCodigos,
  onEliminarCodigos,
  onDesactivarCodigos,
  onActivarCodigos
}: GestionCodigosProps) {
  const [cantidad, setCantidad] = useState(1)
  const [grupoSeleccionado, setGrupoSeleccionado] = useState('')
  const [codigosSeleccionados, setCodigosSeleccionados] = useState<string[]>([])

  const handleGenerarCodigos = () => {
    if (grupoSeleccionado) {
      onGenerarCodigos(cantidad, grupoSeleccionado)
    }
  }

  const handleSeleccionarTodos = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setCodigosSeleccionados(codigos.map(codigo => codigo.codigo))
    } else {
      setCodigosSeleccionados([])
    }
  }

  const handleSeleccionarCodigo = (codigo: string) => {
    setCodigosSeleccionados(prev => 
      prev.includes(codigo) 
        ? prev.filter(c => c !== codigo)
        : [...prev, codigo]
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          type="number"
          min="1"
          value={cantidad}
          onChange={(e) => setCantidad(parseInt(e.target.value))}
          placeholder="Cantidad de códigos"
          className="w-full md:w-1/3"
        />
        <Select onValueChange={setGrupoSeleccionado} value={grupoSeleccionado}>
          <SelectTrigger className="w-full md:w-1/3">
            <SelectValue placeholder="Seleccionar grupo" />
          </SelectTrigger>
          <SelectContent>
            {grupos.map((grupo) => (
              <SelectItem key={grupo.id} value={grupo.id}>
                {grupo.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleGenerarCodigos} className="w-full md:w-auto">
          Generar Códigos
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  onChange={handleSeleccionarTodos}
                  checked={codigosSeleccionados.length === codigos.length}
                />
              </TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Grupo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {codigos.map((codigo) => (
              <TableRow key={codigo.codigo}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={codigosSeleccionados.includes(codigo.codigo)}
                    onChange={() => handleSeleccionarCodigo(codigo.codigo)}
                  />
                </TableCell>
                <TableCell>{codigo.codigo}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    codigo.estado === 'activo' ? 'bg-green-100 text-green-800' :
                    codigo.estado === 'utilizado' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {codigo.estado}
                  </span>
                </TableCell>
                <TableCell>
                  {grupos.find(g => g.id === codigo.grupo_id)?.nombre || 'N/A'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
        <Button 
          onClick={() => onEliminarCodigos(codigosSeleccionados)}
          disabled={codigosSeleccionados.length === 0}
          variant="destructive"
          className="w-full sm:w-auto"
        >
          Eliminar Seleccionados
        </Button>
        <Button 
          onClick={() => onDesactivarCodigos(codigosSeleccionados)}
          disabled={codigosSeleccionados.length === 0}
          className="w-full sm:w-auto"
        >
          Desactivar Seleccionados
        </Button>
        <Button 
          onClick={() => onActivarCodigos(codigosSeleccionados)}
          disabled={codigosSeleccionados.length === 0}
          className="w-full sm:w-auto"
        >
          Activar Seleccionados
        </Button>
      </div>
    </div>
  )
}

