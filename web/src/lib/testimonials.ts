// Template testimonials — the client should replace these with real Google/Elfsight reviews.
// The Reviews component also exposes an embed slot for the live reviews widget.
export interface Testimonial {
  name: string;
  city: string;
  rating: number;
  quote: { en: string; es: string };
}

export const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Maria G.',
    city: 'Pinecrest, FL',
    rating: 5,
    quote: {
      en: 'From the 3D design to the final install, the team was professional and on time. Our aluminum pergola completely transformed the backyard.',
      es: 'Desde el diseño 3D hasta la instalación final, el equipo fue profesional y puntual. Nuestra pérgola de aluminio transformó por completo el patio.',
    },
  },
  {
    name: 'David R.',
    city: 'Weston, FL',
    rating: 5,
    quote: {
      en: 'They handled the permits and HOA approval for us. The louvered roof is built like a tank and looks incredible.',
      es: 'Se encargaron de los permisos y la aprobación del HOA. El techo de lamas es muy resistente y se ve increíble.',
    },
  },
  {
    name: 'Jennifer M.',
    city: 'Coral Gables, FL',
    rating: 5,
    quote: {
      en: 'Our pool screen enclosure is exactly what we wanted — no more bugs and easy to maintain. Highly recommend AB Aluminum.',
      es: 'Nuestro cerramiento de piscina es justo lo que queríamos: sin insectos y fácil de mantener. Recomiendo mucho a AB Aluminum.',
    },
  },
  {
    name: 'Carlos P.',
    city: 'Doral, FL',
    rating: 5,
    quote: {
      en: 'Great communication in English and Spanish. The financing option made it easy to get the patio we always wanted.',
      es: 'Excelente comunicación en inglés y español. La opción de financiamiento facilitó tener el patio que siempre quisimos.',
    },
  },
  {
    name: 'Ashley T.',
    city: 'Parkland, FL',
    rating: 5,
    quote: {
      en: 'Quality craftsmanship and fair pricing. The screen room is now our favorite part of the house.',
      es: 'Trabajo de calidad y precio justo. El porche con malla es ahora nuestra parte favorita de la casa.',
    },
  },
  {
    name: 'Roberto S.',
    city: 'Palmetto Bay, FL',
    rating: 5,
    quote: {
      en: 'Licensed, insured, and they do their own work — no subcontractors. The whole process was smooth and stress-free.',
      es: 'Con licencia, asegurados y hacen su propio trabajo, sin subcontratistas. Todo el proceso fue fácil y sin estrés.',
    },
  },
];
