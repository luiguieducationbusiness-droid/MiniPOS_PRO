# MiniPOS Perú — PWA + Google Sheets

Sistema base de punto de venta para pequeños negocios. Está diseñado para desplegarse como una PWA estática en GitHub Pages y usar Google Sheets como almacenamiento mediante Google Apps Script.

## Incluye

- Punto de venta con carrito.
- Métodos de pago: efectivo, Yape, Plin, tarjeta, transferencia bancaria, POS y otro.
- Pantalla de cobro con monto, cálculo de vuelto y QR comercial configurable para billeteras digitales.
- Inventario con SKU/código, categoría, precio, stock y stock mínimo.
- Ingreso de mercadería con proveedor y costo.
- Registro de ventas y detalle de ventas.
- Registro básico de clientes.
- Dashboard con ventas del día, productos y stock bajo.
- Reportes de ventas, ticket promedio, valor del inventario y medios de pago.
- PWA instalable.
- Caché/offline para la interfaz y datos locales mientras no haya sincronización.
- Escaneo de códigos en vivo desde Inventario y Punto de venta; ZXing se descarga la primera vez si el navegador no incluye BarcodeDetector.
- Google Sheets como base de datos sencilla, sin servidor propio.

## Estructura

- `index.html` — interfaz.
- `styles.css` — diseño responsive.
- `app.js` — lógica del POS.
- `sw.js` — service worker/PWA.
- `manifest.webmanifest` — instalación.
- `icon.svg` — icono.
- `Code.gs` — backend para Google Apps Script.
- `README.md` — instrucciones.

## Configuración de Google Sheets

1. Crea un Google Sheet.
2. Abre `Extensiones > Apps Script`.
3. Copia el contenido de `Code.gs`.
4. Guarda.
5. Ejecuta `setup()` una sola vez y acepta los permisos.
6. Selecciona `Implementar > Nueva implementación`.
7. Tipo: `Aplicación web`.
8. Ejecutar como: tu cuenta.
9. Acceso: opción que permita acceder a la aplicación mediante enlace, según las opciones disponibles en tu cuenta.
10. Copia la URL terminada en `/exec`.

## Configuración de la PWA

1. Sube todos los archivos excepto `Code.gs` a un repositorio de GitHub.
2. Activa GitHub Pages desde `Settings > Pages`.
3. Abre la PWA publicada.
4. Entra a `Configuración`.
5. Pega la URL `/exec` de Apps Script.
6. Guarda.
7. Presiona `Sincronizar`.
8. Para mostrar el QR al cobrar, carga la imagen del QR del negocio desde Configuración. La imagen se conserva únicamente en ese dispositivo.

## Estructura del Sheet

`Productos`: code, name, category, price, stock, minStock, updatedAt

`Ventas`: id, date, total, payment, customer, reference

`DetalleVentas`: saleId, code, name, qty, price, subtotal

`Movimientos`: id, date, type, code, product, qty, total, supplier

`Clientes`: doc, name, phone, email, purchases

## Importante sobre pagos y SUNAT

Los métodos Yape, Plin, efectivo, tarjeta, transferencia, POS y otro se registran como método de pago. El QR es la imagen estática del negocio: el cliente debe ingresar el monto en su billetera y el cajero debe verificar el abono antes de confirmar. Este proyecto base NO confirma automáticamente una transferencia ni realiza conciliación bancaria.

Tampoco genera por sí solo comprobantes electrónicos SUNAT. Para una versión empresarial se debe integrar un proveedor/API de facturación electrónica y contemplar las obligaciones tributarias aplicables al negocio.

## Seguridad

Google Sheets es adecuado para un MVP o pequeño negocio, pero no debe considerarse una base de datos empresarial de alta concurrencia. Para crecer, se recomienda migrar el backend a una API con autenticación, base de datos y control de roles.

No guardes contraseñas, claves bancarias ni credenciales privadas dentro de la PWA.

## Mejoras recomendadas para la siguiente versión

- Login y roles: administrador/cajero.
- Apertura y cierre de caja.
- Arqueo de caja.
- Devoluciones/anulaciones con auditoría.
- Compras y proveedores.
- Alertas de stock.
- Código de barras con cámara en tiempo real.
- Generación de ticket PDF.
- WhatsApp para compartir comprobante/resumen.
- Dashboard con ventas por día/semana/mes.
- Exportación CSV/Excel.
- Integración de comprobantes electrónicos con proveedor autorizado.
- Multi-sucursal.
- Control de gastos.
- Utilidad/margen por producto.
