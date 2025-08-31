import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { uploadFileToStoracha, getStorachaStatus, resetStoracha } from '../utils/filecoinStorage-v2'
import { registerProduct } from '../utils/contractIntegration'

const ProductRegistration = ({ userAddress }) => {
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    producerName: '',
    batchNumber: '',
  })
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [storachaStatus, setStorachaStatus] = useState(null)
  const [lastUploadResult, setLastUploadResult] = useState(null)
  const { address } = useAccount()

  // Verificar estado de Storacha al cargar
  useEffect(() => {
    checkStorachaStatus()
  }, [])

  const checkStorachaStatus = async () => {
    try {
      const status = await getStorachaStatus()
      setStorachaStatus(status)
      console.log('📊 Estado de Storacha:', status)
    } catch (error) {
      console.error('❌ Error verificando estado:', error)
      setStorachaStatus({ error: error.message })
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setProductData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files)
    setFiles(selectedFiles)
    console.log('📁 Archivos seleccionados:', selectedFiles.map(f => f.name))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!address) {
      alert('Por favor conecta tu wallet primero')
      return
    }

    if (files.length === 0) {
      alert('Por favor selecciona al menos un archivo')
      return
    }

    setUploading(true)
    setLastUploadResult(null)

    try {
      console.log('🚀 Iniciando proceso de registro...')

      // Subir archivos a Storacha/Filecoin
      const uploadResults = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        console.log(`📤 Subiendo archivo ${i + 1}/${files.length}: ${file.name}`)
        
        const result = await uploadFileToStoracha(file)
        uploadResults.push({
          fileName: file.name,
          cid: result.cid,
          gatewayUrl: result.gatewayUrl
        })
        
        console.log('✅ Subido:', result)
      }

      // Crear metadata del producto
      const productMetadata = {
        ...productData,
        timestamp: new Date().toISOString(),
        files: uploadResults,
        producer: address
      }

      // Subir metadata como JSON
      console.log('📋 Subiendo metadata del producto...')
      const metadataBlob = new Blob([JSON.stringify(productMetadata, null, 2)], {
        type: 'application/json'
      })
      const metadataFile = new File([metadataBlob], 'product-metadata.json', {
        type: 'application/json'
      })

      const metadataResult = await uploadFileToStoracha(metadataFile)
      console.log('✅ Metadata subida:', metadataResult)

      // Registrar en blockchain
      console.log('⛓️  Registrando en blockchain...')
      const txResult = await registerProduct(
        productData.name,
        productData.description,
        productData.batchNumber,
        metadataResult.cid // CID de la metadata
      )

      console.log('✅ Producto registrado exitosamente!')
      
      setLastUploadResult({
        success: true,
        files: uploadResults,
        metadata: metadataResult,
        transaction: txResult
      })

      // Limpiar formulario
      setProductData({
        name: '',
        description: '',
        producerName: '',
        batchNumber: '',
      })
      setFiles([])

    } catch (error) {
      console.error('❌ Error en el proceso:', error)
      setLastUploadResult({
        success: false,
        error: error.message
      })
    } finally {
      setUploading(false)
    }
  }

  const handleResetStoracha = async () => {
    try {
      console.log('🔄 Reiniciando Storacha...')
      await resetStoracha()
      await checkStorachaStatus()
      console.log('✅ Reiniciado exitosamente')
    } catch (error) {
      console.error('❌ Error reiniciando:', error)
    }
  }

  return (
    <div className="product-registration">
      <h2>📦 Registro de Producto</h2>
      
      {/* Estado de Storacha */}
      <div className="storacha-status" style={{ 
        padding: '15px', 
        marginBottom: '20px', 
        borderRadius: '8px',
        backgroundColor: storachaStatus?.error ? '#ffe6e6' : '#e6f7ff'
      }}>
        <h3>🔧 Estado de Storacha</h3>
        {storachaStatus ? (
          <div>
            <p><strong>Cliente:</strong> {storachaStatus.clientInitialized ? '✅ Inicializado' : '❌ No inicializado'}</p>
            {storachaStatus.agentDID && (
              <p><strong>Agent DID:</strong> {storachaStatus.agentDID.substring(0, 30)}...</p>
            )}
            <p><strong>Espacio:</strong> {storachaStatus.hasSpace ? '✅ Configurado' : '❌ No configurado'}</p>
            {storachaStatus.configuredEmail && (
              <p><strong>Email:</strong> {storachaStatus.configuredEmail}</p>
            )}
            <p><strong>Autenticado:</strong> {storachaStatus.isAuthenticated ? '✅ Sí' : '⚠️ No'}</p>
            {storachaStatus.error && (
              <p style={{ color: 'red' }}><strong>Error:</strong> {storachaStatus.error}</p>
            )}
          </div>
        ) : (
          <p>🔄 Verificando...</p>
        )}
        <button 
          onClick={checkStorachaStatus} 
          style={{ marginRight: '10px' }}
        >
          🔄 Verificar Estado
        </button>
        <button onClick={handleResetStoracha}>
          🔄 Reiniciar Storacha
        </button>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Nombre del Producto:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={productData.name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Descripción:</label>
          <textarea
            id="description"
            name="description"
            value={productData.description}
            onChange={handleInputChange}
            rows="4"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="producerName">Nombre del Productor:</label>
          <input
            type="text"
            id="producerName"
            name="producerName"
            value={productData.producerName}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="batchNumber">Número de Lote:</label>
          <input
            type="text"
            id="batchNumber"
            name="batchNumber"
            value={productData.batchNumber}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="files">Archivos (imágenes, documentos, etc.):</label>
          <input
            type="file"
            id="files"
            multiple
            onChange={handleFileChange}
            accept="image/*,application/pdf,text/*"
          />
          {files.length > 0 && (
            <p>📁 {files.length} archivo(s) seleccionado(s)</p>
          )}
        </div>

        <button 
          type="submit" 
          disabled={uploading || !address}
          style={{
            padding: '12px 24px',
            backgroundColor: uploading ? '#ccc' : '#007cba',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: uploading ? 'not-allowed' : 'pointer'
          }}
        >
          {uploading ? '🔄 Procesando...' : '📤 Registrar Producto'}
        </button>
      </form>

      {/* Resultado de la última subida */}
      {lastUploadResult && (
        <div className="upload-result" style={{
          marginTop: '20px',
          padding: '15px',
          borderRadius: '8px',
          backgroundColor: lastUploadResult.success ? '#e6ffe6' : '#ffe6e6'
        }}>
          <h3>{lastUploadResult.success ? '✅ Éxito!' : '❌ Error'}</h3>
          
          {lastUploadResult.success ? (
            <div>
              <p><strong>🎉 Producto registrado exitosamente!</strong></p>
              
              <h4>📁 Archivos subidos:</h4>
              {lastUploadResult.files.map((file, index) => (
                <div key={index} style={{ marginBottom: '10px' }}>
                  <p><strong>{file.fileName}</strong></p>
                  <p>CID: {file.cid}</p>
                  <a href={file.gatewayUrl} target="_blank" rel="noopener noreferrer">
                    🔗 Ver archivo
                  </a>
                </div>
              ))}
              
              <h4>📋 Metadata:</h4>
              <p>CID: {lastUploadResult.metadata.cid}</p>
              <a href={lastUploadResult.metadata.gatewayUrl} target="_blank" rel="noopener noreferrer">
                🔗 Ver metadata
              </a>
              
              <h4>⛓️ Transacción:</h4>
              <p>Hash: {lastUploadResult.transaction.transactionHash}</p>
            </div>
          ) : (
            <div>
              <p><strong>Error:</strong> {lastUploadResult.error}</p>
              {lastUploadResult.error.includes('email') && (
                <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
                  <p><strong>💡 Sugerencia:</strong></p>
                  <p>• Revisa tu bandeja de entrada para confirmar el email de Storacha</p>
                  <p>• Configura un plan de pago en <a href="https://console.storacha.network" target="_blank">console.storacha.network</a></p>
                  <p>• O comenta VITE_STORACHA_EMAIL en tu .env para usar modo local</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ProductRegistration
