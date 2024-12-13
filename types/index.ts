export interface Candidato {
  id: string;
  nombre: string;
  votos: number;
}

export interface Cargo {
  id: string;
  nombre: string;
  orden: number;
}

export interface Departamento {
  id: string;
  nombre: string;
  cargos: Cargo[];
  candidatos: Candidato[];
  tiempoVotacion: number;
  activo: boolean;
}

export interface GrupoVotacion {
  id: string;
  nombre: string;
  departamentos: Departamento[];
  activo: boolean;
  urlAcceso?: string;
}

export interface CodigoAcceso {
  codigo: string;
  estado: 'activo' | 'utilizado' | 'pendiente';
  grupoId: string;
}

export interface ResultadoVotacion {
  departamentoId: string;
  candidatos: {
    id: string;
    nombre: string;
    votos: number;
    cargoAsignado?: string;
  }[];
}

