import { useState, useEffect } from 'react';
import { useStorageSync } from 'ui';
import './ItensPage.css';

interface ItemReceita {
  item: string;
  quantidade: string;
}

interface Produto {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  imagem: string;
  observacao: string;
  favorito: boolean;
  itensReceita: ItemReceita[];
}

const ItensPage = () => {
  const [produtosCadastrados, setProdutosCadastrados] = useStorageSync<Produto[]>('produtos', []);
  const [favoritos, setFavoritos] = useStorageSync<Produto[]>('favoritos', []);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('café da manhã');
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mostrarReceitaId, setMostrarReceitaId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<Produto>>({});

  // Listener para atualizações em tempo real
  useEffect(() => {
    const channel = new BroadcastChannel('products_channel');
    
    channel.addEventListener('message', (event) => {
      if (event.data.type === 'PRODUCTS_UPDATE') {
        setProdutosCadastrados(event.data.data);
      }
    });

    return () => {
      channel.close();
    };
  }, [setProdutosCadastrados]);

  const categorias = [
    'café da manhã',
    'finger food inicial',
    'Antepasto',
    'Buffet americano',
    'Serviço à russa',
    'brasileirinha',
    'inglesa direto',
    'inglesa indireto',
    'À francesa',
    'empratados',
    'sobremesas',
    'finger food final',
    'marmitas',
    'congelados',
    'doceria',
    'salgadinhos',
    'churrasco'
  ];

  const produtosFiltrados = produtosCadastrados?.filter(produto => 
    produto.categoria.toLowerCase() === categoriaSelecionada.toLowerCase()
  ) || [];

  const toggleFavorito = (id: number) => {
    const produto = produtosCadastrados?.find(p => p.id === id);
    if (!produto) return;

    const index = favoritos?.findIndex(f => f.id === id) ?? -1;
    let novosFavoritos = [...(favoritos || [])];

    if (index === -1) {
      novosFavoritos.push(produto);
    } else {
      novosFavoritos.splice(index, 1);
    }

    setFavoritos(novosFavoritos);
  };

  const deletarProduto = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este produto permanentemente?')) {
      const novosProdutos = produtosCadastrados?.filter(p => p.id !== id) || [];
      const novosFavoritos = favoritos?.filter(f => f.id !== id) || [];

      setProdutosCadastrados(novosProdutos);
      setFavoritos(novosFavoritos);
    }
  };

  const iniciarEdicao = (id: number) => {
    const produto = produtosCadastrados?.find(p => p.id === id);
    if (produto) {
      setEditValues({
        nome: produto.nome,
        descricao: produto.descricao,
        preco: produto.preco,
        observacao: produto.observacao,
        imagem: produto.imagem
      });
      setEditandoId(id);
    }
  };

  const handleEditChange = (field: keyof Produto, value: any) => {
    setEditValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, id: number) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleEditChange('imagem', event.target.result.toString());
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const salvarEdicao = (id: number) => {
    const novosProdutos = produtosCadastrados?.map(produto => 
      produto.id === id ? { ...produto, ...editValues } : produto
    ) || [];

    setProdutosCadastrados(novosProdutos);
    setEditandoId(null);
  };

  const toggleReceita = (id: number) => {
    setMostrarReceitaId(mostrarReceitaId === id ? null : id);
  };

  return (
    <>
      <section className="cabeçalho-inicial-mobile">
        <div className="container">
          <ul className="seleção-de-categoria-mobile">
            {categorias.map(categoria => (
              <li 
                key={categoria}
                className={categoriaSelecionada === categoria ? 'active' : ''}
                onClick={() => setCategoriaSelecionada(categoria)}
              >
                {categoria}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <article data-test-id="artigo container cardstack" className="seção container cardstack">
        <section data-test-id="seção container cardstack" id="cardstack-section">
          <div id="produtos-container" className="menu-fornecedores-lista__wrapper">
            {produtosFiltrados.map(produto => (
              <div key={produto.id} className="menu-fornecedores-lista__item-wrapper">
                <div className={`menu ${editandoId === produto.id ? 'editando' : ''}`}>
                  <div className="imagem-cardstack">
                    <span className="img__cardstack">
                      <img 
                        src={editandoId === produto.id ? editValues.imagem || produto.imagem : produto.imagem} 
                        alt={produto.nome} 
                        decoding="async" 
                        className="propria__imagem-menu" 
                      />
                      {editandoId === produto.id && (
                        <label style={{
                          cursor: 'pointer',
                          position: 'absolute',
                          right: '10px',
                          top: '10px',
                          background: 'rgba(255,255,255,0.7)',
                          padding: '5px',
                          borderRadius: '50%'
                        }}>
                          <input 
                            type="file" 
                            accept="image/*" 
                            style={{ display: 'none' }} 
                            onChange={(e) => handleImageChange(e, produto.id)}
                          />
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icone-upload">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                        </label>
                      )}
                    </span>
                  </div>
                  <div className="menu__content">
                    <h3 className="menu__titulo">
                      <div className="menu__titulo-container">
                        {editandoId === produto.id ? (
                          <input 
                            type="text" 
                            value={editValues.nome || ''}
                            className="edit-input"
                            onChange={(e) => handleEditChange('nome', e.target.value)}
                          />
                        ) : (
                          <span className="menu__nome">{produto.nome}</span>
                        )}
                      </div>
                    </h3>
                    <div className="menu__informação">
                      {editandoId === produto.id ? (
                        <textarea 
                          value={editValues.descricao || ''}
                          className="edit-textarea"
                          onChange={(e) => handleEditChange('descricao', e.target.value)}
                        />
                      ) : (
                        <span className="menu-descrição">{produto.descricao}</span>
                      )}
                    </div>
                    <div className="menu__rodapé">
                      {editandoId === produto.id ? (
                        <input 
                          type="number" 
                          step="0.01"
                          value={editValues.preco || 0}
                          className="edit-input"
                          onChange={(e) => handleEditChange('preco', parseFloat(e.target.value))}
                        />
                      ) : (
                        <span className="menu__valores">R$ {produto.preco.toFixed(2)}</span>
                      )}
                    </div>
                    <div className="menu__observação">
                      {editandoId === produto.id ? (
                        <textarea 
                          value={editValues.observacao || ''}
                          className="edit-textarea"
                          onChange={(e) => handleEditChange('observacao', e.target.value)}
                        />
                      ) : (
                        <span className="menu__detalhes">{produto.observacao}</span>
                      )}
                    </div>
                  </div>
                  <div className="menu-fornecedores-lista__icone-item">
                    <button 
                      className="editar-btn" 
                      onClick={() => editandoId === produto.id ? salvarEdicao(produto.id) : iniciarEdicao(produto.id)}
                    >
                      {editandoId === produto.id ? (
                        'Salvar'
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icone-editar">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      )}
                    </button>
                    <button 
                      className="favorito-btn" 
                      onClick={() => toggleFavorito(produto.id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={favoritos?.some(f => f.id === produto.id) ? '#ff4757' : 'none'} stroke={favoritos?.some(f => f.id === produto.id) ? '#ff4757' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`icone-coração ${favoritos?.some(f => f.id === produto.id) ? 'favoritado' : ''}`}>
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    </button>
                    <button 
                      className="lixeira-btn" 
                      onClick={() => deletarProduto(produto.id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icone-lixeira">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </button>
                    <button 
                      className="caderno-btn" 
                      onClick={() => toggleReceita(produto.id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icone-caderno">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                      </svg>
                    </button>
                  </div>
                </div>
                
                {mostrarReceitaId === produto.id && (
                  <div className="receita-container">
                    <button className="fechar-receita" onClick={() => setMostrarReceitaId(null)}>✕</button>
                    <div className="receita-titulo">Receita: {produto.nome}</div>
                    <div className="receita-lista" id={`receita-lista-${produto.id}`}>
                      {produto.itensReceita.map((item, index) => (
                        <div key={index} className="receita-item">
                          {index + 1}° - {item.quantidade.includes('kg') ? item.quantidade : item.quantidade + 'g'} de {item.item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </article>

      <div className="orcamento-float">
        <a href="/orcamento" className="btn-orcamento" data-count={favoritos?.length || 0}>
          Ver Orçamento ({favoritos?.length || 0})
        </a>
      </div>
    </>
  );
};

export default ItensPage;