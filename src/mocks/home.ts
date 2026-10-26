export const videoUrl =
  'https://static.readdy.ai/video/f26834b624de85b51148884d2721b69d/8b19c5e8468412a660b1aa9385331e7b.mp4';

export const videoCover =
  'https://static.readdy.ai/image/8d67d4b5b60a62e7b1df4167f7b5245a/4b1db075f975b291b30c072a524ecaec.jpeg';

export const videoDuration = 14;

export const navLinks = [
  { label: 'القصة', href: '#story' },
  { label: 'السفراء', href: '#ambassadors' },
  { label: 'الشحن', href: '#logistics' },
  { label: 'الأرقام', href: '#numbers' },
  { label: 'الأسئلة', href: '#faq' },
];

/* Statement lit word by word as the panel scrolls. `accent` words take the italic serif. */
export const manifestoWords = [
  { t: 'المصنع', accent: false },
  { t: 'السعودي', accent: false },
  { t: 'يملك', accent: false },
  { t: 'المنتج،', accent: false },
  { t: 'والسفير', accent: false },
  { t: 'يملك', accent: false },
  { t: 'الثقة', accent: true },
  { t: 'والعلاقات', accent: false },
  { t: 'في', accent: false },
  { t: 'بلده،', accent: false },
  { t: 'ولم', accent: false },
  { t: 'يكن', accent: false },
  { t: 'بينهما', accent: false },
  { t: 'نظام', accent: false },
  { t: 'يربطهما', accent: false },
  { t: 'بعقد', accent: false },
  { t: 'واضح', accent: false },
  { t: 'وشحن', accent: false },
  { t: 'موثوق', accent: false },
  { t: 'ودفع', accent: false },
  { t: 'آمن', accent: true },
  { t: '—', accent: false },
  { t: 'حتى', accent: false },
  { t: 'الآن.', accent: false },
];

export const storyPanel = {
  id: 'story',
  stamp: '٠٢ — المصنع',
  title: 'صدّر دون أن تبني \nقسم *تصدير*',
  sub: 'تجهّز المنتج فقط. نحن نتولّى المستندات، والجمارك، والشحن، والتحصيل بالريال بعد البيع.',
  points: [
    'دفع مقابل البيع فقط — بدون تكلفة اكتساب ثابتة',
    'آلية مستندات وتصدير جاهزة من أول طلب',
    'تسوية بالريال وكشف حساب بعد انتهاء فترة الإرجاع',
  ],
  image:
    'https://readdy.ai/api/search-image?query=Minimal%20paper%20white%20editorial%20scene%20of%20a%20clean%20Saudi%20factory%20workshop%20floor%20with%20neatly%20stacked%20kraft%20cartons%20and%20product%20samples%20on%20a%20steel%20working%20table%2C%20warm%20amber%20light%2C%20soft%20neutral%20beige%20background%2C%20calm%20product%20photography%2C%20high%20detail%2C%20muted%20consistent%20palette&width=2400&height=1350&seq=sta-panel-factory-01&orientation=landscape',
  alt: 'طاولة تجهيز في مصنع سعودي بكراتين كرافت ومنتجات جاهزة للتصدير',
};

export const ambassadorsPanel = {
  id: 'ambassadors',
  stamp: '٠٣ — السفراء',
  title: 'اعرف المنتج السعودي \nوكن *سفيرًا* له',
  sub: 'زرت مكة والمدينة وأحببت التمر والعود والقهوة؟ عُد إلى بلدك سفيرًا لها: رابط وكود وبطاقة QR، وعمولة من كل طلب يصل إلى أهلك وجيرانك.',
  points: [
    'البداية مع المعتمرين والحجاج، ووكيل العمرة سفير قائد لفريق رحلته',
    'مستويات: سفير، وسفير معتمد، وسفير نخبة — عمولة 5% و7% و8% على التجزئة',
    'مكتبة محتوى جاهز بلغتك: العربية والإنجليزية والأردو والإندونيسية',
    '«الطلب الجماعي»: طرد واحد لحملتك أو عائلتك يخفّض تكلفة الشحن',
  ],
  image:
    'https://public.readdy.ai/ai/img_res/edited_fffbe1e0134e31d1b4d18e78b93bda2c_7379df84.jpg',
  alt: 'علبة شحن كرافت مطويّة بملصق سفير الأخضر والنخلة الذهبية، وبطاقة QR شخصية خضراء بالشعار نفسه على قماش رملي فاتح',
};

export const logisticsPanel = {
  id: 'logistics',
  stamp: '٠٤ — الشحن',
  title: 'طبقة شحن\n واحدة *موحّدة*',
  sub: 'مستودع تجميع وفحص في جدة، يربط شركات الشحن المحلية والدولية، ويتابع كل شحنة بلغة المشتري.',
  points: [
    'استلام، وفحص، وتجميع في مستودع جدة',
    'شحن بري وبحري وجوي بحسب حجم الطلب',
    'رقم تتبع واحد من المصنع حتى باب المشتري',
    'سعر نهائي يشمل الشحن والرسوم المتوقعة',
  ],
  image:
    'https://readdy.ai/api/search-image?query=Minimal%20aerial%20editorial%20view%20of%20a%20clean%20light%20warehouse%20aisle%20with%20a%20conveyor%20belt%20and%20neatly%20stacked%20kraft%20boxes%2C%20paper%20white%20floor%2C%20warm%20amber%20highlights%2C%20soft%20neutral%20beige%20background%2C%20calm%20logistics%20photography%2C%20high%20detail%2C%20muted%20consistent%20palette&width=2400&height=1350&seq=sta-panel-logistics-03&orientation=landscape',
  alt: 'ممر مستودع فاتح بخط إنتاج وكراتين كرافت مرصوصة للتصدير',
};

export const numbersPanel = {
  id: 'numbers',
  stamp: '٠٥ — الأرقام',
  title: 'نموذج *يُقاس *\nبالنتائج',
  sub: 'كل رقم ينمو من بيع فعلي: من سلة فردية إلى صفقة جملة، ومن سفير واحد إلى فريق يعمل من بلده.',
  image:
    'https://readdy.ai/api/search-image?query=Minimal%20paper%20white%20editorial%20still%20life%20of%20export%20documents%2C%20a%20clipboard%20and%20a%20digital%20scale%20with%20small%20kraft%20boxes%2C%20warm%20amber%20light%2C%20soft%20neutral%20beige%20background%2C%20calm%20product%20photography%2C%20high%20detail%2C%20muted%20consistent%20palette&width=2400&height=1350&seq=sta-panel-numbers-04&orientation=landscape',
  alt: 'مستندات تصدير وميزان رقمي وكراتين صغيرة على سطح فاتح',
};

export const stats = [
  { count: 300, suffix: ' ر.س', label: 'متوسط سلة التجزئة' },
  { count: 90, suffix: ' ألف', label: 'متوسط صفقة الجملة' },
  { count: 20, suffix: '%', label: 'عمولة المنصة حتى' },
  { count: 4, suffix: ' لغات', label: 'عند الإطلاق: العربية والإنجليزية والأردية والإندونيسية' },
];

export const joinPanel = {
  id: 'join',
  stamp: '٠٦ — انضم',
  title: 'ابدأ من *اليوم*',
  sub: 'سفير أو مصنع — اختر مسارك وسيتواصل معك فريق سفير خلال يوم عمل واحد.',
  image:
    'https://readdy.ai/api/search-image?query=Minimal%20paper%20white%20editorial%20scene%20of%20an%20open%20kraft%20box%20revealing%20a%20wrapped%20Saudi%20product%20with%20a%20folded%20note%20beside%20it%2C%20warm%20amber%20light%2C%20soft%20neutral%20beige%20background%2C%20calm%20product%20photography%2C%20high%20detail%2C%20muted%20consistent%20palette&width=2400&height=1350&seq=sta-panel-join-05&orientation=landscape',
  alt: 'علبة كرافت مفتوحة تكشف منتجًا سعوديًا مغلّفًا وبطاقة مطويّة',
};

export const faq = [
  {
    q: 'كيف يحصل المصنع على أول طلب؟',
    a: 'بعد التوثيق وإضافة المنتجات، ينال المصنع إشعارًا فوريًا بأول طلب مع مهلة تجهيز واضحة وملصق شحن جاهز، والمنصة تتولّى المستندات والشحن الدولي.',
  },
  {
    q: 'كيف يُحتسب سعر المشتري؟',
    a: 'سعر المشتري واحد سواء جاء الطلب عبر سفير أم لا، ويشمل الشحن والرسوم المتوقعة، فلا مفاجآت جمركية عند الاستلام.',
  },
  {
    q: 'كيف تُدفع عمولة السفير؟',
    a: 'العملية تأتي من حصة المنصة لا من سعر المنتج. تبقى العمولة معلّقة حتى انتهاء فترة الإرجاع، ثم تصبح قابلة للسحب.',
  },
  {
    q: 'متى يبدأ السفير بالكسب؟',
    a: 'التسجيل داخل المملكة مسموح، ويبدأ التفعيل للكسب من خارجها، وتُحتسب العمولة على الطلبات المشحونة إلى خارج المملكة فقط.',
  },
  {
    q: 'ما فترة الإرجاع؟',
    a: '14 يومًا من التسليم قبل تحويل التسوية إلى المصنع، وقبل أن تصبح عمولة السفير قابلة للسحب.',
  },
];

export const footerCols = [
  {
    title: 'المنصة',
    links: [
      { label: 'القصة', href: '#story' },
      { label: 'برنامج السفراء', href: '#ambassadors' },
      { label: 'الشحن واللوجستيات', href: '#logistics' },
      { label: 'الأرقام', href: '#numbers' },
    ],
  },
  {
    title: 'للمصانع',
    links: [
      { label: 'انضم كمصنع', href: '#join' },
      { label: 'كيف نوثّق المصانع', href: '#faq' },
      { label: 'مؤشر جاهزية التصدير', href: '#numbers' },
      { label: 'حافز هيئة الصادرات', href: '#join' },
    ],
  },
  {
    title: 'للسفراء',
    links: [
      { label: 'كن سفيرًا', href: '#join' },
      { label: 'المستويات والعمولات', href: '#ambassadors' },
      { label: 'أدوات السفير', href: '#ambassadors' },
      { label: 'الأسئلة الشائعة', href: '#faq' },
    ],
  },
];

export const formEndpoint = 'https://readdy.ai/api/form/db77ld0d6mcdj80oo8h0';