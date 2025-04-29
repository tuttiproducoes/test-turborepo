import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import ItensPage from './pages/ItensPage';
import OrcamentoPage from './pages/OrcamentoPage';

const router = createBrowserRouter([
  {
    path: "/",
    element: <ItensPage />,
  },
  {
    path: "/orcamento",
    element: <OrcamentoPage />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);