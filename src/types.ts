export interface Config {
  url: string;
  key: string;
  obraId: string;
  gemini: string;
  model: string;
  imgbbKey: string;
}

export interface Servico {
  id?: string;
  id_servico: string;
  nome: string;
  categoria: string;
  avanco_atual: number;
  status_atual: string;
  obra_id?: string;
  data_inicio?: string;
  data_fim?: string;
  equipe?: string;
}

export interface Pendencia {
  id: string;
  descricao: string;
  prioridade: string;
  status: string;
  obra_id?: string;
}

export interface DiarioEntry {
  texto?: string;
  ts?: string;
  db_id?: string;
  iaResult?: any;
  confirmado?: boolean;
}

export interface Equipe {
  cod: string;
  nome: string;
}

export interface Nota {
  id: string;
  tipo: string;
  texto: string;
  data_nota: string;
  obra_id?: string;
}

export interface Foto {
  id: string;
  url: string;
  thumb: string;
  data: string;
  semana: string;
  legenda: string;
  obra_id?: string;
}

export interface AppState {
  servicos: Servico[];
  pendencias: Pendencia[];
  presenca: Record<string, string[]>;
  diario: Record<string, DiarioEntry>;
  notas: Nota[];
  fotos: Foto[];
  equipes: Equipe[];
  currentDay: string;
  pendingChanges: any[];
}
