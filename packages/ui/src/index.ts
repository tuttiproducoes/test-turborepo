export { useWebSocketSync } from './useWebSocketSync.js';
export { useStorageSync } from './useStorageSync.js';

export interface Produto {
    id: number;
    nome: string;
    descricao: string;
    preco: number;
    categoria: string;
    imagem: string;
    observacao: string;
    favorito: boolean;
    itensReceita: Array<{
      item: string;
      quantidade: string;
    }>;
  }