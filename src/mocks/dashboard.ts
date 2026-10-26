import type { LedgerOrder } from '@/pages/dashboard/lib/economics';
export type NavItem = { key: string; label: string; icon: string; badge?: string };

export const buyerNav: NavItem[] = [
  { key: 'home', label: 'الرئيسية', icon: 'ri-home-5-line' },
  { key: 'orders', label: 'طلباتي', icon: 'ri-file-list-3-line', badge: '3' },
  { key: 'quotes', label: 'عروض الأسعار', icon: 'ri-price-tag-3-line' },
  { key: 'deals', label: 'صفقات الجملة', icon: 'ri-hand-coin-line' },
  { key: 'contracts', label: 'العقود', icon: 'ri-file-paper-2-line', badge: '2' },
  { key: 'favorites', label: 'المفضلة والقوائم', icon: 'ri-heart-3-line' },
  { key: 'addresses', label: 'العناوين', icon: 'ri-map-pin-2-line' },
  { key: 'payments', label: 'وسائل الدفع', icon: 'ri-bank-card-line' },
  { key: 'returns', label: 'الإرجاع والنزاعات', icon: 'ri-arrow-go-back-line' },
  { key: 'messages', label: 'الرسائل والدعم', icon: 'ri-chat-3-line', badge: '2' },
  { key: 'tickets', label: 'تذاكر الدعم', icon: 'ri-customer-service-2-line' },
  { key: 'account', label: 'الحساب والتحقق', icon: 'ri-user-settings-line' },
];

export const ambassadorNav: NavItem[] = [
  { key: 'amb-home', label: 'لوحة السفير', icon: 'ri-dashboard-3-line' },
  { key: 'links', label: 'روابطي وأكوادي', icon: 'ri-link' },
  { key: 'mypage', label: 'صفحتي', icon: 'ri-layout-masonry-line' },
  { key: 'amb-pages', label: 'صفحاتي التسويقية', icon: 'ri-window-2-line', badge: '2' },
  { key: 'content', label: 'مكتبة المحتوى', icon: 'ri-image-2-line' },
  { key: 'attributed', label: 'الطلبات المنسوبة', icon: 'ri-list-check-2', badge: '5' },
  { key: 'merchants', label: 'المشترون التجار', icon: 'ri-store-2-line' },
  { key: 'group', label: 'الطلب الجماعي', icon: 'ri-group-2-line' },
  { key: 'wallet', label: 'المحفظة والسحب', icon: 'ri-wallet-3-line' },
  { key: 'levels', label: 'المستويات والتحديات', icon: 'ri-trophy-line' },
  { key: 'leader', label: 'لوحة السفير القائد', icon: 'ri-vip-crown-2-line' },
  { key: 'team', label: 'فريقي', icon: 'ri-team-line' },
  { key: 'kyc', label: 'التحقق', icon: 'ri-shield-check-line', badge: '!' },
  { key: 'terms', label: 'الشروط والإرشادات', icon: 'ri-book-open-line' },
];

export const buyerUser = {
  name: 'أحمد النعيمي',
  country: 'الأردن',
  flagIcon: 'ri-map-pin-line',
  level: 'عميل',
  initials: 'أ.ن',
};

export const ambassadorUser = {
  name: 'أحمد النعيمي',
  country: 'الأردن',
  level: 'سفير معتمد',
  code: 'AHMAD-JO-2481',
  initials: 'أ.ن',
};

/* ------------------------------------------------------------ buyer data */

export const buyerStats = [
  { icon: 'ri-truck-line', num: '3', lbl: 'طلبات نشطة' },
  { icon: 'ri-wallet-3-line', num: '184 ر.س', lbl: 'رصيد العمولة' },
  { icon: 'ri-heart-3-line', num: '12', lbl: 'منتج في المفضلة' },
  { icon: 'ri-file-list-3-line', num: '27', lbl: 'طلب مكتمل' },
];

export const buyerRecentOrders = [
  { id: 'SFR-20481', date: '٤ أكتوبر ٢٠٢٦', value: '420 ر.س', status: 'قيد التوصيل', tone: 'warn', items: 3, factory: 'تمور المدينة' },
  { id: 'SFR-20462', date: '٢٧ سبتمبر ٢٠٢٦', value: '285 ر.س', status: 'تم التسليم', tone: 'ok', items: 2, factory: 'دار العود' },
  { id: 'SFR-20430', date: '١٥ سبتمبر ٢٠٢٦', value: '760 ر.س', status: 'بانتظار الشحن', tone: 'info', items: 5, factory: 'نُسج للعبايات' },
];

export const buyerOrders = [
  {
    id: 'SFR-20481', date: '٤ أكتوبر ٢٠٢٦', value: '420 ر.س', status: 'قيد التوصيل', tone: 'warn',
    factory: 'تمور المدينة', country: 'الأردن', items: 3,
    timeline: [
      { t: 'تم إنشاء الطلب', s: '٤ أكتوبر — ١٠:٢٤', done: true },
      { t: 'تم الاستلام من المصنع', s: '٥ أكتوبر — ٠٩:١٠', done: true },
      { t: 'في مستودع جدة', s: '٦ أكتوبر — ١٤:٤٠', done: true },
      { t: 'غادر المملكة', s: '٧ أكتوبر — ٢٢:٠٥', done: true },
      { t: 'في جمارك الوجهة', s: 'بانتظار التخليص', done: false },
      { t: 'خرج للتوصيل', s: '—', done: false },
      { t: 'تم التسليم', s: '—', done: false },
    ],
  },
  {
    id: 'SFR-20462', date: '٢٧ سبتمبر ٢٠٢٦', value: '285 ر.س', status: 'تم التسليم', tone: 'ok',
    factory: 'دار العود', country: 'الأردن', items: 2,
    timeline: [
      { t: 'تم إنشاء الطلب', s: '٢٧ سبتمبر', done: true },
      { t: 'في مستودع جدة', s: '٢٩ سبتمبر', done: true },
      { t: 'تم التسليم', s: '٣ أكتوبر', done: true },
    ],
  },
  {
    id: 'SFR-20430', date: '١٥ سبتمبر ٢٠٢٦', value: '760 ر.س', status: 'بانتظار الشحن', tone: 'info',
    factory: 'نُسج للعبايات', country: 'الأردن', items: 5,
    timeline: [
      { t: 'تم إنشاء الطلب', s: '١٥ سبتمبر', done: true },
      { t: 'قيد التجهيز في المصنع', s: '١٧ سبتمبر', done: true },
      { t: 'بانتظار التسليم للشحن', s: '—', done: false },
    ],
  },
];

export const buyerQuotes = [
  {
    factory: 'نُسج للعبايات', rating: '٤٫٨', city: 'الرياض', price: '٦٨ ر.س / وحدة', moq: '٥٠ وحدة',
    lead: '١٢ يومًا', terms: '٥٠٪ مقدّم، والباقي عند الشحن', incoterm: 'CIF', sample: 'متاح',
  },
  {
    factory: 'مصنع وفرة للعود', rating: '٤٫٥', city: 'جدة', price: '٧٤ ر.س / وحدة', moq: '٣٠ وحدة',
    lead: '٩ أيام', terms: '٤٠٪ مقدّم، والباقي عند التسليم', incoterm: 'FOB', sample: 'متاح',
  },
  {
    factory: 'بيت القهوة السعودية', rating: '٤٫٦', city: 'أبها', price: '٥٢ ر.س / وحدة', moq: '١٠٠ وحدة',
    lead: '١٥ يومًا', terms: 'دفعة واحدة عند التأكيد', incoterm: 'EXW', sample: 'غير متاح',
  },
];

export const buyerDeals = [
  {
    name: 'نُسج للعبايات', total: '٨٤٫٠٠٠ ر.س', paid: '٤٢٫٠٠٠ ر.س', due: '٤٢٫٠٠٠ ر.س',
    stage: 'الإنتاج', progress: 55, nextDue: '١٦ أكتوبر ٢٠٢٦',
    stages: [
      { key: 'deposit', date: '٢ سبتمبر ٢٠٢٦ · ١٠:١٥ ص' },
      { key: 'production', date: '١٠ سبتمبر ٢٠٢٦ · ٠٢:٣٠ م' },
    ],
  },
  {
    name: 'مصنع وفرة للعود', total: '٩٦٫٠٠٠ ر.س', paid: '٩٦٫٠٠٠ ر.س', due: '٠ ر.س',
    stage: 'الشحن', progress: 88, nextDue: '—',
    stages: [
      { key: 'deposit', date: '١ أغسطس ٢٠٢٦ · ٠٩:٠٥ ص' },
      { key: 'production', date: '٩ أغسطس ٢٠٢٦ · ١١:٤٠ ص' },
      { key: 'packing', date: '١٨ أغسطس ٢٠٢٦ · ٠٤:٢٠ م' },
      { key: 'shipping', date: '٢٥ أغسطس ٢٠٢٦ · ٠٨:٥٠ ص' },
    ],
  },
];

export const favoriteLists = [
  { name: 'هدايا العائلة', count: 6 },
  { name: 'تمور للعيد', count: 4 },
  { name: 'أفكار إعادة بيع', count: 9 },
  { name: 'عطور مخفّضة', count: 3 },
];

export const favoriteProducts = [
  { name: 'علبة تمر سكري فاخرة', factory: 'تمور المدينة', price: '٩٦ ر.س', productId: 'dates-sukkari', drop: 'انخفض ١٢٪', img: 'https://readdy.ai/api/search-image?query=Minimal%20product%20photo%20of%20a%20premium%20box%20of%20Saudi%20dates%20on%20a%20clean%20warm%20beige%20background%2C%20soft%20amber%20light%2C%20top%20view%2C%20neutral%20palette%2C%20high%20detail&width=800&height=600&seq=sta-fav-dates-01&orientation=landscape' },
  { name: 'عطر عود مركّز', factory: 'دار العود', price: '٢٤٠ ر.س', drop: '', img: 'https://readdy.ai/api/search-image?query=Minimal%20product%20photo%20of%20a%20small%20elegant%20oud%20perfume%20bottle%20on%20a%20clean%20warm%20beige%20background%2C%20soft%20amber%20light%2C%20neutral%20palette%2C%20high%20detail&width=800&height=600&seq=sta-fav-oud-02&orientation=landscape', productId: 'oud-dehn' },
  { name: 'عباية كلاسيك مطرّزة', factory: 'نُسج للعبايات', price: '٤٩٠ ر.س', drop: '', img: 'https://readdy.ai/api/search-image?query=Minimal%20product%20photo%20of%20a%20folded%20elegant%20black%20abaya%20with%20subtle%20gold%20embroidery%20on%20a%20clean%20warm%20beige%20background%2C%20soft%20light%2C%20neutral%20palette%2C%20high%20detail&width=800&height=600&seq=sta-fav-abaya-03&orientation=landscape', productId: 'fashion-abaya' },
];

export const buyerAddresses = [
  { name: 'المنزل', country: 'الأردن — عمّان', detail: 'شارع المدينة المنورة، مجمع ٧، مبنى ١٢، شقة ٤', phone: '+962 79 555 1212', def: true },
  { name: 'المكتب', country: 'الأردن — الزرقاء', detail: 'المنطقة الحرة، مستودع ٢٤', phone: '+962 77 100 9090', def: false },
  { name: 'قريب — القاهرة', country: 'مصر — القاهرة', detail: 'مدينة نصر، شارع الطيران', phone: '+20 100 555 3344', def: false },
];

export const buyerCards = [
  { brand: 'VISA', last4: '4421', exp: '٠٩/٢٩', holder: 'AHMAD ALNAME', def: true },
  { brand: 'MASTERCARD', last4: '8890', exp: '٠٣/٢٨', holder: 'AHMAD ALNAME', def: false },
];

export const buyerReturns = [
  { id: 'RET-118', order: 'SFR-20390', item: 'علبة تمر سكري', reason: 'منتج تالف', amount: '٩٦ ر.س', status: 'قيد المراجعة', tone: 'warn' },
  { id: 'RET-104', order: 'SFR-20211', item: 'عباية كلاسيك', reason: 'المقاس غير مناسب', amount: '٤٩٠ ر.س', status: 'تم الاسترداد', tone: 'ok' },
];

export const buyerThreads = [
  { name: 'تمور المدينة', last: 'تم تأكيد موعد التسليم لهذا الأسبوع بإذن الله.', time: '١٠:٢٤', unread: true },
  { name: 'دعم سفير', last: 'نعم، الرسوم الجمركية مدفوعة مسبقًا (DDP).', time: 'أمس', unread: true },
  { name: 'دار العود', last: 'شكرًا لطلبك، وصفت لك العبوة بهدية صغيرة.', time: 'الأحد', unread: false },
];

export const buyerMessages = [
  { from: 'me', text: 'مرحبًا، هل يمكن معرفة موعد وصول الشحنة؟', time: '١٠:١٠' },
  { from: 'them', text: 'أهلًا بك. الشحنة خرجت من مستودع جدة أمس، والوصول المتوقع خلال ٣ أيام.', time: '١٠:١٨' },
  { from: 'me', text: 'ممتاز، هل الرسوم الجمركية مدفوعة؟', time: '١٠:٢٠' },
  { from: 'them', text: 'نعم، الطلب بنظام DDP — السعر النهائي شامل الرسوم.', time: '١٠:٢٤' },
];

export const buyerRecommendations = [
  { name: 'تمر عجوة المدينة', factory: 'تمور المدينة', price: '١٢٠ ر.س', img: 'https://readdy.ai/api/search-image?query=Minimal%20product%20photo%20of%20a%20shallow%20dish%20of%20ajwa%20Saudi%20dates%20on%20a%20clean%20warm%20beige%20surface%2C%20soft%20amber%20light%2C%20top%20view%2C%20neutral%20palette%2C%20high%20detail&width=800&height=600&seq=sta-rec-ajwa-01&orientation=landscape', productId: 'dates-khalas' },
  { name: 'قهوة عربية مطحونة', factory: 'بيت القهوة السعودية', price: '٦٨ ر.س', img: 'https://readdy.ai/api/search-image?query=Minimal%20product%20photo%20of%20a%20kraft%20pouch%20of%20Saudi%20arabic%20coffee%20beans%20on%20a%20clean%20warm%20beige%20surface%2C%20soft%20amber%20light%2C%20neutral%20palette%2C%20high%20detail&width=800&height=600&seq=sta-rec-coffee-02&orientation=landscape', productId: 'coffee-arabic' },
  { name: 'بخور معمول فاخر', factory: 'دار العود', price: '١٨٠ ر.س', img: 'https://readdy.ai/api/search-image?query=Minimal%20product%20photo%20of%20a%20small%20glass%20jar%20of%20Saudi%20bakhoor%20incense%20on%20a%20clean%20warm%20beige%20surface%2C%20soft%20amber%20light%2C%20neutral%20palette%2C%20high%20detail&width=800&height=600&seq=sta-rec-bakhoor-03&orientation=landscape', productId: 'oud-bakhoor' },
];

/* ------------------------------------------------------ ambassador data */

export const ambStats = [
  { icon: 'ri-money-dollar-circle-line', num: '٣٫٤٨٠ ر.س', lbl: 'إجمالي الأرباح', delta: '+١٢٪', up: true },
  { icon: 'ri-time-line', num: '٤٢٠ ر.س', lbl: 'عمولات معلّقة', delta: '', up: true },
  { icon: 'ri-wallet-3-line', num: '٣٫٠٦٠ ر.س', lbl: 'قابلة للسحب', delta: '', up: true },
  { icon: 'ri-cursor-line', num: '٨٬٢٤١', lbl: 'نقرة على روابطي', delta: '+٨٪', up: true },
];

export const ambSummary = {
  clicks: 8241,
  orders: 47,
  conversion: '٠٫٥٧٪',
  level: 'سفير معتمد',
  nextLevel: 'سفير نخبة',
  progress: 68,
  toNext: '١٣ طلبًا متبقيًا للترقية',
};

/* Six-month performance trend for the ambassador analytics card. */
export const ambTrend = {
  labels: ['مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر'],
  clicks: { values: [4200, 5100, 4620, 6180, 7360, 8241], delta: '+٨٪' },
  orders: { values: [22, 28, 25, 33, 41, 47], delta: '+١١٪' },
  commissions: { values: [1860, 2240, 1980, 2680, 3120, 3480], delta: '+١٢٪' },
};

/* Same three trends re-sliced by the period switcher (7 / 30 / 90 days) so the
   charts answer instantly when the ambassador taps a range. */
export const ambTrendPeriods = {
  d7: {
    labels: ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'],
    clicks: { values: [820, 960, 1040, 1180, 990, 1310, 1420], delta: '+٤٪' },
    orders: { values: [3, 5, 4, 6, 5, 8, 9], delta: '+٦٪' },
    commissions: { values: [180, 320, 260, 410, 300, 520, 610], delta: '+٥٪' },
  },
  d30: {
    labels: ['الأسبوع ١', 'الأسبوع ٢', 'الأسبوع ٣', 'الأسبوع ٤'],
    clicks: { values: [1820, 2140, 1980, 2301], delta: '+٨٪' },
    orders: { values: [10, 12, 11, 14], delta: '+٧٪' },
    commissions: { values: [780, 920, 860, 1020], delta: '+٩٪' },
  },
  d90: {
    labels: ['أغسطس', 'سبتمبر', 'أكتوبر'],
    clicks: { values: [18240, 21050, 22110], delta: '+١٠٪' },
    orders: { values: [92, 104, 118], delta: '+١١٪' },
    commissions: { values: [6420, 7180, 7940], delta: '+١٢٪' },
  },
};

export const ambLinks = [
  { target: 'الكود الشخصي — AHMAD-JO-2481', url: 'safeer.sa/r/AHMAD-JO-2481', clicks: 3120, orders: 21, rate: '٠٫٦٧٪' },
  { target: 'صفحة عبايات نُسج', url: 'safeer.sa/r/abayas-2481', clicks: 1840, orders: 11, rate: '٠٫٦٠٪' },
  { target: 'منتجات دار العود', url: 'safeer.sa/r/oud-2481', clicks: 1265, orders: 8, rate: '٠٫٦٣٪' },
  { target: 'حملة العيد — تمور', url: 'safeer.sa/r/eid-dates-2481', clicks: 2016, orders: 7, rate: '٠٫٣٥٪' },
];

export const ambContent = [
  { name: 'قصة مصنع التمور', type: 'فيديو ٣٠ ث', lang: 'الأردية', img: 'https://readdy.ai/api/search-image?query=Minimal%20editorial%20still%20of%20Saudi%20date%20factory%20interior%20with%20warm%20light%20and%20kraft%20boxes%2C%20clean%20beige%20tones%2C%20neutral%20palette%2C%20high%20detail&width=800&height=600&seq=sta-content-dates-01&orientation=landscape' },
  { name: 'صور عبايات موسم العروض', type: '٥ صور', lang: 'الإنجليزية', img: 'https://readdy.ai/api/search-image?query=Minimal%20editorial%20still%20of%20folded%20abayas%20on%20a%20neutral%20surface%20with%20soft%20light%2C%20clean%20beige%20tones%2C%20high%20detail&width=800&height=600&seq=sta-content-abaya-02&orientation=landscape' },
  { name: 'نص منشور العود', type: 'نص قصير', lang: 'العربية', img: 'https://readdy.ai/api/search-image?query=Minimal%20editorial%20still%20of%20oud%20perfume%20bottles%20on%20a%20neutral%20surface%20with%20warm%20light%2C%20clean%20beige%20tones%2C%20high%20detail&width=800&height=600&seq=sta-content-oud-03&orientation=landscape' },
  { name: 'فيديو تجهيز الطلب', type: 'فيديو ١٥ ث', lang: 'الإندونيسية', img: 'https://readdy.ai/api/search-image?query=Minimal%20editorial%20still%20of%20a%20packing%20table%20with%20kraft%20boxes%20and%20labels%2C%20neutral%20beige%20tones%2C%20warm%20light%2C%20high%20detail&width=800&height=600&seq=sta-content-pack-04&orientation=landscape' },
  { name: 'قصة القهوة السعودية', type: 'فيديو ٤٥ ث', lang: 'الأردية', img: 'https://readdy.ai/api/search-image?query=Minimal%20editorial%20still%20of%20Saudi%20arabic%20coffee%20cups%20and%20beans%20on%20a%20neutral%20surface%2C%20warm%20light%2C%20clean%20beige%20tones%2C%20high%20detail&width=800&height=600&seq=sta-content-coffee-05&orientation=landscape' },
  { name: 'بانر حملة الحقيبة الثانية', type: 'بانر', lang: 'العربية', img: 'https://readdy.ai/api/search-image?query=Minimal%20editorial%20banner%20scene%20of%20a%20kraft%20suitcase%20and%20shipping%20box%20in%20a%20light%20airport%20corridor%2C%20neutral%20beige%20tones%2C%20warm%20light%2C%20high%20detail&width=800&height=600&seq=sta-content-bag-06&orientation=landscape' },
];

export const ambOrders = [
  { date: '٦ أكتوبر ٢٠٢٦', country: 'الأردن', value: '٣٨٠ ر.س', commission: '٢٦٫٦ ر.س', status: 'معلّقة', tone: 'warn' },
  { date: '٣ أكتوبر ٢٠٢٦', country: 'الأردن', value: '٥٢٠ ر.س', commission: '٣٦٫٤ ر.س', status: 'معلّقة', tone: 'warn' },
  { date: '٢٨ سبتمبر ٢٠٢٦', country: 'مصر', value: '٧٤٠ ر.س', commission: '٥١٫٨ ر.س', status: 'مستحقة', tone: 'ok' },
  { date: '٢٢ سبتمبر ٢٠٢٦', country: 'الأردن', value: '٢٩٠ ر.س', commission: '٢٠٫٣ ر.س', status: 'مستحقة', tone: 'ok' },
  { date: '١٨ سبتمبر ٢٠٢٦', country: 'الأردن', value: '٦٤٠ ر.س', commission: '٤٤٫٨ ر.س', status: 'مدفوعة', tone: 'info' },
];

export const ambMerchants = [
  { name: 'متجر الياسمين', country: 'الأردن', deal: '١٢٤٫٠٠٠ ر.س', expiry: '٣٠ يونيو ٢٠٢٧', commission: '٢٬٤٨٠ ر.س' },
  { name: 'سوق الحرير', country: 'مصر', deal: '٨٦٫٥٠٠ ر.س', expiry: '١٢ مارس ٢٠٢٧', commission: '١٬٧٣٠ ر.س' },
  { name: 'نُزل التمور', country: 'الأردن', deal: '٤٥٫٠٠٠ ر.س', expiry: '٨ يناير ٢٠٢٧', commission: '٩٠٠ ر.س' },
];

export const ambGroupMembers = [
  { name: 'أحمد (أنت)', items: 'علبة تمر + عود', share: '١٨٠ ر.س' },
  { name: 'سامر — عمّان', items: 'عباية صيفية', share: '٤٢٠ ر.س' },
  { name: 'لمى — الزرقاء', items: 'بخور معمول', share: '١٦٠ ر.س' },
  { name: 'أم أحمد', items: 'قهوة عربية ×٢', share: '١٣٦ ر.س' },
];

export const ambWallet = {
  available: '٣٫٠٦٠ ر.س',
  pending: '٤٢٠ ر.س',
  minWithdraw: '٥٠٠ ر.س',
  fee: '١٫٥٪',
  methods: ['تحويل بنكي دولي (IBAN)', 'محفظة إلكترونية محلية', 'رصيد شراء في المنصة (+٢٪)'],
  movements: [
    { date: '٣ أكتوبر ٢٠٢٦', label: 'عمولة — SFR-20462', amount: '+٥١٫٨ ر.س', tone: 'in' },
    { date: '١ أكتوبر ٢٠٢٦', label: 'سحب إلى محفظة محلية', amount: '-٢٤٥٫٠ ر.س', tone: 'out' },
    { date: '٢٢ سبتمبر ٢٠٢٦', label: 'مكافأة تحدي سفير الحي', amount: '+١٠٠٫٠ ر.س', tone: 'in' },
    { date: '١٨ سبتمبر ٢٠٢٦', label: 'مكافأة فريق — مستوى واحد', amount: '+٣٦٫٠ ر.س', tone: 'in' },
  ],
  sources: [
    { label: 'تمور المدينة', value: 1480, display: '٤٢٪ · ١٫٤٨٠ ر.س' },
    { label: 'دار العود', value: 980, display: '٢٨٪ · ٩٨٠ ر.س' },
    { label: 'نُسج للعبايات', value: 620, display: '١٨٪ · ٦٢٠ ر.س' },
    { label: 'حملة العيد', value: 420, display: '١٢٪ · ٤٢٠ ر.س' },
  ],
};

export const ambLevels = [
  { name: 'سفير', retail: '٥٪', wholesale: '١٫٥٪', perks: 'رابط، وكود، وQR، ومكتبة محتوى', reach: 'عند التسجيل', tone: '' },
  { name: 'سفير معتمد', retail: '٧٪', wholesale: '٢٪ + ٠٫٥٪ تكرار', perks: 'سحب أسرع، وعينات مجانية، وصفحة سفير', reach: 'فريق نشط من ٥ سفراء', tone: '' },
  { name: 'سفير قائد', retail: '٨٪', wholesale: '٣٪ + ١٪ تكرار', perks: 'فريق، ومكافأة ١٪ على الفريق المباشر، ومدير حساب', reach: 'فريق نشط من ٥ سفراء', tone: '' },
];

export const ambChallenges = [
  { name: 'سفير الحي', desc: 'الأعلى مبيعات في دولتك هذا الشهر', reward: 'شارة + ١٠٠ ر.س', progress: 72 },
  { name: 'أول ١٠ طلبات', desc: 'حقّق ١٠ طلبات منسوبة', reward: '٠٫٥٪ إضافية شهرين', progress: 100 },
  { name: 'طلب جماعي', desc: 'أنشئ طلبًا جماعيًا يقبل ٤ أشخاص', reward: 'مكافأة ٥٠ ر.س', progress: 40 },
];

export const ambTeam = [
  { name: 'خالد — عمّان', orders: 14, sales: '٤٬٢٠٠ ر.س', bonus: '٤٢ ر.س' },
  { name: 'ريم — إربد', orders: 9, sales: '٢٬٨٥٠ ر.س', bonus: '٢٨٫٥ ر.س' },
  { name: 'يوسف — الزرقاء', orders: 5, sales: '١٬٤٠٠ ر.س', bonus: '١٤ ر.س' },
];

export const ambKyc = [
  { t: 'تأكيد الجوال', s: 'تم التحقق برمز OTP', done: true },
  { t: 'البريد الإلكتروني', s: 'تم التأكيد', done: true },
  { t: 'الهوية الوطنية / جواز السفر', s: 'مقبول', done: true },
  { t: 'التحقق بصورة شخصية (Selfie)', s: 'مطلوب لرفع حدود السحب', done: false },
  { t: 'طريقة استلام العمولة', s: 'اربط محفظتك أو حسابك البنكي', done: false },
];

export const ambTerms = [
  { q: 'من يحق له أن يكون سفيرًا؟', a: 'كل من يحب المنتج السعودي — زائر، أو مقيم، أو من الجاليات في الخارج. التسجيل داخل المملكة مسموح، ويبدأ التفعيل للكسب من خارج المملكة، وتُحتسب العمولة على الطلبات المشحونة إلى خارج المملكة فقط.' },
  { q: 'كيف تُنسب الطلبات إليّ؟', a: 'في التجزئة: آخر نقرة على رابطك خلال ٣٠ يومًا، أو إدخال كودك عند الدفع، والكود يتغلّب على الرابط. في الجملة: يرتبط حساب التاجر بك لمدة ١٢ شهرًا تكسب خلالها على الصفقات المتكررة.' },
  { q: 'متى تصبح العمولة قابلة للسحب؟', a: 'تبقى العمولة «معلّقة» حتى يتأكد التسليم في بلد الوصول وتنتهي نافذة الإرجاع المعتمدة لذلك البلد، ثم تصبح «قابلة للسحب» بعد التحقق من الهوية.' },
  { q: 'ما الممنوع في البرنامج؟', a: 'شراء السفير لنفسه بكوده، والإعلان المدفوع على اسم سفير في محركات البحث، واستخدام اسم أي جهة حكومية، والوعد بأرباح ثابتة للانضمام.' },
  { q: 'كيف أحصل على المزيد من المبيعات؟', a: 'استخدم مكتبة المحتوى الجاهز بلغتك، وركّز على منتجات موسمك المحلي، وأنشئ طلبات جماعية لتخفيض الشحن، وارعَ تجار الجملة المُحالين.' },
];

/* --------------------------------------------------------------- admin data
   The platform operations room: one role for the internal team that watches
   every order, every riyal, every commission and every shipment. */

export const adminNav: NavItem[] = [
  { key: 'admin-home', label: 'الرئيسية والتحليلات', icon: 'ri-dashboard-3-line' },
  { key: 'admin-platform', label: 'الإعدادات التجارية', icon: 'ri-equalizer-line' },
  { key: 'admin-factories', label: 'إدارة المصانع', icon: 'ri-building-2-line', badge: '4' },
  { key: 'admin-products', label: 'المنتجات والكتالوج', icon: 'ri-shopping-bag-3-line', badge: '3' },
  { key: 'admin-orders', label: 'الطلبات', icon: 'ri-file-list-3-line', badge: '12' },
  { key: 'admin-ambassadors', label: 'السفراء', icon: 'ri-share-forward-2-line' },
  { key: 'admin-returns', label: 'سجل الإرجاعات', icon: 'ri-arrow-go-back-line', badge: '3' },
  { key: 'admin-amb-pages', label: 'صفحات السفراء', icon: 'ri-window-2-line', badge: '2' },
  { key: 'admin-finance', label: 'المالية والتسويات', icon: 'ri-money-dollar-circle-line' },
  { key: 'admin-warehouses', label: 'عمليات المستودعات', icon: 'ri-building-4-line' },
  { key: 'admin-logistics', label: 'الشحن واللوجستيات', icon: 'ri-truck-line' },
  { key: 'admin-groups', label: 'الطلبات الجماعية', icon: 'ri-group-line' },
  { key: 'admin-compliance', label: 'التوثيق والامتثال', icon: 'ri-shield-check-line' },
  { key: 'admin-whatsapp', label: 'قوالب واتساب', icon: 'ri-whatsapp-line' },
  { key: 'admin-privacy', label: 'طلبات الخصوصية', icon: 'ri-user-shared-line' },
  { key: 'admin-health', label: 'صحة النظام', icon: 'ri-pulse-line' },
  { key: 'admin-marketing', label: 'التسويق والمحتوى', icon: 'ri-megaphone-line' },
  { key: 'admin-content', label: 'إدارة المحتوى', icon: 'ri-file-edit-line' },
  { key: 'admin-support', label: 'الدعم والإدارة الداخلية', icon: 'ri-customer-service-2-line' },
  { key: 'admin-contracts', label: 'العقود', icon: 'ri-file-paper-2-line', badge: '4' },
  { key: 'admin-accounts', label: 'الحسابات المسجّلة', icon: 'ri-user-follow-line' },
];

export const adminUser = {
  name: 'سارة العتيبي',
  role: 'مديرة العمليات',
  country: 'الرياض — السعودية',
  initials: 'س.ع',
};

export const adminStats = [
  { icon: 'ri-money-dollar-circle-line', num: '٤٫٢٦ م', lbl: 'إجمالي المبيعات', delta: '+١٤٪', up: true },
  { icon: 'ri-percent-line', num: '٢٩٤٬٨٠٠ ر.س', lbl: 'إيراد المنصة', delta: '+٩٪', up: true },
  { icon: 'ri-shopping-bag-3-line', num: '١٬٢٤٠', lbl: 'طلبات التجزئة', delta: '+٦٪', up: true },
  { icon: 'ri-hand-coin-line', num: '٨٦', lbl: 'صفقات الجملة', delta: '+٣٪', up: true },
  { icon: 'ri-receipt-line', num: '٣٬٤٠٠ ر.س', lbl: 'متوسط الطلب', delta: '+٢٪', up: true },
  { icon: 'ri-building-2-line', num: '٤٢', lbl: 'مصانع نشطة', delta: '', up: true },
  { icon: 'ri-share-forward-2-line', num: '٥١٢', lbl: 'سفراء نشطون', delta: '+١١٪', up: true },
  { icon: 'ri-line-chart-line', num: '٣٨٪', lbl: 'المبيعات عبر السفراء', delta: '+٤٪', up: true },
];

export const adminAlerts = [
  { icon: 'ri-timer-flash-line', t: 'طلب تجاوز مهلة الشحن', s: 'SFR-20512 · متأخر ٣ أيام · مصنع وفرة', tone: 'danger', time: 'منذ ساعة' },
  { icon: 'ri-bank-card-2-line', t: 'مدفوعات فاشلة متكررة', s: '٤ عمليات فاشلة على نفس البطاقة · خالد ع.', tone: 'warn', time: 'منذ ٣ ساعات' },
  { icon: 'ri-alarm-warning-line', t: 'اشتباه احتيال', s: 'نقرات من جهاز واحد + شراء ذاتي · JO-1190', tone: 'danger', time: 'أمس' },
  { icon: 'ri-file-warning-line', t: 'مستندات مصنع منتهية', s: 'الترخيص الصناعي لـ«بيت القهوة» بعد ٥ أيام', tone: 'warn', time: 'أمس' },
];

export const adminSalesByCountry = [
  { country: 'الأردن', value: '٩٢٠٬٤٠٠ ر.س', pct: 41 },
  { country: 'مصر', value: '٧٤٠٬١٠٠ ر.س', pct: 33 },
  { country: 'الإمارات', value: '٣٨٦٬٠٠٠ ر.س', pct: 17 },
  { country: 'تركيا', value: '١٩٨٬٥٠٠ ر.س', pct: 9 },
];

/* Six-month platform-wide trend for the admin analytics card.
   Sales are in millions of SAR, revenue in thousands of SAR. */
export const adminTrend = {
  labels: ['مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر'],
  sales: { values: [2.9, 3.2, 3.05, 3.55, 3.95, 4.26], delta: '+١٤٪' },
  orders: { values: [880, 950, 910, 1040, 1160, 1240], delta: '+٦٪' },
  revenue: { values: [186, 204, 196, 232, 258, 294.8], delta: '+٩٪' },
};

export const adminTopFactories = [
  { name: 'نُسج للعبايات', sales: '٦٨٤٬٠٠٠ ر.س', score: 92 },
  { name: 'تمور المدينة', sales: '٥٢١٬٤٠٠ ر.س', score: 88 },
  { name: 'دار العود', sales: '٤١٢٬٩٠٠ ر.س', score: 85 },
  { name: 'بيت القهوة السعودية', sales: '٢٩٨٬٢٠٠ ر.س', score: 79 },
];

export const adminPendingFactories = [
  { name: 'مصنع الواحة للتمور', cr: 'CR-4038', city: 'القصيم', category: 'أغذية', status: 'بانتظار المراجعة', tone: 'warn' },
  { name: 'ورش الحرف للعطور', cr: 'CR-4091', city: 'الطائف', category: 'عطور', status: 'مستند ناقص', tone: 'danger' },
  { name: 'نُخب للشوكولاتة', cr: 'CR-4102', city: 'جدة', category: 'أغذية', status: 'بانتظار المراجعة', tone: 'warn' },
  { name: 'الصناعات النجدية', cr: 'CR-4115', city: 'الرياض', category: 'منسوجات', status: 'بانتظار المراجعة', tone: 'warn' },
];

export const adminFactoriesList = [
  { name: 'نُسج للعبايات', plan: 'بلاتيني', products: 48, sales: '٦٨٤٬٠٠٠ ر.س', rating: '٤٫٨', onTime: 96, returns: 2 },
  { name: 'تمور المدينة', plan: 'ذهبي', products: 32, sales: '٥٢١٬٤٠٠ ر.س', rating: '٤٫٧', onTime: 93, returns: 3 },
  { name: 'دار العود', plan: 'ذهبي', products: 26, sales: '٤١٢٬٩٠٠ ر.س', rating: '٤٫٦', onTime: 91, returns: 4 },
  { name: 'بيت القهوة السعودية', plan: 'فضي', products: 18, sales: '٢٩٨٬٢٠٠ ر.س', rating: '٤٫٤', onTime: 86, returns: 6 },
];

export const adminProductReview = [
  { name: 'عباية صيف مطرّزة', factory: 'نُسج للعبايات', category: 'أزياء', hs: '6204.42', countries: 'الأردن · مصر', img: 'https://readdy.ai/api/search-image?query=Minimal%20product%20photo%20of%20a%20folded%20elegant%20summer%20abaya%20with%20subtle%20embroidery%20on%20a%20clean%20warm%20beige%20background%2C%20soft%20light%2C%20neutral%20palette%2C%20high%20detail&width=800&height=600&seq=sta-adm-prod-abaya-01&orientation=landscape' },
  { name: 'تمر عجوة فاخر', factory: 'تمور المدينة', category: 'أغذية', hs: '0804.10', countries: 'الأردن · الإمارات', img: 'https://readdy.ai/api/search-image?query=Minimal%20product%20photo%20of%20a%20shallow%20tray%20of%20premium%20ajwa%20dates%20on%20a%20clean%20warm%20beige%20surface%2C%20soft%20amber%20light%2C%20top%20view%2C%20high%20detail&width=800&height=600&seq=sta-adm-prod-ajwa-02&orientation=landscape' },
  { name: 'بخور معمول مميز', factory: 'دار العود', category: 'عطور', hs: '3307.41', countries: 'مصر · تركيا', img: 'https://readdy.ai/api/search-image?query=Minimal%20product%20photo%20of%20a%20small%20glass%20jar%20of%20premium%20bakhoor%20incense%20on%20a%20clean%20warm%20beige%20surface%2C%20soft%20amber%20light%2C%20high%20detail&width=800&height=600&seq=sta-adm-prod-bakhoor-03&orientation=landscape' },
];

export const adminProductsList = [
  { name: 'علبة تمر سكري فاخرة', factory: 'تمور المدينة', status: 'منشور', tone: 'ok', price: '٩٦ ر.س', stock: '٨٤٠', sales: '١٬٢٤٠', translation: 100 },
  { name: 'عطر عود مركّز', factory: 'دار العود', status: 'منشور', tone: 'ok', price: '٢٤٠ ر.س', stock: '٣١٠', sales: '٦٨٠', translation: 80 },
  { name: 'عباية كلاسيك مطرّزة', factory: 'نُسج للعبايات', status: 'قيد المراجعة', tone: 'warn', price: '٤٩٠ ر.س', stock: '١٢٠', sales: '٤٥٠', translation: 60 },
  { name: 'قهوة عربية مطحونة', factory: 'بيت القهوة السعودية', status: 'موقوف', tone: 'danger', price: '٦٨ ر.س', stock: '٠', sales: '٩٨٠', translation: 100 },
];

export const adminOrders = [
  { id: 'SFR-20512', buyer: 'خالد العمري', country: 'الأردن', value: '٤٢٠ ر.س', pay: 'مدفوع', payTone: 'ok', ship: 'متأخر', shipTone: 'danger', ambassador: 'AHMAD-JO-2481' },
  { id: 'SFR-20508', buyer: 'ليلى حسن', country: 'مصر', value: '٧٦٠ ر.س', pay: 'مدفوع', payTone: 'ok', ship: 'في المستودع', shipTone: 'info', ambassador: '—' },
  { id: 'SFR-20501', buyer: 'سامر ناصر', country: 'الأردن', value: '٢٩٠ ر.س', pay: 'بانتظار', payTone: 'warn', ship: 'قيد التجهيز', shipTone: 'info', ambassador: 'REEM-JO-3012' },
  { id: 'SFR-20497', buyer: 'نور الدين', country: 'تركيا', value: '١٬١٢٠ ر.س', pay: 'مدفوع', payTone: 'ok', ship: 'خرج من المملكة', shipTone: 'info', ambassador: '—' },
  { id: 'SFR-20490', buyer: 'مريم سالم', country: 'الإمارات', value: '٥٤٠ ر.س', pay: 'مسترد جزئيًا', payTone: 'warn', ship: 'تم التسليم', shipTone: 'ok', ambassador: '—' },
];

export const adminRfq = [
  { buyer: 'متجر الياسمين', product: 'عباية كلاسيك × ٥٠٠', country: 'الأردن', delivery: 'CIF — عمّان', offers: 3 },
  { buyer: 'سوق الحرير', product: 'تمر عجوة × ١٠٠٠', country: 'مصر', delivery: 'FOB — جدة', offers: 5 },
  { buyer: 'نُزل التمور', product: 'قهوة عربية × ٢٠٠٠', country: 'الأردن', delivery: 'EXW', offers: 2 },
];

export const adminWholesaleDeals = [
  { factory: 'نُسج للعبايات', buyer: 'متجر الياسمين', value: '٨٤٬٠٠٠ ر.س', terms: '٥٠٪ مقدّم', stage: 'الإنتاج', progress: 55 },
  { factory: 'تمور المدينة', buyer: 'سوق الحرير', value: '٩٦٬٠٠٠ ر.س', terms: 'دفعة واحدة', stage: 'الشحن', progress: 88 },
  { factory: 'دار العود', buyer: 'نُزل التمور', value: '٤٥٬٠٠٠ ر.س', terms: '٤٠٪ مقدّم', stage: 'التجهيز', progress: 32 },
];

export const adminReturns = [
  { id: 'RET-118', order: 'SFR-20390', item: 'علبة تمر سكري', reason: 'منتج تالف', amount: '٩٦ ر.س', deadline: '٢ يوم', decision: 'بانتظار', tone: 'warn' },
  { id: 'RET-113', order: 'SFR-20312', item: 'عباية كلاسيك', reason: 'المقاس غير مناسب', amount: '٤٩٠ ر.س', deadline: '١ يوم', decision: 'استرداد كلي', tone: 'ok' },
  { id: 'RET-109', order: 'SFR-20255', item: 'بخور معمول', reason: 'غير مطابق', amount: '١٨٠ ر.س', deadline: 'منتهية', decision: 'رفض + تحميل التكلفة', tone: 'danger' },
];

/* Full return-case log for the admin returns register. status is the decision
   the register starts with; every later decision is layered on top from the
   admin ops store, so the log keeps one canonical state per case.
   status: pending | accepted | rejected | received */
export const adminReturnsLog = [
  { id: 'RET-126', order: 'SFR-2026-58110', buyer: 'نورة القحطاني', country: 'السعودية', factory: 'دار العود', item: 'بخور معمول فاخر', reason: 'damaged', amount: 1080, creditNote: 'CN-202610-0018', requestedAt: '2026-10-11', status: 'received' },
  { id: 'RET-125', order: 'SFR-2026-54211', buyer: 'خالد العمري', country: 'الأردن', factory: 'تمور المدينة', item: 'علبة تمر سكري فاخرة', reason: 'damaged', amount: 480, creditNote: 'CN-202610-0012', requestedAt: '2026-10-08', status: 'accepted' },
  { id: 'RET-124', order: 'SFR-2026-52890', buyer: 'ليلى حسن', country: 'مصر', factory: 'نُسج للعبايات', item: 'عباية كلاسيك مطرّزة', reason: 'size', amount: 980, creditNote: 'CN-202610-0004', requestedAt: '2026-10-04', status: 'rejected' },
  { id: 'RET-123', order: 'SFR-2026-51102', buyer: 'سامر ناصر', country: 'الأردن', factory: 'بيت القهوة السعودية', item: 'قهوة عربية مطحونة', reason: 'notAsDescribed', amount: 264, creditNote: 'CN-202609-0044', requestedAt: '2026-09-29', status: 'received' },
  { id: 'RET-122', order: 'SFR-2026-49871', buyer: 'مريم سالم', country: 'الإمارات', factory: 'دار العود', item: 'عطر عود مركّز', reason: 'other', amount: 480, creditNote: 'CN-202609-0031', requestedAt: '2026-09-21', status: 'accepted' },
  { id: 'RET-121', order: 'SFR-2026-48330', buyer: 'نور الدين', country: 'تركيا', factory: 'نُسج للعبايات', item: 'عباية صيف مطرّزة', reason: 'size', amount: 735, creditNote: 'CN-202609-0009', requestedAt: '2026-09-12', status: 'pending' },
  { id: 'RET-120', order: 'SFR-2026-47012', buyer: 'أحمد النعيمي', country: 'الأردن', factory: 'تمور المدينة', item: 'تمر عجوة المدينة', reason: 'damaged', amount: 360, creditNote: 'CN-202609-0002', requestedAt: '2026-09-05', status: 'rejected' },
];

export const adminAmbassadors = [
  { name: 'أحمد النعيمي', country: 'الأردن', level: 'سفير معتمد', source: 'رابط عام', clicks: '٨٬٢٤١', orders: 47, sales: '٦٨٬٠٠٠ ر.س', commission: '٤٬٧٦٠ ر.س', status: 'موثّق', tone: 'ok' },
  { name: 'ريم الحربي', country: 'مصر', level: 'سفير قائد', source: 'دعوة فريق', clicks: '١٥٬٢٠٠', orders: 63, sales: '١٢٤٬٠٠٠ ر.س', commission: '٩٬٩٢٠ ر.س', status: 'موثّق', tone: 'ok' },
  { name: 'خالد العز', country: 'الأردن', level: 'سفير', source: 'حملة تيك توك', clicks: '٣٬١٠٠', orders: 4, sales: '٨٬٤٠٠ ر.س', commission: '٥٨٨ ر.س', status: 'بانتظار KYC', tone: 'warn' },
  { name: 'يوسف كمال', country: 'تركيا', level: 'سفير معتمد', source: 'شريك سفر', clicks: '٦٬٤٠٠', orders: 21, sales: '٣١٬٥٠٠ ر.س', commission: '٢٬٢٠٥ ر.س', status: 'مجمّد', tone: 'danger' },
];

export const adminPayments = [
  { id: 'PAY-90231', gateway: 'mada', currency: 'SAR', amount: '٤٢٠٫٠٠', rate: '١٫٠٠', fee: '٦٫٣٠', status: 'مطابق', tone: 'ok' },
  { id: 'PAY-90228', gateway: 'Visa', currency: 'SAR', amount: '٧٦٠٫٠٠', rate: '١٫٠٠', fee: '١١٫٤٠', status: 'مطابق', tone: 'ok' },
  { id: 'PAY-90224', gateway: 'MasterCard', currency: 'USD', amount: '١٤٥٫٠٠', rate: '٣٫٧٥', fee: '٨٫١٥', status: 'قيد المطابقة', tone: 'warn' },
  { id: 'PAY-90219', gateway: 'Apple Pay', currency: 'SAR', amount: '٥٤٠٫٠٠', rate: '١٫٠٠', fee: '٨٫١٠', status: 'فاشل', tone: 'danger' },
];

export const adminSettlements = [
  { factory: 'نُسج للعبايات', period: 'سبتمبر ٢٠٢٦', sales: '٦٨٬٤٠٠ ر.س', commission: '٤٬١٠٤ ر.س', fee: '٦٨٤ ر.س', net: '٦٣٬٦١٢ ر.س', status: 'معتمد', tone: 'ok' },
  { factory: 'تمور المدينة', period: 'سبتمبر ٢٠٢٦', sales: '٥٢٬١٠٠ ر.س', commission: '٣٬١٢٦ ر.س', fee: '٥٢١ ر.س', net: '٤٨٬٤٥٣ ر.س', status: 'قيد الدورة', tone: 'warn' },
  { factory: 'دار العود', period: 'سبتمبر ٢٠٢٦', sales: '٤١٬٢٠٠ ر.س', commission: '٢٬٤٧٢ ر.س', fee: '٤١٢ ر.س', net: '٣٨٬٣١٦ ر.س', status: 'معتمد', tone: 'ok' },
];

/* Per-order settlement ledger. Gross is the goods value in SAR; segment drives
   the active PlatformConfig (channel take rate, tier commission, capped discount). An ambassador
   is only commissioned on a new customer's first order, so a repeat order that
   still carries an ambassador code pays zero commission. */
export const adminFinanceOrders: LedgerOrder[] = [
  { id: 'SFR-20512', channel: 'retail', discount: 17, ambassadorTier: 'certified', leader: 'REEM-EG-3012', date: '2026-10-12', buyer: 'خالد العمري', country: 'الأردن', gross: 420, segment: 'new', ambassador: 'AHMAD-JO-2481', status: 'محصّل', tone: 'ok' },
  { id: 'SFR-20508', channel: 'retail', discount: 30, date: '2026-10-09', buyer: 'ليلى حسن', country: 'مصر', gross: 760, segment: 'new', ambassador: '', status: 'محصّل', tone: 'ok' },
  { id: 'SFR-20501', channel: 'retail', ambassadorTier: 'starter', date: '2026-10-06', buyer: 'سامر ناصر', country: 'الأردن', gross: 290, segment: 'repeat', ambassador: 'REEM-JO-3012', status: 'بانتظار الدفع', tone: 'warn' },
  { id: 'SFR-20497', channel: 'wholesale', date: '2026-09-28', buyer: 'نور الدين', country: 'تركيا', gross: 1120, segment: 'new', ambassador: '', status: 'محصّل', tone: 'ok' },
  { id: 'SFR-20490', channel: 'retail', date: '2026-09-18', buyer: 'مريم سالم', country: 'الإمارات', gross: 540, segment: 'repeat', ambassador: '', status: 'مسترد جزئيًا', tone: 'warn' },
  { id: 'SFR-20481', channel: 'wholesale', monthsSinceFirstDeal: 0, leader: 'REEM-EG-3012', date: '2026-10-04', buyer: 'أحمد النعيمي', country: 'الأردن', gross: 2312, segment: 'new', ambassador: 'AHMAD-JO-2481', status: 'محصّل', tone: 'ok' },
  { id: 'SFR-20462', channel: 'wholesale', monthsSinceFirstDeal: 3, leader: 'REEM-EG-3012', date: '2026-09-27', buyer: 'أحمد النعيمي', country: 'الأردن', gross: 285, segment: 'repeat', ambassador: 'AHMAD-JO-2481', status: 'محصّل', tone: 'ok' },
];

export const adminPayouts = [
  { name: 'ريم الحربي', country: 'مصر', available: '٩٬٩٢٠ ر.س', method: 'تحويل بنكي', status: 'بانتظار الاعتماد', tone: 'warn' },
  { name: 'أحمد النعيمي', country: 'الأردن', available: '٣٬٠٦٠ ر.س', method: 'محفظة إلكترونية', status: 'معتمد', tone: 'ok' },
  { name: 'يوسف كمال', country: 'تركيا', available: '٢٬٢٠٥ ر.س', method: 'رصيد شراء', status: 'معلّق (احتيال)', tone: 'danger' },
];

export const adminInvoices = [
  { id: 'INV-5501', party: 'نُسج للعبايات', type: 'فاتورة عمولة', amount: '٤٬١٠٤ ر.س', vat: 'مرتبطة «فاتورة»', status: 'صادرة', tone: 'ok' },
  { id: 'INV-5498', party: 'سوق الحرير', type: 'إشعار دائن', amount: '٩٦٠ ر.س', vat: 'مرتبطة «فاتورة»', status: 'صادرة', tone: 'ok' },
  { id: 'INV-5490', party: 'تمور المدينة', type: 'فاتورة عمولة', amount: '٣٬١٢٦ ر.س', vat: 'بانتظار الربط', status: 'مسودة', tone: 'warn' },
];

export const adminCarriers = [
  { name: 'أرامكس', service: 'جوّي + بحري', countries: '٢٤ دولة', status: 'مفعّل', tone: 'ok', performance: 94 },
  { name: 'DHL', service: 'جوّي سريع', countries: '٣٨ دولة', status: 'مفعّل', tone: 'ok', performance: 90 },
  { name: 'SMEX', service: 'بحري اقتصادي', countries: '١٢ دولة', status: 'مفعّل', tone: 'ok', performance: 82 },
  { name: 'بريد سبل', service: 'بريد مسجّل', countries: '٤ دول', status: 'موقوف', tone: 'danger', performance: 61 },
];

export const adminWarehouse = [
  { stage: 'الوارد من المصانع', value: '٣٢٠ شحنة', pct: 80 },
  { stage: 'منتظر التجميع', value: '١٢٨ شحنة', pct: 45 },
  { stage: 'الصادر', value: '٢٤٦ شحنة', pct: 62 },
  { stage: 'الإشغال', value: '٧٤٪ من السعة', pct: 74 },
];

export const adminShipments = [
  { id: 'SHP-7781', tracking: 'SFR-2609-K7P2QF', carrier: 'أرامكس', status: 'في جمارك الوجهة', tone: 'warn', last: 'دبي — بانتظار التخليص', delay: 'متأخر يوم' },
  { id: 'SHP-7770', tracking: 'SFR-2608-P4L8WD', carrier: 'DHL', status: 'خرج للتوصيل', tone: 'info', last: 'القاهرة — مع المندوب', delay: 'في الموعد' },
  { id: 'SHP-7762', tracking: 'SFR-2608-Q9N1XM', carrier: 'SMEX', status: 'بانتظار بوليصة', tone: 'warn', last: 'مستودع جدة — قيد التجميع', delay: 'في الموعد' },
  { id: 'SHP-7751', tracking: 'SFR-2607-B3M9ZR', carrier: 'DHL', status: 'تم التسليم', tone: 'ok', last: 'لندن — تم التسليم', delay: 'في الموعد' },
];

export const adminExportDocs = [
  { name: 'الفاتورة التجارية', type: 'INV-5501', order: 'SFR-20512', status: 'جاهز', tone: 'ok' },
  { name: 'قائمة التعبئة', type: 'PL-7712', order: 'SFR-20512', status: 'جاهز', tone: 'ok' },
  { name: 'شهادة المنشأ', type: 'CO-4410', order: 'SFR-20508', status: 'بانتظار الغرفة', tone: 'warn' },
  { name: 'شهادة حلال', type: 'HL-2201', order: 'SFR-20501', status: 'مطلوب', tone: 'danger' },
];

export const adminClearanceGaps = [
  { tracking: 'SFR-2609-K7P2QF', order: 'SFR-2026-47921', country: 'الإمارات', hub: 'ميناء جبل علي', incoterm: 'CIF', party: 'المشتري', missing: ['بوليصة الشحن', 'شهادة المنشأ', 'بيان التصدير'], ageDays: 6, tone: 'danger' },
  { tracking: 'SFR-2608-P4L8WD', order: 'SFR-2026-41128', country: 'مصر', hub: 'ميناء الإسكندرية', incoterm: 'FOB', party: 'وكيل شحن', missing: ['قائمة التعبئة', 'بيانات المستورد'], ageDays: 3, tone: 'warn' },
  { tracking: 'SFR-2608-Q9N1XM', order: 'SFR-2026-39907', country: 'المغرب', hub: 'ميناء الدار البيضاء', incoterm: 'CIF', party: 'المشتري', missing: ['شهادة المنشأ'], ageDays: 1, tone: 'warn' },
];

export const adminCountryRules = [
  { country: 'الأردن', threshold: '١٥٠ د.أ معفى', restricted: '٣ فئات', docs: 'فاتورة + منشأ', fee: '١٠٪' },
  { country: 'مصر', threshold: '١٥٠٠ ج.م معفى', restricted: '٥ فئات', docs: 'فاتورة + حلال', fee: '١٤٪' },
  { country: 'الإمارات', threshold: '١٬٠٠٠ د.إ معفى', restricted: '٢ فئة', docs: 'فاتورة + منشأ', fee: '٥٪' },
  { country: 'تركيا', threshold: '١٥٠ يورو معفى', restricted: '٧ فئات', docs: 'فاتورة + صحي', fee: '٢٠٪' },
];

export const adminVerifications = [
  { entity: 'مصنع الواحة للتمور', type: 'KYB — مصنع', result: 'مقبول بشرط', sanctions: 'نظيف', tone: 'warn' },
  { entity: 'خالد العز', type: 'KYC — سفير', result: 'قيد الفحص', sanctions: 'قائمة مراقبة', tone: 'warn' },
  { entity: 'نُخب للشوكولاتة', type: 'KYB — مصنع', result: 'مقبول', sanctions: 'نظيف', tone: 'ok' },
  { entity: 'يوسف كمال', type: 'KYC — سفير', result: 'مرفوض', sanctions: 'تطابق اسم', tone: 'danger' },
];

export const adminCampaigns = [
  { name: 'حملة العيد', period: '١–٢٠ أكتوبر', countries: 'الأردن · مصر', factories: 8, performance: '٨٤٪ من الهدف' },
  { name: 'عيد الفطر — تمور', period: '١–١٥ مارس', countries: '٤ دول', factories: 6, performance: 'مكتملة' },
  { name: 'موسم العودة للمدارس', period: '٢٠ أغسطس', countries: 'الأردن', factories: 5, performance: 'قادمة' },
];

export const adminCoupons = [
  { code: 'EID4', type: 'خصم ٤٪ (السقف)', limits: 'حتى ٥٠٠ ر.س', usage: '٣٢٠ / ١٠٠٠', bearer: 'المنصة' },
  { code: 'FACTORY50', type: 'شحن مجاني', limits: 'فوق ٥٠٠ ر.س', usage: '١٢٨ / ٥٠٠', bearer: 'المصنع' },
  { code: 'AMB20', type: '٢٠ ر.س', limits: 'أول طلب', usage: '٨٤٠ / ٩٩٩', bearer: 'المصنع' },
];

export const adminContentLibrary = [
  { name: 'قصة مصنع التمور', lang: 'الأردية', product: 'تمور المدينة', posts: 34, img: 'https://readdy.ai/api/search-image?query=Minimal%20editorial%20still%20of%20Saudi%20date%20factory%20interior%20with%20warm%20light%20and%20kraft%20boxes%2C%20clean%20beige%20tones%2C%20high%20detail&width=800&height=600&seq=sta-adm-content-dates-01&orientation=landscape' },
  { name: 'صور عبايات موسم العروض', lang: 'الإنجليزية', product: 'نُسج للعبايات', posts: 21, img: 'https://readdy.ai/api/search-image?query=Minimal%20editorial%20still%20of%20folded%20abayas%20on%20a%20neutral%20surface%20with%20soft%20light%2C%20clean%20beige%20tones%2C%20high%20detail&width=800&height=600&seq=sta-adm-content-abaya-02&orientation=landscape' },
  { name: 'بانر حملة الحقيبة الثانية', lang: 'العربية', product: 'عام', posts: 48, img: 'https://readdy.ai/api/search-image?query=Minimal%20editorial%20banner%20scene%20of%20a%20kraft%20suitcase%20and%20shipping%20box%20in%20a%20light%20airport%20corridor%2C%20neutral%20beige%20tones%2C%20warm%20light%2C%20high%20detail&width=800&height=600&seq=sta-adm-content-bag-03&orientation=landscape' },
];

export const adminNotifications = [
  { event: 'تأكيد الطلب', channels: 'بريد · واتساب', langs: '٦ لغات', status: 'مفعّل', tone: 'ok' },
  { event: 'شحن الطلب', channels: 'بريد · واتساب · SMS', langs: '٦ لغات', status: 'مفعّل', tone: 'ok' },
  { event: 'تسوية المصنع', channels: 'بريد', langs: 'لغتان', status: 'مسودة', tone: 'warn' },
  { event: 'استرداد الرصيد', channels: 'بريد · واتساب', langs: '٤ لغات', status: 'مفعّل', tone: 'ok' },
];

export const adminTranslations = [
  { lang: 'العربية', pct: 100 },
  { lang: 'الإنجليزية', pct: 96 },
  { lang: 'الأردية', pct: 74 },
  { lang: 'الإندونيسية', pct: 58 },
  { lang: 'التركية', pct: 41 },
];

export const adminTickets = [
  { party: 'أحمد النعيمي', lang: 'العربية', priority: 'عالية', priorityTone: 'danger', agent: 'سارة العتيبي', deadline: '٤ ساعات', status: 'مفتوحة', tone: 'warn' },
  { party: 'مصنع وفرة', lang: 'الإنجليزية', priority: 'متوسطة', priorityTone: 'warn', agent: '—', deadline: '٢٤ ساعة', status: 'بانتظار التعيين', tone: 'danger' },
  { party: 'متجر الياسمين', lang: 'العربية', priority: 'منخفضة', priorityTone: 'mute', agent: 'يوسف ك.', deadline: '٤٨ ساعة', status: 'قيد المعالجة', tone: 'info' },
  { party: 'Umm Ahmad', lang: 'الأردية', priority: 'متوسطة', priorityTone: 'warn', agent: 'ريم ح.', deadline: '٢٤ ساعة', status: 'محلولة', tone: 'ok' },
];

export const adminStaff = [
  { name: 'سارة العتيبي', role: 'مديرة العمليات', scope: 'كل الصلاحيات', twofa: true },
  { name: 'يوسف كمال', role: 'مسؤول الطلبات', scope: 'الطلبات · الشحن', twofa: true },
  { name: 'ريم الحربي', role: 'مسؤولة السفراء', scope: 'السفراء · التسويق', twofa: false },
  { name: 'خالد العمري', role: 'محاسب', scope: 'المالية (قراءة)', twofa: true },
];

export const adminAudit = [
  { who: 'سارة العتيبي', what: 'اعتماد مصنع · مصنع الواحة للتمور', cat: 'factory', device: 'MacBook · الرياض', before: 'بانتظار المراجعة', after: 'معتمد', daysAgo: 0, hour: 11, minute: 4 },
  { who: 'يوسف كمال', what: 'جدولة استلام شحنة · SFR-2608-P4L8WD', cat: 'shipment', device: 'Windows · جدة', before: 'بانتظار بوليصة', after: 'استلام مجدول', daysAgo: 0, hour: 9, minute: 40 },
  { who: 'ريم الحربي', what: 'اعتماد منتج · عباية صيف مطرّزة', cat: 'product', device: 'iPhone · القاهرة', before: 'قيد المراجعة', after: 'معتمد', daysAgo: 0, hour: 8, minute: 12 },
  { who: 'سارة العتيبي', what: 'تحكيم نزاع إرجاع · RET-118', cat: 'return', device: 'MacBook · الرياض', before: 'بانتظار', after: 'استرداد كامل (تحكيم)', daysAgo: 1, hour: 18, minute: 22 },
  { who: 'خالد العمري', what: 'تأكيد تسليم شحنة · SFR-2607-B3M9ZR', cat: 'shipment', device: 'Windows · الرياض', before: 'خرج للتوصيل', after: 'تم التسليم', daysAgo: 1, hour: 15, minute: 5 },
  { who: 'يوسف كمال', what: 'اعتماد منتج · تمر عجوة فاخر', cat: 'product', device: 'Windows · جدة', before: 'قيد المراجعة', after: 'معتمد', daysAgo: 3, hour: 13, minute: 30 },
  { who: 'ريم الحربي', what: 'رفض مصنع · الصناعات النجدية', cat: 'factory', device: 'iPhone · القاهرة', before: 'بانتظار المراجعة', after: 'مرفوض', daysAgo: 6, hour: 10, minute: 45 },
  { who: 'سارة العتيبي', what: 'تنفيذ استرداد · RET-113', cat: 'return', device: 'MacBook · الرياض', before: 'استرداد كلي', after: 'تم الاسترداد', daysAgo: 12, hour: 16, minute: 20 },
  { who: 'يوسف كمال', what: 'اعتماد مصنع · نُخب للشوكولاتة', cat: 'factory', device: 'Windows · جدة', before: 'بانتظار المراجعة', after: 'معتمد', daysAgo: 40, hour: 9, minute: 0 },
];

/* Platform settings shown in the support screen now come from PlatformConfig (AdminSupport). */

export const adminLabels = {
  meta: { eyebrow: 'لوحة الإدارة', title: 'غرفة العمليات' },
  common: {
    approve: 'اعتماد', reject: 'رفض', review: 'مراجعة', details: 'التفاصيل',
    exportExcel: 'تصدير Excel', exportPdf: 'تصدير PDF',
    filter: 'فلترة', search: 'بحث', assign: 'تعيين مسؤول', resolve: 'معالجة',
    close: 'إغلاق', edit: 'تعديل', create: 'إنشاء', pause: 'إيقاف',
    view: 'عرض', addRule: 'إضافة قاعدة', simulate: 'محاكاة سعر',
    promote: 'ترقية', demote: 'خفض', suspend: 'إيقاف', message: 'رسالة',
    requestDocs: 'طلب مستندات', schedule: 'جدولة', upload: 'رفع', send: 'إرسال',
    target: 'الوجهة', period: 'الفترة', country: 'الدولة', status: 'الحالة',
    actions: 'الإجراءات', value: 'القيمة', date: 'التاريخ', name: 'الاسم',
    factory: 'المصنع', buyer: 'المشتري', order: 'الطلب', amount: 'المبلغ',
    commission: 'العمولة', net: 'الصافي', payment: 'الدفع', shipping: 'الشحن',
    ambassador: 'السفير', deadline: 'المهلة', priority: 'الأولوية', agent: 'المسؤول',
    role: 'الدور', scope: 'الصلاحيات', twofa: 'التحقق الثنائي', device: 'الجهاز',
    before: 'قبل', after: 'بعد', when: 'الوقت', who: 'الفاعل', arbitrate: 'تحكيم',
    refund: 'استرداد', reproportion: 'إعادة نسبة لسفير', intervene: 'تدخل كوسيط',
    targetFactories: 'توجيه لمصانع إضافية', category: 'الفئة', plan: 'الباقة',
    products: 'المنتجات', sales: 'المبيعات', rating: 'التقييم', onTime: 'الشحن في الموعد',
    returnsCol: 'الإرجاع', price: 'السعر', stock: 'المخزون', translation: 'اكتمال الترجمة',
    level: 'المستوى', source: 'مصدر التجنيد', clicks: 'النقرات', orders: 'الطلبات',
    gateway: 'البوابة', currency: 'العملة', rate: 'سعر الصرف', fee: 'الرسوم',
    method: 'الطريقة', available: 'الرصيد القابل للسحب', service: 'الخدمة',
    countries: 'الدول المخدومة', performance: 'الأداء', carrier: 'الناقل', last: 'آخر حدث',
    delay: 'التأخير', type: 'النوع', threshold: 'الحد المعفى', restricted: 'المقيّد',
    docs: 'المستندات المطلوبة', result: 'النتيجة', sanctions: 'قوائم العقوبات',
    code: 'الكود', limits: 'الحدود', usage: 'الاستخدام', bearer: 'من يتحمل الخصم',
    lang: 'اللغة', completion: 'نسبة الاكتمال', event: 'الحدث', channels: 'القنوات',
    party: 'الطرف', result2: 'الحالة',
  },
  ops: {
    factoryApproved: 'تم اعتماد المصنع وتفعيل حسابه وإشعاره.',
    factoryRejected: 'تم رفض الطلب وإبلاغ المصنع بالمستندات المطلوبة.',
    productApproved: 'تم اعتماد المنتج ونشره في الكتالوج.',
    productRejected: 'تم رفض المنتج وإعادته للمصنع للتعديل.',
    productEdit: 'تم فتح المنتج للتعديل.',
    returnArbitrated: 'تم التحكيم بقبول الاسترداد الكامل للمشتري.',
    returnRefunded: 'تم تنفيذ الاسترداد وإشعار المشتري.',
    shipmentScheduled: 'تمت جدولة الاستلام مع شركة الشحن.',
    shipmentDelivered: 'تم تأكيد التسليم وتحديث حالة الشحنة.',
    docsRequested: 'تم تنزيل نموذج طلب المستندات.',
    statusApproved: 'معتمد',
    statusRejected: 'مرفوض',
    statusArbitrated: 'استرداد كامل (تحكيم)',
    statusRefunded: 'تم الاسترداد',
    statusScheduled: 'استلام مجدول',
    statusDelivered: 'تم التسليم',
    lastScheduled: 'تمت جدولة الاستلام مع الناقل',
    lastDelivered: 'تم التسليم — وقّع المستلم',
    onTime: 'في الموعد',
  },
  audit: {
    factoryApprove: 'اعتماد مصنع',
    factoryReject: 'رفض مصنع',
    productApprove: 'اعتماد منتج',
    productReject: 'رفض منتج',
    returnArbitrate: 'تحكيم نزاع إرجاع',
    returnRefund: 'تنفيذ استرداد',
    shipmentSchedule: 'جدولة استلام شحنة',
    shipmentDeliver: 'تأكيد تسليم شحنة',
    export: 'تصدير السجل',
    empty: 'لا إجراءات مسجّلة بعد — أي اعتماد أو تحكيم سيظهر هنا فورًا بالوقت والجهاز.',
    searchPlaceholder: 'ابحث بالفاعل أو الإجراء أو الجهاز…',
    allActors: 'كل الموظفين',
    allTypes: 'كل الإجراءات',
    allDates: 'كل الفترات',
    today: 'اليوم',
    d7: 'آخر ٧ أيام',
    d30: 'آخر ٣٠ يومًا',
    catFactory: 'المصانع',
    catProduct: 'المنتجات',
    catReturn: 'الإرجاع',
    catShipment: 'الشحن',
    catOther: 'أخرى',
    results: 'نتيجة',
    clear: 'مسح الفلاتر',
    noResults: 'لا نتائج مطابقة للفلتر الحالي.',
    report: 'التقرير الشهري للتدقيق',
    reportSub: 'ملخّص الاعتمادات والتحكيمات لكل موظف خلال الشهر',
    thEmployee: 'الموظف',
    thFactory: 'اعتماد مصانع',
    thProduct: 'اعتماد منتجات',
    thReturns: 'تحكيم/استرداد',
    thShipments: 'شحن',
    thTotal: 'الإجمالي',
    reportExport: 'تصدير التقرير',
    reportEmpty: 'لا إجراءات مسجّلة في هذا الشهر.',
    reportNote: 'يُجمَع التقرير من سجل التدقيق الفعلي حسب الموظف والشهر.',
  },
  home: {
    sub: 'كل طلب، وكل ريال، وكل عمولة، وكل شحنة تمر عبر هذه اللوحة وتُسجَّل في سجل تدقيق.',
    alerts: 'التنبيهات العاجلة', alertsSub: 'طلبات متأخرة، مدفوعات فاشلة، اشتباه احتيال، مستندات منتهية',
    sales: 'المبيعات حسب الدولة', salesSub: 'توزيع الإيراد هذا الشهر',
    topFactories: 'أعلى المصانع أداءً', topFactoriesSub: 'حسب المبيعات ومؤشر جاهزية التصدير',
    ready: 'مؤشر الجاهزية', period: 'آخر ٣٠ يومًا', salesShare: 'من الإيراد',
  },
  factories: {
    sub: 'مراجعة طلبات الانضمام، ومتابعة الباقة والحالة والأداء لكل مصنع.',
    pending: 'طلبات الانضمام', pendingSub: 'بانتظار المراجعة والتحقق',
    list: 'قائمة المصانع', listSub: 'مصنع في المنصة',
    thFacility: 'المنشأة', thCr: 'السجل التجاري', thCity: 'المدينة',
  },
  products: {
    sub: 'اعتماد المنتجات، وإدارة الفئات والسمات، وقواعد المنتجات المقيّدة، والتقييمات.',
    reviewTitle: 'بانتظار الاعتماد', reviewSub: 'منتجات مرسلة من المصانع',
    allTitle: 'كل المنتجات', allSub: 'الحالة والسعر والمخزون والمبيعات والترجمة',
    thProduct: 'المنتج', thHs: 'رمز HS', thAllowed: 'الدول المسموحة',
  },
  orders: {
    sub: 'متابعة كل الطلبات على مستوى المنصة: التجزئة، وعروض الأسعار، وصفقات الجملة، والإرجاع.',
    retail: 'طلبات التجزئة', retailSub: 'أحدث الطلبات على المنصة',
    rfq: 'طلبات عروض الأسعار', rfqSub: 'بانتظار توجيه للمصانع',
    wholesale: 'صفقات الجملة', wholesaleSub: 'قيد الإنتاج والشحن',
    returnsTitle: 'الإرجاع والنزاعات', returnsSub: 'تحكيم وقرار',
    thQty: 'الكمية', thDelivery: 'شرط التسليم', thOffers: 'عدد العروض', thStage: 'المرحلة',
    thReason: 'السبب', thDecision: 'القرار',
  },
  returnsLog: {
    sub: 'كل مرتجع من لحظة الطلب حتى وصول الشحنة: القرار، والاستلام، وقيمة الإشعار الدائن.',
    title: 'سجل الإرجاعات',
    statTotal: 'إجمالي المرتجعات', statPending: 'بانتظار البت', statAccepted: 'مقبولة / مستلمة', statCredit: 'قيمة الإشعارات الدائنة',
    filterAll: 'كل الحالات',
    statusPending: 'بانتظار البت', statusAccepted: 'مقبول', statusRejected: 'مرفوض', statusReceived: 'مستلم',
    thCase: 'المرتجع', thOrder: 'الطلب', thBuyer: 'المشتري', thItem: 'الصنف', thReason: 'السبب',
    thAmount: 'قيمة الإشعار', thCredit: 'الإشعار الدائن', thRequested: 'تاريخ الطلب', thStatus: 'الحالة',
    accept: 'قبول', reject: 'رفض', markReceived: 'تأكيد الاستلام',
    acceptDone: 'تم قبول المرتجع {{id}} وإصدار الإشعار الدائن.',
    rejectDone: 'تم رفض المرتجع {{id}} وإبلاغ المشتري بالسبب.',
    receivedDone: 'تم تسجيل استلام المرتجع {{id}} في مستودع جدة.',
    receivedAt: 'استُلم في {{date}}',
    empty: 'لا مرتجعات مطابقة للفلتر الحالي.',
    exportDone: 'تم تصدير سجل الإرجاعات إلى جهازك.',
    hint: 'القيمة المعروضة هي إجمالي الإشعار الدائن بعد خصم رسوم إعادة التخزين ٥٪.',
    reasonDamaged: 'منتج تالف', reasonSize: 'المقاس غير مناسب', reasonNotAsDescribed: 'غير مطابق للوصف', reasonOther: 'سبب آخر',
    reasonsTitle: 'أعلى أسباب الإرجاع',
    reasonsSub: 'ترتيب الأسباب بحسب عدد المرتجعات وقيمة الإشعارات، والأعلى أولًا',
    reasonTop: 'أعلى سبب: {{reason}} — {{count}} من {{total}} مرتجع ({{pct}}٪)',
    reasonsNote: 'التوزيع محسوب من كل مرتجع مسجّل في السجل، ولا يتأثر بفلتر الحالة أعلاه. الرقم الثالث بجانب كل سبب هو إجمالي قيمة إشعاراته الدائنة.',
  },
  ambassadors: {
    sub: 'أداء كل سفير، ومستواه، ومصدر تجنيده، وعمولاته، وحالة تحققه.',
  },
  finance: {
    sub: 'المدفوعات الواردة، والدفتر المالي، وتسويات المصانع، وصرف عمولات السفراء، والفواتير.',
    payments: 'المدفوعات الواردة', paymentsSub: 'مطابقة العمليات والرسوم',
    settlements: 'تسويات المصانع', settlementsSub: 'دورة تسوية شهرية',
    payouts: 'صرف عمولات السفراء', payoutsSub: 'دفعات جماعية بانتظار الاعتماد',
    invoices: 'الفواتير والضرائب', invoicesSub: 'الربط مع منصة «فاتورة»',
    thInvoice: 'الفاتورة', thVat: 'الضريبة',
    ledger: 'اقتصاديات الطلب وصافي المنصة',
    ledgerSub: 'Take rate التجزئة {{retail}} والجملة {{wholesale}} · عمولة السفير بالمستوى ({{tiers}}) على أول طلب لعميل جديد، والجملة {{ambW}} متكررة {{months}} شهرًا · الخصم بحد {{cap}} يُطرح من صافي المنصة',
    thGross: 'قيمة الطلب', thSegment: 'نوع العميل', thTakeRate: 'Take rate', thTake: 'حصة المنصة',
    thAmb: 'عمولة السفير', thFee: 'رسوم الدفع', thReserve: 'مخصص الإرجاع',
    thDiscount: 'الخصم', thLeader: 'مكافأة القائد', thChannel: 'القناة', channelRetail: 'تجزئة', channelWholesale: 'جملة',
    belowFloor: 'تحت الحد الأدنى للهامش', belowFloorCount: '{{count}} طلب تحت الحد الأدنى للهامش', closeServer: 'إقفال الفترة في الخادم', closedServer: 'تم تسجيل الإقفال في الخادم', closeLocalOnly: 'لا يوجد اتصال بالخادم — المستند للمراجعة فقط وغير صالح كدليل إقفال.',
    thNet: 'صافي المنصة', thMargin: 'هامش الصافي',
    newCustomer: 'عميل جديد', repeatCustomer: 'عميل متكرر',
    noAmb: 'بدون سفير', total: 'الإجمالي', ordersCount: 'طلب',
    statGmv: 'إجمالي قيمة الطلبات', statTake: 'حصة المنصة', statAmb: 'عمولة السفراء', statNet: 'صافي المنصة',
    thDate: 'التاريخ',
    periodMonth: 'هذا الشهر', period30: 'آخر ٣٠ يومًا', period90: 'آخر ٩٠ يومًا', periodAll: 'كل الفترات',
    periodLabel: 'فترة التسوية', periodRange: '{{from}} → {{to}}', periodAllRange: 'كل الفترات المسجّلة',
    closed: 'دورة مقفلة', closing: 'دورة مفتوحة',
    exportExcel: 'تصدير Excel', exported: 'تم تنزيل دفتر التسويات على جهازك.',
    exportEmpty: 'لا توجد طلبات في هذه الفترة للتصدير.',
    exportLedger: 'دفتر التسويات', exportSummary: 'ملخص الفترة',
    exportNote: 'تصدير كامل لدفتر الشهر: كل طلب بنسبته وحصة المنصة وعمولة السفير وصافي المنصة.',
    periodShort: '{{count}} طلب في الفترة المحددة',
    exportPdf: 'تصدير PDF موقّع', exportedPdf: 'تم إنشاء ملخص الإقفال الموقّع وتنزيله PDF.',
    exportPdfFail: 'تعذّر إنشاء ملف PDF — جرّب الطباعة كبديل.', pdfGenerating: 'جاري تجهيز المستند…',
    pdfTitle: 'ملخص إقفال الشهر — دفتر التسويات', pdfSub: 'مستند أرشفة رسمي صادر آليًا من دفتر التسويات',
    pdfRef: 'رقم المستند', pdfGenerated: 'تاريخ الإصدار', pdfPeriod: 'فترة التسوية',
    pdfOrders: 'عدد الطلبات', pdfCycle: 'حالة الدورة', pdfTotals: 'إجماليات الفترة',
    pdfSignature: 'اعتماد مالي', pdfSignedBy: 'المدير المالي', pdfSignLine: 'التوقيع',
    pdfSignatureNote: 'هذا المستند صادر من دفتر التسويات، وبصمته محسوبة في الخادم ومسجّلة في سجل الإقفال غير القابل للتعديل (تسلسل تجزئة مع الإقفال السابق). التحقق يتم بمطابقة البصمة مع سجل الإقفال، لا بإعادة حسابها.',
    pdfHash: 'بصمة التحقق', pdfAuditNote: 'نسخة الأرشفة تُحفظ مع مستندات إقفال الشهر ولا تُعدّل بعد الاعتماد.',
    formula: 'قاعدة الاستدامة: صافي المنصة = حصة المنصة − الخصم (بحد {{cap}}) − عمولة السفير − مكافأة القائد ({{leader}}) − رسوم الدفع − مخصص الإرجاع. أسوأ حالة للتجزئة: {{worstRetail}} · للجملة: {{worstWholesale}}. أي صف تحت الحد الأدنى يُعلَّم بالأحمر.',
    compareTitle: 'ملخص شهري مقارن',
    compareSub: 'الشهر الحالي مقابل الشهر السابق على نفس دفتر التسويات',
    compareCurrent: 'الشهر الحالي', comparePrev: 'الشهر السابق',
    compareGross: 'قيمة الطلبات', compareTake: 'حصة المنصة', compareNet: 'صافي المنصة', compareOrders: 'عدد الطلبات',
    compareNoPrev: 'لا بيانات للشهر السابق',
    compareUp: 'زيادة', compareDown: 'انخفاض',
  },
  logistics: {
    sub: 'شركات الشحن، وقواعد التسعير، ومستودع جدة، وكل الشحنات، والمرتجعات الدولية.',
    carriers: 'شركات الشحن', carriersSub: 'حالة الربط والأداء',
    warehouse: 'مستودع جدة', warehouseSub: 'الوارد والمنتظر والصادر والإشغال',
    shipments: 'كل الشحنات', shipmentsSub: 'رقم التتبع والحالة الموحّدة والتأخير',
    pricing: 'قواعد التسعير', pricingSub: 'حسب الوزن والدولة وهامش المنصة',
    thTracking: 'رقم التتبع', thCompany: 'الشركة',
    schedulePickup: 'جدولة الاستلام', confirmDelivery: 'تأكيد التسليم',
  },
  compliance: {
    sub: 'مستندات التصدير، وقواعد الدول، والتحقق من هويات المصانع (KYB) والسفراء (KYC).',
    docsTitle: 'مستندات التصدير', docsSub: 'إنشاء تلقائي ورفع وإرسال',
    rules: 'قواعد الدول', rulesSub: 'الإعفاء والمقيّد والرسوم',
    verify: 'التحقق من الهويات', verifySub: 'KYB للمصانع و KYC للسفراء وقوائم العقوبات',
    thEntity: 'الجهة', thDocs: 'المستندات',
    gapsTitle: 'شحنات ناقصة مستندات تخليص',
    gapsSub: 'شحنات CIF / FOB غادرت جدة ولم يكتمل ملف تخليصها في الوجهة.',
    gapsAlert: '{{count}} شحنة تحتاج تدخل المكتب — أرسل تنبيهًا لمكتب التصدير قبل أن تتعطل في الجمارك.',
    gapsClear: 'كل الشحنات المفتوحة لديها ملف تخليص مكتمل — لا يوجد ما يحتاج تدخلًا.',
    thTrackingOrder: 'الشحنة والطلب', thMissing: 'المستندات الناقصة', thParty: 'طرف التخليص', thAge: 'بانتظار',
    notifyDesk: 'إبلاغ المكتب', notifiedBtn: 'تم إبلاغ المكتب', pending: 'بانتظار',
    notifyDone: 'تم إرسال تنبيه إلى مكتب التصدير بخصوص {{tracking}}.',
    missingCount: '{{count}} مستند', daysLate: '{{count}} أيام',
    alertTitle: 'تنبيه عاجل لمكتب التصدير',
  },
  marketing: {
    sub: 'الحملات، والكوبونات، ومكتبة محتوى السفراء، وإدارة الواجهة، والإشعارات، والترجمة.',
    campaigns: 'الحملات', campaignsSub: 'الفترة والدول والمصانع المشاركة والأداء',
    coupons: 'الكوبونات', couponsSub: 'النوع والحدود ومن يتحمل الخصم',
    content: 'مكتبة محتوى السفراء', contentSub: 'الأصول واللغة والمنتج وعدد المشاركات',
    notifications: 'الإشعارات', notificationsSub: 'قوالب البريد والرسائل لكل حدث ولغة',
    translations: 'الترجمة', translationsSub: 'نسبة الاكتمال لكل لغة',
    thPerformance: 'الأداء', thPages: 'عدد المشاركات',
  },
  support: {
    sub: 'تذاكر الدعم، والمستخدمون والصلاحيات، وسجل التدقيق، والإعدادات العامة.',
    tickets: 'تذاكر الدعم', ticketsSub: 'الأولوية والمسؤول والمهلة والحالة',
    staff: 'المستخدمون والصلاحيات', staffSub: 'الموظفون والأدوار والتحقق الثنائي',
    audit: 'سجل التدقيق', auditSub: 'من فعل ماذا ومتى ومن أي جهاز',
    settings: 'الإعدادات العامة', settingsSub: 'العملات والدول واللغات والنسب وفترة الإرجاع',
    auditNote: 'سجل التدقيق بحث وتصدير فقط — لا حذف ولا تعديل.',
  },
  accounts: {
    title: 'الحسابات المسجّلة',
    sub: 'كل حساب أنشأ نفسه من شاشات التسجيل: بياناته الكاملة، وحالة تحققه، وقرار الاعتماد.',
    statTotal: 'إجمالي الحسابات',
    statPending: 'بانتظار التحقق',
    statVerified: 'موثّق',
    statFactories: 'حسابات مصانع',
    filterAll: 'الكل',
    searchPh: 'ابحث بالاسم أو البريد أو المنشأة أو السجل التجاري…',
    thAccount: 'الحساب',
    thPanel: 'اللوحة',
    thEntity: 'المنشأة',
    thLocation: 'الموقع',
    thVerification: 'التحقق',
    thJoined: 'تاريخ التسجيل',
    thMethod: 'طريقة التحقق',
    statusPending: 'قيد المراجعة',
    statusVerified: 'موثّق',
    statusRejected: 'مرفوض',
    statusUnverified: 'غير موثّق',
    approve: 'اعتماد',
    reject: 'رفض',
    approveDone: 'تم اعتماد {{name}} وتفعيل حسابه.',
    rejectDone: 'تم رفض تحقق {{name}} وإبلاغه بالبريد.',
    saveError: 'تعذّر حفظ القرار — جرّب مرة أخرى.',
    loading: 'جاري تحميل الحسابات…',
    loadError: 'تعذّر تحميل الحسابات من الخادم.',
    retry: 'إعادة المحاولة',
    refresh: 'تحديث',
    empty: 'لا حسابات مطابقة للفلتر الحالي.',
    emptyHint: 'أي تسجيل جديد من شاشات الحساب يظهر هنا فورًا.',
    hint: 'البيانات تصل مباشرة من التسجيل — قرار الاعتماد هنا يحدّد حالة توثيق الحساب ولا يحذف أي بيانات.',
    demoNote: 'وضع تجريبي — الجدول بيعرض حسابات نموذجية. سجّل دخول بحساب إدارة عشان تشوف التسجيلات الحقيقية.',
    methods: {
      nafath: 'نفاذ',
      cr: 'السجل التجاري',
      manual: 'مراجعة يدوية',
      none: '—',
    },
  },
};
