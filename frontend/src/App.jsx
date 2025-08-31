import React, { useState } from 'react'
import { WagmiConfig, createConfig, configureChains, sepolia } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { filecoin, filecoinCalibration } from 'wagmi/chains'
import WalletLogin from './components/WalletLogin'
import ProtectedRoute from './components/ProtectedRoute'
import ProductRegistrationNew from './components/ProductRegistrationNew'
import ProductQuery from './components/ProductQuery'
import TraceEventForm from './components/TraceEventForm'
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom'
import { getSession } from './utils/sessionManager'
import './App.css'

// Configurar chains de Filecoin
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [filecoin, filecoinCalibration, sepolia],
  [publicProvider()],
)

// Crear configuración de Wagmi
const config = createConfig({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
  ],
  publicClient,
  webSocketPublicClient,
})

function App() {
  const [user, setUser] = useState(getSession())

    const [selectedProductId, setSelectedProductId] = useState('')

    return (
      <WagmiConfig config={config}>
        <Router>
          <div className="App">
            <header className="app-header navbar">
              <div className="navbar-brand">
                <span>Sistema de Trazabilidad en Filecoin</span>
              </div>
              <nav className="navbar-menu">
                <Link to="/registro" className="tab-link">Registro</Link>
                <Link to="/consulta" className="tab-link">Consulta</Link>
                <Link to="/evento" className="tab-link">Evento</Link>
              </nav>
              <div className="navbar-user">
                <WalletLogin onLogin={setUser} />
              </div>
            </header>
            <main className="app-main">
              <Routes>
                <Route path="/registro" element={
                  <section className="registration-section">
                    <ProductRegistrationNew userAddress={user?.address} />
                  </section>
                } />
                <Route path="/consulta" element={
                  <section className="query-section">
                    <ProductQuery />
                  
                  </section>
                } />
                <Route path="/evento" element={
                  <section className="event-section">
                    <TraceEventForm productId={selectedProductId} />
                  </section>
                } />
                <Route path="*" element={<div>Selecciona una opción en las pestañas.</div>} />
              </Routes>
            </main>
          </div>
        </Router>
      </WagmiConfig>
    )
}

export default App