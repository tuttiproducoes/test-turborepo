import React from 'react'
import ReactDOM from 'react-dom/client'
import FormProduto from './pages/FormProduto.tsx';
import "../../../packages/ui/styles/global.css";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FormProduto />
  </React.StrictMode>
)
