/**
 * Comprehensive list of Tunisian Legal Faculties and Institutions
 * Public institutions first, then private
 * Updated 2024
 */

export interface Faculty {
  id: number;
  name: string;
  slug: string;
  type: 'faculte' | 'institut' | 'ecole';
  domain: string;
  specialities: string[];
  university?: string;
  city: string;
  country: string;
  public: boolean;
  level: string[];
}

export const TUNISIAN_FACULTIES: Faculty[] = [
  // PUBLIC INSTITUTIONS
  {
    id: 1,
    name: 'كلية الحقوق والعلوم السياسية بتونس',
    slug: 'fdsp-tunis',
    type: 'faculte',
    domain: 'droit',
    specialities: ['دroit public', 'droit privé'],
    university: 'جامعة تونس',
    city: 'تونس',
    country: 'Tunisie',
    public: true,
    level: ['licence', 'master', 'doctorat'],
  },
  {
    id: 2,
    name: 'كلية العلوم القانونية والسياسية والاجتماعية بتونس',
    slug: 'fscjps-tunis',
    type: 'faculte',
    domain: 'droit',
    specialities: ['droit public', 'droit privé'],
    university: 'جامعة قرطاج',
    city: 'تونس',
    country: 'Tunisie',
    public: true,
    level: ['licence', 'master', 'doctorat'],
  },
  {
    id: 3,
    name: 'كلية الحقوق والعلوم السياسية بسوسة',
    slug: 'fdsp-sousse',
    type: 'faculte',
    domain: 'droit',
    specialities: ['droit public', 'droit privé'],
    university: 'جامعة سوسة',
    city: 'سوسة',
    country: 'Tunisie',
    public: true,
    level: ['licence', 'master', 'doctorat'],
  },
  {
    id: 4,
    name: 'كلية العلوم القانونية والاقتصادية والتصرف بجندوبة',
    slug: 'fsjegd-jendouba',
    type: 'faculte',
    domain: 'droit',
    specialities: ['droit public', 'droit privé', 'gestion'],
    university: 'جامعة جندوبة',
    city: 'جندوبة',
    country: 'Tunisie',
    public: true,
    level: ['licence', 'master'],
  },
  {
    id: 5,
    name: 'المعهد الأعلى للقضاء',
    slug: 'ism-tunisia',
    type: 'institut',
    domain: 'droit',
    specialities: ['magistrature'],
    city: 'تونس',
    country: 'Tunisie',
    public: true,
    level: ['formation professionnelle'],
  },
  {
    id: 6,
    name: 'المعهد الأعلى للمحاماة',
    slug: 'isa-tunisia',
    type: 'institut',
    domain: 'droit',
    specialities: ['avocat'],
    city: 'تونس',
    country: 'Tunisie',
    public: true,
    level: ['formation professionnelle'],
  },
  {
    id: 7,
    name: 'المعهد العالي للعلوم القانونية والسياسية بتونس',
    slug: 'isjps-tunis',
    type: 'institut',
    domain: 'droit',
    specialities: ['droit public'],
    university: 'جامعة تونس',
    city: 'تونس',
    country: 'Tunisie',
    public: true,
    level: ['licence'],
  },
  {
    id: 8,
    name: 'المدرسة الوطنية للإدارة',
    slug: 'ena-tunisie',
    type: 'ecole',
    domain: 'droit',
    specialities: ['administration publique', 'droit administratif'],
    city: 'تونس',
    country: 'Tunisie',
    public: true,
    level: ['formation supérieure'],
  },

  // PRIVATE INSTITUTIONS
  {
    id: 9,
    name: 'الكلية الخاصة للعلوم القانونية والاقتصادية والتصرف',
    slug: 'fac-privee-droit-gestion',
    type: 'faculte',
    domain: 'droit',
    specialities: ['droit privé', 'droit des affaires'],
    city: 'تونس',
    country: 'Tunisie',
    public: false,
    level: ['licence', 'master'],
  },
  {
    id: 10,
    name: 'جامعة ابن خلدون الخاصة – كلية العلوم القانونية',
    slug: 'ibn-khaldoun-law-school',
    type: 'faculte',
    domain: 'droit',
    specialities: ['droit privé', 'droit des affaires'],
    city: 'تونس',
    country: 'Tunisie',
    public: false,
    level: ['licence', 'master'],
  },
  {
    id: 11,
    name: 'المعهد العالي الخاص للعلوم القانونية',
    slug: 'private-law-institute',
    type: 'institut',
    domain: 'droit',
    specialities: ['droit privé'],
    city: 'تونس',
    country: 'Tunisie',
    public: false,
    level: ['licence'],
  },
  {
    id: 12,
    name: 'المدرسة العليا الخاصة للقانون والأعمال',
    slug: 'law-business-school',
    type: 'ecole',
    domain: 'droit',
    specialities: ['droit des affaires'],
    city: 'تونس',
    country: 'Tunisie',
    public: false,
    level: ['licence', 'master'],
  },
];

/**
 * Get all faculties sorted (public first, then private)
 */
export const getAllFaculties = (): Faculty[] => {
  return TUNISIAN_FACULTIES.sort((a, b) => {
    // Public first
    if (a.public && !b.public) return -1;
    if (!a.public && b.public) return 1;
    // Then by name
    return a.name.localeCompare(b.name, 'ar');
  });
};

/**
 * Search faculties by name, university, city, speciality
 * Returns sorted list (public first)
 */
export const searchFaculties = (query: string): Faculty[] => {
  if (!query.trim()) {
    return getAllFaculties();
  }

  const normalizedQuery = query.toLowerCase().trim();

  return TUNISIAN_FACULTIES.filter((faculty) => {
    return (
      faculty.name.includes(query) ||
      (faculty.university && faculty.university.includes(query)) ||
      faculty.city.includes(query) ||
      faculty.city.toLowerCase().includes(normalizedQuery) ||
      faculty.specialities.some((spec) => spec.includes(query) || spec.toLowerCase().includes(normalizedQuery)) ||
      faculty.type.toLowerCase().includes(normalizedQuery)
    );
  })
    .sort((a, b) => {
      // Public first
      if (a.public && !b.public) return -1;
      if (!a.public && b.public) return 1;
      // Prioritize name matches
      const aNameMatch = a.name.includes(query);
      const bNameMatch = b.name.includes(query);
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
      return a.name.localeCompare(b.name, 'ar');
    });
};

/**
 * Get faculties by type (faculte, institut, ecole)
 */
export const getFacultiesByType = (type: 'faculte' | 'institut' | 'ecole'): Faculty[] => {
  return TUNISIAN_FACULTIES.filter((fac) => fac.type === type)
    .sort((a, b) => {
      if (a.public && !b.public) return -1;
      if (!a.public && b.public) return 1;
      return a.name.localeCompare(b.name, 'ar');
    });
};

/**
 * Get faculties by access level (public/private)
 */
export const getFacultiesByAccess = (isPublic: boolean): Faculty[] => {
  return TUNISIAN_FACULTIES.filter((fac) => fac.public === isPublic).sort((a, b) =>
    a.name.localeCompare(b.name, 'ar')
  );
};

/**
 * Get faculties by city
 */
export const getFacultiesByCity = (city: string): Faculty[] => {
  return TUNISIAN_FACULTIES.filter((fac) => fac.city === city)
    .sort((a, b) => {
      if (a.public && !b.public) return -1;
      if (!a.public && b.public) return 1;
      return a.name.localeCompare(b.name, 'ar');
    });
};

/**
 * Get a single faculty by ID
 */
export const getFacultyById = (id: number): Faculty | undefined => {
  return TUNISIAN_FACULTIES.find((fac) => fac.id === id);
};

/**
 * Get all cities
 */
export const getAllCities = (): string[] => {
  const cities = new Set(TUNISIAN_FACULTIES.map((fac) => fac.city));
  return Array.from(cities).sort();
};

/**
 * Get all universities
 */
export const getAllUniversities = (): string[] => {
  const universities = new Set(TUNISIAN_FACULTIES.filter((fac) => fac.university).map((fac) => fac.university!));
  return Array.from(universities).sort();
};
