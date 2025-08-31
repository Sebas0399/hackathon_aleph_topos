// 🚀 ProductRegistration - Componente usando Lighthouse.storage
import { useState } from 'react'
import { uploadSingleFileLighthouse, getLighthouseTokenInfo } from '../utils/filecoinStorage.web3'
import { registerProduct, initializeContract, getContractInfo } from '../utils/contractIntegration'
import './ProductRegistrationNew.css'

export default function ProductRegistrationNew({ userAddress }) {
  const [product, setProduct] = useState({
    name: '',
    description: '',
    origin: '',
    file: null
  })
  
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [lighthouseStatus, setLighthouseStatus] = useState(null)
  const [contractStatus, setContractStatus] = useState(null)

  // 📋 Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setProduct(prev => ({ ...prev, [name]: value }))
  }

  // 📁 Manejar selección de archivo
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    setProduct(prev => ({ ...prev, file }))
    console.log('📁 Archivo seleccionado:', file?.name)
  }

  // 📊 Verificar estado de Lighthouse
  const checkLighthouseStatus = async () => {
    try {
      const info = await getLighthouseTokenInfo()
      setLighthouseStatus({ 
        isReady: true, 
        info,
        apiKey: !!import.meta.env.VITE_LIGHTHOUSE_API_KEY
      })
      console.log('📊 Estado de Lighthouse:', info)
    } catch (error) {
      console.error('❌ Error verificando Lighthouse:', error)
      setLighthouseStatus({ error: error.message })
    }
  }

  // 🔗 Verificar estado del contrato
  const checkContractStatus = async () => {
    try {
      console.log('📊 Verificando estado del contrato...')
      const info = await getContractInfo()
      setContractStatus(info)
      console.log('📊 Estado del contrato:', info)
    } catch (error) {
      console.error('❌ Error verificando contrato:', error)
      setContractStatus({ isReady: false, error: error.message })
    }
  }

  // 🚀 Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!userAddress) {
      alert('Por favor conecta tu wallet primero')
      return
    }
    
    if (!product.file) {
      alert('Por favor selecciona un archivo')
      return
    }

    if (!product.name.trim()) {
      alert('Por favor ingresa el nombre del producto')
      return
    }

    setUploading(true)
    setResult(null)

    try {
      console.log('🚀 Iniciando registro de producto:', product.name)
      
      // Paso 1: Subir archivo con Lighthouse.storage
      console.log('📡 Subiendo archivo con Lighthouse...')
      const lighthouseResult = await uploadSingleFileLighthouse(product.file)
      const fileCID = lighthouseResult.Hash
      const storageProvider = 'Lighthouse'
      
      console.log('✅ Archivo subido con Lighthouse:', fileCID)
      
      // Paso 2: Crear metadatos del producto
      const productData = {
        name: product.name,
        description: product.description,
        origin: product.origin,
        fileCID: fileCID,
        storageProvider,
        timestamp: new Date().toISOString(),
        creator: userAddress
      }

      // Paso 3: Subir metadatos a IPFS también
      console.log('📡 Subiendo metadatos del producto...')
      const metadataFile = new File(
        [JSON.stringify(productData, null, 2)], 
        `${product.name}-metadata.json`, 
        { type: 'application/json' }
      )
      const metadataResult = await uploadSingleFileLighthouse(metadataFile)
      console.log(metadataResult)
      const metadataCID = metadataResult
      
      console.log('✅ Metadatos subidos:', metadataCID)

      // Paso 4: Registrar en el smart contract
      console.log('🔗 Registrando en smart contract...')
      console.log('🔗 MetadataCID para contrato:', metadataCID)
      
      try {
        const contractResult = await registerProduct(metadataCID)
        console.log('✅ Producto registrado en blockchain:', contractResult)
        
        setResult({
          success: true,
          cid: fileCID,
          metadataCID,
          txHash: contractResult.hash || contractResult,
          blockNumber: contractResult.blockNumber,
          gasUsed: contractResult.gasUsed,
          productData,
          storageProvider,
          ipfsUrl: `https://w3s.link/ipfs/${fileCID}`,
          metadataUrl: `https://w3s.link/ipfs/${metadataCID}`,
          message: `Producto registrado exitosamente en blockchain y ${storageProvider}`
        })
        
      } catch (contractError) {
        console.error('❌ Error en smart contract:', contractError)
        // Aún mostramos el archivo subido pero indicamos el error del contrato
        setResult({
          success: false,
          cid: fileCID,
          metadataCID,
          error: `Archivo subido correctamente, pero falló el registro en blockchain: ${contractError.message}`,
          message: 'Error en registro de blockchain',
          partialSuccess: true
        })
      }

    } catch (error) {
      console.error('❌ Error en registro:', error)
      setResult({
        success: false,
        error: error.message,
        message: 'Error al registrar producto'
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="registration-container">
      <div className="registration-header">
        <h2>🏷️ Registro de Producto</h2>
        <p>Registra un producto en la blockchain con almacenamiento descentralizado</p>
        
        {/* Estado de la wallet */}
        <div className={`wallet-status ${userAddress ? 'connected' : 'disconnected'}`}>
          {userAddress ? (
            <>
              <span className="wallet-indicator">🟢</span>
              <span>Wallet conectada: {userAddress.slice(0, 6)}...{userAddress.slice(-4)}</span>
            </>
          ) : (
            <>
              <span className="wallet-indicator">🔴</span>
              <span>Wallet no conectada - Conecta tu wallet para continuar</span>
            </>
          )}
        </div>
      </div>

      {/* 📊 Estado de Lighthouse */}
      <div className="client-status">
        <div className="status-buttons">
          <button 
            onClick={checkLighthouseStatus}
            className="status-check-btn"
          >
            📊 Verificar Lighthouse
          </button>
          <button 
            onClick={checkContractStatus}
            className="status-check-btn"
          >
            🔗 Verificar Contrato
          </button>
        </div>
        
        {lighthouseStatus && (
          <div className={`status-info ${lighthouseStatus.error ? 'error' : 'success'}`}>
            <h4>🚀 Lighthouse.storage</h4>
            {lighthouseStatus.error ? (
              <p>❌ Error: {lighthouseStatus.error}</p>
            ) : (
              <>
                <p>✅ API Key: {lighthouseStatus.apiKey ? 'Configurada' : 'No configurada'}</p>
                {lighthouseStatus.info && (
                  <>
                    <p>💰 Balance: {lighthouseStatus.info.dataLimit} MB disponibles</p>
                    <p>📊 Uso: {lighthouseStatus.info.dataUsed} MB utilizados</p>
                  </>
                )}
              </>
            )}
          </div>
        )}
        
        {contractStatus && (
          <div className={`status-info ${contractStatus.error ? 'error' : 'success'}`}>
            <h4>🔗 Smart Contract</h4>
            {contractStatus.error ? (
              <p>❌ Error: {contractStatus.error}</p>
            ) : (
              <>
                <p>✅ Contrato: {contractStatus.isReady ? 'Listo' : 'No listo'}</p>
                <p>🌐 Red: {contractStatus.networkName} (Chain ID: {contractStatus.networkChainId})</p>
                <p>📍 Dirección: <code>{contractStatus.contractAddress}</code></p>
                <p>👤 Usuario: <code>{contractStatus.userAddress?.slice(0, 6)}...{contractStatus.userAddress?.slice(-4)}</code></p>
              </>
            )}
          </div>
        )}
      </div>

      {/*  Formulario */}
      <form onSubmit={handleSubmit} className="registration-form">
        <div className="form-group">
          <label htmlFor="name">🏷️ Nombre del Producto</label>
          <input
            type="text"
            id="name"
            name="name"
            value={product.name}
            onChange={handleInputChange}
            placeholder="Ej: Café Orgánico Premium"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">📝 Descripción</label>
          <textarea
            id="description"
            name="description"
            value={product.description}
            onChange={handleInputChange}
            placeholder="Describe las características del producto..."
            rows="3"
          />
        </div>

        <div className="form-group">
          <label htmlFor="origin">🌍 Origen</label>
          <input
            type="text"
            id="origin"
            name="origin"
            value={product.origin}
            onChange={handleInputChange}
            placeholder="Ej: Finca La Esperanza, Colombia"
          />
        </div>

        <div className="form-group">
          <label htmlFor="file">📁 Archivo de Evidencia</label>
          <input
            type="file"
            id="file"
            onChange={handleFileChange}
            accept="image/*,application/pdf,.doc,.docx"
          />
          {product.file && (
            <p className="file-info">
              📋 {product.file.name} ({Math.round(product.file.size / 1024)} KB)
            </p>
          )}
        </div>

        <button 
          type="submit" 
          className="submit-btn"
          disabled={uploading || !product.file || !product.name.trim() || !userAddress}
        >
          {uploading ? '⏳ Registrando en blockchain...' : 
           !userAddress ? '🔒 Conecta wallet para registrar' : 
           '🚀 Registrar Producto en Blockchain'}
        </button>
      </form>

      {/* 📊 Resultado */}
      {result && (
        <div className={`result ${result.success ? 'success' : 'error'}`}>
          <h3>{result.success ? '✅ Éxito' : '❌ Error'}</h3>
          <p>{result.message}</p>
          
          {result.success && (
            <div className="success-details">
              <p><strong>📋 Archivo CID:</strong> <code>{result.cid}</code></p>
              <p><strong>📄 Metadatos CID:</strong> <code>{result.metadataCID}</code></p>
              <p><strong>🔗 TX Hash:</strong> <code>{result.txHash}</code></p>
              <p><strong>🔧 Almacenado con:</strong> <span className="provider-badge">{result.storageProvider}</span></p>
              <div className="links-section">
                <p>
                  <strong>� Ver archivo:</strong>{' '}
                  <a href={result.ipfsUrl} target="_blank" rel="noopener noreferrer">
                    IPFS Link
                  </a>
                </p>
                <p>
                  <strong>📊 Ver metadatos:</strong>{' '}
                  <a href={result.metadataUrl} target="_blank" rel="noopener noreferrer">
                    Metadata Link
                  </a>
                </p>
              </div>
              <details className="product-data">
                <summary>📊 Datos del Producto</summary>
                <pre>{JSON.stringify(result.productData, null, 2)}</pre>
              </details>
            </div>
          )}
          
          {!result.success && (
            <div className="error-details">
              <p><strong>🐛 Error técnico:</strong> {result.error}</p>
              <details>
                <summary>💡 Posibles soluciones</summary>
                <ul>
                  <li>Verifica tu conexión a internet</li>
                  <li>Asegúrate de que el archivo no sea demasiado grande (&lt;100MB)</li>
                  <li>Confirma tu email si usas autenticación</li>
                  <li>Revisa la consola del navegador para más detalles</li>
                </ul>
              </details>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
