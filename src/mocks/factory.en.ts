export const factoryNav = [
  { key: 'f-home', label: 'Home', icon: 'ri-dashboard-3-line' },
  { key: 'f-custom', label: 'Custom dashboard', icon: 'ri-layout-masonry-line' },
  { key: 'f-join', label: 'Join & verification', icon: 'ri-shield-check-line', badge: '!' },
  { key: 'f-profile', label: 'Factory profile', icon: 'ri-store-3-line' },
  { key: 'f-products', label: 'Products', icon: 'ri-shopping-bag-3-line', badge: '3' },
  { key: 'f-newproduct', label: 'Add product', icon: 'ri-add-circle-line' },
  { key: 'f-inventory', label: 'Inventory', icon: 'ri-stack-line', badge: '2' },
  { key: 'f-orders', label: 'Retail orders', icon: 'ri-file-list-3-line', badge: '5' },
  { key: 'f-rfq', label: 'Quote requests', icon: 'ri-price-tag-3-line', badge: '2' },
  { key: 'f-deals', label: 'Wholesale deals', icon: 'ri-hand-coin-line' },
  { key: 'f-contracts', label: 'Contracts', icon: 'ri-file-paper-2-line', badge: '3' },
  { key: 'f-shipping', label: 'Shipping', icon: 'ri-truck-line' },
  { key: 'f-returns', label: 'Returns & disputes', icon: 'ri-arrow-go-back-line' },
  { key: 'f-finance', label: 'Finance', icon: 'ri-money-dollar-circle-line' },
  { key: 'f-audit', label: 'Audit log', icon: 'ri-history-line' },
  { key: 'f-analytics', label: 'Analytics', icon: 'ri-line-chart-line' },
  { key: 'f-marketing', label: 'Marketing', icon: 'ri-megaphone-line' },
  { key: 'f-ambassadors', label: 'Ambassador pages', icon: 'ri-share-forward-2-line', badge: '3' },
  { key: 'f-messages', label: 'Messages', icon: 'ri-chat-3-line', badge: '2' },
  { key: 'f-team', label: 'Team & permissions', icon: 'ri-team-line' },
  { key: 'f-subscription', label: 'Subscription & services', icon: 'ri-vip-crown-line' },
  { key: 'f-settings', label: 'Settings & integrations', icon: 'ri-settings-3-line' },
];

export const factoryUser = {
  name: 'Saad Alharbi',
  factory: 'Madinah Dates',
  role: 'Sales manager',
  country: 'Jeddah — Saudi Arabia',
  initials: 'S.H',
};

export const factoryStats = [
  { icon: 'ri-shopping-bag-3-line', num: 'SAR 9,420', lbl: "Today's sales", delta: '+8%', up: true },
  { icon: 'ri-calendar-line', num: 'SAR 142,680', lbl: 'This month', delta: '+12%', up: true },
  { icon: 'ri-box-3-line', num: '5', lbl: 'Awaiting processing', delta: '', up: true },
  { icon: 'ri-price-tag-3-line', num: '2', lbl: 'Quotes awaiting reply', delta: '', up: true },
  { icon: 'ri-wallet-3-line', num: 'SAR 48,300', lbl: 'Balance due', delta: '', up: true },
  { icon: 'ri-star-line', num: '4.7', lbl: 'Store rating', delta: '+0.1', up: true },
];

export const factoryReadiness = {
  value: 82,
  pending: 'Two items remain to complete your profile readiness',
  checklist: [
    { t: 'Certificates up to date', done: true },
    { t: 'Products translated', done: true },
    { t: 'Factory photos uploaded', done: false },
    { t: 'HS code for every product', done: false },
  ],
};

export const factoryTodayOrders = [
  { id: 'SUB-20481', product: 'Premium sukkari dates box', qty: '×4', due: '6 hours', ship: 'Air — Aramex', status: 'Awaiting processing', tone: 'warn' },
  { id: 'SUB-20476', product: 'Premium ajwa dates', qty: '×2', due: '14 hours', ship: 'Sea — SMEX', status: 'In processing', tone: 'info' },
  { id: 'SUB-20470', product: 'Ground Arabic coffee', qty: '×6', due: 'Expired', ship: 'Air — DHL', status: 'Ready for pickup', tone: 'ok' },
];

export const factoryRfqPending = [
  { buyer: 'Al Yasmin Store', qty: '500 units', country: 'Jordan', delivery: 'CIF — Amman', deadline: '8 hours', offers: 3 },
  { buyer: 'Silk Market', qty: '1000 units', country: 'Egypt', delivery: 'FOB — Jeddah', deadline: '1 day', offers: 5 },
];

export const factoryTopCountries = [
  { label: 'Jordan', value: 62, display: '62% · SAR 88,400' },
  { label: 'Egypt', value: 21, display: '21% · SAR 30,000' },
  { label: 'UAE', value: 12, display: '12% · SAR 17,100' },
  { label: 'Turkey', value: 5, display: '5% · SAR 7,180' },
];

/* --------------------------------------------------------------- join / KYC */

export const factoryJoinSteps = [
  { t: 'Account created', s: 'Registered with email provider', done: true },
  { t: 'Business details', s: 'Name, city and category', done: true },
  { t: 'Commercial registration', s: 'CR-4038 uploaded', done: true },
  { t: 'Industrial license', s: 'Accepted', done: true },
  { t: 'Certificates (Halal / quality)', s: 'Last certificate needs uploading', done: false },
  { t: 'Sign the agreement electronically', s: 'Awaiting signature', done: false },
];

export const factoryDocsList = [
  { id: 'cr', name: 'Commercial registration', status: 'Accepted', tone: 'ok' },
  { id: 'license', name: 'Industrial license', status: 'Accepted', tone: 'ok' },
  { id: 'halal', name: 'Halal certificate', status: 'Awaiting upload', tone: 'warn' },
  { id: 'iso', name: 'ISO 22000 quality certificate', status: 'Accepted', tone: 'ok' },
];

/* --------------------------------------------------------------- profile */

export const factoryProfile = {
  logo: 'https://readdy.ai/api/search-image?query=Minimal%20flat%20brand%20mark%20for%20a%20Saudi%20premium%20dates%20company%20on%20a%20clean%20warm%20beige%20background%2C%20kraft%20and%20amber%20tones%2C%20simple%20emblem%2C%20high%20detail&width=400&height=400&seq=sta-fac-logo-01&orientation=squarish',
  bio: 'A Saudi factory specialized in preparing and packing premium dates — ajwa, sukkari and khalas — to high quality standards with export-ready packaging.',
  city: 'Madinah',
  capacity: '120,000 packs / month',
  certs: ['Halal', 'ISO 22000', 'SASO'],
  langs: ['Arabic', 'English', 'Urdu'],
  images: [
    'https://readdy.ai/api/search-image?query=Minimal%20editorial%20photo%20of%20a%20clean%20modern%20Saudi%20dates%20packaging%20facility%20interior%20with%20kraft%20boxes%20and%20warm%20light%2C%20neutral%20beige%20tones%2C%20high%20detail&width=800&height=600&seq=sta-fac-img-01&orientation=landscape',
    'https://readdy.ai/api/search-image?query=Minimal%20editorial%20photo%20of%20rows%20of%20kraft%20boxes%20of%20dates%20ready%20for%20export%20on%20a%20light%20surface%2C%20warm%20amber%20light%2C%20clean%20neutral%20tones%2C%20high%20detail&width=800&height=600&seq=sta-fac-img-02&orientation=landscape',
    'https://readdy.ai/api/search-image?query=Minimal%20editorial%20photo%20of%20a%20quality%20control%20table%20with%20trays%20of%20Saudi%20dates%20in%20a%20bright%20facility%2C%20warm%20light%2C%20clean%20neutral%20tones%2C%20high%20detail&width=800&height=600&seq=sta-fac-img-03&orientation=landscape',
  ],
};

/* --------------------------------------------------------------- products */

export const factoryProducts = [
  { name: 'Premium sukkari dates box', status: 'Published', tone: 'ok', price: 'SAR 96', stock: '840', sales: '1,240', sku: 'DT-500', category: 'Dates & nuts', hs: '0804.10', cost: 'SAR 54', margin: '43%', min: '100', low: false, rating: '4.8', views: '6,420', wishes: '214', updated: '3 days ago', desc: 'Premium sukkari dates hand-picked from Madinah farms, packed in an elegant kraft box that is export-ready with bilingual cards and matching nutrition facts.', img: 'https://readdy.ai/api/search-image?query=Minimal%20product%20photo%20of%20a%20premium%20box%20of%20Saudi%20sukkari%20dates%20on%20a%20clean%20warm%20beige%20background%2C%20soft%20amber%20light%2C%20top%20view%2C%20high%20detail&width=800&height=600&seq=sta-fac-prod-sukkari-01&orientation=landscape' },
  { name: 'Premium ajwa dates', status: 'Published', tone: 'ok', price: 'SAR 120', stock: '310', sales: '680', sku: 'AJ-500', category: 'Dates & nuts', hs: '0804.10', cost: 'SAR 72', margin: '40%', min: '80', low: true, rating: '4.9', views: '5,100', wishes: '187', updated: '1 day ago', desc: 'Authentic Madinah ajwa dates in tightly sealed packs, a favourite among buyers, and needs a quick restock because the quantity is running low.', img: 'https://readdy.ai/api/search-image?query=Minimal%20product%20photo%20of%20a%20shallow%20tray%20of%20premium%20ajwa%20Saudi%20dates%20on%20a%20clean%20warm%20beige%20surface%2C%20soft%20amber%20light%2C%20top%20view%2C%20high%20detail&width=800&height=600&seq=sta-fac-prod-ajwa-02&orientation=landscape' },
  { name: 'Dates gift assortment', status: 'Pending approval', tone: 'warn', price: 'SAR 240', stock: '140', sales: '450', sku: 'GF-01', category: 'Gifts', hs: '0804.10', cost: 'SAR 156', margin: '35%', min: '60', low: false, rating: '4.6', views: '3,240', wishes: '122', updated: '5 days ago', desc: 'A luxury gift box combining selected date varieties, suited to occasions and corporate orders, currently awaiting platform approval before publishing.', img: 'https://readdy.ai/api/search-image?query=Minimal%20product%20photo%20of%20a%20gift%20set%20of%20assorted%20Saudi%20dates%20in%20an%20elegant%20box%20on%20a%20clean%20warm%20beige%20surface%2C%20soft%20amber%20light%2C%20high%20detail&width=800&height=600&seq=sta-fac-prod-gift-03&orientation=landscape' },
  { name: 'Natural date syrup', status: 'Draft', tone: 'mute', price: 'SAR 52', stock: '0', sales: '0', sku: 'SY-350', category: 'Honey & jam', hs: '1302.20', cost: 'SAR 28', margin: '46%', min: '40', low: true, rating: '—', views: '420', wishes: '18', updated: 'a week ago', desc: 'Natural 100% date syrup with no added sugar, started as a draft and needs a final price and product photos before submitting for approval.', img: 'https://readdy.ai/api/search-image?query=Minimal%20product%20photo%20of%20a%20glass%20jar%20of%20natural%20Saudi%20date%20syrup%20on%20a%20clean%20warm%20beige%20surface%2C%20soft%20amber%20light%2C%20high%20detail&width=800&height=600&seq=sta-fac-prod-syrup-04&orientation=landscape' },
];

export const factoryCategories = ['Food', 'Dates & nuts', 'Honey & jam', 'Beverages'];

export const factoryVariants = [
  { name: '500 g box', sku: 'DT-500', barcode: '6281000001', retail: 'SAR 48', wholesale: 'SAR 32' },
  { name: '1 kg box', sku: 'DT-1000', barcode: '6281000002', retail: 'SAR 96', wholesale: 'SAR 68' },
];

export const factoryInventory = [
  { variant: 'Sukkari dates 500 g', sku: 'DT-500', available: '520', reserved: '84', jeddah: '200', min: '200', alert: false },
  { variant: 'Sukkari dates 1 kg', sku: 'DT-1000', available: '320', reserved: '60', jeddah: '120', min: '150', alert: false },
  { variant: 'Ajwa dates 500 g', sku: 'AJ-500', available: '46', reserved: '30', jeddah: '0', min: '100', alert: true },
  { variant: 'Luxury gift assortment', sku: 'GF-01', available: '140', reserved: '12', jeddah: '40', min: '60', alert: false },
  { variant: 'Date syrup 350 g', sku: 'SY-350', available: '0', reserved: '0', jeddah: '0', min: '40', alert: true },
];

/* --------------------------------------------------------------- orders */

export const factoryOrders = [
  { id: 'SUB-20481', buyer: 'Khalid Alomari', country: 'Jordan', qty: 3, product: 'Premium sukkari dates box', due: '6 hours', ship: 'Air — Aramex', status: 'Awaiting processing', tone: 'warn' },
  { id: 'SUB-20476', buyer: 'Layla Hassan', country: 'Egypt', qty: 2, product: 'Premium ajwa dates', due: '14 hours', ship: 'Sea — SMEX', status: 'In processing', tone: 'info' },
  { id: 'SUB-20470', buyer: 'Samer Nasser', country: 'Jordan', qty: 6, product: 'Ground Arabic coffee', due: 'Expired', ship: 'Air — DHL', status: 'Ready for pickup', tone: 'ok' },
  { id: 'SUB-20462', buyer: 'Mariam Salem', country: 'UAE', qty: 1, product: 'Dates gift assortment', due: '3 days', ship: 'Air — Aramex', status: 'Awaiting processing', tone: 'warn' },
  { id: 'SUB-20455', buyer: 'Nour Eldin', country: 'Turkey', qty: 4, product: 'Premium ajwa dates', due: '3 days', ship: 'Sea — SMEX', status: 'In processing', tone: 'info' },
];

export const factoryRfqList = [
  { buyer: 'Al Yasmin Store', product: 'Sukkari dates × 500', qty: '500 units', country: 'Jordan', delivery: 'CIF — Amman', deadline: '8 hours', competitors: 3 },
  { buyer: 'Silk Market', product: 'Ajwa dates × 1000', qty: '1000 units', country: 'Egypt', delivery: 'FOB — Jeddah', deadline: '1 day', competitors: 5 },
  { buyer: 'Dates Inn', product: 'Gift assortment × 300', qty: '300 units', country: 'Jordan', delivery: 'EXW', deadline: '2 days', competitors: 2 },
];

export const factoryDeals = [
  { buyer: 'Al Yasmin Store', value: 'SAR 84,000', paid: 'SAR 42,000', stage: 'Production', stageKey: 'production', progress: 55, docs: 3 },
  { buyer: 'Silk Market', value: 'SAR 96,000', paid: 'SAR 96,000', stage: 'Shipping', stageKey: 'shipping', progress: 88, docs: 5 },
  { buyer: 'Dates Inn', value: 'SAR 45,000', paid: 'SAR 18,000', stage: 'Processing', stageKey: 'packing', progress: 32, docs: 1 },
];

export const factoryShipments = [
  { id: 'SHP-7781', carrier: 'Aramex', country: 'Jordan', status: 'Ready for pickup', tone: 'ok', pickup: 'Today — 4:00 PM' },
  { id: 'SHP-7770', carrier: 'DHL', country: 'UAE', status: 'Awaiting schedule', tone: 'warn', pickup: 'Tomorrow — 10:00 AM' },
  { id: 'SHP-7762', carrier: 'SMEX', country: 'Egypt', status: 'Scheduled', tone: 'info', pickup: 'Sunday — 9:00 AM' },
];

export const factoryPackaging = [
  { country: 'Jordan', note: 'Packing note: double carton + Arabic/English card.' },
  { country: 'Egypt', note: 'Mandatory: halal label and nutrition info in Arabic.' },
  { country: 'Turkey', note: 'Turkish ingredient data required on the label.' },
];

export const factoryReturns = [
  { id: 'RET-118', order: 'SUB-20390', item: 'Sukkari dates box', reason: 'Damaged item', amount: 'SAR 96', deadline: '2 days', status: 'Awaiting your reply', tone: 'warn' },
  { id: 'RET-113', order: 'SUB-20312', item: 'Ajwa dates', reason: 'Wrong size', amount: 'SAR 490', deadline: '1 day', status: 'Awaiting your reply', tone: 'warn' },
  { id: 'RET-109', order: 'SUB-20255', item: 'Gift assortment', reason: 'Not as described', amount: 'SAR 180', deadline: 'Expired', status: 'Accepted', tone: 'ok' },
];

export const factoryFinance = {
  pending: 'SAR 12,400',
  available: 'SAR 48,300',
  nextCycle: '15 October 2026',
  commission: '6%',
  bank: 'AlAhli Bank · •••• 4421',
  statements: [
    { period: 'September 2026', sales: 'SAR 68,400', commission: 'SAR 4,104', net: 'SAR 63,612', status: 'Approved', tone: 'ok' },
    { period: 'August 2026', sales: 'SAR 52,100', commission: 'SAR 3,126', net: 'SAR 48,453', status: 'Paid', tone: 'ok' },
    { period: 'July 2026', sales: 'SAR 41,200', commission: 'SAR 2,472', net: 'SAR 38,316', status: 'Paid', tone: 'ok' },
  ],
  invoices: [
    { id: 'INV-5501', type: 'Commission invoice', amount: 'SAR 4,104', period: 'September', status: 'Issued', tone: 'ok' },
    { id: 'INV-5490', type: 'Commission invoice', amount: 'SAR 3,126', period: 'August', status: 'Issued', tone: 'ok' },
    { id: 'INV-5482', type: 'Credit note', amount: 'SAR 960', period: 'August', status: 'Issued', tone: 'ok' },
  ],
  trend: {
    labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
    sales: { values: [82000, 96000, 88000, 112000, 128000, 142680], delta: '+12%' },
    commission: { values: [4920, 5760, 5280, 6720, 7680, 8560], delta: '+11%' },
    net: { values: [77080, 90240, 82720, 105280, 120320, 134120], delta: '+12%' },
  },
  byChannel: [
    { label: 'Direct retail', value: 48, display: '48% · SAR 12,420' },
    { label: 'Via ambassadors', value: 38, display: '38% · SAR 9,830' },
    { label: 'Wholesale (B2B)', value: 14, display: '14% · SAR 3,620' },
  ],
};

export const factoryTrend = {
  labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
  sales: { values: [82000, 96000, 88000, 112000, 128000, 142680], delta: '+12%' },
  orders: { values: [320, 380, 350, 440, 510, 590], delta: '+9%' },
  units: { values: [980, 1120, 1040, 1320, 1560, 1780], delta: '+8%' },
};

export const factoryByProduct = [
  { label: 'Sukkari box', value: 58, display: '58% · SAR 82,700' },
  { label: 'Ajwa dates', value: 24, display: '24% · SAR 34,200' },
  { label: 'Gift assortment', value: 12, display: '12% · SAR 17,100' },
  { label: 'Other products', value: 6, display: '6% · SAR 8,680' },
];

export const factoryByChannel = [
  { label: 'Direct retail', value: 48, display: '48%' },
  { label: 'Via ambassadors', value: 38, display: '38%' },
  { label: 'Wholesale (B2B)', value: 14, display: '14%' },
];

export const factoryTopAmbassadors = [
  { name: 'Ahmad Alnuaimi', country: 'Jordan', orders: 47, sales: 'SAR 68,000' },
  { name: 'Reem Alharbi', country: 'Egypt', orders: 63, sales: 'SAR 124,000' },
  { name: 'Yousef Kamal', country: 'Turkey', orders: 21, sales: 'SAR 31,500' },
];

export const factoryReturnReasons = [
  { label: 'Damaged item', value: 46, display: '46%' },
  { label: 'Not as described', value: 28, display: '28%' },
  { label: 'Late delivery', value: 16, display: '16%' },
  { label: 'Other', value: 10, display: '10%' },
];

export const factoryCampaigns = [
  { name: 'Eid campaign', period: '1–20 October', countries: 'Jordan · Egypt', boost: '8% × 2 weeks', status: 'Available', tone: 'ok' },
  { name: 'Back-to-school', period: '20 August', countries: 'Jordan', boost: '6% × 10 days', status: 'Upcoming', tone: 'info' },
  { name: 'Eid al-Fitr — dates', period: '1–15 March', countries: '4 countries', boost: '10% × 3 weeks', status: 'Ended', tone: 'mute' },
];

export const factorySamples = [
  { buyer: 'Silk Market', product: 'Ajwa dates', city: 'Cairo', status: 'In shipping', tone: 'info' },
  { buyer: 'Dates Inn', product: 'Gift assortment', city: 'Amman', status: 'Delivered', tone: 'ok' },
  { buyer: 'Al Yasmin Store', product: 'Sukkari dates box', city: 'Amman', status: 'Awaiting approval', tone: 'warn' },
];

export const factoryThreads = [
  { name: 'Al Yasmin Store', last: 'Can you prepare 500 packs within 10 days?', time: '10:24', unread: true },
  { name: 'Safeer Team', last: 'Please upload the updated halal certificate to complete your profile.', time: 'Yesterday', unread: true },
  { name: 'Silk Market', last: 'Thanks, the sample arrived in excellent condition.', time: 'Sunday', unread: false },
];

export const factoryChat = [
  { from: 'them', text: 'Hello, can you prepare an order of 500 packs within 10 days?', time: '10:10' },
  { from: 'me', text: 'Hello, yes we can. The available capacity is enough.', time: '10:16' },
  { from: 'them', text: 'Great, send me a formal quote with the price and lead time.', time: '10:20' },
];

export const factoryTeamList = [
  { name: 'Saad Alharbi', email: 'saad@madinah-dates.sa', role: 'Sales manager', active: true },
  { name: 'Mona Alqahtani', email: 'mona@madinah-dates.sa', role: 'Inventory manager', active: true },
  { name: 'Abdullah Alghamdi', email: 'abdullah@madinah-dates.sa', role: 'Shipping officer', active: false },
];

export const factorySubscription = {
  plan: 'Gold plan',
  renew: '1 January 2027',
  limits: [
    { label: 'Products', value: '250 / 32 used' },
    { label: 'Settlements', value: 'Monthly — no fees' },
    { label: 'Shipping pricing', value: '12% discount' },
    { label: 'Support', value: 'Dedicated account manager' },
  ],
  services: [
    { name: 'Export document generation', status: 'Included', tone: 'ok' },
    { name: 'Certificates of origin', status: 'Unlimited', tone: 'ok' },
    { name: 'Shipment insurance', status: 'Optional', tone: 'warn' },
  ],
};

export const factorySettings = {
  pickup: 'Madinah — Industrial Zone, warehouse 14',
  hours: 'Sunday – Thursday · 9:00 AM – 6:00 PM',
  notifications: [
    { label: 'New incoming order', channels: 'Email · WhatsApp', on: true },
    { label: 'Quote request', channels: 'Email', on: true },
    { label: 'Financial settlement', channels: 'Email', on: false },
  ],
  api: { key: 'sta_pk_••••••••••7a2f', label: 'ERP integration' },
};

/* ------------------------------------------------------- finance extras */

export const factoryPayoutMethods = [
  { id: 'bank', name: 'AlAhli Bank · •••• 4421', note: 'Bank transfer · arrives within 1–2 business days' },
  { id: 'wallet', name: 'Safeer wallet', note: 'Instant · no withdrawal fee' },
  { id: 'mada', name: 'Mada card · •••• 7735', note: 'Instant transfer · daily limit applies' },
];

export const factoryWithdrawals = [
  { id: 'WD-2201', amount: 'SAR 48,300', method: 'AlAhli Bank · •••• 4421', at: '10 October 2026', status: 'Paid out', tone: 'ok' },
  { id: 'WD-2190', amount: 'SAR 12,400', method: 'Safeer wallet', at: '2 September 2026', status: 'Paid out', tone: 'ok' },
  { id: 'WD-2175', amount: 'SAR 9,800', method: 'Mada card · •••• 7735', at: '14 August 2026', status: 'Processing', tone: 'warn' },
];

/* ----------------------------------------------------- analytics extras */

export const factoryFunnel = [
  { label: 'Product visits', value: 12400, display: '12,400' },
  { label: 'Added to cart', value: 1820, display: '1,820 · 14.7%' },
  { label: 'Order placed', value: 590, display: '590 · 32.4%' },
  { label: 'Delivered', value: 561, display: '561 · 95%' },
];

export const factoryChannelTrend = {
  labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
  channels: [
    { name: 'Direct retail', tone: 'accent', values: [42, 48, 46, 58, 64, 70] },
    { name: 'Via ambassadors', tone: 'gold', values: [28, 32, 30, 38, 44, 52] },
    { name: 'Wholesale (B2B)', tone: 'ink', values: [12, 16, 14, 18, 20, 22] },
  ],
};

export const factoryCountryGrowth = [
  { country: 'Jordan', revenue: 'SAR 88,400', share: '62%', growth: '+18%', up: true, orders: '320' },
  { country: 'Egypt', revenue: 'SAR 30,000', share: '21%', growth: '+9%', up: true, orders: '124' },
  { country: 'UAE', revenue: 'SAR 17,100', share: '12%', growth: '−3%', up: false, orders: '58' },
  { country: 'Turkey', revenue: 'SAR 7,180', share: '5%', growth: '+2%', up: true, orders: '21' },
];

/* ---------------------------------------------------------- rfq extras */

export const factoryRfqOffers = [
  {
    buyer: 'Al Yasmin Store',
    offers: [
      { supplier: 'Madinah Dates · You', price: '68', lead: '12 days', terms: '50% upfront, balance on shipping', rating: '4.7', mine: true },
      { supplier: 'Al Ahsa Palm', price: '64', lead: '10 days', terms: 'Single payment on confirmation', rating: '4.5', mine: false },
      { supplier: 'Rawabi Qassim', price: '72', lead: '14 days', terms: '40% upfront, balance on delivery', rating: '4.6', mine: false },
    ],
  },
  {
    buyer: 'Silk Market',
    offers: [
      { supplier: 'Madinah Dates · You', price: '58', lead: '15 days', terms: '50% upfront, balance on shipping', rating: '4.7', mine: true },
      { supplier: 'Al Ahsa Palm', price: '61', lead: '12 days', terms: 'Single payment on confirmation', rating: '4.5', mine: false },
      { supplier: 'Oasis East', price: '63', lead: '16 days', terms: '40% upfront, balance on delivery', rating: '4.4', mine: false },
    ],
  },
  {
    buyer: 'Dates Inn',
    offers: [
      { supplier: 'Madinah Dates · You', price: '75', lead: '9 days', terms: '50% upfront, balance on shipping', rating: '4.7', mine: true },
      { supplier: 'Al Ahsa Palm', price: '78', lead: '11 days', terms: 'Single payment on confirmation', rating: '4.5', mine: false },
    ],
  },
];

export const factoryRfqHistory = [
  { buyer: 'Al Yasmin Store', product: 'Sukkari dates × 500', price: 'SAR 68', lead: '12 days', at: 'Yesterday · 11:20', status: 'Awaiting buyer reply', tone: 'warn' },
  { buyer: 'Silk Market', product: 'Ajwa dates × 1000', price: 'SAR 58', lead: '15 days', at: '2 days ago · 09:40', status: 'Won the order', tone: 'ok' },
  { buyer: 'Dates Inn', product: 'Gift assortment × 300', price: 'SAR 75', lead: '9 days', at: '4 days ago · 15:05', status: 'Not selected', tone: 'mute' },
];