import { configureChains, createConfig } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { filecoin, filecoinCalibration ,sepolia} from 'wagmi/chains'

// Configurar chains de Filecoin
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [filecoin, filecoinCalibration,sepolia],
  [publicProvider()],
)

// Crear configuración de Wagmi
export const config = createConfig({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
  ],
  publicClient,
  webSocketPublicClient,
})

export { chains }