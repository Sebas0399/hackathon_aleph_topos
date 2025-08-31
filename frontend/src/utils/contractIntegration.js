import { ethers } from 'ethers'
import ProductTracerABI from './contracts/ProductTracer.json'
import contractAddress from './contracts/productTracer-address.json'

let provider
let contract

export const initializeContract = async () => {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask no está instalado')
  }
  
  try {
    provider = new ethers.BrowserProvider(window.ethereum)
    contract = new ethers.Contract(contractAddress.ProductTracer, ProductTracerABI.abi, provider)
    
    // Verificar que el contrato existe
    const code = await provider.getCode(contractAddress.ProductTracer)
    if (code === '0x') {
      throw new Error('El contrato no existe en esta red')
    }
    
    return { provider, contract }
  } catch (error) {
    console.error('Error inicializando contrato:', error)
    throw error
  }
}

export const registerProduct = async (metadataCID) => {
  try {
    console.log('🔗 Iniciando registerProduct...')
    console.log('📋 metadataCID recibido:', metadataCID)
    
    // Validar el CID
    if (!metadataCID || typeof metadataCID !== 'string' || metadataCID.trim() === '') {
      throw new Error('MetadataCID inválido o vacío')
    }
    
    // Asegurar que el contrato esté inicializado
    if (!provider || !contract) {
      console.log('⚠️ Inicializando contrato...')
      await initializeContract()
    }
    
    const signer = await provider.getSigner()
    const signerAddress = await signer.getAddress()
    const network = await provider.getNetwork()
    const contractAddress = await contract.getAddress()
    const balance = await provider.getBalance(signerAddress)
    
    console.log('👤 Signer address:', signerAddress)
    console.log('🌐 Network:', network.name, 'Chain ID:', network.chainId.toString())
    console.log('📍 Contract address:', contractAddress)
    console.log('💰 Balance:', ethers.formatEther(balance), 'ETH')
    
    // Verificar que el contrato tiene código
    const code = await provider.getCode(contractAddress)
    if (code === '0x') {
      throw new Error(`El contrato en ${contractAddress} no existe en la red ${network.name}`)
    }
    console.log('✅ Contrato verificado - tiene código')
    
    const contractWithSigner = contract.connect(signer)
    
    // Verificar que la función existe
    if (typeof contractWithSigner.createProduct !== 'function') {
      throw new Error('La función createProduct no existe en el contrato')
    }
    
    console.log('📡 Estimando gas...')
    try {
      const gasEstimate = await contractWithSigner.createProduct.estimateGas(metadataCID)
      console.log('⛽ Gas estimado:', gasEstimate.toString())
    } catch (gasError) {
      console.error('❌ Error estimando gas:', gasError)
      throw new Error(`Error en estimación de gas: ${gasError.message}`)
    }
    
    console.log('📤 Enviando transacción...')
    const tx = await contractWithSigner.createProduct(metadataCID)
    console.log('✅ Transacción enviada:', tx.hash)
    
    console.log('⏳ Esperando confirmación...')
    const receipt = await tx.wait()
    console.log('✅ Transacción confirmada:', receipt)
    console.log({
      productId: receipt.logs[0].args[0],
    })
    return {
      productId: receipt.logs[0].args[0],
      hash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    }
  } catch (error) {
    console.error('❌ Error registering product:', error)
    throw error
  }
}

export const addTraceEvent = async (productId, status, eventMetadataCID) => {
  try {
    const signer = await provider.getSigner()
    const contractWithSigner = contract.connect(signer)
    const tx = await contractWithSigner.addTraceEvent(productId, status, eventMetadataCID)
    await tx.wait()
    return tx.hash
  } catch (error) {
    console.error('Error adding trace event:', error)
    throw error
  }
}

export const getProductEvents = async (productId) => {
  try {
    if (!contract) {
      await initializeContract();
    }
    const events = await contract.getProductEvents(productId);
    return events;
  } catch (error) {
    console.error('Error getting product events:', error);
    throw error;
  }
}

export const getContractInfo = async () => {
  try {
    if (!provider || !contract) {
      await initializeContract()
    }
    
    const network = await provider.getNetwork()
    const address = await contract.getAddress()
    const signer = await provider.getSigner()
    const userAddress = await signer.getAddress()
    
    return {
      contractAddress: address,
      networkName: network.name,
      networkChainId: network.chainId.toString(),
      userAddress,
      isReady: true
    }
  } catch (error) {
    console.error('Error getting contract info:', error)
    return {
      isReady: false,
      error: error.message
    }
  }
}
export const getProduct = async (productId) => {
  try {
    if (!contract) {
      await initializeContract();
    }
    const product = await contract.products(productId);
    return product;
  } catch (error) {
    console.error('Error getting product:', error);
    throw error;
  }
}

// Inicializar el contrato cuando se carga el módulo
if (typeof window !== 'undefined') {
  // No inicializar automáticamente, solo cuando se necesite
  console.log('📜 Módulo contractIntegration cargado')
}