import React, { useState } from 'react'
import { getProductEvents, getProduct } from '../utils/contractIntegration'
// Recuperar metadatos JSON desde Lighthouse/IPFS
const fetchMetadataFromCID = async (cid) => {
  // Usar puerta de enlace pública IPFS
  const url = `https://w3s.link/ipfs/${cid}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('No se pudo recuperar el JSON desde IPFS/Lighthouse');
  return await response.json();
}

const ProductQuery = () => {
  const [productId, setProductId] = useState('')
  const [productData, setProductData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  // Estado para el modal de detalles de metadata
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDetails, setModalDetails] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalTitle, setModalTitle] = useState('');

  const handleSearch = async () => {
    if (!productId) return
    setLoading(true)
    setError(null)
    try {
      // Buscar eventos del producto en el contrato
      const eventsProductData = await getProduct(parseInt(productId))
      const events = await getProductEvents(parseInt(productId));

      if (!events || events.length === 0) {
        throw new Error('No se encontró el producto o no tiene eventos');
      }
      // Obtener el CID de metadatos del primer evento (creación)
      const metadataCID = events[0][3];
      console.log('Fetched metadataCID:', metadataCID);
      // Obtener metadatos JSON desde IPFS/Lighthouse
      const metadata = metadataCID ? await fetchMetadataFromCID(metadataCID) : null;
      const metadataProductData = await fetchMetadataFromCID(eventsProductData[2]);
      console.log('Fetched metadata:', metadata);
      setProductData({ metadata,metadataProductData, events });
    } catch (err) {
      console.error('Error fetching product data:', err);
      setError('No se encontró el producto o el ID es inválido');
      setProductData(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="product-query modern-form">
      <div className="search-box card">
        <input
          type="text"
          placeholder="ID"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="input"
        />
        <button onClick={handleSearch} disabled={loading} className="btn-primary">
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {productData && (
        <div className="product-details card">
          <h2 className="form-title">Información del Producto</h2>
          <div className="product-info">
            <p><strong>Nombre:</strong> {productData.metadataProductData.name}</p>
            <p><strong>Descripción:</strong> {productData.metadataProductData.description}</p>
            <p><strong>Productor:</strong> {productData.metadataProductData.producerName}</p>
            <p><strong>Fecha:</strong> {productData.metadataProductData.timestamp}</p>
          </div>

          <h3>Historial de Trazabilidad</h3>
          <div className="events-list">
            {productData.events.map((event, index) => {
              const eventTypes = {
                0: 'Created',
                1: 'Harvested',
                2: 'Processed',
                3: 'Shipped',
                4: 'Delivered'
              };
              const handleOpenModal = async () => {
                setModalOpen(true);
                setModalTitle(`Detalles de Metadata (${event[3]})`);
                setModalLoading(true);
                try {
                  const d = await fetchMetadataFromCID(event[3]);
                  setModalDetails(d);
                } catch {
                  setModalDetails(null);
                }
                setModalLoading(false);
              };
              return (
                <div key={index} className="event-item card">
                  <p><strong>Tipo de Evento:</strong> {eventTypes[event[1]] || event[1]}</p>
                  {/* <p><strong>Fecha:</strong> {new Date(event.timestamp * 1000).toLocaleString()}</p> */}
                  <p><strong>Por:</strong> {event[2]}</p>
                  <p>
                    <strong>CID Metadata:</strong> 
                    <button type="button" className="btn-link" onClick={handleOpenModal}>{event[3]}</button>
                  </p>
                </div>
              );
            })}
            {modalOpen && (
              <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                  <button className="modal-close" onClick={() => setModalOpen(false)}>&times;</button>
                  <h4>{modalTitle}</h4>
                  {modalLoading ? (
                    <span>Cargando detalles...</span>
                  ) : modalDetails ? (
                    <pre>{JSON.stringify(modalDetails, null, 2)}</pre>
                  ) : (
                    <span>No se pudo obtener los detalles.</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductQuery