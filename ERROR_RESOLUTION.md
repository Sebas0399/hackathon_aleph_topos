# ✅ ACTUALIZACIÓN: Storacha ya NO usa API tokens

## 🆕 Cambio importante

**Storacha ha actualizado su sistema de autenticación**. La nueva versión usa:
- ✅ **Autenticación por email** (opcional)
- ✅ **Espacios locales** automáticos
- ❌ **YA NO se usan API tokens**

## Error "undefined is not supported by the IPLD Data Model"

### Causa principal actualizada
Este error ahora ocurre principalmente por intentar usar la configuración antigua con tokens en lugar del nuevo sistema.

## ✅ Solución actualizada

### 1. Remover configuración de tokens
```bash
# ELIMINA estas líneas de tu .env:
# VITE_STORACHA_TOKEN=cualquier_valor
```

### 2. Nueva configuración (opcional)
```bash
# Para espacio local (funciona inmediatamente):
# No configures nada

# Para espacio con recovery entre dispositivos:
VITE_STORACHA_EMAIL=tu_email@ejemplo.com
```

### 3. Reiniciar servidor
```bash
cd frontend
npm run dev
```

## 🔧 Configuración recomendada

### Desarrollo rápido:
```bash
# Archivo .env vacío o sin VITE_STORACHA_* 
# El sistema crea espacio local automáticamente
```

### Producción:
```bash
VITE_STORACHA_EMAIL=tu_email_empresarial@empresa.com
# Confirma el email cuando llegue la notificación
```

## 🚨 Errores comunes y soluciones

### "Agent has no proofs"
- **Causa**: Intentando usar tokens antiguos
- **Solución**: Elimina `VITE_STORACHA_TOKEN`, usa nuevo método

### "Email confirmation required"
- **Causa**: Email configurado pero no confirmado
- **Solución**: Revisa bandeja de entrada y confirma

### "Undefined IPLD Data Model"
- **Causa**: Configuración mixta (tokens + nuevo sistema)
- **Solución**: Usa SOLO el nuevo método sin tokens

## 📖 Documentación actualizada

- [Nueva guía de Storacha JS Client](https://docs.storacha.network/js-client/)
- [Conceptos de UCANs](https://docs.storacha.network/concepts/ucans-and-storacha/)

## 🎯 Solución inmediata

1. **Elimina** `VITE_STORACHA_TOKEN` de tu `.env`
2. **Opcional**: Agrega `VITE_STORACHA_EMAIL=tu_email@ejemplo.com`
3. **Reinicia** el servidor: `npm run dev`

El sistema funcionará inmediatamente con espacios locales, sin necesidad de tokens ni configuración compleja.
