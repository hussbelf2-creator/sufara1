/* منصة سفير storefront — mock catalogue. Static display data only (no backend yet). */

export const storeHero = {
  eyebrow: 'سوق التصدير السعودي',
  title: 'سوق المنتجات *السعودية*\nللمشترين حول العالم',
  sub: 'تصفّح منتجات مصانع موثّقة في قطاعات متعددة — غذائية وصناعية ومنزلية — بأسعار التجزئة والجملة، وتصلك شحنة واحدة موحّدة من جدة.',
};

/* Headline numbers shown on the storefront band. */
export const storeStats = [
  { value: '9', label: 'قطاعات تصديرية' },
  { value: '+24', label: 'منتجًا موثّقًا' },
  { value: '+30', label: 'سوقًا للتصدير' },
  { value: '100%', label: 'دفع محجوز حتى الاستلام' },
];

/* Third-party inspection & certification marks shown in the storefront trust bar. */
export const verifiedBadges = ['SGS', 'TÜV Rheinland', 'Intertek', 'ISO 9001', 'شهادة حلال'];

export const storeNavLinks = [
  { label: 'الرئيسية', to: '/' },
  { label: 'المتجر', to: '/products' },
  { label: 'دليل المصانع', to: '/factories' },
  { label: 'قارن المنتجات', to: '/compare' },
  { label: 'برنامج السفراء', to: '/#ambassadors' },
  { label: 'كيف نعمل', to: '/#story' },
];

export const trustItems = [
  {
    icon: 'ri-truck-line',
    title: 'شحن موحّد',
    text: 'مستودع تجميع وفحص في جدة، وشحنة واحدة من المصنع حتى بابك.',
  },
  {
    icon: 'ri-shield-check-line',
    title: 'دفع محجوز',
    text: 'أموالك محتجزة حتى تستلم طلبك، ثم تُسوّى للمصنع والسفير.',
  },
  {
    icon: 'ri-price-tag-3-line',
    title: 'سعر نهائي',
    text: 'السعر يعرض الشحن والرسوم المتوقعة، فلا مفاجآت جمركية.',
  },
  {
    icon: 'ri-verified-badge-line',
    title: 'مصنع موثّق',
    text: 'كل مصنع مراجَع بمستنداته وشهاداته قبل نشر أي منتج.',
  },
];

export const categories = [
  {
    id: 'dates',
    name: 'التمور',
    icon: 'ri-plant-line',
    blurb: 'خلاص وسكري ومجدول من واحات المملكة',
    count: 320,
    image:
      'https://readdy.ai/api/search-image?query=Assorted%20premium%20Saudi%20dates%20arranged%20in%20woven%20baskets%20on%20a%20warm%20sand%20market%20table%2C%20soft%20natural%20light%2C%20editorial%20food%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=800&height=600&seq=sta-cat-dates-01&orientation=landscape',
  },
  {
    id: 'oud',
    name: 'العطور والبخور',
    icon: 'ri-fire-line',
    blurb: 'دهن العود والعنبر والبخور المعمول',
    count: 182,
    image:
      'https://readdy.ai/api/search-image?query=Saudi%20oud%20perfume%20vials%20and%20bakhoor%20incense%20arranged%20on%20a%20dark%20wooden%20tray%2C%20warm%20sand%20beige%20background%2C%20soft%20natural%20light%2C%20editorial%20product%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=800&height=600&seq=sta-cat-oud-02&orientation=landscape',
  },
  {
    id: 'coffee',
    name: 'القهوة العربية',
    icon: 'ri-cup-line',
    blurb: 'قهوة بالهيل والزعفران وحبوب محمّصة',
    count: 141,
    image:
      'https://readdy.ai/api/search-image?query=Saudi%20Arabic%20coffee%20dallah%20and%20finjan%20cups%20on%20a%20warm%20sand%20linen%20backdrop%2C%20soft%20natural%20light%2C%20editorial%20product%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=800&height=600&seq=sta-cat-coffee-03&orientation=landscape',
  },
  {
    id: 'fashion',
    name: 'الأزياء والعبايات',
    icon: 'ri-shirt-line',
    blurb: 'عبايات وشيلات بخياطة سعودية',
    count: 264,
    image:
      'https://readdy.ai/api/search-image?query=Elegant%20modest%20Saudi%20abaya%20and%20folded%20shawls%20styled%20on%20warm%20neutral%20tones%2C%20soft%20natural%20light%2C%20editorial%20fashion%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=800&height=600&seq=sta-cat-fashion-04&orientation=landscape',
  },
  {
    id: 'beauty',
    name: 'العناية والجمال',
    icon: 'ri-leaf-line',
    blurb: 'ورد الطائف وصابون حليب الإبل',
    count: 118,
    image:
      'https://readdy.ai/api/search-image?query=Taif%20rose%20petals%20and%20natural%20beauty%20products%20flat%20lay%20on%20a%20warm%20sand%20surface%2C%20soft%20natural%20light%2C%20editorial%20product%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=800&height=600&seq=sta-cat-beauty-05&orientation=landscape',
  },
  {
    id: 'crafts',
    name: 'الهدايا والحرف',
    icon: 'ri-hand-heart-line',
    blurb: 'حرف يدوية ومباخر ودلال وسبح',
    count: 208,
    image:
      'https://readdy.ai/api/search-image?query=Saudi%20handicrafts%20collection%20with%20carved%20wood%20and%20brass%20on%20a%20warm%20sand%20background%2C%20soft%20natural%20light%2C%20editorial%20product%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=800&height=600&seq=sta-cat-crafts-06&orientation=landscape',
  },
  {
    id: 'home',
    name: 'الأثاث والمنزل',
    icon: 'ri-sofa-line',
    blurb: 'مجالس ومفروشات وديكور بلمسة سعودية',
    count: 176,
    image:
      'https://readdy.ai/api/search-image?query=Minimal%20light%20living%20room%20with%20a%20modern%20neutral%20sofa%20and%20woven%20textile%20cushions%20in%20a%20Saudi%20home%2C%20warm%20sand%20and%20soft%20green%20tones%2C%20soft%20natural%20light%2C%20editorial%20interior%20photography%2C%20high%20detail%2C%20muted%20consistent%20palette&width=800&height=600&seq=sta-cat-home-07&orientation=landscape',
  },
  {
    id: 'building',
    name: 'مواد البناء والتشطيب',
    icon: 'ri-building-2-line',
    blurb: 'بلاط وسيراميك وألمنيوم وعوازل معتمدة',
    count: 254,
    image:
      'https://readdy.ai/api/search-image?query=Neatly%20stacked%20porcelain%20tiles%20and%20aluminium%20window%20profiles%20in%20a%20clean%20light%20building%20materials%20showroom%2C%20warm%20sand%20and%20soft%20green%20tones%2C%20soft%20natural%20light%2C%20editorial%20industrial%20photography%2C%20high%20detail%2C%20muted%20consistent%20palette&width=800&height=600&seq=sta-cat-building-08&orientation=landscape',
  },
  {
    id: 'packaging',
    name: 'التغليف والبلاستيك',
    icon: 'ri-archive-2-line',
    blurb: 'كراتين وعلب وحاويات غذائية معتمدة للتصدير',
    count: 132,
    image:
      'https://readdy.ai/api/search-image?query=Kraft%20export%20cartons%20and%20clean%20recycled%20plastic%20food%20containers%20stacked%20on%20a%20light%20table%2C%20warm%20sand%20and%20soft%20green%20tones%2C%20soft%20natural%20light%2C%20editorial%20product%20photography%2C%20high%20detail%2C%20muted%20consistent%20palette&width=800&height=600&seq=sta-cat-packaging-09&orientation=landscape',
  },
  {
    id: 'honey',
    name: 'العسل',
    icon: 'ri-drop-line',
    blurb: 'سدر وسمر وطلح من جبال عسير والباحة',
    count: 0,
    image:
      'https://readdy.ai/api/search-image?query=Saudi%20sidr%20honey%20jars%20with%20honeycomb%20on%20a%20warm%20sand%20linen%20backdrop%2C%20soft%20natural%20light%2C%20editorial%20product%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=800&height=600&seq=safeer-cat-honey-10&orientation=landscape',
  },
];

export const factories = [
  {
    id: 'hasa',
    name: 'مصنع تمور الأحساء',
    city: 'الأحساء',
    since: 1998,
    rating: 4.9,
    products: 64,
    verified: true,
    blurb: 'من أكبر مصانع التمور في الشرق، ومورّد لأسواق الخليج وأوروبا.',
  },
  {
    id: 'oud',
    name: 'بيت عود الرياض',
    city: 'الرياض',
    since: 2005,
    rating: 4.8,
    products: 38,
    verified: true,
    blurb: 'دهن عود معتّق وبخور معمول بمزيج خاص، بتعبئة تصديرية.',
  },
  {
    id: 'fifa',
    name: 'مزارع قهوة فيفا',
    city: 'جازان',
    since: 2011,
    rating: 4.7,
    products: 22,
    verified: true,
    blurb: 'قهوة جبال فيفا من المزارع العالية، محمّصة على دفعات صغيرة.',
  },
  {
    id: 'atelier',
    name: 'أتيليه جدة للأزياء',
    city: 'جدة',
    since: 2014,
    rating: 4.8,
    products: 51,
    verified: true,
    blurb: 'عبايات وشيلات بخياطة دقيقة وقصات عصرية للسوق الدولي.',
  },
  {
    id: 'taif',
    name: 'معامل ورد الطائف',
    city: 'الطائف',
    since: 2009,
    rating: 4.9,
    products: 29,
    verified: true,
    blurb: 'تقطير ورد الطائف وعطور مركّزة بخلاصة طبيعية.',
  },
  {
    id: 'hejaz',
    name: 'حرف الحجاز اليدوية',
    city: 'مكة المكرمة',
    since: 2016,
    rating: 4.6,
    products: 44,
    verified: true,
    blurb: 'ورش حرف يدوية: دلال نحاسية، ومباخر، وسجاد، ومسابح.',
  },
  {
    id: 'najd',
    name: 'مصانع نجد للأثاث',
    city: 'الرياض',
    since: 2007,
    rating: 4.7,
    products: 41,
    verified: true,
    blurb: 'مجالس وكراسي ومفروشات بخياطة سعودية، بتصاميم تناسب المنازل والمقاهي.',
  },
  {
    id: 'yanbu',
    name: 'ينبع لمواد البناء',
    city: 'ينبع',
    since: 2003,
    rating: 4.6,
    products: 58,
    verified: true,
    blurb: 'بلاط وسيراميك وعوازل وألمنيوم معتمد للمشاريع والمقاولين في أسواق التصدير.',
  },
  {
    id: 'pack',
    name: 'جدة للتغليف والبلاستيك',
    city: 'جدة',
    since: 2012,
    rating: 4.8,
    products: 36,
    verified: true,
    blurb: 'كراتين تصدير وعلب وحاويات غذائية بمواد معتمدة وقابلة لإعادة التدوير.',
  },
];

export const galleryExtras = [
  'https://readdy.ai/api/search-image?query=Saudi%20export%20warehouse%20with%20neatly%20stacked%20kraft%20cartons%20ready%20for%20shipping%2C%20warm%20sand%20beige%20tones%2C%20soft%20natural%20light%2C%20editorial%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=900&height=900&seq=sta-detail-warehouse-01&orientation=squarish',
  'https://readdy.ai/api/search-image?query=Hands%20wrapping%20a%20Saudi%20product%20in%20kraft%20paper%20with%20a%20folded%20note%2C%20warm%20sand%20beige%20surface%2C%20soft%20natural%20light%2C%20editorial%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=900&height=900&seq=sta-detail-wrapping-02&orientation=squarish',
  'https://readdy.ai/api/search-image?query=Quality%20inspection%20table%20with%20a%20Saudi%20product%20and%20a%20clipboard%20on%20a%20warm%20sand%20background%2C%20soft%20natural%20light%2C%20editorial%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=900&height=900&seq=sta-detail-inspection-03&orientation=squarish',
];

export const products = [
  {
    id: 'dates-khalas',
    name: 'تمر خلاص الأحساء الفاخر — 1 كجم',
    categoryId: 'dates',
    factoryId: 'hasa',
    price: 89,
    compareAt: 110,
    rating: 4.9,
    reviews: 412,
    image:
      'https://readdy.ai/api/search-image?query=Premium%20Saudi%20Khalas%20dates%20piled%20in%20a%20shallow%20ceramic%20bowl%20with%20a%20kraft%20export%20carton%20behind%2C%20warm%20sand%20beige%20minimal%20studio%20background%2C%20soft%20natural%20light%2C%20editorial%20product%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=900&height=900&seq=sta-prod-dates-khalas-01&orientation=squarish',
    tags: ['الأكثر مبيعًا', 'مصنع موثّق'],
    shortDesc: 'تمر خلاص بدرجة أولى، مختار يدويًا ومعبّأ في كرتون تصدير.',
    description:
      'من واحات الأحساء، تمر خلاص بدرجة أولى يُنتقى يدويًا ويُعبّأ مباشرة بعد الفرز في كرتون تصدير محكم يحفظ الرطوبة. حلاوة طبيعية متوازنة، وقوام ناعم، ومذاق يصل كما خرج من المصنع.',
    weight: '1 كجم',
    hs: '0804.10',
    origin: 'المملكة العربية السعودية',
    stock: 1200,
    featured: true,
    bestseller: true,
    wholesale: { moq: 50, tiers: [{ min: 50, max: 199, price: 62 }, { min: 200, max: 999, price: 55 }, { min: 1000, max: 0, price: 48 }] },
  },
  {
    id: 'dates-sukkari',
    name: 'تمر سكري القصيم الملكي — 1 كجم',
    categoryId: 'dates',
    factoryId: 'hasa',
    price: 129,
    rating: 4.8,
    reviews: 268,
    image:
      'https://readdy.ai/api/search-image?query=Golden%20Saudi%20Sukkari%20dates%20arranged%20neatly%20on%20a%20small%20wooden%20plate%2C%20warm%20sand%20beige%20minimal%20studio%20background%2C%20soft%20natural%20light%2C%20editorial%20product%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=900&height=900&seq=sta-prod-dates-sukkari-02&orientation=squarish',
    tags: ['تصدير'],
    shortDesc: 'سكري القصيم بحبات كبيرة ولون ذهبي ومذاق عسلي.',
    description:
      'تمر سكري من نخيل القصيم بحبات كبيرة ولون ذهبي فاتح، ومذاق عسلي غني. يُجفّف بطريقة تحافظ على طراوته، ويأتي في عبوة تصديرية جاهزة للعرض على الرف.',
    weight: '1 كجم',
    hs: '0804.10',
    origin: 'المملكة العربية السعودية',
    stock: 860,
    featured: true,
    wholesale: { moq: 50, tiers: [{ min: 50, max: 199, price: 92 }, { min: 200, max: 999, price: 84 }, { min: 1000, max: 0, price: 76 }] },
  },
  {
    id: 'dates-choco',
    name: 'تمر مجدول محشو بالشوكولاتة — 500 جم',
    categoryId: 'dates',
    factoryId: 'hasa',
    price: 75,
    rating: 4.7,
    reviews: 156,
    image:
      'https://readdy.ai/api/search-image?query=Saudi%20dates%20stuffed%20with%20dark%20chocolate%20lined%20up%20on%20a%20matte%20plate%2C%20warm%20sand%20beige%20studio%20background%2C%20soft%20natural%20light%2C%20editorial%20product%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=900&height=900&seq=sta-prod-dates-choco-03&orientation=squarish',
    tags: ['جديد'],
    shortDesc: 'مجدول محشو بشوكولاتة داكنة، مثالي للهدايا والضيافة.',
    description:
      'تمر مجدول طري محشو بشوكولاتة داكنة عالية المحتوى الكاكاوي، ويُقدّم في عبوة أنيقة تصلح للإهداء. توازن مثالي بين حلاوة التمر ومرارة الشوكولاتة.',
    weight: '500 جم',
    hs: '1806.90',
    origin: 'المملكة العربية السعودية',
    stock: 540,
    isNew: true,
    wholesale: { moq: 40, tiers: [{ min: 40, max: 199, price: 52 }, { min: 200, max: 0, price: 45 }] },
  },
  {
    id: 'dates-giftbox',
    name: 'علبة هدايا التمور المشكّلة — 1.5 كجم',
    categoryId: 'dates',
    factoryId: 'hasa',
    price: 189,
    compareAt: 230,
    rating: 5,
    reviews: 331,
    image:
      'https://readdy.ai/api/search-image?query=Elegant%20gift%20box%20of%20assorted%20Saudi%20dates%20with%20a%20folded%20kraft%20lid%20and%20ribbon%2C%20warm%20sand%20beige%20studio%20background%2C%20soft%20natural%20light%2C%20editorial%20product%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=900&height=900&seq=sta-prod-dates-gift-04&orientation=squarish',
    tags: ['هدية', 'الأكثر مبيعًا'],
    shortDesc: 'تشكيلة من أفخر الأصناف في علبة هدايا كرافت أنيقة.',
    description:
      'علبة هدايا تجمع خمسة أصناف من أفخر تمور المملكة، مرتّبة في فواصل خشبية داخل علبة كرافت مطويّة بشريط. الخيار الأشهر للإهداء في المناسبات والأعياد.',
    weight: '1.5 كجم',
    hs: '0804.10',
    origin: 'المملكة العربية السعودية',
    stock: 410,
    featured: true,
    bestseller: true,
    wholesale: { moq: 24, tiers: [{ min: 24, max: 99, price: 138 }, { min: 100, max: 0, price: 122 }] },
  },
  {
    id: 'oud-dehn',
    name: 'دهن عود كمبودي معتّق — 3 مل',
    categoryId: 'oud',
    factoryId: 'oud',
    price: 480,
    rating: 4.9,
    reviews: 89,
    image:
      'https://readdy.ai/api/search-image?query=Small%20glass%20vial%20of%20aged%20Cambodian%20oud%20oil%20with%20a%20wooden%20cap%2C%20warm%20sand%20beige%20studio%20background%2C%20soft%20natural%20light%2C%20editorial%20product%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=900&height=900&seq=sta-prod-oud-dehn-05&orientation=squarish',
    tags: ['فاخر'],
    shortDesc: 'دهن عود كمبودي معتّق بثبات عالٍ وقاعدة خشبية دافئة.',
    description:
      'دهن عود كمبودي معتّق سنوات، يُقدّم في قارورة زجاجية صغيرة بسدادة خشبية. يبدأ برائحة خشبية دافئة ثم يستقر على قاعدة عميقة تدوم طويلًا على الثوب.',
    weight: '3 مل',
    hs: '3303.00',
    origin: 'المملكة العربية السعودية',
    stock: 180,
    featured: true,
    wholesale: { moq: 12, tiers: [{ min: 12, max: 49, price: 385 }, { min: 50, max: 0, price: 350 }] },
  },
  {
    id: 'oud-bakhoor',
    name: 'بخور معمول فاخر — 100 جم',
    categoryId: 'oud',
    factoryId: 'oud',
    price: 260,
    rating: 4.8,
    reviews: 143,
    image:
      'https://readdy.ai/api/search-image?query=Handmade%20Saudi%20bakhoor%20incense%20chips%20in%20a%20small%20ceramic%20dish%20with%20gentle%20smoke%2C%20warm%20sand%20beige%20studio%20background%2C%20soft%20natural%20light%2C%20editorial%20product%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=900&height=900&seq=sta-prod-oud-bakhoor-06&orientation=squarish',
    tags: ['مصنع موثّق'],
    shortDesc: 'بخور معمول بدهن العود والعنبر والمسك الأبيض.',
    description:
      'بخور معمول يدويًا بمزيج من دهن العود والعنبر والمسك الأبيض، يُحرق على الفحم فينشر رائحة دافئة تملأ المجلس. يأتي في علبة محكمة تحفظ الرائحة مدة طويلة.',
    weight: '100 جم',
    hs: '3307.41',
    origin: 'المملكة العربية السعودية',
    stock: 320,
    wholesale: { moq: 20, tiers: [{ min: 20, max: 99, price: 198 }, { min: 100, max: 0, price: 176 }] },
  },
  {
    id: 'oud-mabkhara',
    name: 'مبخرة خشبية منقوشة',
    categoryId: 'oud',
    factoryId: 'hejaz',
    price: 210,
    rating: 4.6,
    reviews: 97,
    image:
      'https://readdy.ai/api/search-image?query=Carved%20wooden%20mabkhara%20incense%20burner%20standing%20alone%2C%20warm%20sand%20beige%20studio%20background%2C%20soft%20natural%20light%2C%20editorial%20product%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=900&height=900&seq=sta-prod-oud-mabkhara-07&orientation=squarish',
    tags: ['حرف يدوية'],
    shortDesc: 'مبخرة من خشب صلب بنقش يدوي حجازي تقليدي.',
    description:
      'مبخرة مصنوعة من خشب صلب منقوش يدويًا بنقوش حجازية تقليدية، بقاعدة ثابتة وحوض مقاوم للحرارة. قطعة عملية وجميلة لزاوية الضيافة في أي منزل.',
    weight: '450 جم',
    hs: '4420.10',
    origin: 'المملكة العربية السعودية',
    stock: 140,
    wholesale: { moq: 24, tiers: [{ min: 24, max: 119, price: 158 }, { min: 120, max: 0, price: 139 }] },
  },
  {
    id: 'beauty-rose',
    name: 'عطر ورد الطائف المركّز — 50 مل',
    categoryId: 'beauty',
    factoryId: 'taif',
    price: 340,
    rating: 4.9,
    reviews: 205,
    image:
      'https://readdy.ai/api/search-image?query=Elegant%20glass%20flacon%20of%20Taif%20rose%20perfume%20with%20a%20golden%20stopper%2C%20warm%20sand%20beige%20studio%20background%2C%20soft%20natural%20light%2C%20editorial%20product%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=900&height=900&seq=sta-prod-beauty-rose-08&orientation=squarish',
    tags: ['الأكثر مبيعًا'],
    shortDesc: 'ورد الطائف المركّز بخلاصة طبيعية وزهور مختارة.',
    description:
      'عطر مركّز مستخلص من ورد الطائف المنتقى عند الفجر، بخلاصة طبيعية عالية التركيز. رائحة زهرية نظيفة تدوم طويلًا وتناسب الجو الحار والرطب في بلدان الاستيراد.',
    weight: '50 مل',
    hs: '3303.00',
    origin: 'المملكة العربية السعودية',
    stock: 260,
    featured: true,
    wholesale: { moq: 12, tiers: [{ min: 12, max: 59, price: 268 }, { min: 60, max: 0, price: 242 }] },
  },
  {
    id: 'beauty-soap',
    name: 'صابون حليب الإبل الطبيعي — 3 قطع',
    categoryId: 'beauty',
    factoryId: 'taif',
    price: 95,
    rating: 4.5,
    reviews: 78,
    image:
      'https://readdy.ai/api/search-image?query=Three%20bars%20of%20natural%20camel%20milk%20soap%20stacked%20with%20a%20linen%20wrap%2C%20warm%20sand%20beige%20studio%20background%2C%20soft%20natural%20light%2C%20editorial%20product%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=900&height=900&seq=sta-prod-beauty-soap-09&orientation=squarish',
    tags: ['طبيعي'],
    shortDesc: 'صابون مصنوع من حليب الإبل وزيت الزيتون للبشرة الجافة.',
    description:
      'صابون طبيعي مصنوع من حليب الإبل وزيت الزيتون وزبدة الشيا، مناسب للبشرة الجافة والحساسة. خالٍ من الكبريت والملونات الصناعية، ومغلّف بغطاء كتان.',
    weight: '3 × 120 جم',
    hs: '3401.11',
    origin: 'المملكة العربية السعودية',
    stock: 430,
    wholesale: { moq: 36, tiers: [{ min: 36, max: 199, price: 68 }, { min: 200, max: 0, price: 58 }] },
  },
  {
    id: 'coffee-arabic',
    name: 'قهوة عربية بالهيل والزعفران — 250 جم',
    categoryId: 'coffee',
    factoryId: 'fifa',
    price: 65,
    rating: 4.8,
    reviews: 512,
    image:
      'https://readdy.ai/api/search-image?query=Saudi%20Arabic%20coffee%20ground%20with%20cardamom%20and%20saffron%20beside%20a%20small%20brass%20finjan%2C%20warm%20sand%20beige%20studio%20background%2C%20soft%20natural%20light%2C%20editorial%20product%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=900&height=900&seq=sta-prod-coffee-arabic-10&orientation=squarish',
    tags: ['الأكثر مبيعًا'],
    shortDesc: 'قهوة مطحونة بالهيل والزعفران، جاهزة للدلة.',
    description:
      'قهوة عربية مطحونة بمزيج متوازن من الهيل والزعفران، تُحضّر في الدلة وتُقدّم في الفناجين. المذاق اللي نعرفه في المملكة، معبّأ في كيس صمّام يحفظ النكهة.',
    weight: '250 جم',
    hs: '0901.21',
    origin: 'المملكة العربية السعودية',
    stock: 1500,
    featured: true,
    bestseller: true,
    wholesale: { moq: 60, tiers: [{ min: 60, max: 299, price: 44 }, { min: 300, max: 0, price: 38 }] },
  },
  {
    id: 'coffee-beans',
    name: 'حبوب قهوة فيفا محمّصة متوسطة — 500 جم',
    categoryId: 'coffee',
    factoryId: 'fifa',
    price: 95,
    rating: 4.7,
    reviews: 188,
    image:
      'https://readdy.ai/api/search-image?query=Roasted%20Fifa%20coffee%20beans%20spilling%20from%20a%20kraft%20paper%20bag%2C%20warm%20sand%20beige%20studio%20background%2C%20soft%20natural%20light%2C%20editorial%20product%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=900&height=900&seq=sta-prod-coffee-beans-11&orientation=squarish',
    tags: ['محمّص طازج'],
    shortDesc: 'حبوب من مزارع فيفا العالية، محمّصة على دفعات صغيرة.',
    description:
      'حبوب قهوة من مزارع فيفا الجبلية على ارتفاع يمنحها حموضة مشرقة وقوامًا ناعمًا. تُحمّص على دفعات صغيرة قبل الشحن لتصلك في ذروة نكهتها.',
    weight: '500 جم',
    hs: '0901.11',
    origin: 'المملكة العربية السعودية',
    stock: 640,
    wholesale: { moq: 40, tiers: [{ min: 40, max: 199, price: 68 }, { min: 200, max: 0, price: 60 }] },
  },
  {
    id: 'coffee-dallah',
    name: 'دلة قهوة نحاسية منقوشة',
    categoryId: 'coffee',
    factoryId: 'hejaz',
    price: 320,
    rating: 4.9,
    reviews: 64,
    image:
      'https://readdy.ai/api/search-image?query=Hand%20engraved%20brass%20Arabic%20coffee%20dallah%20pot%20with%20a%20curved%20spout%2C%20warm%20sand%20beige%20studio%20background%2C%20soft%20natural%20light%2C%20editorial%20product%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=900&height=900&seq=sta-prod-coffee-dallah-12&orientation=squarish',
    tags: ['حرف يدوية'],
    shortDesc: 'دلة نحاسية منقوشة يدويًا، قطعة ضيافة أصيلة.',
    description:
      'دلة من النحاس الخالص منقوشة يدويًا بنقوش حجازية، تُستخدم للقهوة العربية أو كقطعة ضيافة فاخرة. تبطن من الداخل لحفظ الحرارة ومنع التأكسد.',
    weight: '1.2 كجم',
    hs: '7418.10',
    origin: 'المملكة العربية السعودية',
    stock: 96,
    featured: true,
    wholesale: { moq: 12, tiers: [{ min: 12, max: 59, price: 252 }, { min: 60, max: 0, price: 226 }] },
  },
  {
    id: 'fashion-abaya',
    name: 'عباية كريب سادة بقصة عصرية',
    categoryId: 'fashion',
    factoryId: 'atelier',
    price: 290,
    rating: 4.7,
    reviews: 176,
    image:
      'https://readdy.ai/api/search-image?query=Minimal%20black%20crepe%20abaya%20neatly%20folded%20on%20a%20warm%20neutral%20surface%2C%20soft%20natural%20light%2C%20editorial%20fashion%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=900&height=900&seq=sta-prod-fashion-abaya-13&orientation=squarish',
    tags: ['تصدير'],
    shortDesc: 'عباية كريب خفيفة بقصة واسعة تناسب الجو الحار.',
    description:
      'عباية من الكريب الخفيف بقصة واسعة وأكمام عملية، تناسب الطقس الحار والرطب. خياطة نظيفة وحواشٍ مثبّتة، وتأتي بثلاثة مقاسات جاهزة للتصدير.',
    weight: '600 جم',
    hs: '6204.43',
    origin: 'المملكة العربية السعودية',
    stock: 340,
    wholesale: { moq: 30, tiers: [{ min: 30, max: 149, price: 214 }, { min: 150, max: 0, price: 192 }] },
  },
  {
    id: 'fashion-sheila',
    name: 'شيلة مطرّزة بخيوط ذهبية',
    categoryId: 'fashion',
    factoryId: 'atelier',
    price: 240,
    rating: 4.6,
    reviews: 92,
    image:
      'https://readdy.ai/api/search-image?query=Embroidered%20black%20sheila%20shawl%20with%20subtle%20gold%20thread%20folds%2C%20warm%20sand%20beige%20surface%2C%20soft%20natural%20light%2C%20editorial%20fashion%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=900&height=900&seq=sta-prod-fashion-sheila-14&orientation=squarish',
    tags: ['جديد'],
    shortDesc: 'شيلة ناعمة بحواشٍ مطرّزة بخيط ذهبي.',
    description:
      'شيلة من قماش ناعم مطرّزة يدويًا بخيط ذهبي على الحواشي، تكمل إطلالة العباية في المناسبات. خفيفة على الرأس ولا تشفّ، ومتوفرة بعدة ألوان هادئة.',
    weight: '300 جم',
    hs: '6214.30',
    origin: 'المملكة العربية السعودية',
    stock: 280,
    isNew: true,
    wholesale: { moq: 30, tiers: [{ min: 30, max: 149, price: 176 }, { min: 150, max: 0, price: 158 }] },
  },
  {
    id: 'fashion-set',
    name: 'طقم عباية وشيلة مخمل — إصدار محدود',
    categoryId: 'fashion',
    factoryId: 'atelier',
    price: 420,
    rating: 4.8,
    reviews: 58,
    image:
      'https://readdy.ai/api/search-image?query=Elegant%20matching%20abaya%20and%20shawl%20set%20in%20deep%20green%20velvet%20folded%20flat%2C%20warm%20sand%20beige%20surface%2C%20soft%20natural%20light%2C%20editorial%20fashion%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=900&height=900&seq=sta-prod-fashion-set-15&orientation=squarish',
    tags: ['فاخر'],
    shortDesc: 'طقم مخمل بلون أخضر غامق، إصدار محدود للمناسبات.',
    description:
      'طقم من المخمل الفاخر بلون أخضر غامق يضم عباية وشيلة متناسقتين، بتفاصيل مطرّزة على الأكمام. إصدار محدود بكمية إنتاج صغيرة لكل مقاس.',
    weight: '1 كجم',
    hs: '6204.43',
    origin: 'المملكة العربية السعودية',
    stock: 74,
    wholesale: { moq: 20, tiers: [{ min: 20, max: 79, price: 318 }, { min: 80, max: 0, price: 288 }] },
  },
  {
    id: 'crafts-rug',
    name: 'سجادة صلاة مخملية مبطّنة',
    categoryId: 'crafts',
    factoryId: 'hejaz',
    price: 150,
    rating: 4.8,
    reviews: 240,
    image:
      'https://readdy.ai/api/search-image?query=Padded%20velvet%20prayer%20rug%20rolled%20neatly%20with%20a%20soft%20tassel%2C%20warm%20sand%20beige%20studio%20background%2C%20soft%20natural%20light%2C%20editorial%20product%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=900&height=900&seq=sta-prod-crafts-rug-16&orientation=squarish',
    tags: ['الأكثر مبيعًا'],
    shortDesc: 'سجادة مخملية مبطّنة بقاعدة مانعة للانزلاق.',
    description:
      'سجادة صلاة من المخمل المبطّن بقاعدة مانعة للانزلاق، راحة أكبر للسجود على الأرضيات الصلبة. تأتي مطويّة في حافظة أنيقة تسهل حملها في السفر والحج.',
    weight: '650 جم',
    hs: '5702.50',
    origin: 'المملكة العربية السعودية',
    stock: 620,
    bestseller: true,
    wholesale: { moq: 40, tiers: [{ min: 40, max: 199, price: 108 }, { min: 200, max: 0, price: 96 }] },
  },
  {
    id: 'crafts-misbaha',
    name: 'مسبحة كهرمان طبيعي — 33 حبة',
    categoryId: 'crafts',
    factoryId: 'hejaz',
    price: 130,
    rating: 4.6,
    reviews: 111,
    image:
      'https://readdy.ai/api/search-image?query=Amber%20rosary%20prayer%20beads%20coiled%20gracefully%20on%20a%20small%20tray%2C%20warm%20sand%20beige%20studio%20background%2C%20soft%20natural%20light%2C%20editorial%20product%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=900&height=900&seq=sta-prod-crafts-misbaha-17&orientation=squarish',
    tags: ['حرف يدوية'],
    shortDesc: 'مسبحة من الكهرمان الطبيعي بشكل دائري ناعم.',
    description:
      'مسبحة من 33 حبة كهرمان طبيعي بشكل دائري مصقول، بخيط متين وعلامة فصل أنيقة. قطعة هدية محبوبة ومتينة للاستخدام اليومي.',
    weight: '60 جم',
    hs: '7116.20',
    origin: 'المملكة العربية السعودية',
    stock: 380,
    wholesale: { moq: 50, tiers: [{ min: 50, max: 249, price: 92 }, { min: 250, max: 0, price: 82 }] },
  },
  {
    id: 'crafts-coffee-set',
    name: 'طقم ضيافة عربي — دلة و6 فناجين',
    categoryId: 'crafts',
    factoryId: 'hejaz',
    price: 450,
    rating: 4.9,
    reviews: 73,
    image:
      'https://readdy.ai/api/search-image?query=Arabic%20coffee%20hospitality%20set%20with%20brass%20dallah%20and%20six%20small%20finjan%20cups%2C%20warm%20sand%20beige%20studio%20background%2C%20soft%20natural%20light%2C%20editorial%20product%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=900&height=900&seq=sta-prod-crafts-coffeeset-18&orientation=squarish',
    tags: ['هدية', 'فاخر'],
    shortDesc: 'طقم ضيافة كامل: دلة نحاسية وستة فناجين على صينية.',
    description:
      'طقم ضيافة عربي متكامل يضم دلة نحاسية منقوشة وستة فناجين وصينية مطابقة، في علبة هدايا محكمة. جاهز للتقديم مباشرة أو الإهداء.',
    weight: '2.4 كجم',
    hs: '7418.10',
    origin: 'المملكة العربية السعودية',
    stock: 88,
    featured: true,
    wholesale: { moq: 10, tiers: [{ min: 10, max: 49, price: 352 }, { min: 50, max: 0, price: 318 }] },
  },
  {
    id: 'home-majlis',
    name: 'مجلس أرضي مبطّن بقماش مقاوم — 3 مقاعد',
    categoryId: 'home',
    factoryId: 'najd',
    price: 1450,
    rating: 4.7,
    reviews: 46,
    image:
      'https://readdy.ai/api/search-image?query=Modern%20low%20Saudi%20majlis%20floor%20seating%20with%20neutral%20upholstered%20cushions%20and%20woven%20throws%2C%20warm%20sand%20beige%20studio%20background%2C%20soft%20natural%20light%2C%20editorial%20furniture%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=900&height=900&seq=sta-prod-home-majlis-19&orientation=squarish',
    tags: ['مصنع موثّق', 'فاخر'],
    shortDesc: 'مجلس أرضي مبطّن بإسفنج عالي الكثافة وقماش مقاوم للبقع.',
    description:
      'مجلس أرضي مصنوع من خشب صلب مبطن بإسفنج عالي الكثافة وقماش مقاوم للبقع، بقاعدة مريحة تناسب الجلسات الطويلة. يأتي قابلاً للفك في وحدات سهلة الشحن الدولي، مع إمكانية تخصيص اللون والمقاس.',
    weight: '32 كجم',
    hs: '9403.60',
    origin: 'المملكة العربية السعودية',
    stock: 120,
    wholesale: { moq: 10, tiers: [{ min: 10, max: 49, price: 1180 }, { min: 50, max: 0, price: 1050 }] },
  },
  {
    id: 'home-linen',
    name: 'طقم مفارش سرير قطن مصري مطرّز — 6 أفراد',
    categoryId: 'home',
    factoryId: 'najd',
    price: 260,
    rating: 4.6,
    reviews: 88,
    image:
      'https://readdy.ai/api/search-image?query=Folded%20embroidered%20Egyptian%20cotton%20bed%20linen%20set%20in%20soft%20neutral%20tones%2C%20warm%20sand%20beige%20studio%20background%2C%20soft%20natural%20light%2C%20editorial%20textile%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=900&height=900&seq=sta-prod-home-linen-20&orientation=squarish',
    tags: ['جديد'],
    shortDesc: 'مفارش قطن مصري بغزل عالي وتطريز يدوي أنيق.',
    description:
      'طقم مفارش من القطن المصري طويل التيلة بغزل عالٍ وملمس ناعم يتحمّل الغسيل المتكرر. تطريز يدوي على الحواشي بلمسة هادئة، ويأتي مغلّفًا في علبة مناسبة للبيع بالتجزئة.',
    weight: '2.4 كجم',
    hs: '6302.21',
    origin: 'المملكة العربية السعودية',
    stock: 480,
    isNew: true,
    wholesale: { moq: 24, tiers: [{ min: 24, max: 119, price: 196 }, { min: 120, max: 0, price: 176 }] },
  },
  {
    id: 'building-porcelain',
    name: 'بلاط بورسلان مطفي 60×60 — للمتر المربع',
    categoryId: 'building',
    factoryId: 'yanbu',
    price: 78,
    rating: 4.6,
    reviews: 132,
    image:
      'https://readdy.ai/api/search-image?query=Matte%20grey%20porcelain%20floor%20tiles%20neatly%20stacked%20with%20a%20single%20tile%20standing%20in%20front%2C%20light%20showroom%20background%2C%20soft%20natural%20light%2C%20editorial%20industrial%20photography%2C%20high%20detail%2C%20neutral%20palette&width=900&height=900&seq=sta-prod-building-porcelain-21&orientation=squarish',
    tags: ['تصدير', 'معتمد'],
    shortDesc: 'بورسلان مطفي عالي المقاومة للأرضيات الداخلية والخارجية.',
    description:
      'بلاط بورسلان مطفي بمقاس 60×60 سم ومقاومة عالية للخدش والانزلاق، مناسب للأرضيات الداخلية والمداخل والمشاريع التجارية. مطابق للمواصفات السعودية والخليجية، ويتوفّر بكميات المشاريع.',
    weight: '18 كجم/م²',
    hs: '6907.21',
    origin: 'المملكة العربية السعودية',
    stock: 9000,
    featured: true,
    wholesale: { moq: 500, tiers: [{ min: 500, max: 4999, price: 58 }, { min: 5000, max: 0, price: 49 }] },
  },
  {
    id: 'building-aluminium',
    name: 'نافذة ألمنيوم مزدوجة العزل — 120×100 سم',
    categoryId: 'building',
    factoryId: 'yanbu',
    price: 640,
    rating: 4.5,
    reviews: 61,
    image:
      'https://readdy.ai/api/search-image?query=Double%20glazed%20aluminium%20window%20frame%20with%20clean%20lines%20leaning%20in%20a%20light%20showroom%2C%20soft%20natural%20light%2C%20editorial%20industrial%20photography%2C%20high%20detail%2C%20neutral%20palette&width=900&height=900&seq=sta-prod-building-aluminium-22&orientation=squarish',
    tags: ['تصدير'],
    shortDesc: 'نافذة ألمنيوم بزجاج مزدوج يعزل الحرارة والصوت.',
    description:
      'نافذة ألمنيوم بقطاع مؤكسد وزجاج مزدوج معزول يخفض الحرارة والصوت، مع إكسسوارات مقاومة للصدأ. تُصنَّع بمقاسات حسب الطلب وتشحن مفكوكة لتسهيل الشحن والتجميع في موقع المشروع.',
    weight: '22 كجم',
    hs: '7610.10',
    origin: 'المملكة العربية السعودية',
    stock: 260,
    wholesale: { moq: 20, tiers: [{ min: 20, max: 99, price: 520 }, { min: 100, max: 0, price: 470 }] },
  },
  {
    id: 'pack-carton',
    name: 'كرتون تصدير ثلاثي الطبقات — مقاس وسط',
    categoryId: 'packaging',
    factoryId: 'pack',
    price: 6.5,
    rating: 4.8,
    reviews: 274,
    image:
      'https://readdy.ai/api/search-image?query=Stacked%20kraft%20corrugated%20export%20cartons%20with%20a%20single%20box%20open%20on%20a%20light%20table%2C%20soft%20natural%20light%2C%20editorial%20product%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=900&height=900&seq=sta-prod-pack-carton-23&orientation=squarish',
    tags: ['تصدير', 'الأكثر مبيعًا'],
    shortDesc: 'كرتون مموّج ثلاثي الطبقات بقوّة تحمّل عالية للشحن.',
    description:
      'كرتون تصدير مموّج ثلاثي الطبقات بقوّة تحمّل عالية يناسب الشحن الجوي والبحري، ويُطبع عليه الاسم والشعار عند الطلب. مقاس وسط مناسب لتغليف التمور والعطور والهدايا.',
    weight: '320 جم',
    hs: '4819.10',
    origin: 'المملكة العربية السعودية',
    stock: 40000,
    bestseller: true,
    wholesale: { moq: 500, tiers: [{ min: 500, max: 4999, price: 4.2 }, { min: 5000, max: 0, price: 3.4 }] },
  },
  {
    id: 'pack-container',
    name: 'حاوية تخزين غذائية شفافة — 1 لتر',
    categoryId: 'packaging',
    factoryId: 'pack',
    price: 9,
    rating: 4.7,
    reviews: 153,
    image:
      'https://readdy.ai/api/search-image?query=Clear%20plastic%20food%20storage%20containers%20with%20sealed%20lids%20lined%20up%20on%20a%20light%20table%2C%20soft%20natural%20light%2C%20editorial%20product%20photography%2C%20high%20detail%2C%20neutral%20palette&width=900&height=900&seq=sta-prod-pack-container-24&orientation=squarish',
    tags: ['معتمد للغذاء'],
    shortDesc: 'حاويات شفافة بغطاء محكم من مواد آمنة للغذاء.',
    description:
      'حاوية تخزين شفافة بغطاء محكم الإغلاق مصنوعة من مادة آمنة للاستخدام الغذائي وقابلة لإعادة التدوير، مقاومة للتشقق ومناسبة للتبريد والاستخدام اليومي. تُشحن بكميات المصانع والمتاجر.',
    weight: '90 جم',
    hs: '3924.10',
    origin: 'المملكة العربية السعودية',
    stock: 25000,
    wholesale: { moq: 1000, tiers: [{ min: 1000, max: 9999, price: 5.5 }, { min: 10000, max: 0, price: 4.4 }] },
  },
];

export const sortOptions = [
  { value: 'featured', label: 'الأكثر رواجًا' },
  { value: 'new', label: 'الأحدث' },
  { value: 'price-asc', label: 'السعر: من الأقل' },
  { value: 'price-desc', label: 'السعر: من الأعلى' },
  { value: 'rating', label: 'الأعلى تقييمًا' },
];

export const storeFootCols = [
  {
    title: 'المتجر',
    links: [
      { label: 'كل المنتجات', to: '/products' },
      { label: 'التمور', to: '/products?category=dates' },
      { label: 'العطور والبخور', to: '/products?category=oud' },
      { label: 'القهوة العربية', to: '/products?category=coffee' },
    ],
  },
  {
    title: 'المنصة',
    links: [
      { label: 'كيف نعمل', to: '/#story' },
      { label: 'برنامج السفراء', to: '/#ambassadors' },
      { label: 'الشحن واللوجستيات', to: '/#logistics' },
      { label: 'الأرقام', to: '/#numbers' },
    ],
  },
  {
    title: 'للمصانع',
    links: [
      { label: 'انضم كمصنع', to: '/#join' },
      { label: 'كيف نوثّق المصانع', to: '/#faq' },
      { label: 'مؤشر جاهزية التصدير', to: '/#numbers' },
      { label: 'دليل المصانع', to: '/factories' },
    ],
  },
];

/* Countries + destination ports offered in the merchant RFQ form. */
export const rfqCountries = [
  { code: 'pk', name: 'باكستان', ports: ['ميناء كراتشي', 'ميناء قاسم', 'ميناء جوادر'] },
  { code: 'eg', name: 'مصر', ports: ['ميناء الإسكندرية', 'ميناء بورسعيد', 'ميناء دمياط'] },
  { code: 'id', name: 'إندونيسيا', ports: ['ميناء تانجونج بريوك — جاكرتا', 'ميناء سورابايا', 'ميناء بيلاوان'] },
  { code: 'my', name: 'ماليزيا', ports: ['ميناء كلانج', 'ميناء بينانج'] },
  { code: 'tr', name: 'تركيا', ports: ['ميناء مرسين', 'ميناء إسطنبول', 'ميناء إزمير'] },
  { code: 'bd', name: 'بنغلاديش', ports: ['ميناء شيتاغونغ'] },
  { code: 'ae', name: 'الإمارات', ports: ['ميناء جبل علي', 'ميناء خالد'] },
  { code: 'jo', name: 'الأردن', ports: ['ميناء العقبة'] },
  { code: 'ma', name: 'المغرب', ports: ['ميناء طنجة المتوسط', 'ميناء الدار البيضاء'] },
  { code: 'ng', name: 'نيجيريا', ports: ['ميناء لاغوس'] },
  { code: 'ke', name: 'كينيا', ports: ['ميناء مومباسا'] },
  { code: 'gb', name: 'المملكة المتحدة', ports: ['ميناء فيليكستو', 'ميناء ساوثهامبتون'] },
  { code: 'fr', name: 'فرنسا', ports: ['ميناء مارسيليا', 'ميناء لوهافر'] },
  { code: 'de', name: 'ألمانيا', ports: ['ميناء هامبورغ', 'ميناء بريمن'] },
  { code: 'us', name: 'الولايات المتحدة', ports: ['ميناء نيويورك / نيوجيرسي', 'ميناء لوس أنجلوس', 'ميناء هيوستن'] },
  { code: 'za', name: 'جنوب أفريقيا', ports: ['ميناء دوربان'] },
];

export const rfqIncoterms = ['EXW', 'FOB', 'CIF', 'DDP'];

/* Promo / discount codes accepted in the cart and at checkout. */
/* Platform-funded codes. Every percent is capped at PlatformConfig.promo.capRate
   (4%) at runtime, so a code can never cost more than the decided ceiling. */
export const promoCodes = [
  {
    code: 'SAFEER4',
    label: 'خصم ٤٪',
    description: 'خصم 4% على قيمة المنتجات في أي طلب تجزئة.',
    kind: 'percent',
    value: 4,
    minSubtotal: 0,
  },
  {
    code: 'UMRAH4',
    label: 'هدية العمرة ٤٪',
    description: 'خصم 4% لزوّار بيت الله على أول طلب من 300 ر.س فأكثر.',
    kind: 'percent',
    value: 4,
    minSubtotal: 300,
  },
  {
    code: 'BULK50',
    label: 'خصم ٥٠ ر.س',
    description: 'خصم 50 ر.س على الطلبات من 1,500 ر.س فأكثر.',
    kind: 'fixed',
    value: 50,
    minSubtotal: 1500,
  },
];

/* Extra profile data for each verified factory — powers the factory directory + profile page. */
export const factoryExtra: Record<
  string,
  {
    cover: string;
    workshop: string;
    certifications: string[];
    markets: string[];
    responseTime: string;
    employees: string;
    area: string;
    address: string;
  }
> = {
  hasa: {
    cover:
      'https://readdy.ai/api/search-image?query=Modern%20Saudi%20dates%20factory%20in%20Al-Ahsa%20surrounded%20by%20palm%20groves%20with%20neatly%20stacked%20kraft%20export%20cartons%20in%20the%20yard%2C%20warm%20sand%20tones%2C%20soft%20natural%20light%2C%20editorial%20industrial%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=1400&height=900&seq=sta-fac-hasa-cover-01&orientation=landscape',
    workshop:
      'https://readdy.ai/api/search-image?query=Clean%20date%20sorting%20and%20packing%20line%20inside%20a%20Saudi%20food%20factory%20with%20workers%20in%20hairnets%20and%20stainless%20steel%20machines%2C%20warm%20sand%20tones%2C%20soft%20natural%20light%2C%20editorial%20industrial%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=1200&height=800&seq=sta-fac-hasa-work-02&orientation=landscape',
    certifications: ['HACCP', 'ISO 22000', 'شهادة صحية للتصدير', 'حلال'],
    markets: ['الإمارات', 'ماليزيا', 'المملكة المتحدة', 'الكويت'],
    responseTime: 'أقل من 24 ساعة',
    employees: '180 موظفًا',
    area: '22,000 م²',
    address: 'طريق الهفوف — الأحساء، المنطقة الشرقية',
  },
  oud: {
    cover:
      'https://readdy.ai/api/search-image?query=Saudi%20oud%20distillery%20workshop%20with%20copper%20distillation%20vessels%20and%20wooden%20shelves%20lined%20with%20small%20oud%20oil%20bottles%2C%20warm%20sand%20tones%2C%20soft%20natural%20light%2C%20editorial%20industrial%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=1400&height=900&seq=sta-fac-oud-cover-03&orientation=landscape',
    workshop:
      'https://readdy.ai/api/search-image?query=Artisan%20blending%20oud%20perfume%20oils%20in%20a%20Saudi%20atelier%20with%20amber%20glass%20vials%20on%20a%20warm%20wooden%20bench%2C%20soft%20natural%20light%2C%20editorial%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=1200&height=800&seq=sta-fac-oud-work-04&orientation=landscape',
    certifications: ['ISO 9001', 'اعتماد هيئة الغذاء والدواء', 'شهادة منشأ'],
    markets: ['تركيا', 'فرنسا', 'الإمارات', 'ماليزيا'],
    responseTime: 'أقل من 48 ساعة',
    employees: '95 موظفًا',
    area: '8,500 م²',
    address: 'المنطقة الصناعية الثانية — الرياض',
  },
  fifa: {
    cover:
      'https://readdy.ai/api/search-image?query=High%20altitude%20coffee%20farm%20terraces%20in%20Jazan%20Saudi%20Arabia%20with%20green%20coffee%20cherries%20and%20misty%20mountains%20behind%2C%20warm%20neutral%20tones%2C%20soft%20natural%20light%2C%20editorial%20landscape%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=1400&height=900&seq=sta-fac-fifa-cover-05&orientation=landscape',
    workshop:
      'https://readdy.ai/api/search-image?query=Coffee%20roasting%20workshop%20with%20a%20small%20drum%20roaster%20and%20burlap%20bean%20sacks%20in%20a%20Saudi%20roastery%2C%20warm%20sand%20tones%2C%20soft%20natural%20light%2C%20editorial%20industrial%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=1200&height=800&seq=sta-fac-fifa-work-06&orientation=landscape',
    certifications: ['HACCP', 'شهادة مطابقة للتصدير', 'حلال'],
    markets: ['مصر', 'الأردن', 'الإمارات'],
    responseTime: 'أقل من 48 ساعة',
    employees: '42 موظفًا',
    area: '3,200 م²',
    address: 'محافظة فيفا — جازان',
  },
  atelier: {
    cover:
      'https://readdy.ai/api/search-image?query=Elegant%20fashion%20atelier%20in%20Jeddah%20with%20sewing%20stations%20and%20rolls%20of%20neutral%20tone%20fabric%20along%20the%20wall%2C%20soft%20natural%20light%2C%20editorial%20fashion%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=1400&height=900&seq=sta-fac-atelier-cover-07&orientation=landscape',
    workshop:
      'https://readdy.ai/api/search-image?query=Hands%20stitching%20a%20folded%20black%20abaya%20at%20a%20sewing%20machine%20in%20a%20bright%20Saudi%20atelier%2C%20warm%20neutral%20tones%2C%20soft%20natural%20light%2C%20editorial%20fashion%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=1200&height=800&seq=sta-fac-atelier-work-08&orientation=landscape',
    certifications: ['ISO 9001', 'شهادة منشأ', 'اختبار جودة الأقمشة'],
    markets: ['إندونيسيا', 'ماليزيا', 'تركيا'],
    responseTime: 'أقل من 24 ساعة',
    employees: '130 موظفًا',
    area: '6,400 م²',
    address: 'المنطقة الصناعية — جدة',
  },
  taif: {
    cover:
      'https://readdy.ai/api/search-image?query=Taif%20rose%20fields%20in%20Saudi%20Arabia%20at%20dawn%20with%20baskets%20of%20freshly%20picked%20pink%20roses%2C%20warm%20neutral%20tones%2C%20soft%20natural%20light%2C%20editorial%20landscape%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=1400&height=900&seq=sta-fac-taif-cover-09&orientation=landscape',
    workshop:
      'https://readdy.ai/api/search-image?query=Rose%20oil%20distillation%20workshop%20with%20a%20copper%20alembic%20and%20glass%20bottles%20in%20a%20Saudi%20perfume%20lab%2C%20warm%20sand%20tones%2C%20soft%20natural%20light%2C%20editorial%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=1200&height=800&seq=sta-fac-taif-work-10&orientation=landscape',
    certifications: ['ISO 22716', 'اعتماد هيئة الغذاء والدواء', 'شهادة منشأ'],
    markets: ['فرنسا', 'تركيا', 'المملكة المتحدة'],
    responseTime: 'أقل من 72 ساعة',
    employees: '60 موظفًا',
    area: '4,100 م²',
    address: 'طريق الهدا — الطائف',
  },
  hejaz: {
    cover:
      'https://readdy.ai/api/search-image?query=Traditional%20Saudi%20handicraft%20workshop%20in%20Mecca%20with%20brass%20dallah%20pots%2C%20carved%20wood%20and%20woven%20rugs%20arranged%20on%20wooden%20shelves%2C%20warm%20sand%20tones%2C%20soft%20natural%20light%2C%20editorial%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=1400&height=900&seq=sta-fac-hejaz-cover-11&orientation=landscape',
    workshop:
      'https://readdy.ai/api/search-image?query=Craftsman%20hand%20engraving%20a%20brass%20Arabic%20coffee%20dallah%20in%20a%20warm%20Saudi%20workshop%2C%20soft%20natural%20light%2C%20editorial%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=1200&height=800&seq=sta-fac-hejaz-work-12&orientation=landscape',
    certifications: ['شهادة منشأ', 'اعتماد حرف يدوية', 'ISO 9001'],
    markets: ['باكستان', 'إندونيسيا', 'مصر', 'المغرب'],
    responseTime: 'أقل من 72 ساعة',
    employees: '74 موظفًا',
    area: '5,000 م²',
    address: 'حي المعابدة — مكة المكرمة',
  },
  najd: {
    cover:
      'https://readdy.ai/api/search-image?query=Modern%20Saudi%20furniture%20factory%20floor%20with%20upholstered%20majlis%20seating%20and%20wood%20frames%20in%20progress%2C%20warm%20sand%20tones%2C%20soft%20natural%20light%2C%20editorial%20industrial%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=1400&height=900&seq=sta-fac-najd-cover-13&orientation=landscape',
    workshop:
      'https://readdy.ai/api/search-image?query=Upholsterer%20stitching%20fabric%20on%20a%20sofa%20frame%20inside%20a%20bright%20Saudi%20furniture%20workshop%2C%20warm%20neutral%20tones%2C%20soft%20natural%20light%2C%20editorial%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=1200&height=800&seq=sta-fac-najd-work-14&orientation=landscape',
    certifications: ['ISO 9001', 'شهادة منشأ', 'اختبار جودة الأقمشة'],
    markets: ['الإمارات', 'الكويت', 'مصر'],
    responseTime: 'أقل من 48 ساعة',
    employees: '110 موظفًا',
    area: '9,300 م²',
    address: 'المدينة الصناعية الثانية — الرياض',
  },
  yanbu: {
    cover:
      'https://readdy.ai/api/search-image?query=Saudi%20building%20materials%20factory%20yard%20with%20stacked%20porcelain%20tile%20pallets%20and%20aluminium%20profiles%2C%20warm%20sand%20tones%2C%20soft%20natural%20light%2C%20editorial%20industrial%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=1400&height=900&seq=sta-fac-yanbu-cover-15&orientation=landscape',
    workshop:
      'https://readdy.ai/api/search-image?query=Automated%20tile%20pressing%20and%20glazing%20line%20inside%20a%20modern%20Saudi%20ceramics%20factory%2C%20warm%20sand%20tones%2C%20soft%20natural%20light%2C%20editorial%20industrial%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=1200&height=800&seq=sta-fac-yanbu-work-16&orientation=landscape',
    certifications: ['ISO 13006', 'شهادة مطابقة سعودية', 'شهادة منشأ'],
    markets: ['الأردن', 'مصر', 'العراق'],
    responseTime: 'أقل من 48 ساعة',
    employees: '240 موظفًا',
    area: '38,000 م²',
    address: 'المدينة الصناعية — ينبع',
  },
  pack: {
    cover:
      'https://readdy.ai/api/search-image?query=Clean%20packaging%20factory%20with%20stacked%20kraft%20corrugated%20sheets%20and%20finished%20cartons%20on%20pallets%2C%20warm%20sand%20tones%2C%20soft%20natural%20light%2C%20editorial%20industrial%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=1400&height=900&seq=sta-fac-pack-cover-17&orientation=landscape',
    workshop:
      'https://readdy.ai/api/search-image?query=Corrugated%20cardboard%20production%20line%20folding%20and%20printing%20cartons%20in%20a%20Saudi%20packaging%20factory%2C%20warm%20sand%20tones%2C%20soft%20natural%20light%2C%20editorial%20industrial%20photography%2C%20high%20detail%2C%20warm%20neutral%20palette&width=1200&height=800&seq=sta-fac-pack-work-18&orientation=landscape',
    certifications: ['ISO 9001', 'شهادة سلامة غذائية', 'مواد قابلة لإعادة التدوير'],
    markets: ['مصر', 'باكستان', 'نيجيريا', 'كينيا'],
    responseTime: 'أقل من 24 ساعة',
    employees: '160 موظفًا',
    area: '14,500 م²',
    address: 'المنطقة الصناعية الثالثة — جدة',
  },
};