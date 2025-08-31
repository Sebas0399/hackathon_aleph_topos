import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getProduct } from '../utils/contractIntegration'
import { addTraceEvent } from '../utils/contractIntegration'
import { uploadSingleFileLighthouse, getLighthouseTokenInfo } from '../utils/filecoinStorage.web3'

const TraceEventForm = ({ productId: propProductId }) => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const urlProductId = params.get('productId');
  const urlEventMetadataCID = params.get('eventMetadataCID');
  const productId = urlProductId || propProductId || '';

  const [status, setStatus] = useState('');
  const [eventMetadataCID, setEventMetadataCID] = useState(urlEventMetadataCID || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [productDetails, setProductDetails] = useState(null);
  const [productMetadata, setProductMetadata] = useState(null);
  // Helper para obtener metadatos desde IPFS/Lighthouse
  const fetchMetadataFromCID = async (cid) => {
    const url = `https://w3s.link/ipfs/${cid}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('No se pudo recuperar el JSON desde IPFS/Lighthouse');
    return await response.json();
  };
  const [locationLoading, setLocationLoading] = useState(false);
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);

  const statusOptions = [
    { value: 0, label: 'Created' },
    { value: 1, label: 'Harvested' },
    { value: 2, label: 'Processed' },
    { value: 3, label: 'Shipped' },
    { value: 4, label: 'Delivered' }
  ];

  // Obtener detalles del producto al cargar
  useEffect(() => {
    if (productId) {
      getProduct(parseInt(productId)).then(async product => {
        console.log('Detalles del producto:', product);
        if (product) {
          setProductDetails(product);
          // Si el producto tiene eventMetadataCID y no viene en la URL, usarlo como valor inicial
          if (product[2]) {
            setEventMetadataCID(product[2]);
          }
          if (product.metadataCID) {
            try {
              const metadata = await fetchMetadataFromCID(product.metadataCID);
              setProductMetadata(metadata);
            } catch {}
          }
        }
      }).catch(() => {});
    }
  }, [productId]);

  // Obtener ubicación actual
  useEffect(() => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
          setLocationLoading(false);
        },
        (err) => {
          setLocationLoading(false);
        }
      );
    } else {
      setLocationLoading(false);
    }
  }, []); // <-- Add this closing bracket and dependency array to properly close useEffect

  // Helper para subir metadata de evento a IPFS/Lighthouse
  // Importa uploadSingleFileLighthouse desde utils si no está
  // import { uploadSingleFileLighthouse } from '../utils/filecoinStorage-v2';
  const uploadEventMetadata = async (metadataObj) => {
    // Crear archivo JSON de metadata
    const metadataFile = new File(
      [JSON.stringify(metadataObj, null, 2)],
      `event-metadata.json`,
      { type: 'application/json' }
    );
    // Subir archivo a Lighthouse
    const metadataResult = await uploadSingleFileLighthouse(metadataFile);
    console.log('Uploaded event metadata:', metadataResult);
    // Si el resultado tiene .data.Hash, usarlo como CID
    return metadataResult
    throw new Error('No se pudo obtener el CID de la metadata del evento');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // Construir metadata de evento
      const eventTypes = {
        0: 'Created',
        1: 'Harvested',
        2: 'Processed',
        3: 'Shipped',
        4: 'Delivered'
      };
      const eventMetadata = {
        type: eventTypes[parseInt(status)] || status,
        origin: lat && lng ? { lat, lng } : null,
        creator: window.ethereum.selectedAddress || '',
        timestamp: Math.floor(Date.now() / 1000)
      };
      // Subir metadata a IPFS/Lighthouse y obtener CID
      const cid = await uploadEventMetadata(eventMetadata);
      setEventMetadataCID(cid);
      // Guardar evento en el contrato
      const txHash = await addTraceEvent(
        parseInt(productId),
        parseInt(status),
        cid,
        lat,
        lng
      );
      setResult(txHash);
    } catch (err) {
      setError('Error al agregar el evento: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="trace-event-form modern-form">
      <h2 className="form-title">Agregar Evento de Trazabilidad</h2>
      <div className="product-details card">
        <strong>Detalles del Producto (Metadata):</strong>
        {productMetadata ? (
          <pre className="metadata-json">{JSON.stringify(productMetadata, null, 2)}</pre>
        ) : (
          <p>Cargando metadata...</p>
        )}
      </div>
      <form onSubmit={handleSubmit} className="form-content">
        <div className="form-group">
          <label>ID del Producto</label>
          <input
            type="number"
            value={productId}
            disabled
            className="input"
          />
        </div>
        <div className="form-group">
          <label>Estado</label>
          <select value={status} onChange={e => setStatus(e.target.value)} required className="input">
            <option value="">Selecciona estado</option>
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Metadata CID del Evento</label>
          {eventMetadataCID ? (
            <span className="cid-value">{eventMetadataCID}</span>
          ) : (
            <input
              type="text"
              value={eventMetadataCID}
              onChange={e => setEventMetadataCID(e.target.value)}
              placeholder="CID del evento (baf...)"
              required
              className="input"
            />
          )}
        </div>
        <div className="form-group">
          <label>Ubicación actual</label>
          {locationLoading ? (
            <p>Obteniendo ubicación...</p>
          ) : lat && lng ? (
            <>
              <input type="text" value={`${lat},${lng}`} readOnly className="input" />
              <div className="map-container">
                <iframe
                  title="map"
                  width="100%"
                  height="200"
                  frameBorder="0"
                  style={{border:0}}
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01}%2C${lat-0.01}%2C${lng+0.01}%2C${lat+0.01}&layer=mapnik&marker=${lat}%2C${lng}`}
                  allowFullScreen
                ></iframe>
                <div>
                  <a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`} target="_blank" rel="noopener noreferrer">Ver mapa grande</a>
                </div>
              </div>
            </>
          ) : (
            <p>No se pudo obtener la ubicación.</p>
          )}
        </div>
        <button type="submit" disabled={loading || !status || !eventMetadataCID} className="btn-primary">
          {loading ? 'Enviando...' : 'Agregar Evento'}
        </button>
      </form>
      {result && <div className="success">Evento agregado. TX Hash: <code>{result}</code></div>}
      {error && <div className="error">{error}</div>}
    </div>
  );
}

export default TraceEventForm;
