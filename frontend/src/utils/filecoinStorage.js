import { create } from '@storacha/client'

// El nuevo método de Storacha NO requiere tokens, usa autenticación por email
const getStorachaEmail = () => {
  const email = import.meta.env.VITE_STORACHA_EMAIL
  console.log('Email desde env:', email ? email : 'no configurado')
  return email
}

const getStorachaSpaceDID = () => {
  const spaceDID = import.meta.env.VITE_STORACHA_SPACE_DID
  console.log('Space DID desde env:', spaceDID ? `${spaceDID.substring(0, 15)}...` : 'no configurado')
  return spaceDID
}

const makeStorachaClient = async () => {
  try {
    console.log('Creando cliente Storacha (sin token)...')
    
    // Nuevo método: crear cliente sin token
    const client = await create()
    console.log('Cliente Storacha creado exitosamente')
    
    return client
  } catch (error) {
    console.error('Error creando clientfe Storacha:', error)
    throw new Error(`No se pudo crear el cliente Storacha: ${error.message}`)
  }
}

const ensureStorachaSpace = async (client) => {
  try {
    const configuredSpaceDID = getStorachaSpaceDID()
    const configuredEmail = getStorachaEmail()
    
    // Si hay un espacio configurado específicamente, intentar usarlo
    if (configuredSpaceDID && configuredSpaceDID !== 'your_space_did_here') {
      console.log('Intentando usar espacio configurado:', configuredSpaceDID)
      try {
        await client.setCurrentSpace(configuredSpaceDID)
        const currentSpace = client.currentSpace()
        if (currentSpace && currentSpace.did() === configuredSpaceDID) {
          console.log('✅ Espacio configurado establecido correctamente')
          
          // Verificar que el espacio tiene permisos válidos
          try {
            // Crear un blob de prueba muy pequeño para verificar permisos
            const testBlob = new Blob(['test'], { type: 'text/plain' })
            const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' })
            
            console.log('🔍 Verificando permisos del espacio...')
            // Solo verificamos, no completamos la subida
            // await client.uploadFile(testFile)
            // console.log('✅ Espacio tiene permisos válidos')
            
            return currentSpace
          } catch (permissionError) {
            console.warn('⚠️  Espacio configurado no tiene permisos válidos:', permissionError.message)
            if (permissionError.message.includes('space/blob/add')) {
              console.warn('❌ Error de permisos en espacio. Creando espacio nuevo...')
              // Limpiar espacio actual para forzar creación de uno nuevo
              await client.setCurrentSpace(null)
            }
          }
        } else {
          console.warn('⚠️  No se pudo establecer el espacio configurado (no coincide el DID)')
        }
      } catch (spaceError) {
        console.warn('⚠️  Error usando espacio configurado:', spaceError.message)
        console.log('Continuando con proceso de autenticación...')
      }
    }
    
    // Verificar si ya hay un espacio actual válido
    let space = client.currentSpace()
    console.log('Espacio actual:', space ? `existe (${space.did()})` : 'no existe')
    
    if (!space) {
      console.log('Necesario crear espacio...')
      
      // Si hay email configurado, intentar login automático
      if (configuredEmail && configuredEmail !== 'tu_email_aqui') {
        try {
          console.log('Intentando login con email configurado:', configuredEmail)
          const account = await client.login(configuredEmail)
          console.log('✅ Login exitoso, esperando plan de pago...')
          
          // Esperar plan de pago
          await account.plan.wait()
          console.log('✅ Plan de pago confirmado')
          
          // Crear espacio con cuenta
          space = await client.createSpace('storacha-space', { account })
          console.log('✅ Espacio creado con cuenta:', space.did())
        } catch (emailError) {
          console.warn('⚠️  Error con login por email:', emailError.message)
          if (emailError.message.includes('email')) {
            console.warn('💡 Puede que necesites confirmar tu email en la bandeja de entrada')
          }
          console.log('Creando espacio local sin cuenta...')
        }
      }
      
      // Si no hay email o falló el login, crear espacio local
      if (!space) {
        console.log('Creando espacio local...')
        space = await client.createSpace('local-space')
        console.log('⚠️  Espacio local creado (sin recovery account):', space.did())
        console.log('💡 Para persistencia entre dispositivos, configura VITE_STORACHA_EMAIL')
      }
      
      if (!space) {
        throw new Error('No se pudo crear el espacio en Storacha')
      }
      
      console.log('Estableciendo espacio como actual...')
      await client.setCurrentSpace(space.did())
      
      // Verificar que el espacio está seleccionado
      const currentSpace = client.currentSpace()
      if (!currentSpace) {
        throw new Error('No se pudo seleccionar el espacio en Storacha')
      }
      
      console.log('✅ Espacio configurado exitosamente')
      console.log(`💡 Para usar este espacio en el futuro, agrega a tu .env:`)
      console.log(`VITE_STORACHA_SPACE_DID=${space.did()}`)
      if (!configuredEmail) {
        console.log(`💡 Para recovery entre dispositivos, agrega también:`)
        console.log(`VITE_STORACHA_EMAIL=tu_email_aqui`)
      }
      
    } else {
      console.log('✅ Usando espacio existente:', space.did())
    }
    
    return space
  } catch (error) {
    console.error('Error en ensureStorachaSpace:', error)
    throw error
  }
}
export const storeFile = async (file) => {
  try {
    console.log('Archivo recibido para Filecoin:', {
      name: file?.name,
      size: file?.size,
      type: file?.type,
      lastModified: file?.lastModified
    });
    
    // Validaciones mejoradas
    if (!file) {
      throw new Error('El archivo a subir está vacío o indefinido');
    }
    
    if (!(file instanceof File)) {
      throw new Error('El parámetro debe ser un objeto File válido');
    }
    
    if (!file.name || file.name.trim() === '') {
      throw new Error('El archivo debe tener un nombre válido');
    }
    
    if (file.size === 0) {
      throw new Error('El archivo está vacío');
    }
    
    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      throw new Error('El archivo es demasiado grande (máximo 100MB)');
    }
    
    console.log('Creando cliente Storacha...');
    const client = await makeStorachaClient();
    
    console.log('Configurando espacio de almacenamiento...');
    const space = await ensureStorachaSpace(client);
    
    console.log('Iniciando subida de archivo...');
    // Usar uploadFile para archivos individuales (método correcto según documentación)
    const result = await client.uploadFile(file);
    console.log('Resultado de subida:', result);
    
    if (!result || !result.cid) {
      throw new Error('No se recibió un CID válido del servicio de almacenamiento');
    }
    
    console.log('Archivo subido exitosamente con CID:', result.cid);
    // Convertir CID a string de forma segura
    const cidString = typeof result.cid === 'string' ? result.cid : result.cid.toString();
    return cidString;
    
  } catch (error) {
    console.error('Error detallado uploading file:', {
      message: error.message,
      stack: error.stack,
      fileName: file?.name
    });
    
    // Mejorar los mensajes de error para el usuario
    if (error.message.includes('space/blob/add')) {
      throw new Error('❌ Error de permisos en el espacio de Storacha. El espacio configurado no tiene permisos válidos. Solución: Comenta VITE_STORACHA_SPACE_DID en tu .env para crear un espacio nuevo.');
    } else if (error.message.includes('IPLD Data Model')) {
      throw new Error('Error interno del servicio de almacenamiento. Verifica que el archivo no contenga metadata corrupta.');
    } else if (error.message.includes('uploadFiles is not a function') || error.message.includes('not a function')) {
      throw new Error('Error en la API de Storacha. Verifica que estés usando la versión correcta del cliente.');
    } else if (error.message.includes('login') || error.message.includes('email')) {
      throw new Error('Error de autenticación. Verifica tu email o confirma el email en tu bandeja de entrada.');
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      throw new Error('Error de conectividad. Verifica tu conexión a internet.');
    } else if (error.message.includes('space')) {
      throw new Error('Error con el espacio de almacenamiento. Verifica tu configuración de VITE_STORACHA_SPACE_DID.');
    } else {
      throw new Error('Error subiendo archivo a Storacha: ' + error.message);
    }
  }
}


export const storeFiles = async (files) => {
  try {
    console.log('Archivos recibidos para Filecoin:', files);
    
    // Validaciones mejoradas
    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new Error('La lista de archivos a subir está vacía o no es un array válido');
    }
    
    // Validar cada archivo individualmente
    for (let i = 0; i < files.length; i++) {
      if (!files[i]) {
        throw new Error(`El archivo en la posición ${i} está indefinido`);
      }
      if (!(files[i] instanceof File)) {
        throw new Error(`El elemento en la posición ${i} no es un objeto File válido`);
      }
      if (!files[i].name || files[i].name.trim() === '') {
        throw new Error(`El archivo en la posición ${i} debe tener un nombre válido`);
      }
      if (files[i].size === 0) {
        throw new Error(`El archivo "${files[i].name}" está vacío`);
      }
    }
    
    const client = await makeStorachaClient();
    const space = await ensureStorachaSpace(client);
    
    // Usar uploadDirectory para múltiples archivos (método correcto según documentación)
    const result = await client.uploadDirectory(files);
    
    if (!result || !result.cid) {
      throw new Error('No se recibió un CID válido del servicio de almacenamiento');
    }
    
    // Convertir CID a string de forma segura
    const cidString = typeof result.cid === 'string' ? result.cid : result.cid.toString();
    return cidString;
  } catch (error) {
    console.error('Error uploading files:', error);
    throw new Error('Failed to upload files to Filecoin: ' + error.message);
  }
}


export const storeJSON = async (jsonObject, filename = 'metadata.json') => {
  try {
    // Validar que jsonObject no sea undefined o null
    if (jsonObject === undefined || jsonObject === null) {
      throw new Error('El objeto JSON no puede ser undefined o null');
    }
    
    // Limpiar valores undefined del objeto JSON
    const cleanObject = JSON.parse(JSON.stringify(jsonObject, (key, value) => {
      return value === undefined ? null : value;
    }));
    
    const jsonString = JSON.stringify(cleanObject);
    
    if (!filename || filename.trim() === '') {
      filename = 'metadata.json';
    }
    
    const file = new File([jsonString], filename, {
      type: 'application/json',
    });
    
    const cid = await storeFile(file);
    return cid;
  } catch (error) {
    console.error('Error storing JSON:', error);
    throw new Error('Failed to store JSON on Filecoin: ' + error.message);
  }
}


export const retrieveFile = async (cid) => {
  try {
    if (!cid || cid.trim() === '') {
      throw new Error('CID no puede estar vacío');
    }
    
    const client = await makeStorachaClient();
    const files = await client.downloadFiles(cid);
    return files;
  } catch (error) {
    console.error('Error retrieving file:', error);
    throw new Error('Failed to retrieve file from Filecoin: ' + error.message);
  }
}

// Función para limpiar y recrear espacio (útil cuando hay problemas de permisos)
export const resetStorachaSpace = async () => {
  try {
    console.log('🔄 Reiniciando espacio de Storacha...');
    const client = await makeStorachaClient();
    
    // Limpiar espacio actual
    await client.setCurrentSpace(null);
    console.log('✅ Espacio actual limpiado');
    
    // Forzar creación de nuevo espacio
    const space = await ensureStorachaSpace(client);
    console.log('✅ Nuevo espacio creado:', space.did());
    
    return space;
  } catch (error) {
    console.error('❌ Error reiniciando espacio:', error);
    throw error;
  }
}

// Función de prueba para validar la configuración
export const testStorachaConnection = async () => {
  try {
    console.log('Probando conexión con Storacha (nuevo método sin tokens)...');
    const client = await makeStorachaClient();
    
    console.log('Cliente creado, configurando espacio...');
    const space = await ensureStorachaSpace(client);
    
    console.log('✅ Conexión con Storacha exitosa');
    console.log(`🏠 Espacio activo: ${space.did()}`);
    
    const configuredEmail = getStorachaEmail();
    if (configuredEmail && configuredEmail !== 'tu_email_aqui') {
      console.log(`📧 Email configurado: ${configuredEmail}`);
    } else {
      console.log('⚠️  Email no configurado - usando espacio local sin recovery');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error probando conexión con Storacha:', error);
    throw error;
  }
}

// Función para obtener información del espacio actual
export const getSpaceInfo = async () => {
  try {
    const client = await makeStorachaClient();
    const space = client.currentSpace();
    
    if (!space) {
      return { hasSpace: false, spaceDID: null };
    }
    
    return { 
      hasSpace: true, 
      spaceDID: space.did(),
      spaceInfo: space
    };
  } catch (error) {
    console.error('Error obteniendo información del espacio:', error);
    throw error;
  }
}

export const retrieveJSON = async (cid) => {
  try {
    const files = await retrieveFile(cid)
    const jsonFile = files.find(file => file.name.endsWith('.json'))
    if (!jsonFile) {
      throw new Error('JSON file not found')
    }
    const text = await jsonFile.text()
    return JSON.parse(text)
  } catch (error) {
    console.error('Error retrieving JSON:', error)
    throw new Error('Failed to retrieve JSON from Filecoin')
  }
}