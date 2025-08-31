// 🌊 Implementación usando Lighthouse.storage (recomendado por Filecoin docs)
// Ref: https://docs.filecoin.io/builder-cookbook/data-storage/store-data
// Lighthouse provee agregación automática de deals y RaaS (Replication, Renewal, Repair)

const LIGHTHOUSE_UPLOAD_URL = 'https://node.lighthouse.storage/api/v0/add'
const LIGHTHOUSE_STATUS_URL = 'https://api.lighthouse.storage/api/lighthouse/file_info'
const UPLOAD_TIMEOUT_MS = 2 * 60 * 1000 // 2 minutos

const getLighthouseToken = () => {
  return import.meta.env.VITE_LIGHTHOUSE_API_KEY || null
}

// Helper: do fetch with timeout and AbortController
const fetchWithTimeout = async (url, options = {}, timeout = UPLOAD_TIMEOUT_MS) => {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, { signal: controller.signal, ...options })
    clearTimeout(id)
    return res
  } catch (err) {
    clearTimeout(id)
    throw err
  }
}

export const uploadSingleFileLighthouse = async (file) => {
  const apiKey = getLighthouseToken()
  if (!apiKey) throw new Error('VITE_LIGHTHOUSE_API_KEY no configurado en .env')

  try {
    console.log('� Subiendo a Lighthouse.storage:', file.name)

    const formData = new FormData()
    formData.append('file', file)

    const response = await fetchWithTimeout(LIGHTHOUSE_UPLOAD_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Lighthouse upload failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const result = await response.json()
    
    // Respuesta esperada: { Name: "file.txt", Hash: "QmXXX", Size: "12345" }
    const cid = result.Hash
    if (!cid) throw new Error('No Hash/CID en respuesta de Lighthouse: ' + JSON.stringify(result))

    console.log('✅ Lighthouse CID:', cid)
    console.log('📊 Archivo info:', { name: result.Name, size: result.Size })
    
    return cid
  } catch (err) {
    console.error('❌ Error subiendo a Lighthouse:', err)
    throw err
  }
}

export const uploadMultipleFilesLighthouse = async (filesArray) => {
  const apiKey = getLighthouseToken()
  if (!apiKey) throw new Error('VITE_LIGHTHOUSE_API_KEY no configurado en .env')

  try {
    console.log('� Subiendo directorio a Lighthouse, archivos:', filesArray.length)

    const formData = new FormData()
    filesArray.forEach((file) => {
      formData.append('file', file)
    })

    const response = await fetchWithTimeout(LIGHTHOUSE_UPLOAD_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Lighthouse upload failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const result = await response.json()
    
    // Para múltiples archivos, puede retornar array o CID del directorio
    const cid = Array.isArray(result) ? result[0]?.Hash : result.Hash
    if (!cid) throw new Error('No CID en respuesta de Lighthouse: ' + JSON.stringify(result))

    console.log('✅ Lighthouse directory CID:', cid)
    return cid
  } catch (err) {
    console.error('❌ Error subiendo directorio a Lighthouse:', err)
    throw err
  }
}

// 📊 Función para verificar el estado de un archivo en Lighthouse
export const getLighthouseFileStatus = async (cid) => {
  try {
    const response = await fetch(`${LIGHTHOUSE_STATUS_URL}?cid=${cid}`)
    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (err) {
    console.warn('⚠️ No se pudo obtener status de Lighthouse:', err.message)
    return null
  }
}

export const getLighthouseTokenInfo = () => {
  const token = getLighthouseToken()
  return { hasToken: !!token }
}

// Función con RaaS (Replication, Renewal, Repair) automático
export const uploadWithRaaS = async (file, raasSConfig = {}) => {
  const apiKey = getLighthouseToken()
  if (!apiKey) throw new Error('VITE_LIGHTHOUSE_API_KEY no configurado en .env')

  // Configuración por defecto de RaaS
  const dealParams = {
    num_copies: raasSConfig.copies || 2,
    repair_threshold: raasSConfig.repairThreshold || 28800, // ~10 días en epochs
    renew_threshold: raasSConfig.renewThreshold || 28800,   // ~10 días en epochs  
    network: 'calibration', // o 'mainnet'
    ...raasSConfig
  }

  try {
    console.log('🌊 Subiendo con RaaS a Lighthouse:', file.name, dealParams)

    const formData = new FormData()
    formData.append('file', file)
    
    // Agregar parámetros de deal como form data
    Object.entries(dealParams).forEach(([key, value]) => {
      formData.append(key, String(value))
    })

    const response = await fetchWithTimeout(LIGHTHOUSE_UPLOAD_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Lighthouse RaaS upload failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const result = await response.json()
    const cid = result.Hash
    if (!cid) throw new Error('No CID en respuesta de Lighthouse RaaS: ' + JSON.stringify(result))

    console.log('✅ Lighthouse RaaS CID:', cid)
    console.log('🔄 RaaS config aplicada:', dealParams)
    
    return { cid, raasSConfig: dealParams, fileInfo: result }
  } catch (err) {
    console.error('❌ Error subiendo con RaaS a Lighthouse:', err)
    throw err
  }
}

// Alias compatible con la API existente
export const storeFileLighthouse = async (file) => uploadSingleFileLighthouse(file)

export default {
  uploadSingleFileLighthouse,
  uploadMultipleFilesLighthouse,
  uploadWithRaaS,
  storeFileLighthouse,
  getLighthouseFileStatus,
  getLighthouseTokenInfo
}
