# Promo Residencias 2

**Duración:** 2 semanas  
**Canal:** Instagram DM  
**Planes:** Mensual $3.500 / Anual $28.000  

---

## Concepto

Campaña dirigida a residencias de neonatología. La unidad de adopción es la residencia, no el residente individual.

**Mecánica:** Cada residente que se suscribe recibe un cupón gratis para un colega de la misma residencia.

Efecto esperado: si hay 6 residentes en una guardia, 3 pagan y 3 entran gratis → toda la guardia usa NeoCalcu.

---

## Flujo operativo

1. Residente manda DM a Instagram
2. Responder con el texto de bienvenida (ver abajo)
3. Residente abre neocalcu.pro → toca **Apoyar** → elige plan → paga por MercadoPago
4. La app activa la membresía automáticamente con `?paid=1`
5. Residente avisa por DM que pagó
6. Generar cupón desde el admin (código automático) y anotarlo en la tabla de seguimiento con la residencia correspondiente
7. Enviar el cupón por DM
8. El colega lo canjea en la app desde SettingsPanel

---

## Tracking de cupones

El admin genera códigos automáticos (ej. `AB3K7MNQ`). El mapeo residencia ↔ cupón se lleva en la tabla de seguimiento de este doc.

**Campo email del cupón:** dejarlo libre para que el residente ingrese su propio email. Le permite recuperar su cuenta si cambia de dispositivo. No usarlo para notas internas.

---

## Copy para DMs

### Mensaje inicial (versión larga)

> Hola! Soy Diego, neonatólogo. Armé **NeoCalcu** para uso bedside en UCIN — cálculo de dosis por peso, fototerapia NICE 2023, Finnegan, ROP, valores de lab neonatal. Todo offline, entra desde el celu sin instalar nada.
>
> Estoy lanzando una promo para residencias estas dos semanas: **cada residente que se suscribe recibe un cupón gratis para un colega de la misma residencia.**
>
> Plan mensual $3.500 o anual $28.000. Si les interesa para la residencia me avisan y les explico cómo funciona.
>
> neocalcu.pro

### Mensaje inicial (versión corta — para referidos o conocidos)

> Hola! Te paso la promo que estoy haciendo para residencias: cada residente que se suscribe a NeoCalcu recibe un cupón gratis para un colega de la misma residencia. ¿Les puede servir para la guardia? neocalcu.pro

### Respuesta cuando preguntan cómo pagar

> Entrá a neocalcu.pro, tocá **Apoyar** en el header, elegís el plan y pagás por MercadoPago. Cuando esté listo me avisás y te mando el cupón para tu colega.

### Envío del cupón

> Acá va tu cupón: **[CÓDIGO]**
>
> Tu colega lo canjea desde la app en Configuración → Ingresar cupón. Cualquier duda me decís.

---

## Residencias target

Lista de residencias a contactar (completar):

- [ ] Hospital Garrahan
- [ ] Hospital Posadas
- [ ] Hospital Sardá
- [ ] Hospital Gutiérrez
- [ ] Hospital de Niños Ricardo Gutiérrez
- [ ] Hospital Fernández
- [ ] Hospital Italiano
- [ ] Hospital Austral
- [ ] Hospital Alemán
- [ ] Hospital San Martín (La Plata)
- [ ] Hospital de Niños de La Plata
- [ ] Hospital Privado de Córdoba
- [ ] Sanatorio Allende (Córdoba)

---

## Seguimiento

| Residencia | Contacto | Fecha DM | Pagó | Cupón generado | Cupón canjeado |
|---|---|---|---|---|---|
| | | | | | |

---

## Notas

- Los cupones no tienen vencimiento — verificar en el admin si se quiere limitar
- **Recuperación de cuenta:** si el residente pierde la membresía (cambio de celu, reset), puede recuperarla solo desde la app ingresando su email registrado (toast → "Recuperar"). No requiere intervención manual. Solo funciona si registró el email previamente — recordarles que lo hagan cuando la app lo pida.
- La promo no requiere cambios en el código — todo corre sobre la infraestructura existente
