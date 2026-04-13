/**
 * Comprehensive list of Tunisian Universities (Public and Private)
 * Updated 2024
 */

export interface University {
  id: string;
  name: string;
  nameAr: string;
  type: 'public' | 'private';
  city: string;
  region: string;
}

export const TUNISIAN_UNIVERSITIES: University[] = [
  // PUBLIC UNIVERSITIES
  // North
  {
    id: 'uni-tunis-el-manar',
    name: 'University of Tunis El Manar',
    nameAr: 'جامعة تونس المنار',
    type: 'public',
    city: 'Tunis',
    region: 'Tunis'
  },
  {
    id: 'uni-tunis',
    name: 'University of Tunis',
    nameAr: 'جامعة تونس',
    type: 'public',
    city: 'Tunis',
    region: 'Tunis'
  },
  {
    id: 'uni-carthage',
    name: 'University of Carthage',
    nameAr: 'جامعة قرطاج',
    type: 'public',
    city: 'Carthage',
    region: 'Tunis'
  },
  {
    id: 'uni-manouba',
    name: 'University of Manouba',
    nameAr: 'جامعة منوبة',
    type: 'public',
    city: 'Manouba',
    region: 'Ben Arous'
  },
  {
    id: 'uni-bizerte',
    name: 'University of Bizerte',
    nameAr: 'جامعة بنزرت',
    type: 'public',
    city: 'Bizerte',
    region: 'Bizerte'
  },
  {
    id: 'uni-jendouba',
    name: 'University of Jendouba',
    nameAr: 'جامعة جندوبة',
    type: 'public',
    city: 'Jendouba',
    region: 'Jendouba'
  },

  // Central
  {
    id: 'uni-sousse',
    name: 'University of Sousse',
    nameAr: 'جامعة سوسة',
    type: 'public',
    city: 'Sousse',
    region: 'Sousse'
  },
  {
    id: 'uni-sfax',
    name: 'University of Sfax',
    nameAr: 'جامعة صفاقس',
    type: 'public',
    city: 'Sfax',
    region: 'Sfax'
  },
  {
    id: 'uni-kairouan',
    name: 'University of Kairouan',
    nameAr: 'جامعة القيروان',
    type: 'public',
    city: 'Kairouan',
    region: 'Kairouan'
  },
  {
    id: 'uni-monastir',
    name: 'University of Monastir',
    nameAr: 'جامعة المنستير',
    type: 'public',
    city: 'Monastir',
    region: 'Monastir'
  },

  // South
  {
    id: 'uni-gabes',
    name: 'University of Gabes',
    nameAr: 'جامعة قابس',
    type: 'public',
    city: 'Gabes',
    region: 'Gabes'
  },
  {
    id: 'uni-djerba',
    name: 'University of Djerba',
    nameAr: 'جامعة جربة',
    type: 'public',
    city: 'Djerba',
    region: 'Medenine'
  },
  {
    id: 'uni-tozeur',
    name: 'University of Tozeur',
    nameAr: 'جامعة توزر',
    type: 'public',
    city: 'Tozeur',
    region: 'Tozeur'
  },
  {
    id: 'uni-gafsa',
    name: 'University of Gafsa',
    nameAr: 'جامعة قفصة',
    type: 'public',
    city: 'Gafsa',
    region: 'Gafsa'
  },

  // PRIVATE UNIVERSITIES
  {
    id: 'uni-isamm',
    name: 'Tunis Business School',
    nameAr: 'مدرسة تونس للأعمال',
    type: 'private',
    city: 'Tunis',
    region: 'Tunis'
  },
  {
    id: 'uni-sup-com',
    name: 'Sup\'Com',
    nameAr: 'سوب كوم',
    type: 'private',
    city: 'Tunis',
    region: 'Tunis'
  },
  {
    id: 'uni-isg',
    name: 'ISG - Business School',
    nameAr: 'مدرسة الدراسات العليا للتجارة',
    type: 'private',
    city: 'Tunis',
    region: 'Tunis'
  },
  {
    id: 'uni-ept',
    name: 'EPT - School of Engineering',
    nameAr: 'المدرسة العليا للعلوم والتكنولوجيا',
    type: 'private',
    city: 'Tunis',
    region: 'Tunis'
  },
  {
    id: 'uni-isit',
    name: 'ISIT',
    nameAr: 'معهد العلوم والتقنيات',
    type: 'private',
    city: 'Tunis',
    region: 'Tunis'
  },
  {
    id: 'uni-ehtp',
    name: 'EHTP - Engineering School',
    nameAr: 'المدرسة الهندسية',
    type: 'private',
    city: 'Tunis',
    region: 'Tunis'
  },
  {
    id: 'uni-fsb',
    name: 'FSB - Faculty of Science and Business',
    nameAr: 'كلية العلوم والأعمال',
    type: 'private',
    city: 'Tunis',
    region: 'Tunis'
  },
  {
    id: 'uni-itb',
    name: 'ITB - Business Institute',
    nameAr: 'معهد الأعمال',
    type: 'private',
    city: 'Tunis',
    region: 'Tunis'
  },
  {
    id: 'uni-btech',
    name: 'BTech Business School',
    nameAr: 'مدرسة بيتك',
    type: 'private',
    city: 'Tunis',
    region: 'Tunis'
  },
  {
    id: 'uni-isg-sfax',
    name: 'ISG - Sfax',
    nameAr: 'مدرسة الدراسات العليا للتجارة - صفاقس',
    type: 'private',
    city: 'Sfax',
    region: 'Sfax'
  },
  {
    id: 'uni-iseah-sousse',
    name: 'ISEAH - Sousse',
    nameAr: 'معهد أسوة - سوسة',
    type: 'private',
    city: 'Sousse',
    region: 'Sousse'
  },
  {
    id: 'uni-iuc',
    name: 'ISAMM University',
    nameAr: 'معهد العلوم الإدارية بمنوبة',
    type: 'private',
    city: 'Manouba',
    region: 'Ben Arous'
  },
  {
    id: 'uni-ipest',
    name: 'IPEST - Preparatory School',
    nameAr: 'معهد التحضيري للعلوم والتقنية',
    type: 'private',
    city: 'Tunis',
    region: 'Tunis'
  },
  {
    id: 'uni-eit',
    name: 'EIT - Engineering Institute',
    nameAr: 'معهد الهندسة والتكنولوجيا',
    type: 'private',
    city: 'Tunis',
    region: 'Tunis'
  },
  {
    id: 'uni-sst',
    name: 'SST - School of Science and Technology',
    nameAr: 'مدرسة العلوم والتكنولوجيا',
    type: 'private',
    city: 'Tunis',
    region: 'Tunis'
  },
  {
    id: 'uni-escae',
    name: 'ESCAE',
    nameAr: 'المدرسة العليا للتجارة والإدارة',
    type: 'private',
    city: 'Tunis',
    region: 'Tunis'
  },
  {
    id: 'uni-ises',
    name: 'ISES',
    nameAr: 'معهد العلوم الاقتصادية والاجتماعية',
    type: 'private',
    city: 'Tunis',
    region: 'Tunis'
  },
  {
    id: 'uni-iset-djerba',
    name: 'ISET - Djerba',
    nameAr: 'معهد العلوم والتكنولوجيا - جربة',
    type: 'private',
    city: 'Djerba',
    region: 'Medenine'
  },
  {
    id: 'uni-iset-sfax',
    name: 'ISET - Sfax',
    nameAr: 'معهد العلوم والتكنولوجيا - صفاقس',
    type: 'private',
    city: 'Sfax',
    region: 'Sfax'
  },
  {
    id: 'uni-iset-sousse',
    name: 'ISET - Sousse',
    nameAr: 'معهد العلوم والتكنولوجيا - سوسة',
    type: 'private',
    city: 'Sousse',
    region: 'Sousse'
  },
  {
    id: 'uni-upec',
    name: 'UPEC',
    nameAr: 'جامعة شرق الأرض',
    type: 'private',
    city: 'Tunis',
    region: 'Tunis'
  },
  {
    id: 'uni-umu',
    name: 'UMU',
    nameAr: 'الجامعة الحرة المتوسطية',
    type: 'private',
    city: 'Tunis',
    region: 'Tunis'
  },
];

/**
 * Get all universities sorted by name
 */
export const getAllUniversities = (): University[] => {
  return TUNISIAN_UNIVERSITIES.sort((a, b) => a.nameAr.localeCompare(b.nameAr));
};

/**
 * Search universities by name (Arabic or English)
 */
export const searchUniversities = (query: string): University[] => {
  if (!query.trim()) {
    return getAllUniversities();
  }

  const normalizedQuery = query.toLowerCase().trim();

  return TUNISIAN_UNIVERSITIES.filter((uni) => {
    return (
      uni.nameAr.includes(query) ||
      uni.name.toLowerCase().includes(normalizedQuery) ||
      uni.city.toLowerCase().includes(normalizedQuery) ||
      uni.region.toLowerCase().includes(normalizedQuery)
    );
  }).sort((a, b) => {
    // Prioritize exact matches and name matches
    const aNameMatch = a.name.toLowerCase().startsWith(normalizedQuery);
    const bNameMatch = b.name.toLowerCase().startsWith(normalizedQuery);
    if (aNameMatch && !bNameMatch) return -1;
    if (!aNameMatch && bNameMatch) return 1;
    return a.nameAr.localeCompare(b.nameAr);
  });
};

/**
 * Get universities by type
 */
export const getUniversitiesByType = (type: 'public' | 'private'): University[] => {
  return TUNISIAN_UNIVERSITIES.filter((uni) => uni.type === type).sort((a, b) =>
    a.nameAr.localeCompare(b.nameAr)
  );
};

/**
 * Get universities by region/city
 */
export const getUniversitiesByRegion = (region: string): University[] => {
  return TUNISIAN_UNIVERSITIES.filter((uni) => uni.region.toLowerCase() === region.toLowerCase()).sort(
    (a, b) => a.nameAr.localeCompare(b.nameAr)
  );
};

/**
 * Get a single university by ID
 */
export const getUniversityById = (id: string): University | undefined => {
  return TUNISIAN_UNIVERSITIES.find((uni) => uni.id === id);
};

/**
 * Get all regions
 */
export const getAllRegions = (): string[] => {
  const regions = new Set(TUNISIAN_UNIVERSITIES.map((uni) => uni.region));
  return Array.from(regions).sort();
};
