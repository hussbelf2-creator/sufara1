export const factoryNav = [
  { key: 'f-home', label: 'الرئيسية', icon: 'ri-dashboard-3-line' },
  { key: 'f-custom', label: 'لوحة التحكم المخصّصة', icon: 'ri-layout-masonry-line' },
  { key: 'f-join', label: 'الانضمام والتحقق', icon: 'ri-shield-check-line', badge: '!' },
  { key: 'f-profile', label: 'ملف المصنع', icon: 'ri-store-3-line' },
  { key: 'f-products', label: 'المنتجات', icon: 'ri-shopping-bag-3-line', badge: '3' },
  { key: 'f-newproduct', label: 'إضافة منتج', icon: 'ri-add-circle-line' },
  { key: 'f-inventory', label: 'المخزون', icon: 'ri-stack-line', badge: '2' },
  { key: 'f-orders', label: 'طلبات التجزئة', icon: 'ri-file-list-3-line', badge: '5' },
  { key: 'f-rfq', label: 'طلبات عروض الأسعار', icon: 'ri-price-tag-3-line', badge: '2' },
  { key: 'f-deals', label: 'صفقات الجملة', icon: 'ri-hand-coin-line' },
  { key: 'f-contracts', label: 'العقود', icon: 'ri-file-paper-2-line', badge: '3' },
  { key: 'f-shipping', label: 'الشحن', icon: 'ri-truck-line' },
  { key: 'f-returns', label: 'الإرجاع والنزاعات', icon: 'ri-arrow-go-back-line' },
  { key: 'f-finance', label: 'المالية', icon: 'ri-money-dollar-circle-line' },
  { key: 'f-audit', label: 'سجل التدقيق', icon: 'ri-history-line' },
  { key: 'f-analytics', label: 'التحليلات', icon: 'ri-line-chart-line' },
  { key: 'f-marketing', label: 'التسويق', icon: 'ri-megaphone-line' },
  { key: 'f-ambassadors', label: 'صفحات السفراء', icon: 'ri-share-forward-2-line', badge: '3' },
  { key: 'f-messages', label: 'الرسائل', icon: 'ri-chat-3-line', badge: '2' },
  { key: 'f-team', label: 'الفريق والصلاحيات', icon: 'ri-team-line' },
  { key: 'f-subscription', label: 'الاشتراك والخدمات', icon: 'ri-vip-crown-line' },
  { key: 'f-settings', label: 'الإعدادات والتكاملات', icon: 'ri-settings-3-line' },
];

export const factoryUser = {
  name: 'سعد الحربي',
  factory: 'تمور المدينة',
  role: 'مسؤول المبيعات',
  country: 'جدة — السعودية',
  initials: 'س.ح',
};

export const factoryStats = [
  { icon: 'ri-shopping-bag-3-line', num: '٩٬٤٢٠ ر.س', lbl: 'مبيعات اليوم', delta: '+٨٪', up: true },
  { icon: 'ri-calendar-line', num: '١٤٢٬٦٨٠ ر.س', lbl: 'مبيعات الشهر', delta: '+١٢٪', up: true },
  { icon: 'ri-box-3-line', num: '٥', lbl: 'طلبات بانتظار التجهيز', delta: '', up: true },
  { icon: 'ri-price-tag-3-line', num: '٢', lbl: 'عروض بانتظار الرد', delta: '', up: true },
  { icon: 'ri-wallet-3-line', num: '٤٨٬٣٠٠ ر.س', lbl: 'الرصيد المستحق', delta: '', up: true },
  { icon: 'ri-star-line', num: '٤٫٧', lbl: 'تقييم المتجر', delta: '+٠٫١', up: true },
];

export const factoryReadiness = {
  value: 82,
  pending: 'باقي مربّعان لإكمال جاهزية الملف',
  checklist: [
    { t: 'الشهادات محدّثة', done: true },
    { t: 'المنتجات مترجمة', done: true },
    { t: 'صور المصنع مرفوعة', done: false },
    { t: 'رقم HS لكل منتج', done: false },
  ],
};

export const factoryTodayOrders = [
  { id: 'SUB-20481', product: 'علبة تمر سكري فاخرة', qty: '×٤', due: '٦ ساعات', ship: 'جوّي — أرامكس', status: 'بانتظار التجهيز', tone: 'warn' },
  { id: 'SUB-20476', product: 'تمر عجوة فاخر', qty: '×٢', due: '١٤ ساعة', ship: 'بحري — SMEX', status: 'قيد التجهيز', tone: 'info' },
  { id: 'SUB-20470', product: 'قهوة عربية مطحونة', qty: '×٦', due: 'منتهية', ship: 'جوّي — DHL', status: 'جاهز للاستلام', tone: 'ok' },
];

export const factoryRfqPending = [
  { buyer: 'متجر الياسمين', qty: '٥٠٠ وحدة', country: 'الأردن', delivery: 'CIF — عمّان', deadline: '٨ ساعات', offers: 3 },
  { buyer: 'سوق الحرير', qty: '١٠٠٠ وحدة', country: 'مصر', delivery: 'FOB — جدة', deadline: '١ يوم', offers: 5 },
];

export const factoryTopCountries = [
  { label: 'الأردن', value: 62, display: '٦٢٪ · ٨٨٬٤٠٠ ر.س' },
  { label: 'مصر', value: 21, display: '٢١٪ · ٣٠٬٠٠٠ ر.س' },
  { label: 'الإمارات', value: 12, display: '١٢٪ · ١٧٬١٠٠ ر.س' },
  { label: 'تركيا', value: 5, display: '٥٪ · ٧٬١٨٠ ر.س' },
];

/* --------------------------------------------------------------- join / KYC */

export const factoryJoinSteps = [
  { t: 'إنشاء الحساب', s: 'تم التسجيل بمزود البريد', done: true },
  { t: 'بيانات المنشأة', s: 'الاسم والمدينة والفئة', done: true },
  { t: 'السجل التجاري', s: 'تم رفع CR-4038', done: true },
  { t: 'الترخيص الصناعي', s: 'مقبول', done: true },
  { t: 'الشهادات (حلال / جودة)', s: 'مطلوب رفع آخر شهادة', done: false },
  { t: 'توقيع الاتفاقية إلكترونيًا', s: 'بانتظار التوقيع', done: false },
];

export const factoryDocsList = [
  { id: 'cr', name: 'السجل التجاري', status: 'مقبول', tone: 'ok' },
  { id: 'license', name: 'الترخيص الصناعي', status: 'مقبول', tone: 'ok' },
  { id: 'halal', name: 'شهادة حلال', status: 'بانتظار الرفع', tone: 'warn' },
  { id: 'iso', name: 'شهادة الجودة ISO 22000', status: 'مقبول', tone: 'ok' },
];

/* --------------------------------------------------------------- profile */

export const factoryProfile = {
  logo: 'https://readdy.ai/api/search-image?query=Minimal%20flat%20brand%20mark%20for%20a%20Saudi%20premium%20dates%20company%20on%20a%20clean%20warm%20beige%20background%2C%20kraft%20and%20amber%20tones%2C%20simple%20emblem%2C%20high%20detail&width=400&height=400&seq=sta-fac-logo-01&orientation=squarish',
  bio: 'مصنع سعودي متخصص في تجهيز وتعبئة التمور الفاخنة بأصنافها العجوة والسكري والخلاص، بمعايير جودة عالية وتغليف جاهز للتصدير.',
  city: 'المدينة المنورة',
  capacity: '١٢٠٬٠٠٠ عبوة شهريًا',
  certs: ['حلال', 'ISO 22000', 'SASO'],
  langs: ['العربية', 'الإنجليزية', 'الأردية'],
  images: [
    'https://readdy.ai/api/search-image?query=Minimal%20editorial%20photo%20of%20a%20clean%20modern%20Saudi%20dates%20packaging%20facility%20interior%20with%20kraft%20boxes%20and%20warm%20light%2C%20neutral%20beige%20tones%2C%20high%20detail&width=800&height=600&seq=sta-fac-img-01&orientation=landscape',
    'https://readdy.ai/api/search-image?query=Minimal%20editorial%20photo%20of%20rows%20of%20kraft%20boxes%20of%20dates%20ready%20for%20export%20on%20a%20light%20surface%2C%20warm%20amber%20light%2C%20clean%20neutral%20tones%2C%20high%20detail&width=800&height=600&seq=sta-fac-img-02&orientation=landscape',
    'https://readdy.ai/api/search-image?query=Minimal%20editorial%20photo%20of%20a%20quality%20control%20table%20with%20trays%20of%20Saudi%20dates%20in%20a%20bright%20facility%2C%20warm%20light%2C%20clean%20neutral%20tones%2C%20high%20detail&width=800&height=600&seq=sta-fac-img-03&orientation=landscape',
  ],
};

/* --------------------------------------------------------------- products */

export const factoryProducts = [
  { name: 'علبة تمر سكري فاخرة', status: 'منشور', tone: 'ok', price: '٩٦ ر.س', stock: '٨٤٠', sales: '١٬٢٤٠', sku: 'DT-500', category: 'تمور ومكسرات', hs: '0804.10', cost: '٥٤ ر.س', margin: '٤٣٪', min: '١٠٠', low: false, rating: '٤٫٨', views: '٦٬٤٢٠', wishes: '٢١٤', updated: 'قبل ٣ أيام', desc: 'تمر سكري فاخر مُنتقى من مزارع المدينة، معبأ في علبة كرافت أنيقة جاهزة للتصدير مع بطاقة عربية وإنجليزية ومعلومات غذائية مطابقة.', img: 'https://readdy.ai/api/search-image?query=Minimal%20product%20photo%20of%20a%20premium%20box%20of%20Saudi%20sukkari%20dates%20on%20a%20clean%20warm%20beige%20background%2C%20soft%20amber%20light%2C%20top%20view%2C%20high%20detail&width=800&height=600&seq=sta-fac-prod-sukkari-01&orientation=landscape' },
  { name: 'تمر عجوة فاخر', status: 'منشور', tone: 'ok', price: '١٢٠ ر.س', stock: '٣١٠', sales: '٦٨٠', sku: 'AJ-500', category: 'تمور ومكسرات', hs: '0804.10', cost: '٧٢ ر.س', margin: '٤٠٪', min: '٨٠', low: true, rating: '٤٫٩', views: '٥٬١٠٠', wishes: '١٨٧', updated: 'قبل يوم', desc: 'تمر عجوة المدينة الأصلي بعبوات محكمة الإغلاق، محبوب لدى المشترين، ويحتاج تجديد مخزون سريع لقرب نفاد الكمية.', img: 'https://readdy.ai/api/search-image?query=Minimal%20product%20photo%20of%20a%20shallow%20tray%20of%20premium%20ajwa%20Saudi%20dates%20on%20a%20clean%20warm%20beige%20surface%2C%20soft%20amber%20light%2C%20top%20view%2C%20high%20detail&width=800&height=600&seq=sta-fac-prod-ajwa-02&orientation=landscape' },
  { name: 'تشكيلة تمور هدايا', status: 'بانتظار الاعتماد', tone: 'warn', price: '٢٤٠ ر.س', stock: '١٤٠', sales: '٤٥٠', sku: 'GF-01', category: 'هدايا', hs: '0804.10', cost: '١٥٦ ر.س', margin: '٣٥٪', min: '٦٠', low: false, rating: '٤٫٦', views: '٣٬٢٤٠', wishes: '١٢٢', updated: 'قبل ٥ أيام', desc: 'صندوق هدايا فاخر يجمع أصنافًا مختارة من التمور، مناسب للمناسبات والشركات، بانتظار اعتماد المنصة للنشر.', img: 'https://readdy.ai/api/search-image?query=Minimal%20product%20photo%20of%20a%20gift%20set%20of%20assorted%20Saudi%20dates%20in%20an%20elegant%20box%20on%20a%20clean%20warm%20beige%20surface%2C%20soft%20amber%20light%2C%20high%20detail&width=800&height=600&seq=sta-fac-prod-gift-03&orientation=landscape' },
  { name: 'دبس التمر الطبيعي', status: 'مسودة', tone: 'mute', price: '٥٢ ر.س', stock: '٠', sales: '٠', sku: 'SY-350', category: 'عسل ومربّى', hs: '1302.20', cost: '٢٨ ر.س', margin: '٤٦٪', min: '٤٠', low: true, rating: '—', views: '٤٢٠', wishes: '١٨', updated: 'قبل أسبوع', desc: 'دبس تمر طبيعي ١٠٠٪ بلا سكر مضاف، بدأ كمسودة ويحتاج تحديد السعر النهائي ورفع صور المنتج قبل الإرسال للاعتماد.', img: 'https://readdy.ai/api/search-image?query=Minimal%20product%20photo%20of%20a%20glass%20jar%20of%20natural%20Saudi%20date%20syrup%20on%20a%20clean%20warm%20beige%20surface%2C%20soft%20amber%20light%2C%20high%20detail&width=800&height=600&seq=sta-fac-prod-syrup-04&orientation=landscape' },
];

export const factoryCategories = ['أغذية', 'تمور ومكسرات', 'عسل ومربّى', 'مشروبات'];

export const factoryVariants = [
  { name: 'علبة ٥٠٠ جم', sku: 'DT-500', barcode: '6281000001', retail: '٤٨ ر.س', wholesale: '٣٢ ر.س' },
  { name: 'علبة ١ كجم', sku: 'DT-1000', barcode: '6281000002', retail: '٩٦ ر.س', wholesale: '٦٨ ر.س' },
];

export const factoryInventory = [
  { variant: 'علبة تمر سكري ٥٠٠ جم', sku: 'DT-500', available: '٥٢٠', reserved: '٨٤', jeddah: '٢٠٠', min: '٢٠٠', alert: false },
  { variant: 'علبة تمر سكري ١ كجم', sku: 'DT-1000', available: '٣٢٠', reserved: '٦٠', jeddah: '١٢٠', min: '١٥٠', alert: false },
  { variant: 'تمر عجوة ٥٠٠ جم', sku: 'AJ-500', available: '٤٦', reserved: '٣٠', jeddah: '٠', min: '١٠٠', alert: true },
  { variant: 'تشكيلة هدايا فاخرة', sku: 'GF-01', available: '١٤٠', reserved: '١٢', jeddah: '٤٠', min: '٦٠', alert: false },
  { variant: 'دبس التمر ٣٥٠ جم', sku: 'SY-350', available: '٠', reserved: '٠', jeddah: '٠', min: '٤٠', alert: true },
];

/* --------------------------------------------------------------- orders */

export const factoryOrders = [
  { id: 'SUB-20481', buyer: 'خالد العمري', country: 'الأردن', qty: 3, product: 'علبة تمر سكري فاخرة', due: '٦ ساعات', ship: 'جوّي — أرامكس', status: 'بانتظار التجهيز', tone: 'warn' },
  { id: 'SUB-20476', buyer: 'ليلى حسن', country: 'مصر', qty: 2, product: 'تمر عجوة فاخر', due: '١٤ ساعة', ship: 'بحري — SMEX', status: 'قيد التجهيز', tone: 'info' },
  { id: 'SUB-20470', buyer: 'سامر ناصر', country: 'الأردن', qty: 6, product: 'قهوة عربية مطحونة', due: 'منتهية', ship: 'جوّي — DHL', status: 'جاهز للاستلام', tone: 'ok' },
  { id: 'SUB-20462', buyer: 'مريم سالم', country: 'الإمارات', qty: 1, product: 'تشكيلة تمور هدايا', due: '٣ أيام', ship: 'جوّي — أرامكس', status: 'بانتظار التجهيز', tone: 'warn' },
  { id: 'SUB-20455', buyer: 'نور الدين', country: 'تركيا', qty: 4, product: 'تمر عجوة فاخر', due: '٣ أيام', ship: 'بحري — SMEX', status: 'قيد التجهيز', tone: 'info' },
];

export const factoryRfqList = [
  { buyer: 'متجر الياسمين', product: 'علبة تمر سكري × ٥٠٠', qty: '٥٠٠ وحدة', country: 'الأردن', delivery: 'CIF — عمّان', deadline: '٨ ساعات', competitors: 3 },
  { buyer: 'سوق الحرير', product: 'تمر عجوة × ١٠٠٠', qty: '١٠٠٠ وحدة', country: 'مصر', delivery: 'FOB — جدة', deadline: '١ يوم', competitors: 5 },
  { buyer: 'نُزل التمور', product: 'تشكيلة هدايا × ٣٠٠', qty: '٣٠٠ وحدة', country: 'الأردن', delivery: 'EXW', deadline: '٢ يوم', competitors: 2 },
];

export const factoryDeals = [
  { buyer: 'متجر الياسمين', value: '٨٤٬٠٠٠ ر.س', paid: '٤٢٬٠٠٠ ر.س', stage: 'الإنتاج', stageKey: 'production', progress: 55, docs: 3 },
  { buyer: 'سوق الحرير', value: '٩٦٬٠٠٠ ر.س', paid: '٩٦٬٠٠٠ ر.س', stage: 'الشحن', stageKey: 'shipping', progress: 88, docs: 5 },
  { buyer: 'نُزل التمور', value: '٤٥٬٠٠٠ ر.س', paid: '١٨٬٠٠٠ ر.س', stage: 'التجهيز', stageKey: 'packing', progress: 32, docs: 1 },
];

export const factoryShipments = [
  { id: 'SHP-7781', carrier: 'أرامكس', country: 'الأردن', status: 'جاهز للاستلام', tone: 'ok', pickup: 'اليوم — ٤:٠٠ م' },
  { id: 'SHP-7770', carrier: 'DHL', country: 'الإمارات', status: 'بانتظار الجدولة', tone: 'warn', pickup: 'غدًا — ١٠:٠٠ ص' },
  { id: 'SHP-7762', carrier: 'SMEX', country: 'مصر', status: 'مجدول', tone: 'info', pickup: 'الأحد — ٩:٠٠ ص' },
];

export const factoryPackaging = [
  { country: 'الأردن', note: 'تعليمات التغليف: كرتون مزدوج + بطاقة عربية/إنجليزية.' },
  { country: 'مصر', note: 'إلزامي: ملصق حلال ومعلومات غذائية بالعربية.' },
  { country: 'تركيا', note: 'يُلزم بيانات المكوّنات بالتركية على الملصق.' },
];

export const factoryReturns = [
  { id: 'RET-118', order: 'SUB-20390', item: 'علبة تمر سكري', reason: 'منتج تالف', amount: '٩٦ ر.س', deadline: '٢ يوم', status: 'بانتظار ردّك', tone: 'warn' },
  { id: 'RET-113', order: 'SUB-20312', item: 'تمر عجوة فاخر', reason: 'المقاس غير مناسب', amount: '٤٩٠ ر.س', deadline: '١ يوم', status: 'بانتظار ردّك', tone: 'warn' },
  { id: 'RET-109', order: 'SUB-20255', item: 'تشكيلة هدايا', reason: 'غير مطابق', amount: '١٨٠ ر.س', deadline: 'منتهية', status: 'مقبول', tone: 'ok' },
];

export const factoryFinance = {
  pending: '١٢٬٤٠٠ ر.س',
  available: '٤٨٬٣٠٠ ر.س',
  nextCycle: '١٥ أكتوبر ٢٠٢٦',
  commission: '٦٪',
  bank: 'البنك الأهلي · •••• ٤٤٢١',
  statements: [
    { period: 'سبتمبر ٢٠٢٦', sales: '٦٨٬٤٠٠ ر.س', commission: '٤٬١٠٤ ر.س', net: '٦٣٬٦١٢ ر.س', status: 'معتمد', tone: 'ok' },
    { period: 'أغسطس ٢٠٢٦', sales: '٥٢٬١٠٠ ر.س', commission: '٣٬١٢٦ ر.س', net: '٤٨٬٤٥٣ ر.س', status: 'مدفوع', tone: 'ok' },
    { period: 'يوليو ٢٠٢٦', sales: '٤١٬٢٠٠ ر.س', commission: '٢٬٤٧٢ ر.س', net: '٣٨٬٣١٦ ر.س', status: 'مدفوع', tone: 'ok' },
  ],
  invoices: [
    { id: 'INV-5501', type: 'فاتورة عمولة', amount: '٤٬١٠٤ ر.س', period: 'سبتمبر', status: 'صادرة', tone: 'ok' },
    { id: 'INV-5490', type: 'فاتورة عمولة', amount: '٣٬١٢٦ ر.س', period: 'أغسطس', status: 'صادرة', tone: 'ok' },
    { id: 'INV-5482', type: 'إشعار دائن', amount: '٩٦٠ ر.س', period: 'أغسطس', status: 'صادرة', tone: 'ok' },
  ],
  trend: {
    labels: ['مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر'],
    sales: { values: [82000, 96000, 88000, 112000, 128000, 142680], delta: '+١٢٪' },
    commission: { values: [4920, 5760, 5280, 6720, 7680, 8560], delta: '+١١٪' },
    net: { values: [77080, 90240, 82720, 105280, 120320, 134120], delta: '+١٢٪' },
  },
  byChannel: [
    { label: 'تجزئة مباشرة', value: 48, display: '٤٨٪ · ١٢٬٤٢٠ ر.س' },
    { label: 'عبر السفراء', value: 38, display: '٣٨٪ · ٩٬٨٣٠ ر.س' },
    { label: 'جملة (B2B)', value: 14, display: '١٤٪ · ٣٬٦٢٠ ر.س' },
  ],
};

export const factoryTrend = {
  labels: ['مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر'],
  sales: { values: [82000, 96000, 88000, 112000, 128000, 142680], delta: '+١٢٪' },
  orders: { values: [320, 380, 350, 440, 510, 590], delta: '+٩٪' },
  units: { values: [980, 1120, 1040, 1320, 1560, 1780], delta: '+٨٪' },
};

export const factoryByProduct = [
  { label: 'علبة تمر سكري', value: 58, display: '٥٨٪ · ٨٢٬٧٠٠ ر.س' },
  { label: 'تمر عجوة', value: 24, display: '٢٤٪ · ٣٤٬٢٠٠ ر.س' },
  { label: 'تشكيلة هدايا', value: 12, display: '١٢٪ · ١٧٬١٠٠ ر.س' },
  { label: 'منتجات أخرى', value: 6, display: '٦٪ · ٨٬٦٨٠ ر.س' },
];

export const factoryByChannel = [
  { label: 'تجزئة مباشرة', value: 48, display: '٤٨٪' },
  { label: 'عبر السفراء', value: 38, display: '٣٨٪' },
  { label: 'جملة (B2B)', value: 14, display: '١٤٪' },
];

export const factoryTopAmbassadors = [
  { name: 'أحمد النعيمي', country: 'الأردن', orders: 47, sales: '٦٨٬٠٠٠ ر.س' },
  { name: 'ريم الحربي', country: 'مصر', orders: 63, sales: '١٢٤٬٠٠٠ ر.س' },
  { name: 'يوسف كمال', country: 'تركيا', orders: 21, sales: '٣١٬٥٠٠ ر.س' },
];

export const factoryReturnReasons = [
  { label: 'منتج تالف', value: 46, display: '٤٦٪' },
  { label: 'غير مطابق', value: 28, display: '٢٨٪' },
  { label: 'تأخر التوصيل', value: 16, display: '١٦٪' },
  { label: 'أخرى', value: 10, display: '١٠٪' },
];

export const factoryCampaigns = [
  { name: 'حملة العيد', period: '١–٢٠ أكتوبر', countries: 'الأردن · مصر', boost: '٨٪ × ٢ أسبوع', status: 'متاحة', tone: 'ok' },
  { name: 'موسم العودة للمدارس', period: '٢٠ أغسطس', countries: 'الأردن', boost: '٦٪ × ١٠ أيام', status: 'قادمة', tone: 'info' },
  { name: 'عيد الفطر — تمور', period: '١–١٥ مارس', countries: '٤ دول', boost: '١٠٪ × ٣ أسابيع', status: 'منتهية', tone: 'mute' },
];

export const factorySamples = [
  { buyer: 'سوق الحرير', product: 'تمر عجوة', city: 'القاهرة', status: 'قيد الشحن', tone: 'info' },
  { buyer: 'نُزل التمور', product: 'تشكيلة هدايا', city: 'عمّان', status: 'تم التسليم', tone: 'ok' },
  { buyer: 'متجر الياسمين', product: 'علبة تمر سكري', city: 'عمّان', status: 'بانتظار الموافقة', tone: 'warn' },
];

export const factoryThreads = [
  { name: 'متجر الياسمين', last: 'هل يمكن تجهيز ٥٠٠ عبوة خلال ١٠ أيام؟', time: '١٠:٢٤', unread: true },
  { name: 'إدارة سفير', last: 'يرجى رفع شهادة الحلال المحدّثة لإكمال الملف.', time: 'أمس', unread: true },
  { name: 'سوق الحرير', last: 'شكرًا، وصلت العيّنة وبحالة ممتازة.', time: 'الأحد', unread: false },
];

export const factoryChat = [
  { from: 'them', text: 'السلام عليكم، هل يمكن تجهيز طلبية ٥٠٠ عبوة خلال ١٠ أيام؟', time: '١٠:١٠' },
  { from: 'me', text: 'وعليكم السلام، نعم ممكن. الطاقة الإنتاجية المتاحة تكفي.', time: '١٠:١٦' },
  { from: 'them', text: 'ممتاز، أرسل لي عرضًا رسميًا بالسعر ومدة الإنتاج.', time: '١٠:٢٠' },
];

export const factoryTeamList = [
  { name: 'سعد الحربي', email: 'saad@madinah-dates.sa', role: 'مسؤول المبيعات', active: true },
  { name: 'منى القحطاني', email: 'mona@madinah-dates.sa', role: 'مسؤولة المخزون', active: true },
  { name: 'عبدالله الغامدي', email: 'abdullah@madinah-dates.sa', role: 'مسؤول الشحن', active: false },
];

export const factorySubscription = {
  plan: 'الباقة الذهبية',
  renew: '١ يناير ٢٠٢٧',
  limits: [
    { label: 'عدد المنتجات', value: '٢٥٠ / ٣٢ منتجًا' },
    { label: 'التسويات', value: 'شهرية — بلا رسوم' },
    { label: 'تسعير الشحن', value: 'خصم ١٢٪' },
    { label: 'الدعم', value: 'مدير حساب مخصّص' },
  ],
  services: [
    { name: 'توليد مستندات التصدير', status: 'مضمّن', tone: 'ok' },
    { name: 'شهادات المنشأ', status: 'بلا حدود', tone: 'ok' },
    { name: 'تأمين الشحنات', status: 'اختياري', tone: 'warn' },
  ],
};

export const factorySettings = {
  pickup: 'المدينة المنورة — المنطقة الصناعية، مستودع ١٤',
  hours: 'الأحد – الخميس · ٩:٠٠ ص – ٦:٠٠ م',
  notifications: [
    { label: 'طلب جديد وارد', channels: 'بريد · واتساب', on: true },
    { label: 'طلب عرض سعر', channels: 'بريد', on: true },
    { label: 'تسوية مالية', channels: 'بريد', on: false },
  ],
  api: { key: 'sta_pk_••••••••••7a2f', label: 'تكامل ERP' },
};

/* ------------------------------------------------------- finance extras */

export const factoryPayoutMethods = [
  { id: 'bank', name: 'البنك الأهلي · •••• ٤٤٢١', note: 'تحويل بنكي · يصل خلال ١–٢ يوم عمل' },
  { id: 'wallet', name: 'محفظة سفير', note: 'فوري · بلا رسوم سحب' },
  { id: 'mada', name: 'بطاقة مدى · •••• ٧٧٣٥', note: 'تحويل فوري · بحد يومي' },
];

export const factoryWithdrawals = [
  { id: 'WD-2201', amount: '٤٨٬٣٠٠ ر.س', method: 'البنك الأهلي · •••• ٤٤٢١', at: '١٠ أكتوبر ٢٠٢٦', status: 'تم الصرف', tone: 'ok' },
  { id: 'WD-2190', amount: '١٢٬٤٠٠ ر.س', method: 'محفظة سفير', at: '٢ سبتمبر ٢٠٢٦', status: 'تم الصرف', tone: 'ok' },
  { id: 'WD-2175', amount: '٩٬٨٠٠ ر.س', method: 'بطاقة مدى · •••• ٧٧٣٥', at: '١٤ أغسطس ٢٠٢٦', status: 'قيد المعالجة', tone: 'warn' },
];

/* ----------------------------------------------------- analytics extras */

export const factoryFunnel = [
  { label: 'زيارات المنتج', value: 12400, display: '١٢٬٤٠٠' },
  { label: 'إضافة للسلة', value: 1820, display: '١٬٨٢٠ · ١٤٫٧٪' },
  { label: 'إتمام الطلب', value: 590, display: '٥٩٠ · ٣٢٫٤٪' },
  { label: 'تم التسليم', value: 561, display: '٥٦١ · ٩٥٪' },
];

export const factoryChannelTrend = {
  labels: ['مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر'],
  channels: [
    { name: 'تجزئة مباشرة', tone: 'accent', values: [42, 48, 46, 58, 64, 70] },
    { name: 'عبر السفراء', tone: 'gold', values: [28, 32, 30, 38, 44, 52] },
    { name: 'جملة (B2B)', tone: 'ink', values: [12, 16, 14, 18, 20, 22] },
  ],
};

export const factoryCountryGrowth = [
  { country: 'الأردن', revenue: '٨٨٬٤٠٠ ر.س', share: '٦٢٪', growth: '+١٨٪', up: true, orders: '٣٢٠' },
  { country: 'مصر', revenue: '٣٠٬٠٠٠ ر.س', share: '٢١٪', growth: '+٩٪', up: true, orders: '١٢٤' },
  { country: 'الإمارات', revenue: '١٧٬١٠٠ ر.س', share: '١٢٪', growth: '−٣٪', up: false, orders: '٥٨' },
  { country: 'تركيا', revenue: '٧٬١٨٠ ر.س', share: '٥٪', growth: '+٢٪', up: true, orders: '٢١' },
];

/* ---------------------------------------------------------- rfq extras */

export const factoryRfqOffers = [
  {
    buyer: 'متجر الياسمين',
    offers: [
      { supplier: 'تمور المدينة · أنت', price: '٦٨', lead: '١٢ يومًا', terms: '٥٠٪ مقدّم والباقي عند الشحن', rating: '٤٫٧', mine: true },
      { supplier: 'نخيل الأحساء', price: '٦٤', lead: '١٠ أيام', terms: 'دفعة واحدة عند التأكيد', rating: '٤٫٥', mine: false },
      { supplier: 'روابي القصيم', price: '٧٢', lead: '١٤ يومًا', terms: '٤٠٪ مقدّم والباقي عند التسليم', rating: '٤٫٦', mine: false },
    ],
  },
  {
    buyer: 'سوق الحرير',
    offers: [
      { supplier: 'تمور المدينة · أنت', price: '٥٨', lead: '١٥ يومًا', terms: '٥٠٪ مقدّم والباقي عند الشحن', rating: '٤٫٧', mine: true },
      { supplier: 'نخيل الأحساء', price: '٦١', lead: '١٢ يومًا', terms: 'دفعة واحدة عند التأكيد', rating: '٤٫٥', mine: false },
      { supplier: 'واحة الشرق', price: '٦٣', lead: '١٦ يومًا', terms: '٤٠٪ مقدّم والباقي عند التسليم', rating: '٤٫٤', mine: false },
    ],
  },
  {
    buyer: 'نُزل التمور',
    offers: [
      { supplier: 'تمور المدينة · أنت', price: '٧٥', lead: '٩ أيام', terms: '٥٠٪ مقدّم والباقي عند الشحن', rating: '٤٫٧', mine: true },
      { supplier: 'نخيل الأحساء', price: '٧٨', lead: '١١ يومًا', terms: 'دفعة واحدة عند التأكيد', rating: '٤٫٥', mine: false },
    ],
  },
];

export const factoryRfqHistory = [
  { buyer: 'متجر الياسمين', product: 'علبة تمر سكري × ٥٠٠', price: '٦٨ ر.س', lead: '١٢ يومًا', at: 'أمس · ١١:٢٠', status: 'بانتظار ردّ المشتري', tone: 'warn' },
  { buyer: 'سوق الحرير', product: 'تمر عجوة × ١٠٠٠', price: '٥٨ ر.س', lead: '١٥ يومًا', at: 'قبل يومين · ٠٩:٤٠', status: 'فزت بالطلب', tone: 'ok' },
  { buyer: 'نُزل التمور', product: 'تشكيلة هدايا × ٣٠٠', price: '٧٥ ر.س', lead: '٩ أيام', at: 'قبل ٤ أيام · ١٥:٠٥', status: 'لم يُوفّق', tone: 'mute' },
];