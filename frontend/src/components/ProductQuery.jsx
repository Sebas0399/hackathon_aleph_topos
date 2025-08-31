import React, { useState } from 'react'
import { getProductEvents } from '../utils/contractIntegration'
import { retrieveJSON } from '../utils/filecoinStorage'

const ProductQuery = () => {
  const [productId, setProductId] = useState('')
  const [productData, setProductData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSearch = async () => {
    if (!productId) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Obtener eventos del contrato
      const events = await getProductEvents(parseInt(productId))
      
      if (events.length === 0) {
        throw new Error('No se encontró el producto')
      }
      
      // Obtener metadata del primer evento (creación)
      const creationEvent = events[0]
      const metadata = await retrieveJSON(creationEvent.metadataCID)
      
      setProductData({
        metadata,
        events
      })
    } catch (err) {
      setError(err.message)
      setProductData(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="product-query">
      <div className="search-box">
        <input
          type="number"
          placeholder="ID del Producto"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {productData && (
        <div className="product-details">
          <h3>Información del Producto</h3>
          <div className="product-info">
            <p><strong>Nombre:</strong> {productData.metadata.name}</p>
            <p><strong>Descripción:</strong> {productData.metadata.description}</p>
            <p><strong>Productor:</strong> {productData.metadata.producerName}</p>
            <p><strong>Lote:</strong> {productData.metadata.batchNumber}</p>
          </div>

          <h3>Historial de Trazabilidad</h3>
          <div className="events-list">
            {productData.events.map((event, index) => (
              <div key={index} className="event-item">
                <p><strong>Evento:</strong> {event.status}</p>
                <p><strong>Fecha:</strong> {new Date(event.timestamp * 1000).toLocaleString()}</p>
                <p><strong>Por:</strong> {event.actor.substring(0, 8)}...</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductQuery