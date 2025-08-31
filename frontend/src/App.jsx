import React, { useState } from 'react'
import { WagmiConfig, createConfig, configureChains, sepolia } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { filecoin, filecoinCalibration } from 'wagmi/chains'
import WalletLogin from './components/WalletLogin'
import ProtectedRoute from './components/ProtectedRoute'
import ProductRegistrationNew from './components/ProductRegistrationNew'
import ProductQuery from './components/ProductQuery'
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

  return (
    <WagmiConfig config={config}>
      <div className="App">
        <header className="app-header">
          <h1>Sistema de Trazabilidad en Filecoin</h1>
          <WalletLogin onLogin={setUser} />
        </header>
        
        <main className="app-main">
          <ProtectedRoute user={user}>
            <section className="registration-section">
              <h2>Registro de Nuevo Producto</h2>
              <ProductRegistrationNew userAddress={user?.address} />
            </section>
          </ProtectedRoute>
          
          <section className="query-section">
            <h2>Consulta de Producto</h2>
            <ProductQuery />
          </section>
        </main>
      </div>
    </WagmiConfig>
  )
}

export default App