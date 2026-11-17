// Apoyo institucional. Mientras el array esté vacío, Ajustes muestra la invitación a apoyar.
// Cuando haya apoyos, agregarlos acá y se muestran como "Con el apoyo de".
// El apoyo nunca condiciona el contenido clínico (ver "Independencia editorial").
export interface Sponsor {
  name: string;
  url?: string;
  /** Ruta de logo dentro de public/ (ej. '/sponsors/hospital.png'). Opcional. */
  logo?: string;
}

export const sponsors: Sponsor[] = [];
