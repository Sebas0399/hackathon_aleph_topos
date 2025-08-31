# 🚨 Error: "failed space/blob/add invocation"

## 🔍 Análisis del problema

El error `"failed space/blob/add invocation"` indica que el espacio configurado no tiene permisos válidos para realizar operaciones de subida de archivos.

### Causas comunes:

1. **Espacio DID no coincide con el email**: El espacio fue creado con otro email/cuenta
2. **Email no confirmado**: Tu email `antony.aguay@gmail.com` necesita confirmación
3. **Plan de pago requerido**: Storacha requiere plan de pago para espacios persistentes
4. **Espacio corrupto o sin permisos**: El espacio DID no tiene las autorizaciones necesarias

## ✅ Solución aplicada

### 1. **Espacio DID comentado temporalmente**
```bash
# En tu .env ahora está comentado:
# VITE_STORACHA_SPACE_DID=did:key:z6Mksj2v8Bs88jKPPhn88oTmXPPsTvttGPC1YDF857xEpYZj
```

### 2. **Configuración actual (funcional)**
```bash
VITE_STORACHA_EMAIL=antony.aguay@gmail.com
# (Sin Space DID - se creará uno nuevo automáticamente)
```

## 🔧 Próximos pasos

### Paso 1: Confirmar email (IMPORTANTE)
1. **Revisa tu bandeja de entrada** de `antony.aguay@gmail.com`
2. **Busca email de Storacha** (también revisa spam/promociones)
3. **Confirma tu email** haciendo clic en el enlace

### Paso 2: Configurar plan de pago
1. **Después de confirmar email**, se te pedirá seleccionar un plan
2. **Storacha requiere plan de pago** para espacios persistentes
3. **Selecciona un plan** (hay opciones gratuitas limitadas)

### Paso 3: Probar la aplicación
1. **Reinicia servidor**: `npm run dev`
2. **Prueba subir archivo**: Debería crear espacio nuevo automáticamente
3. **Anota el nuevo DID**: Se mostrará en la consola

## 🎯 Comportamiento esperado

### Primera ejecución:
```
🔍 Verificando permisos del espacio...
✅ Login exitoso, esperando plan de pago...
✅ Plan de pago confirmado
✅ Espacio creado con cuenta: did:key:z6MkNuevo...
💡 Para usar este espacio en el futuro, agrega a tu .env:
VITE_STORACHA_SPACE_DID=did:key:z6MkNuevo...
```

### Después de confirmar email y plan:
```
✅ Espacio configurado exitosamente
✅ Archivo subido exitosamente con CID: bafybeXXXX...
```

## 🚨 Si el problema persiste

### Opción 1: Usar espacio local (sin recovery)
```bash
# Comenta también el email para usar espacio local:
# VITE_STORACHA_EMAIL=antony.aguay@gmail.com
```

### Opción 2: Usar función de reset
El código incluye una función `resetStorachaSpace()` que puedes llamar para limpiar y recrear el espacio.

## 📧 Estados del email

### ✅ Email confirmado + Plan seleccionado
- Espacios persistentes con recovery
- Subidas funcionan normalmente

### ⚠️  Email confirmado + Sin plan
- Error: "No payment plan selected"
- Necesitas seleccionar plan

### ❌ Email no confirmado
- Error: "Email confirmation required"
- Revisa bandeja de entrada

### 🏠 Sin email configurado
- Espacio local inmediato
- Sin recovery entre dispositivos
- Funciona para desarrollo

## 🎯 Recomendación inmediata

1. **Revisa tu email** `antony.aguay@gmail.com` y confirma si hay email de Storacha
2. **Si no hay email**, comenta `VITE_STORACHA_EMAIL` para usar espacio local
3. **Reinicia servidor** y prueba subir archivo
4. **Una vez funcionando**, puedes configurar email y plan gradualmente
