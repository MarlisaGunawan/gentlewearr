import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { CartProvider } from './context/CartContext';
import { loadRemoteData } from './services/remoteData';
import './styles/global.css';
import './styles/nav.css';
import './styles/hero.css';
import './styles/landing.css';
import './styles/footer.css';
import './styles/shop.css';
import './styles/cart.css';
import './styles/checkout.css';

// Load live products + CMS content from the Laravel API first (falls back to demo data).
loadRemoteData().finally(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <BrowserRouter>
        <CartProvider>
          <App />
        </CartProvider>
      </BrowserRouter>
    </StrictMode>
  );
});
