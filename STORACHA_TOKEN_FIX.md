# 🆕 Nueva Configuración de Storacha (SIN API Tokens)

## ✅ Cambio importante en Storacha

**Storacha ya NO usa API tokens**. La nueva versión usa:
- ✅ **Autenticación por email** (opcional pero recomendado)
- ✅ **Espacios locales** con UCANs (User Controlled Authorization Networks)
- ✅ **Recovery entre dispositivos** cuando usas email

## 🔧 Nueva configuración paso a paso

### Opción 1: Configuración simple (espacio local)
```bash
# En tu archivo .env - NO necesitas configurar nada
# El sistema creará un espacio local automáticamente
```

### Opción 2: Configuración completa (con recovery)
```bash
# En tu archivo .env
VITE_STORACHA_EMAIL=tu_email_real@ejemplo.com
```

### Opción 3: Configuración avanzada (espacio específico)
```bash
# En tu archivo .env
VITE_STORACHA_EMAIL=tu_email_real@ejemplo.com
VITE_STORACHA_SPACE_DID=did:key:z6MkXXXXXXXX... # se genera automáticamente
```

## 🚀 Cómo funciona ahora

### 1. **Sin email configurado:**
- ✅ Crea un espacio local inmediatamente
- ⚠️  Sin recovery entre dispositivos
- 🏠 Perfecto para desarrollo y pruebas

### 2. **Con email configurado:**
- 📧 Envía email de confirmación la primera vez
- ✅ Crea espacio con recovery account
- 🔄 Acceso desde múltiples dispositivos
- 💾 Datos persistentes con plan de pago

## 📋 Configuración recomendada

### Para desarrollo rápido:
```bash
# No configures nada - funciona inmediatamente
```

### Para producción:
```bash
VITE_STORACHA_EMAIL=tu_email_empresarial@empresa.com
```

## � Migración desde tokens

Si tenías configuración anterior con tokens:

### ❌ Configuración antigua (ya no funciona):
```bash
VITE_STORACHA_TOKEN=eyJhbGciOiJIUzI1NiIs...
```

### ✅ Nueva configuración:
```bash
VITE_STORACHA_EMAIL=tu_email@ejemplo.com
```

## � Solución de problemas

### Error: "Agent has no proofs"
- **Causa**: Intentando usar configuración de tokens antigua
- **Solución**: Elimina `VITE_STORACHA_TOKEN` y usa el nuevo método

### Error: "Email confirmation required"
- **Causa**: Email configurado pero no confirmado
- **Solución**: Revisa tu bandeja de entrada y confirma el email

### Error: "No payment plan"
- **Causa**: Email confirmado pero sin plan de pago
- **Solución**: El sistema te guiará para seleccionar un plan

## � Documentación oficial

- [Storacha JS Client](https://docs.storacha.network/js-client/)
- [Conceptos de UCANs](https://docs.storacha.network/concepts/ucans-and-storacha/)
- [Crear una cuenta](https://docs.storacha.network/how-to/create-account/)

## 🎯 Para uso inmediato

**Solución rápida**: No configures nada en `.env`. El sistema funciona inmediatamente con espacios locales.

**Para persistencia**: Agrega solo `VITE_STORACHA_EMAIL=tu_email@ejemplo.com` y confirma el email cuando llegue.
