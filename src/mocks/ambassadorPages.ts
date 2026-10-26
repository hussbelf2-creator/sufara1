/* Ambassador marketing-pages data — the shared source of truth for the
   ambassador dashboard, the factory dashboard (approval flow) and the platform
   admin governance view, plus the public landing page. Arabic is the base set;
   English lives in src/mocks/ambassadorPages.en.ts with the exact same shape. */

/* Registry of every ambassador that can own a marketing page. The public
   landing page (/f/:amb/:factory) looks an ambassador up here by slug. */
export const ambRegistry = [
  { slug: 'ahmad-jo-2481', name: 'أحمد النعيمي', initials: 'أ.ن', country: 'الأردن', level: 'سفير معتمد', code: 'AHMAD-JO-2481' },
  { slug: 'reem-eg-3012', name: 'ريم الحربي', initials: 'ر.ح', country: 'مصر', level: 'سفير قائد', code: 'REEM-EG-3012' },
  { slug: 'khaled-jo-1190', name: 'خالد العز', initials: 'خ.ع', country: 'الأردن', level: 'سفير', code: 'KHALED-JO-1190' },
  { slug: 'yousef-tr-2044', name: 'يوسف كمال', initials: 'ي.ك', country: 'تركيا', level: 'سفير معتمد', code: 'YOUSEF-TR-2044' },
];

/* Headline numbers for the ambassador's own marketing-pages board. */
export const ambPageStats = [
  { icon: 'ri-window-2-line', num: '٢', lbl: 'صفحات منشورة' },
  { icon: 'ri-cursor-line', num: '٤٬٣٨٥', lbl: 'نقرة على الصفحات' },
  { icon: 'ri-shopping-bag-3-line', num: '٢٩', lbl: 'طلب منسوب' },
  { icon: 'ri-money-dollar-circle-line', num: '٤٬٠٢٥ ر.س', lbl: 'عمولة الصفحات' },
];

/* The current ambassador's factory pages, in every workflow state. */
export const ambFactoryPages = [
  {
    id: 'PG-1001', factoryId: 'hasa', factory: 'مصنع تمور الأحساء', city: 'الأحساء',
    status: 'published', statusLabel: 'منشورة', tone: 'ok', commission: '٧٪',
    code: 'AHMAD-TAMR4', link: 'safeer.sa/f/ahmad-jo-2481/hasa', clicks: '٣٬١٢٠', baseClicks: 3120,
    orders: 21, sales: '٤٨٬٣٠٠ ر.س', earned: '٣٬٣٨١ ر.س', variant: 'full', since: '١ أكتوبر ٢٠٢٦',
  },
  {
    id: 'PG-1002', factoryId: 'oud', factory: 'بيت عود الرياض', city: 'الرياض',
    status: 'published', statusLabel: 'منشورة', tone: 'ok', commission: '٧٪',
    code: 'AHMAD-OUD4', link: 'safeer.sa/f/ahmad-jo-2481/oud', clicks: '١٬٢٦٥', baseClicks: 1265,
    orders: 8, sales: '٩٬٢٠٠ ر.س', earned: '٦٤٤ ر.س', variant: 'short', since: '١٨ سبتمبر ٢٠٢٦',
  },
  {
    id: 'PG-1003', factoryId: 'fifa', factory: 'مزارع قهوة فيفا', city: 'جازان',
    status: 'pending', statusLabel: 'بانتظار موافقة المصنع', tone: 'warn', commission: '—',
    code: '—', link: '—', clicks: '—', baseClicks: 0, orders: 0, sales: '—', earned: '—', variant: 'full', since: '٦ أكتوبر ٢٠٢٦',
  },
  {
    id: 'PG-1004', factoryId: 'taif', factory: 'معامل ورد الطائف', city: 'الطائف',
    status: 'rejected', statusLabel: 'مرفوضة', tone: 'danger', commission: '—',
    code: '—', link: '—', clicks: '—', baseClicks: 0, orders: 0, sales: '—', earned: '—', variant: 'full', since: '٢ أكتوبر ٢٠٢٦',
  },
];

/* Commission rules shown as a checklist on the ambassador board. */
export const ambPageRules = [
  { icon: 'ri-link', t: 'رابط فريد لكل مصنع', s: 'كل مصنع يحصل على رابط خاص بك يحمل كودك تلقائيًا.' },
  { icon: 'ri-coupon-3-line', t: 'كود خصم عند الدفع', s: 'الكود يتغلّب على الرابط عند إدخاله في الدفع — فتُحفظ نسبتك دائمًا.' },
  { icon: 'ri-time-line', t: 'نافذة إسناد ٣٠ يومًا', s: 'آخر نقرة على رابطك تُنسب لك خلال ٣٠ يومًا.' },
  { icon: 'ri-shield-check-line', t: 'العمولة تُقفَل بعد التسليم والإرجاع', s: 'تصبح العمولة قابلة للسحب بعد تأكيد التسليم في بلد الوصول وانتهاء نافذة الإرجاع فيه — لا بعدد أيام ثابت من تاريخ الطلب.' },
];

/* Incoming publish requests to the factory owner (approval flow). */
export const factoryAmbRequests = [
  {
    id: 'RQ-2201', ambassador: 'أحمد النعيمي', initials: 'أ.ن', country: 'الأردن', level: 'سفير معتمد',
    requested: '٧٪', date: 'منذ ساعتين', note: 'جمهوري في الأردن مهتم بالتمور الفاخرة.',
  },
  {
    id: 'RQ-2198', ambassador: 'ريم الحربي', initials: 'ر.ح', country: 'مصر', level: 'سفير قائد',
    requested: '٨٪', date: 'أمس', note: 'أطلب صفحة تسويقية لمصنعكم لمتابعي مصر.',
  },
  {
    id: 'RQ-2190', ambassador: 'خالد العز', initials: 'خ.ع', country: 'الأردن', level: 'سفير',
    requested: '٥٪', date: 'منذ ٣ أيام', note: 'بداية معكم وأريد تجربة الصفحة.',
  },
];

/* Ambassador pages already published for this factory. */
export const factoryAmbPages = [
  { id: 'PG-1001', ambassador: 'أحمد النعيمي', country: 'الأردن', code: 'AHMAD-TAMR4', ambSlug: 'ahmad-jo-2481', factoryId: 'hasa', commission: '٧٪', clicks: '٣٬١٢٠', baseClicks: 3120, orders: 21, sales: '٤٨٬٣٠٠ ر.س', owed: '٣٬٣٨١ ر.س', status: 'نشطة', tone: 'ok' },
  { id: 'PG-1010', ambassador: 'ريم الحربي', country: 'مصر', code: 'REEM-TAMR4', ambSlug: 'reem-eg-3012', factoryId: 'hasa', commission: '٨٪', clicks: '٥٬٤٠٠', baseClicks: 5400, orders: 34, sales: '٧٨٬٦٠٠ ر.س', owed: '٦٬٢٨٨ ر.س', status: 'نشطة', tone: 'ok' },
  { id: 'PG-1020', ambassador: 'يوسف كمال', country: 'تركيا', code: 'YOUSEF-TAMR4', ambSlug: 'yousef-tr-2044', factoryId: 'hasa', commission: '٧٪', clicks: '٩٨٠', baseClicks: 980, orders: 6, sales: '١٢٬١٠٠ ر.س', owed: '٨٤٧ ر.س', status: 'موقوفة', tone: 'danger' },
];

/* The factory's ambassador-program settings. */
export const factoryAmbConfig = {
  factoryId: 'hasa',
  defaultCommission: '٧٪',
  minCommission: '٥٪',
  maxCommission: '٨٪',
  codePrefix: 'TAMR',
  windowDays: '٣٠ يومًا',
  returnWindow: 'حسب بلد الوصول بعد التسليم المؤكد',
  autoApprove: false,
};

/* Platform-wide page registry for the admin governance view. */
export const adminAmbPages = [
  { id: 'PG-1001', ambassador: 'أحمد النعيمي', country: 'الأردن', factory: 'مصنع تمور الأحساء', code: 'AHMAD-TAMR4', ambSlug: 'ahmad-jo-2481', factoryId: 'hasa', baseClicks: 3120, commission: '٧٪', clicks: '٣٬١٢٠', orders: 21, sales: '٤٨٬٣٠٠ ر.س', commissionValue: '٣٬٣٨١ ر.س', status: 'منشورة', tone: 'ok' },
  { id: 'PG-1002', ambassador: 'أحمد النعيمي', country: 'الأردن', factory: 'بيت عود الرياض', code: 'AHMAD-OUD4', ambSlug: 'ahmad-jo-2481', factoryId: 'oud', baseClicks: 1265, commission: '٧٪', clicks: '١٬٢٦٥', orders: 8, sales: '٩٬٢٠٠ ر.س', commissionValue: '٦٤٤ ر.س', status: 'منشورة', tone: 'ok' },
  { id: 'PG-1010', ambassador: 'ريم الحربي', country: 'مصر', factory: 'مصنع تمور الأحساء', code: 'REEM-TAMR4', ambSlug: 'reem-eg-3012', factoryId: 'hasa', baseClicks: 5400, commission: '٨٪', clicks: '٥٬٤٠٠', orders: 34, sales: '٧٨٬٦٠٠ ر.س', commissionValue: '٦٬٢٨٨ ر.س', status: 'منشورة', tone: 'ok' },
  { id: 'PG-1015', ambassador: 'خالد العز', country: 'الأردن', factory: 'مزارع قهوة فيفا', code: 'KHALED-COF4', ambSlug: 'khaled-jo-1190', factoryId: 'fifa', baseClicks: 640, commission: '٦٪', clicks: '٦٤٠', orders: 3, sales: '٤٬٨٠٠ ر.س', commissionValue: '٢٨٨ ر.س', status: 'قيد المراجعة', tone: 'warn' },
  { id: 'PG-1020', ambassador: 'يوسف كمال', country: 'تركيا', factory: 'مصنع تمور الأحساء', code: 'YOUSEF-TAMR4', ambSlug: 'yousef-tr-2044', factoryId: 'hasa', baseClicks: 980, commission: '٧٪', clicks: '٩٨٠', orders: 6, sales: '١٢٬١٠٠ ر.س', commissionValue: '٨٤٧ ر.س', status: 'موقوفة', tone: 'danger' },
  { id: 'PG-1025', ambassador: 'ريم الحربي', country: 'مصر', factory: 'معامل ورد الطائف', code: 'REEM-ROSE4', ambSlug: 'reem-eg-3012', factoryId: 'taif', baseClicks: 2100, commission: '٧٪', clicks: '٢٬١٠٠', orders: 13, sales: '٢٦٬٤٠٠ ر.س', commissionValue: '١٬٨٤٨ ر.س', status: 'منشورة', tone: 'ok' },
];

/* Attribution disputes the platform arbitrates between factory and ambassador. */
export const adminAmbDisputes = [
  { id: 'DSP-77', ambassador: 'خالد العز', factory: 'مزارع قهوة فيفا', reason: 'نسبة طلب متنازع عليها', amount: '٢٦٧ ر.س', age: 'يومان', status: 'مفتوح', tone: 'warn' },
  { id: 'DSP-74', ambassador: 'يوسف كمال', factory: 'مصنع تمور الأحساء', reason: 'اشتباه شراء ذاتي', amount: '١٬٢٤٠ ر.س', age: '٥ أيام', status: 'قيد الفحص', tone: 'danger' },
  { id: 'DSP-70', ambassador: 'ريم الحربي', factory: 'مصنع تمور الأحساء', reason: 'إرجاع بعد الإسناد', amount: '٣٨٠ ر.س', age: 'منتهٍ', status: 'محلول', tone: 'ok' },
];

/* The attribution ledger — how a checkout chose an ambassador (code beats link). */
export const ambPageAttribution = [
  { id: 'SUB-20481', date: '٦ أكتوبر ٢٠٢٦', page: 'صفحة تمور الأحساء', source: 'كود خصم', code: 'AHMAD-TAMR4', country: 'الأردن', value: '٣٨٠ ر.س', commission: '٢٦٫٦ ر.س', status: 'معلّقة', tone: 'warn' },
  { id: 'SUB-20476', date: '٣ أكتوبر ٢٠٢٦', page: 'صفحة بيت عود الرياض', source: 'رابط', code: '—', country: 'الأردن', value: '٥٢٠ ر.س', commission: '٣٦٫٤ ر.س', status: 'معلّقة', tone: 'warn' },
  { id: 'SUB-20455', date: '٢٨ سبتمبر ٢٠٢٦', page: 'صفحة تمور الأحساء', source: 'كود خصم', code: 'AHMAD-TAMR4', country: 'مصر', value: '٧٤٠ ر.س', commission: '٥١٫٨ ر.س', status: 'قابلة للسحب', tone: 'ok' },
  { id: 'SUB-20430', date: '١٨ سبتمبر ٢٠٢٦', page: 'صفحة ورد الطائف', source: 'رابط', code: '—', country: 'تركيا', value: '٤٩٠ ر.س', commission: '٣٤٫٣ ر.س', status: 'مدفوعة', tone: 'info' },
];