# Mobbin MCP en OpenCode

La plantilla ya registra Mobbin en `opencode.json`:

```json
{
  "mcp": {
    "mobbin": {
      "type": "remote",
      "url": "https://api.mobbin.com/mcp",
      "enabled": true
    }
  }
}
```

## Autenticacion

Mobbin MCP usa OAuth. No copies tokens ni agregues una API key al repositorio.

Desde una terminal ejecuta:

```bash
opencode mcp auth mobbin
```

Se abrira el navegador. Inicia sesion en Mobbin y autoriza OpenCode. Despues verifica:

```bash
opencode mcp list
```

Si necesitas diagnosticar la conexion:

```bash
opencode mcp debug mobbin
```

Para volver a autorizar:

```bash
opencode mcp logout mobbin
opencode mcp auth mobbin
```

Mobbin indica que MCP requiere un plan Pro, Team o Enterprise. La autorizacion queda guardada por OpenCode fuera del proyecto.

## Uso directo con dibot-fast

```text
Usa el MCP mobbin para buscar referencias de wallet crypto mobile.
Analiza hasta seis pantallas relevantes y extrae jerarquia, navegacion,
composicion, color, tipografia, escala, espaciado, radios, sombras, cards,
estados y patrones de interaccion. Reproduce el lenguaje visual, pero no copies
una pantalla pixel a pixel, marcas, logos, textos ni assets.
Construye una app original desde la plantilla y empieza a programar.
```

## Crear un superprompt primero

Selecciona el agente `prompt-builder` y escribe:

```text
Quiero una app ecommerce para mi tienda de mascotas.
Debe tener catalogo, busqueda, categorias, detalle de producto, carrito,
checkout, pedidos y perfil. Quiero una experiencia movil premium,
amigable y original. Usa Mobbin para investigar referencias relevantes.
```

El agente devuelve un superprompt y guarda las referencias en `references/mobbin/`.
Pasa el superprompt, el README y todas las imágenes de esa carpeta a `dibot-fast`,
que construirá la aplicación.

## Cambios rápidos sobre una app existente

Para una petición como “agrega favoritos”, “cambia el color del botón” o “añade un filtro”, usa el agente `dibot-update`:

```text
opencode run --agent dibot-update "Agrega [cambio concreto] y conserva el diseño existente. Ejecuta build y lint al terminar."
```

Este agente modifica solo lo necesario, mantiene la dirección visual y actualiza el schema/DB únicamente si el cambio lo requiere.

## Imágenes reales

Cuando una app necesite fotografía o ilustraciones, `dibot-fast` puede usar imágenes públicas directas de Unsplash, Pexels o Wikimedia Commons. Debe guardar una copia en `public/assets/` cuando sea posible, incluir `alt`, fuente/crédito y un fallback local. No debe usar assets de Mobbin ni de las apps de referencia.
