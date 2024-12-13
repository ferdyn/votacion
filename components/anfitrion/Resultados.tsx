import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ResultadoVotacion } from '@/types'

export function Resultados({ resultados }: { resultados: ResultadoVotacion[] }) {
  return (
    <div className="space-y-4">
      {resultados.map((resultado) => (
        <Card key={resultado.departamentoId}>
          <CardHeader>
            <CardTitle className="text-lg">Resultados del Departamento: {resultado.departamentoId}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] w-full rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Candidato</TableHead>
                    <TableHead>Votos</TableHead>
                    <TableHead>Cargo Asignado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultado.candidatos.map((candidato) => (
                    <TableRow key={candidato.id}>
                      <TableCell className="font-medium">{candidato.nombre}</TableCell>
                      <TableCell>{candidato.votos}</TableCell>
                      <TableCell>{candidato.cargoAsignado || 'No asignado'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

