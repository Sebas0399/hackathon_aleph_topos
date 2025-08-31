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
  const [progress, setProgress] = useState(0)
  const [storachaReady, setStorachaReady] = useState(false)
  const [spaceInfo, setSpaceInfo] = useState(null)
  const [connectionError, setConnectionError] = useState(null)
  const { address } = useAccount()

  // Probar conexión con Storacha al montar el componente
  useEffect(() => {
    const checkStorachaConnection = async () => {
      try {
        await testStorachaConnection()
        const info = await getSpaceInfo()
        setSpaceInfo(info)
        setStorachaReady(true)
        setConnectionError(null)
        console.log('Storacha está listo para usar')
      } catch (error) {
        console.error('Problema con Storacha:', error)
        setStorachaReady(false)
        setSpaceInfo(null)
        setConnectionError(error.message)
      }
    }
    
    checkStorachaConnection()
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setProductData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    console.log('Archivos seleccionados:', selectedFiles);
    
    // Validar archivos antes de establecerlos
    const validFiles = selectedFiles.filter(file => {
      if (!file) {
        console.warn('Archivo indefinido encontrado');
        return false;
      }
      if (!file.name || file.name.trim() === '') {
        console.warn('Archivo sin nombre encontrado');
        return false;
      }
      if (file.size === 0) {
        console.warn(`Archivo vacío encontrado: ${file.name}`);
        return false;
      }
      return true;
    });
    
    setFiles(validFiles);
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setUploading(true)
    setProgress(0)

    try {
      // Validar conexión con Storacha primero
      if (!storachaReady) {
        throw new Error('Storacha no está configurado correctamente. Revisa tu token en el archivo .env');
      }
      
      // Validar que todos los campos requeridos estén completos
      if (!productData.name || !productData.description || !productData.producerName || !productData.batchNumber) {
        throw new Error('Todos los campos son requeridos');
      }
      
      if (!userAddress && !address) {
        throw new Error('No se pudo obtener la dirección de la wallet');
      }
      
      // Subir archivos a Filecoin (solo si hay archivos)
      const fileCIDs = {}
      if (files && files.length > 0) {
        console.log('Subiendo archivos:', files);
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          console.log(`Subiendo archivo ${i + 1}/${files.length}:`, file.name);
          setProgress((i / files.length) * 50)
          
          const cid = await storeFile(file)
          fileCIDs[file.name] = `ipfs://${cid}`
        }
      }

      // Crear metadata
      setProgress(60)
      const metadata = {
        name: productData.name,
        description: productData.description,
        producerName: productData.producerName,
        batchNumber: productData.batchNumber,
        producerAddress: userAddress || address,
        images: Object.values(fileCIDs).filter(url => 
          url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
        ),
        documents: Object.values(fileCIDs).filter(url => 
          url.match(/\.(pdf|doc|docx|txt)$/i)
        ),
        timestamp: new Date().toISOString()
      }
      
      console.log('Metadata creada:', metadata);

      // Subir metadata a Filecoin
      setProgress(80)
      const metadataCID = await storeJSON(metadata)

      // Registrar en blockchain
      setProgress(90)
      const txHash = await registerProduct(metadataCID)

      setProgress(100)
      alert(`Producto registrado exitosamente!\nCID: ${metadataCID}\nTX: ${txHash}`)
      
      // Reset form
      setProductData({
        name: '',
        description: '',
        producerName: '',
        batchNumber: '',
      })
      setFiles([])
    } catch (error) {
      console.error('Error registering product:', error)
      alert('Error al registrar el producto: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      {/* Indicador de estado de Storacha */}
      <div className={`storacha-status ${storachaReady ? 'ready' : 'not-ready'}`}>
        <div>
          <span>Estado de Storacha: </span>
          {storachaReady ? (
            <span style={{color: 'green'}}>✅ Conectado</span>
          ) : (
            <span style={{color: 'red'}}>❌ Error de conexión</span>
          )}
        </div>
        
        {connectionError && (
          <div style={{fontSize: '12px', marginTop: '4px', color: '#d32f2f', backgroundColor: '#ffebee', padding: '8px', borderRadius: '4px'}}>
            <strong>Error:</strong> {connectionError}
            {connectionError.includes('token') && (
              <div style={{marginTop: '4px'}}>
                ⚠️ <strong>Nota:</strong> Storacha ya NO usa API tokens. Usa email o espacio local.
              </div>
            )}
            {connectionError.includes('email') && (
              <div style={{marginTop: '4px'}}>
                💡 <strong>Solución:</strong> Configura VITE_STORACHA_EMAIL o deja que use espacio local.
              </div>
            )}
          </div>
        )}
        
        {spaceInfo && spaceInfo.hasSpace && (
          <div style={{fontSize: '12px', marginTop: '4px', color: '#666'}}>
            🏠 Espacio activo: {spaceInfo.spaceDID.substring(0, 20)}...
          </div>
        )}
        {storachaReady && (!spaceInfo || !spaceInfo.hasSpace) && (
          <div style={{fontSize: '12px', marginTop: '4px', color: '#888'}}>
            ℹ️  Usando espacio local (sin recovery entre dispositivos)
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="product-form">
      <div className="form-group">
        <label>Nombre del Producto:</label>
        <input
          type="text"
          name="name"
          value={productData.name}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Descripción:</label>
        <textarea
          name="description"
          value={productData.description}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Nombre del Productor:</label>
        <input
          type="text"
          name="producerName"
          value={productData.producerName}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Número de Lote:</label>
        <input
          type="text"
          name="batchNumber"
          value={productData.batchNumber}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Archivos (Imágenes/Documentos):</label>
        <input
          type="file"
          multiple
          onChange={handleFileChange}
        />
      </div>

      <button 
        type="submit" 
        disabled={uploading || !storachaReady}
        className="submit-button"
      >
        {uploading ? `Subiendo... ${progress}%` : 'Registrar Producto'}
      </button>
    </form>
    </div>
  )
}

export default ProductRegistration