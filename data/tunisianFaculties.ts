/**
 * Comprehensive list of Tunisian Legal Faculties and Institutions
 * Public institutions first, then private
 * Updated 2024 - Bilingual (AR/FR)
 */

export interface Faculty {
  id: number;
  name_ar: string;
  name_fr: string;
  name: string; // Dynamic display name
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
    name_ar: 'كلية الحقوق والعلوم السياسية بتونس',
    name_fr: 'Faculté de Droit et des Sciences Politiques de Tunis',
    name: 'كلية الحقوق والعلوم السياسية بتونس',
    slug: 'fdsp-tunis',
    type: 'faculte',
    domain: 'droit',
    specialities: ['droit public', 'droit privé'],
    university: 'جامعة تونس',
    city: 'تونس',
    country: 'Tunisie',
    public: true,
    level: ['licence', 'master', 'doctorat'],
  },
  {
    id: 2,
    name_ar: 'قسم القانونية والسياسية والاجتماعية بتونس',
    name_fr: 'Faculté des Sciences Juridiques, Politiques et Sociales de Tunis',
    name: 'قسم القانونية والسياسية والاجتماعية بتونس',
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
    name_ar: 'كلية الحقوق والعلوم السياسية بسوسة',
    name_fr: 'Faculté de Droit et des Sciences Politiques de Sousse',
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
    name_ar: 'كلية القانونية والاقتصادية والتصرف بجندوبة',
    name_fr: 'Faculté des Sciences Juridiques, Économiques et de Gestion de Jendouba',
    name: 'كلية القانونية والاقتصادية والتصرف بجندوبة',
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
    name_ar: 'المعهد الأعلى للقضاء',
    name_fr: 'Institut Supérieur de la Magistrature',
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
    name_ar: 'المعهد الأعلى للمحاماة',
    name_fr: 'Institut Supérieur de la Profession d’Avocat',
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
    name_ar: 'المعهد العالي للعلوم القانونية والسياسية بتونس',
    name_fr: 'Institut Supérieur des Sciences Juridiques et Politiques de Tunis',
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
    name_ar: 'المدرسة الوطنية للإدارة',
    name_fr: 'École Nationale d’Administration',
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
    name_ar: 'كلية العلوم القانونية والاقتصادية والتصرف (خاصة)',
    name_fr: 'Faculté Privée des Sciences Juridiques, Économiques et de Gestion',
    name: 'كلية العلوم القانونية والاقتصادية والتصرف (خاصة)',
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
    name_ar: 'جامعة ابن خلدون الخاصة – كلية العلوم القانونية',
    name_fr: 'Université Privée Ibn Khaldoun – Faculté de Droit',
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
    name_ar: 'المعهد العالي الخاص للعلوم القانونية',
    name_fr: 'Institut Supérieur Privé des Sciences Juridiques',
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
    name_ar: 'المدرسة العليا الخاصة للقانون والأعمال',
    name_fr: 'École Supérieure Privée de Droit et des Affaires',
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
 * Localized based on current language
 */
export const getAllFaculties = (lang: string = 'ar'): Faculty[] => {
  return TUNISIAN_FACULTIES.map(fac => ({
    ...fac,
    name: lang === 'fr' ? fac.name_fr : fac.name_ar
  })).sort((a, b) => {
    // Public first
    if (a.public && !b.public) return -1;
    if (!a.public && b.public) return 1;
    // Then by name
    return a.name.localeCompare(b.name, lang === 'fr' ? 'fr' : 'ar');
  });
};

/**
 * Search faculties by name, university, city, speciality
 * Returns sorted list (public first)
 */
export const searchFaculties = (query: string, lang: string = 'ar'): Faculty[] => {
  if (!query.trim()) {
    return getAllFaculties(lang);
  }

  const normalizedQuery = query.toLowerCase().trim();

  return TUNISIAN_FACULTIES.map(fac => ({
    ...fac,
    name: lang === 'fr' ? fac.name_fr : fac.name_ar
  })).filter((faculty) => {
    return (
      faculty.name_ar.includes(query) ||
      faculty.name_fr.toLowerCase().includes(normalizedQuery) ||
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
      const aNameMatch = a.name.toLowerCase().includes(normalizedQuery);
      const bNameMatch = b.name.toLowerCase().includes(normalizedQuery);
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
      return a.name.localeCompare(b.name, lang === 'fr' ? 'fr' : 'ar');
    });
};

/**
 * Get faculties by type (faculte, institut, ecole)
 */
export const getFacultiesByType = (type: 'faculte' | 'institut' | 'ecole', lang: string = 'ar'): Faculty[] => {
  return getAllFaculties(lang).filter((fac) => fac.type === type);
};

/**
 * Get faculties by access level (public/private)
 */
export const getFacultiesByAccess = (isPublic: boolean, lang: string = 'ar'): Faculty[] => {
  return getAllFaculties(lang).filter((fac) => fac.public === isPublic);
};

/**
 * Get faculties by city
 */
export const getFacultiesByCity = (city: string, lang: string = 'ar'): Faculty[] => {
  return getAllFaculties(lang).filter((fac) => fac.city === city);
};

/**
 * Get a single faculty by ID
 */
export const getFacultyById = (id: number, lang: string = 'ar'): Faculty | undefined => {
  const fac = TUNISIAN_FACULTIES.find((fac) => fac.id === id);
  if (!fac) return undefined;
  return {
    ...fac,
    name: lang === 'fr' ? fac.name_fr : fac.name_ar
  };
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
