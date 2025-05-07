import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { useWebSocketSync } from 'ui';
import './FormProduto.css';

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

const FormProduto = () => {
  const [produtosCadastrados, setProdutosCadastrados] = useWebSocketSync<Produto[]>('produtos', []);
  const [itensReceita, setItensReceita] = useState<ItemReceita[]>([{ item: '', quantidade: '' }]);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco: '',
    categoria: '',
    observacao: '',
  });
  const [imagePreview, setImagePreview] = useState({
    url: '',
    showDefault: true
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronização extra via BroadcastChannel
  useEffect(() => {
    if (produtosCadastrados && produtosCadastrados.length > 0) {
      const channel = new BroadcastChannel('products_channel');
      channel.postMessage({
        type: 'PRODUCTS_UPDATE',
        data: produtosCadastrados
      });
      setTimeout(() => channel.close(), 100);
    }
  }, [produtosCadastrados]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index: number, field: keyof ItemReceita, value: string) => {
    const newItens = [...itensReceita];
    newItens[index] = { ...newItens[index], [field]: value };
    setItensReceita(newItens);
  };

  const addItem = () => {
    setItensReceita([...itensReceita, { item: '', quantidade: '' }]);
  };

  const removeItem = (index: number) => {
    if (itensReceita.length > 1) {
      const newItens = [...itensReceita];
      newItens.splice(index, 1);
      setItensReceita(newItens);
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview({
          url: reader.result as string,
          showDefault: false
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      alert('Por favor, informe o nome do produto.');
      return;
    }
    
    if (!formData.descricao.trim()) {
      alert('Por favor, informe a descrição do produto.');
      return;
    }
    
    if (isNaN(parseFloat(formData.preco)) || parseFloat(formData.preco) <= 0) {
      alert('Por favor, informe um preço válido para o produto.');
      return;
    }
    
    if (!formData.categoria) {
      alert('Por favor, selecione uma categoria para o produto.');
      return;
    }
    
    if (!fileInputRef.current?.files?.length) {
      alert('Por favor, selecione uma imagem para o produto.');
      return;
    }

    const file = fileInputRef.current.files[0];
    
    if (!file.type.match('image.*')) {
      alert('Por favor, selecione um arquivo de imagem válido (JPEG, PNG, etc).');
      return;
    }

    try {
      const img = new Image();
      const imgUrl = URL.createObjectURL(file);
      
      img.onload = async () => {
        const imagemRedimensionada = await redimensionarImagem(img, 800, 800, 0.8);
        
        const novoProduto: Produto = {
          id: Date.now(),
          nome: formData.nome.trim(),
          descricao: formData.descricao.trim(),
          preco: parseFloat(formData.preco),
          categoria: formData.categoria,
          imagem: imagemRedimensionada,
          observacao: formData.observacao.trim() || 'Sem observações',
          favorito: false,
          itensReceita: itensReceita.filter(item => item.item.trim() && item.quantidade.trim())
        };
        
        const novosProdutos = [...(produtosCadastrados || []), novoProduto];
        setProdutosCadastrados(novosProdutos);
        
        alert('Produto cadastrado com sucesso!');
        resetForm();
      };
      
      img.src = imgUrl;
    } catch (error) {
      alert('Erro ao processar a imagem. Por favor, tente novamente.');
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      preco: '',
      categoria: '',
      observacao: '',
    });
    setItensReceita([{ item: '', quantidade: '' }]);
    setImagePreview({ url: '', showDefault: true });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const redimensionarImagem = (imagem: HTMLImageElement, maxWidth: number, maxHeight: number, qualidade: number): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      let width = imagem.width;
      let height = imagem.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(imagem, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', qualidade));
      }
    });
  };

  return (
    <>
      <section className="cabeçalho-inicial-mobile">
        <div className="container">
          <h1>Cadastro de Produtos</h1>
        </div>
      </section>

      <main className="container">
        <form onSubmit={handleSubmit} className="form-cadastro">
          <div className="form-group">
            <label htmlFor="nome">Nome do Produto:</label>
            <input
              type="text"
              id="nome"
              name="nome"
              required
              value={formData.nome}
              onChange={handleChange}
            />
          </div>
          
          <div id="itens-receita-container">
            {itensReceita.map((item, index) => (
              <div className="item-receita-group" key={index}>
                <div className="form-group-inline">
                  <div className="form-group item-receita" style={{marginRight: '10px'}}>
                    <label htmlFor={`item-receita-${index+1}`}>Item-Receita:</label>
                    <input
                      type="text"
                      id={`item-receita-${index+1}`}
                      required
                      value={item.item}
                      onChange={(e) => handleItemChange(index, 'item', e.target.value)}
                    />
                  </div>
                  <div className="form-group kilograma-item" style={{marginRight: '10px'}}>
                    <label htmlFor={`kilograma-item-${index+1}`}>Kg:</label>
                    <input
                      type="text"
                      id={`kilograma-item-${index+1}`}
                      required
                      value={item.quantidade}
                      onChange={(e) => handleItemChange(index, 'quantidade', e.target.value)}
                    />
                  </div>
                  <div className="form-group icones-item">
                    <button type="button" className="adicionar-item" onClick={addItem}>
                      <span className="material-icons" style={{color: '#000000'}}>add_circle</span>
                    </button>
                    <button type="button" className="remover-item" onClick={() => removeItem(index)}>
                      <span className="material-icons" style={{color: '#ff0000'}}>delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="form-group">
            <label htmlFor="descricao">Descrição (máximo 150 caracteres):</label>
            <textarea
              id="descricao"
              name="descricao"
              rows={3}
              maxLength={150}
              required
              value={formData.descricao}
              onChange={handleChange}
            ></textarea>
            <div className="char-counter">
              <span id="descricao-counter">{formData.descricao.length}</span>/150
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="preco">Preço (R$):</label>
            <input
              type="number"
              id="preco"
              name="preco"
              step="0.01"
              min="0"
              required
              value={formData.preco}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="categoria">Categoria:</label>
            <select
              id="categoria"
              name="categoria"
              required
              value={formData.categoria}
              onChange={handleChange}
            >
              <option value="">Selecione uma categoria</option>
              <option value="café da manhã">café da manhã</option>
              <option value="finger food inicial">finger food inicial</option>
              <option value="Antepasto">Antepasto</option>
              <option value="Buffet americano">Buffet americano</option>
              <option value="Serviço à russa">Serviço à russa</option>
              <option value="brasileirinha">brasileirinha</option>
              <option value="inglesa direto">inglesa direto</option>
              <option value="inglesa indireto">inglesa indireto</option>
              <option value="À francesa">À francesa</option>
              <option value="empratados">empratados</option>
              <option value="sobremesas">sobremesas</option>
              <option value="finger food final">finger food final</option>
              <option value="marmitas">marmitas</option>
              <option value="congelados">congelados</option>
              <option value="doceria">doceria</option>
              <option value="salgadinhos">salgadinhos</option>
              <option value="churrasco">churrasco</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="imagem">Imagem do Produto:</label>
            <div className="file-upload">
              <input
                type="file"
                id="imagem"
                name="imagem"
                accept="image/*"
                required
                ref={fileInputRef}
                onChange={handleImageChange}
              />
              <label htmlFor="imagem" className="file-upload-label">
                <span className="file-upload-button">Escolher Arquivo</span>
                <span className="file-upload-text">
                  {fileInputRef.current?.files?.[0]?.name || 'Nenhum arquivo selecionado'}
                </span>
              </label>
              <div className="image-preview">
                {imagePreview.showDefault ? (
                  <span className="image-preview__default-text">Pré-visualização da imagem</span>
                ) : (
                  <img src={imagePreview.url} alt="Pré-visualização da imagem" className="image-preview__image" />
                )}
              </div>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="observacao">Observações (máximo 100 caracteres):</label>
            <textarea
              id="observacao"
              name="observacao"
              rows={2}
              maxLength={100}
              value={formData.observacao}
              onChange={handleChange}
            ></textarea>
            <div className="char-counter">
              <span id="observacao-counter">{formData.observacao.length}</span>/100
            </div>
          </div>
          
          <button type="submit">Cadastrar Produto</button>
        </form>
      </main>
    </>
  );
};

export default FormProduto;