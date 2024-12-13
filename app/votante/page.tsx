'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GrupoVotacion, Departamento, Candidato, CodigoAcceso } from '@/types'

// Simulated API call to verify access code
const verificarCodigoAcceso = async (codigo: string): Promise<CodigoAcceso | null> => {
  // This would be replaced with an actual API call
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulated response
      if (codigo === 'ABC123') {
        resolve({
          codigo: 'ABC123',
          estado: 'activo',
          grupoId: '1'
        })
      } else {
        resolve(null)
      }
    }, 1000)
  })
}

// Simulated API call to get active voting group
const getGrupoVotacionActivo = async (grupoId: string): Promise<GrupoVotacion | null> => {
  // This would be replaced with an actual API call
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulated response
      resolve({
        id: '1',
        nombre: 'Grupo 1',
        departamentos: [
          {
            id: '1',
            nombre: 'Departamento 1',
            cargos: [{ id: '1', nombre: 'Presidente', orden: 1 }],
            candidatos: [
              { id: '1', nombre: 'Candidato 1', votos: 0 },
              { id: '2', nombre: 'Candidato 2', votos: 0 },
            ],
            tiempoVotacion: 5,
            activo: true
          },
          {
            id: '2',
            nombre: 'Departamento 2',
            cargos: [{ id: '2', nombre: 'Secretario', orden: 1 }],
            candidatos: [
              { id: '3', nombre: 'Candidato 3', votos: 0 },
              { id: '4', nombre: 'Candidato 4', votos: 0 },
            ],
            tiempoVotacion: 5,
            activo: false
          }
        ],
        activo: true
      })
    }, 1000)
  })
}

export default function VotantePage() {
  const [codigo, setCodigo] = useState('')
  const [grupoVotacion, setGrupoVotacion] = useState<GrupoVotacion | null>(null)
  const [departamentoActivo, setDepartamentoActivo] = useState<Departamento | null>(null)
  const [candidatoSeleccionado, setCandidatoSeleccionado] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState('')
  const [tiempoRestante, setTiempoRestante] = useState(0)

  useEffect(() => {
    // Cargar datos del localStorage al iniciar
    const storedCodigo = localStorage.getItem('codigoVotante');
    const storedGrupo = localStorage.getItem('grupoVotacionActual');
    const storedDepartamento = localStorage.getItem('departamentoActivo');

    if (storedCodigo) setCodigo(storedCodigo);
    if (storedGrupo) setGrupoVotacion(JSON.parse(storedGrupo));
    if (storedDepartamento) setDepartamentoActivo(JSON.parse(storedDepartamento));
  }, []);

  useEffect(() => {
    // Guardar datos en localStorage cuando cambien
    localStorage.setItem('codigoVotante', codigo);
    if (grupoVotacion) localStorage.setItem('grupoVotacionActual', JSON.stringify(grupoVotacion));
    if (departamentoActivo) localStorage.setItem('departamentoActivo', JSON.stringify(departamentoActivo));
  }, [codigo, grupoVotacion, departamentoActivo]);

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

  const verificarCodigo = async () => {
    setMensaje('Verificando código...')
    try {
      const codigoVerificado = await verificarCodigoAcceso(codigo)
      if (codigoVerificado) {
        const grupo = await getGrupoVotacionActivo(codigoVerificado.grupoId)
        if (grupo && grupo.activo) {
          setGrupoVotacion(grupo)
          setMensaje('Código válido. Esperando que se active la votación.')
        } else {
          setMensaje('El grupo de votación no está activo en este momento.')
        }
      } else {
        setMensaje('Código inválido. Por favor, intente nuevamente.')
      }
    } catch (error) {
      setMensaje('Error al verificar el código. Por favor, intente nuevamente.')
    }
  }

  const seleccionarDepartamento = (departamento: Departamento) => {
    setDepartamentoActivo(departamento)
    setTiempoRestante(departamento.tiempoVotacion * 60)
    setCandidatoSeleccionado(null)
  }

  const enviarVoto = async () => {
    if (departamentoActivo && candidatoSeleccionado) {
      // Aquí iría la lógica para enviar el voto al backend
      setMensaje('Su voto ha sido registrado correctamente. Gracias por su participación.')
      setDepartamentoActivo(null)
      setCandidatoSeleccionado(null)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-4 text-center">Votación de la Iglesia</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-xl">
            {!grupoVotacion ? 'Ingresar Código de Acceso' : 
             !departamentoActivo ? 'Seleccionar Departamento' : 'Emitir Voto'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!grupoVotacion ? (
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Ingrese el código de acceso"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className="text-center"
              />
              <Button 
                onClick={verificarCodigo} 
                className="w-full"
                disabled={!codigo}
              >
                Verificar Código
              </Button>
            </div>
          ) : !departamentoActivo ? (
            <div className="space-y-4">
              <h3 className="text-center font-semibold">{grupoVotacion.nombre}</h3>
              {grupoVotacion.departamentos.filter(d => d.activo).map((departamento) => (
                <Button
                  key={departamento.id}
                  onClick={() => seleccionarDepartamento(departamento)}
                  className="w-full"
                >
                  {departamento.nombre}
                </Button>
              ))}
              {grupoVotacion.departamentos.filter(d => d.activo).length === 0 && (
                <p className="text-center">No hay departamentos activos en este momento.</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-center font-semibold">{departamentoActivo.nombre}</h3>
              <p className="text-center">Tiempo restante: {Math.floor(tiempoRestante / 60)}:{(tiempoRestante % 60).toString().padStart(2, '0')}</p>
              <div className="grid grid-cols-1 gap-2">
                {departamentoActivo.candidatos.map((candidato) => (
                  <Button
                    key={candidato.id}
                    onClick={() => setCandidatoSeleccionado(candidato.id)}
                    variant={candidatoSeleccionado === candidato.id ? 'default' : 'outline'}
                    className="w-full"
                  >
                    {candidato.nombre}
                  </Button>
                ))}
              </div>
              <Button 
                onClick={enviarVoto} 
                className="w-full"
                disabled={!candidatoSeleccionado}
              >
                Enviar Voto
              </Button>
            </div>
          )}
          {mensaje && (
            <p className="mt-4 text-center text-green-600">{mensaje}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

