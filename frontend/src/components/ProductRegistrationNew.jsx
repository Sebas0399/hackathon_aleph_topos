// 🚀 ProductRegistration - Componente usando Lighthouse.storage
import { useState, useEffect } from 'react'
import { uploadSingleFileLighthouse, getLighthouseTokenInfo } from '../utils/filecoinStorage.web3'
import { registerProduct, getContractInfo } from '../utils/contractIntegration'
import './ProductRegistrationNew.css'

export default function ProductRegistrationNew({ userAddress }) {
  const [product, setProduct] = useState({
    name: '',
    description: '',
    origin: '',
    // file: null, // Comentado: archivo
    lat: null,
    lng: null
  })
  const [locationLoading, setLocationLoading] = useState(false)
  // Obtener ubicación actual al cargar el componente
  useEffect(() => {
    setLocationLoading(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setProduct(prev => ({
            ...prev,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            origin: `${pos.coords.latitude},${pos.coords.longitude}`
          }))
          setLocationLoading(false)
        },
        (err) => {
          setLocationLoading(false)
        }
      )
    } else {
      setLocationLoading(false)
    }
  }, [])
  
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [lighthouseStatus, setLighthouseStatus] = useState(null)
  const [contractStatus, setContractStatus] = useState(null)

  // 📋 Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setProduct(prev => ({ ...prev, [name]: value }))
  }

  // const handleFileChange = (e) => {
  //   const file = e.target.files[0]
  //   setProduct(prev => ({ ...prev, file }))
  //   console.log('📁 Archivo seleccionado:', file?.name)
  // }

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
    
  // if (!product.file) {
  //   alert('Por favor selecciona un archivo')
  //   return
  // }

    if (!product.name.trim()) {
      alert('Por favor ingresa el nombre del producto')
      return
    }

    setUploading(true)
    setResult(null)

    try {
      console.log('🚀 Iniciando registro de producto:', product.name)
      
      // Paso 1: Crear metadatos del producto (sin archivo)
      const productData = {
        name: product.name,
        description: product.description,
        origin: product.origin,
        lat: product.lat,
        lng: product.lng,
        // fileCID: null, // Comentado: archivo
        // storageProvider: null, // Comentado: archivo
        timestamp: new Date().toISOString(),
        creator: userAddress
      }

      // Paso 2: Subir metadatos a IPFS
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

      // Paso 3: Registrar en el smart contract
      console.log('🔗 Registrando en smart contract...')
      console.log('🔗 MetadataCID para contrato:', metadataCID)
      
      try {
        const contractResult = await registerProduct(metadataCID)
        console.log('✅ Producto registrado en blockchain:', contractResult)
        
        setResult({
          success: true,
          metadataCID,
          txHash: contractResult.hash || contractResult,
          blockNumber: contractResult.blockNumber,
          gasUsed: contractResult.gasUsed,
          productData,
          metadataUrl: `https://w3s.link/ipfs/${metadataCID}`,
          productId: contractResult.productId || contractResult.id || null,
          message: `Producto registrado exitosamente en blockchain.`
        })
        
      } catch (contractError) {
        console.error('❌ Error en smart contract:', contractError)
        setResult({
          success: false,
          metadataCID,
          error: `Falló el registro en blockchain: ${contractError.message}`,
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
          <label htmlFor="origin">🌍 Ubicación actual</label>
          {locationLoading ? (
            <p>Obteniendo ubicación...</p>
          ) : product.lat && product.lng ? (
            <>
              <input
                type="text"
                id="origin"
                name="origin"
                value={product.origin}
                readOnly
              />
              <div style={{marginTop: '0.5em'}}>
                <iframe
                  title="map"
                  width="100%"
                  height="200"
                  frameBorder="0"
                  style={{border:0}}
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${product.lng-0.01}%2C${product.lat-0.01}%2C${product.lng+0.01}%2C${product.lat+0.01}&layer=mapnik&marker=${product.lat}%2C${product.lng}`}
                  allowFullScreen
                ></iframe>
                <div>
                  <a href={`https://www.openstreetmap.org/?mlat=${product.lat}&mlon=${product.lng}#map=18/${product.lat}/${product.lng}`} target="_blank" rel="noopener noreferrer">Ver mapa grande</a>
                </div>
              </div>
            </>
          ) : (
            <p>No se pudo obtener la ubicación.</p>
          )}
        </div>

        {/*
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
        */}

        <button 
          type="submit" 
          className="submit-btn"
          disabled={uploading|| !product.name.trim() || !userAddress}
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
              <p><strong>📄 Metadatos CID:</strong> <code>{result.metadataCID}</code></p>
              <p><strong>🔗 TX Hash:</strong> <code>{result.txHash}</code></p>
              <div className="links-section">
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
              {result.productId && (
                <div style={{marginTop: '1em'}}>
                  <strong>➡️ Generar eventos para este producto:</strong>
                  <br />
                  <a href={`/evento?productId=${result.productId}`}>Ir a eventos de trazabilidad</a>
                </div>
              )}
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
