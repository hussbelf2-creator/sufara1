import type { LedgerOrder } from '@/pages/dashboard/lib/economics';
/* English versions of every dashboard data set. Structural data (icons,
   images, numbers that are not text) mirrors src/mocks/dashboard.ts so the two
   are interchangeable; only human-readable text is translated. */

export const buyerNav = [
  { key: 'home', label: 'Home', icon: 'ri-home-5-line' },
  { key: 'orders', label: 'My orders', icon: 'ri-file-list-3-line', badge: '3' },
  { key: 'quotes', label: 'Price quotes', icon: 'ri-price-tag-3-line' },
  { key: 'deals', label: 'Wholesale deals', icon: 'ri-hand-coin-line' },
  { key: 'contracts', label: 'Contracts', icon: 'ri-file-paper-2-line', badge: '2' },
  { key: 'favorites', label: 'Favorites & lists', icon: 'ri-heart-3-line' },
  { key: 'addresses', label: 'Addresses', icon: 'ri-map-pin-2-line' },
  { key: 'payments', label: 'Payment methods', icon: 'ri-bank-card-line' },
  { key: 'returns', label: 'Returns & disputes', icon: 'ri-arrow-go-back-line' },
  { key: 'messages', label: 'Messages & support', icon: 'ri-chat-3-line', badge: '2' },
  { key: 'tickets', label: 'Support tickets', icon: 'ri-customer-service-2-line' },
  { key: 'account', label: 'Account & verification', icon: 'ri-user-settings-line' },
];

export const ambassadorNav = [
  { key: 'amb-home', label: 'Ambassador dashboard', icon: 'ri-dashboard-3-line' },
  { key: 'links', label: 'My links & codes', icon: 'ri-link' },
  { key: 'mypage', label: 'My page', icon: 'ri-layout-masonry-line' },
  { key: 'amb-pages', label: 'My marketing pages', icon: 'ri-window-2-line', badge: '2' },
  { key: 'content', label: 'Content library', icon: 'ri-image-2-line' },
  { key: 'attributed', label: 'Attributed orders', icon: 'ri-list-check-2', badge: '5' },
  { key: 'merchants', label: 'Merchant buyers', icon: 'ri-store-2-line' },
  { key: 'group', label: 'Group order', icon: 'ri-group-2-line' },
  { key: 'wallet', label: 'Wallet & withdrawals', icon: 'ri-wallet-3-line' },
  { key: 'levels', label: 'Levels & challenges', icon: 'ri-trophy-line' },
  { key: 'leader', label: 'Leader dashboard', icon: 'ri-vip-crown-2-line' },
  { key: 'team', label: 'My team', icon: 'ri-team-line' },
  { key: 'kyc', label: 'Verification', icon: 'ri-shield-check-line', badge: '!' },
  { key: 'terms', label: 'Terms & guidelines', icon: 'ri-book-open-line' },
];

export const buyerUser = {
  name: 'Ahmad Alnuaimi',
  country: 'Jordan',
  flagIcon: 'ri-map-pin-line',
  level: 'Customer',
  initials: 'A.N',
};

export const ambassadorUser = {
  name: 'Ahmad Alnuaimi',
  country: 'Jordan',
  level: 'Certified ambassador',
  code: 'AHMAD-JO-2481',
  initials: 'A.N',
};

export const buyerStats = [
  { icon: 'ri-truck-line', num: '3', lbl: 'Active orders' },
  { icon: 'ri-wallet-3-line', num: 'SAR 184', lbl: 'Commission balance' },
  { icon: 'ri-heart-3-line', num: '12', lbl: 'Items saved' },
  { icon: 'ri-file-list-3-line', num: '27', lbl: 'Completed orders' },
];

export const buyerRecentOrders = [
  { id: 'SFR-20481', date: 'October 4, 2026', value: 'SAR 420', status: 'Out for delivery', tone: 'warn', items: 3, factory: 'Madinah Dates' },
  { id: 'SFR-20462', date: 'September 27, 2026', value: 'SAR 285', status: 'Delivered', tone: 'ok', items: 2, factory: 'Dar Al Oud' },
  { id: 'SFR-20430', date: 'September 15, 2026', value: 'SAR 760', status: 'Awaiting shipment', tone: 'info', items: 5, factory: 'Nusaj Abayas' },
];

export const buyerOrders = [
  {
    id: 'SFR-20481', date: 'October 4, 2026', value: 'SAR 420', status: 'Out for delivery', tone: 'warn',
    factory: 'Madinah Dates', country: 'Jordan', items: 3,
    timeline: [
      { t: 'Order created', s: 'October 4 — 10:24', done: true },
      { t: 'Picked up from factory', s: 'October 5 — 09:10', done: true },
      { t: 'At Jeddah warehouse', s: 'October 6 — 14:40', done: true },
      { t: 'Left the Kingdom', s: 'October 7 — 22:05', done: true },
      { t: 'At destination customs', s: 'Awaiting clearance', done: false },
      { t: 'Out for delivery', s: '—', done: false },
      { t: 'Delivered', s: '—', done: false },
    ],
  },
  {
    id: 'SFR-20462', date: 'September 27, 2026', value: 'SAR 285', status: 'Delivered', tone: 'ok',
    factory: 'Dar Al Oud', country: 'Jordan', items: 2,
    timeline: [
      { t: 'Order created', s: 'September 27', done: true },
      { t: 'At Jeddah warehouse', s: 'September 29', done: true },
      { t: 'Delivered', s: 'October 3', done: true },
    ],
  },
  {
    id: 'SFR-20430', date: 'September 15, 2026', value: 'SAR 760', status: 'Awaiting shipment', tone: 'info',
    factory: 'Nusaj Abayas', country: 'Jordan', items: 5,
    timeline: [
      { t: 'Order created', s: 'September 15', done: true },
      { t: 'In production at factory', s: 'September 17', done: true },
      { t: 'Awaiting handover to shipping', s: '—', done: false },
    ],
  },
];

export const buyerQuotes = [
  {
    factory: 'Nusaj Abayas', rating: '4.8', city: 'Riyadh', price: 'SAR 68 / unit', moq: '50 units',
    lead: '12 days', terms: '50% upfront, rest on shipping', incoterm: 'CIF', sample: 'Available',
  },
  {
    factory: 'Muwaffar Oud Factory', rating: '4.5', city: 'Jeddah', price: 'SAR 74 / unit', moq: '30 units',
    lead: '9 days', terms: '40% upfront, rest on delivery', incoterm: 'FOB', sample: 'Available',
  },
  {
    factory: 'Saudi Coffee House', rating: '4.6', city: 'Abha', price: 'SAR 52 / unit', moq: '100 units',
    lead: '15 days', terms: 'Single payment on confirmation', incoterm: 'EXW', sample: 'Unavailable',
  },
];

export const buyerDeals = [
  {
    name: 'Nusaj Abayas', total: 'SAR 84,000', paid: 'SAR 42,000', due: 'SAR 42,000',
    stage: 'Production', progress: 55, nextDue: 'October 16, 2026',
    stages: [
      { key: 'deposit', date: 'Sep 2, 2026 · 10:15 AM' },
      { key: 'production', date: 'Sep 10, 2026 · 02:30 PM' },
    ],
  },
  {
    name: 'Muwaffar Oud Factory', total: 'SAR 96,000', paid: 'SAR 96,000', due: 'SAR 0',
    stage: 'Shipping', progress: 88, nextDue: '—',
    stages: [
      { key: 'deposit', date: 'Aug 1, 2026 · 09:05 AM' },
      { key: 'production', date: 'Aug 9, 2026 · 11:40 AM' },
      { key: 'packing', date: 'Aug 18, 2026 · 04:20 PM' },
      { key: 'shipping', date: 'Aug 25, 2026 · 08:50 AM' },
    ],
  },
];

export const favoriteLists = [
  { name: 'Family gifts', count: 6 },
  { name: 'Eid dates', count: 4 },
  { name: 'Resale ideas', count: 9 },
  { name: 'Discounted perfumes', count: 3 },
];

export const favoriteProducts = [
  { name: 'Premium Sukkari date box', factory: 'Madinah Dates', price: 'SAR 96', productId: 'dates-sukkari', drop: 'Down 12%', img: 'https://readdy.ai/api/search-image?query=Minimal%20product%20photo%20of%20a%20premium%20box%20of%20Saudi%20dates%20on%20a%20clean%20warm%20beige%20background%2C%20soft%20amber%20light%2C%20top%20view%2C%20neutral%20palette%2C%20high%20detail&width=800&height=600&seq=sta-fav-dates-01&orientation=landscape' },
  { name: 'Concentrated oud perfume', factory: 'Dar Al Oud', price: 'SAR 240', productId: 'oud-dehn', drop: '', img: 'https://readdy.ai/api/search-image?query=Minimal%20product%20photo%20of%20a%20small%20elegant%20oud%20perfume%20bottle%20on%20a%20clean%20warm%20beige%20background%2C%20soft%20amber%20light%2C%20neutral%20palette%2C%20high%20detail&width=800&height=600&seq=sta-fav-oud-02&orientation=landscape' },
  { name: 'Classic embroidered abaya', factory: 'Nusaj Abayas', price: 'SAR 490', productId: 'fashion-abaya', drop: '', img: 'https://readdy.ai/api/search-image?query=Minimal%20product%20photo%20of%20a%20folded%20elegant%20black%20abaya%20with%20subtle%20gold%20embroidery%20on%20a%20clean%20warm%20beige%20background%2C%20soft%20light%2C%20neutral%20palette%2C%20high%20detail&width=800&height=600&seq=sta-fav-abaya-03&orientation=landscape' },
];

export const buyerAddresses = [
  { name: 'Home', country: 'Jordan — Amman', detail: 'Al Madinah Al Munawwarah St, Complex 7, Building 12, Apt 4', phone: '+962 79 555 1212', def: true },
  { name: 'Office', country: 'Jordan — Zarqa', detail: 'Free Zone, Warehouse 24', phone: '+962 77 100 9090', def: false },
  { name: 'Relative — Cairo', country: 'Egypt — Cairo', detail: 'Nasr City, Al Tayaran Street', phone: '+20 100 555 3344', def: false },
];

export const buyerCards = [
  { brand: 'VISA', last4: '4421', exp: '09/29', holder: 'AHMAD ALNAME', def: true },
  { brand: 'MASTERCARD', last4: '8890', exp: '03/28', holder: 'AHMAD ALNAME', def: false },
];

export const buyerReturns = [
  { id: 'RET-118', order: 'SFR-20390', item: 'Sukkari date box', reason: 'Damaged item', amount: 'SAR 96', status: 'Under review', tone: 'warn' },
  { id: 'RET-104', order: 'SFR-20211', item: 'Classic abaya', reason: 'Wrong size', amount: 'SAR 490', status: 'Refunded', tone: 'ok' },
];

export const buyerThreads = [
  { name: 'Madinah Dates', last: 'Your delivery has been confirmed for this week, God willing.', time: '10:24', unread: true },
  { name: 'Safeer Support', last: 'Yes, the customs fees are prepaid (DDP).', time: 'Yesterday', unread: true },
  { name: 'Dar Al Oud', last: 'Thanks for your order — we added a small gift to the package.', time: 'Sunday', unread: false },
];

export const buyerMessages = [
  { from: 'me', text: 'Hi, can you tell me when the shipment will arrive?', time: '10:10' },
  { from: 'them', text: 'Hello. The shipment left the Jeddah warehouse yesterday and should arrive within 3 days.', time: '10:18' },
  { from: 'me', text: 'Great, are the customs fees paid?', time: '10:20' },
  { from: 'them', text: 'Yes, the order is DDP — the final price includes the fees.', time: '10:24' },
];

export const buyerRecommendations = [
  { name: 'Madinah Ajwa dates', factory: 'Madinah Dates', price: 'SAR 120', productId: 'dates-khalas', img: 'https://readdy.ai/api/search-image?query=Minimal%20product%20photo%20of%20a%20shallow%20dish%20of%20ajwa%20Saudi%20dates%20on%20a%20clean%20warm%20beige%20surface%2C%20soft%20amber%20light%2C%20top%20view%2C%20neutral%20palette%2C%20high%20detail&width=800&height=600&seq=sta-rec-ajwa-01&orientation=landscape' },
  { name: 'Ground Arabic coffee', factory: 'Saudi Coffee House', price: 'SAR 68', productId: 'coffee-arabic', img: 'https://readdy.ai/api/search-image?query=Minimal%20product%20photo%20of%20a%20kraft%20pouch%20of%20Saudi%20arabic%20coffee%20beans%20on%20a%20clean%20warm%20beige%20surface%2C%20soft%20amber%20light%2C%20neutral%20palette%2C%20high%20detail&width=800&height=600&seq=sta-rec-coffee-02&orientation=landscape' },
  { name: 'Premium maamoul bakhoor', factory: 'Dar Al Oud', price: 'SAR 180', productId: 'oud-bakhoor', img: 'https://readdy.ai/api/search-image?query=Minimal%20product%20photo%20of%20a%20small%20glass%20jar%20of%20Saudi%20bakhoor%20incense%20on%20a%20clean%20warm%20beige%20surface%2C%20soft%20amber%20light%2C%20neutral%20palette%2C%20high%20detail&width=800&height=600&seq=sta-rec-bakhoor-03&orientation=landscape' },
];

export const ambStats = [
  { icon: 'ri-money-dollar-circle-line', num: 'SAR 3,480', lbl: 'Total earnings', delta: '+12%', up: true },
  { icon: 'ri-time-line', num: 'SAR 420', lbl: 'Pending commissions', delta: '', up: true },
  { icon: 'ri-wallet-3-line', num: 'SAR 3,060', lbl: 'Available to withdraw', delta: '', up: true },
  { icon: 'ri-cursor-line', num: '8,241', lbl: 'Clicks on my links', delta: '+8%', up: true },
];

export const ambSummary = {
  clicks: 8241,
  orders: 47,
  conversion: '0.57%',
  level: 'Certified ambassador',
  nextLevel: 'Elite ambassador',
  progress: 68,
  toNext: '13 orders left to level up',
};

/* Six-month performance trend for the ambassador analytics card. */
export const ambTrend = {
  labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
  clicks: { values: [4200, 5100, 4620, 6180, 7360, 8241], delta: '+8%' },
  orders: { values: [22, 28, 25, 33, 41, 47], delta: '+11%' },
  commissions: { values: [1860, 2240, 1980, 2680, 3120, 3480], delta: '+12%' },
};

/* Same three trends re-sliced by the period switcher (7 / 30 / 90 days) so the
   charts answer instantly when the ambassador taps a range. */
export const ambTrendPeriods = {
  d7: {
    labels: ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    clicks: { values: [820, 960, 1040, 1180, 990, 1310, 1420], delta: '+4%' },
    orders: { values: [3, 5, 4, 6, 5, 8, 9], delta: '+6%' },
    commissions: { values: [180, 320, 260, 410, 300, 520, 610], delta: '+5%' },
  },
  d30: {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    clicks: { values: [1820, 2140, 1980, 2301], delta: '+8%' },
    orders: { values: [10, 12, 11, 14], delta: '+7%' },
    commissions: { values: [780, 920, 860, 1020], delta: '+9%' },
  },
  d90: {
    labels: ['Aug', 'Sep', 'Oct'],
    clicks: { values: [18240, 21050, 22110], delta: '+10%' },
    orders: { values: [92, 104, 118], delta: '+11%' },
    commissions: { values: [6420, 7180, 7940], delta: '+12%' },
  },
};

export const ambLinks = [
  { target: 'Personal code — AHMAD-JO-2481', url: 'safeer.sa/r/AHMAD-JO-2481', clicks: 3120, orders: 21, rate: '0.67%' },
  { target: 'Nusaj abayas page', url: 'safeer.sa/r/abayas-2481', clicks: 1840, orders: 11, rate: '0.60%' },
  { target: 'Dar Al Oud products', url: 'safeer.sa/r/oud-2481', clicks: 1265, orders: 8, rate: '0.63%' },
  { target: 'Eid campaign — dates', url: 'safeer.sa/r/eid-dates-2481', clicks: 2016, orders: 7, rate: '0.35%' },
];

export const ambContent = [
  { name: 'The dates factory story', type: '30s video', lang: 'Urdu', img: 'https://readdy.ai/api/search-image?query=Minimal%20editorial%20still%20of%20Saudi%20date%20factory%20interior%20with%20warm%20light%20and%20kraft%20boxes%2C%20clean%20beige%20tones%2C%20neutral%20palette%2C%20high%20detail&width=800&height=600&seq=sta-content-dates-01&orientation=landscape' },
  { name: 'Sale-season abaya photos', type: '5 photos', lang: 'English', img: 'https://readdy.ai/api/search-image?query=Minimal%20editorial%20still%20of%20folded%20abayas%20on%20a%20neutral%20surface%20with%20soft%20light%2C%20clean%20beige%20tones%2C%20high%20detail&width=800&height=600&seq=sta-content-abaya-02&orientation=landscape' },
  { name: 'Oud post copy', type: 'Short text', lang: 'Arabic', img: 'https://readdy.ai/api/search-image?query=Minimal%20editorial%20still%20of%20oud%20perfume%20bottles%20on%20a%20neutral%20surface%20with%20warm%20light%2C%20clean%20beige%20tones%2C%20high%20detail&width=800&height=600&seq=sta-content-oud-03&orientation=landscape' },
  { name: 'Order prep video', type: '15s video', lang: 'Indonesian', img: 'https://readdy.ai/api/search-image?query=Minimal%20editorial%20still%20of%20a%20packing%20table%20with%20kraft%20boxes%20and%20labels%2C%20neutral%20beige%20tones%2C%20warm%20light%2C%20high%20detail&width=800&height=600&seq=sta-content-pack-04&orientation=landscape' },
  { name: 'Saudi coffee story', type: '45s video', lang: 'Urdu', img: 'https://readdy.ai/api/search-image?query=Minimal%20editorial%20still%20of%20Saudi%20arabic%20coffee%20cups%20and%20beans%20on%20a%20neutral%20surface%2C%20warm%20light%2C%20clean%20beige%20tones%2C%20high%20detail&width=800&height=600&seq=sta-content-coffee-05&orientation=landscape' },
  { name: 'Second-bag campaign banner', type: 'Banner', lang: 'Arabic', img: 'https://readdy.ai/api/search-image?query=Minimal%20editorial%20banner%20scene%20of%20a%20kraft%20suitcase%20and%20shipping%20box%20in%20a%20light%20airport%20corridor%2C%20neutral%20beige%20tones%2C%20warm%20light%2C%20high%20detail&width=800&height=600&seq=sta-content-bag-06&orientation=landscape' },
];

export const ambOrders = [
  { date: 'October 6, 2026', country: 'Jordan', value: 'SAR 380', commission: 'SAR 26.6', status: 'Pending', tone: 'warn' },
  { date: 'October 3, 2026', country: 'Jordan', value: 'SAR 520', commission: 'SAR 36.4', status: 'Pending', tone: 'warn' },
  { date: 'September 28, 2026', country: 'Egypt', value: 'SAR 740', commission: 'SAR 51.8', status: 'Due', tone: 'ok' },
  { date: 'September 22, 2026', country: 'Jordan', value: 'SAR 290', commission: 'SAR 20.3', status: 'Due', tone: 'ok' },
  { date: 'September 18, 2026', country: 'Jordan', value: 'SAR 640', commission: 'SAR 44.8', status: 'Paid', tone: 'info' },
];

export const ambMerchants = [
  { name: 'Al Yasmin Store', country: 'Jordan', deal: 'SAR 124,000', expiry: 'June 30, 2027', commission: 'SAR 2,480' },
  { name: 'Silk Market', country: 'Egypt', deal: 'SAR 86,500', expiry: 'March 12, 2027', commission: 'SAR 1,730' },
  { name: 'Dates Inn', country: 'Jordan', deal: 'SAR 45,000', expiry: 'January 8, 2027', commission: 'SAR 900' },
];

export const ambGroupMembers = [
  { name: 'Ahmad (you)', items: 'Date box + oud', share: 'SAR 180' },
  { name: 'Samer — Amman', items: 'Summer abaya', share: 'SAR 420' },
  { name: 'Lama — Zarqa', items: 'Maamoul bakhoor', share: 'SAR 160' },
  { name: 'Umm Ahmad', items: 'Arabic coffee ×2', share: 'SAR 136' },
];

export const ambWallet = {
  available: 'SAR 3,060',
  pending: 'SAR 420',
  minWithdraw: 'SAR 500',
  fee: '1.5%',
  methods: ['International bank transfer (IBAN)', 'Local e-wallet', 'Platform shopping credit (+2%)'],
  movements: [
    { date: 'October 3, 2026', label: 'Commission — SFR-20462', amount: '+SAR 51.8', tone: 'in' },
    { date: 'October 1, 2026', label: 'Withdrawal to local wallet', amount: '-SAR 245.0', tone: 'out' },
    { date: 'September 22, 2026', label: 'Neighborhood ambassador challenge reward', amount: '+SAR 100.0', tone: 'in' },
    { date: 'September 18, 2026', label: 'Team reward — one level', amount: '+SAR 36.0', tone: 'in' },
  ],
  sources: [
    { label: 'Madinah Dates', value: 1480, display: '42% · SAR 1,480' },
    { label: 'Dar Al Oud', value: 980, display: '28% · SAR 980' },
    { label: 'Nusaj Abayas', value: 620, display: '18% · SAR 620' },
    { label: 'Eid campaign', value: 420, display: '12% · SAR 420' },
  ],
};

export const ambLevels = [
  { name: 'Ambassador', retail: '5%', wholesale: '1.5%', perks: 'Link, code, QR and content library', reach: 'On sign-up', tone: '' },
  { name: 'Certified ambassador', retail: '7%', wholesale: '2% + 0.5% recurring', perks: 'Faster withdrawals, free samples and an ambassador page', reach: 'SAR 10,000 in 90 days', tone: 'ok' },
  { name: 'Lead ambassador', retail: '8%', wholesale: '3% + 1% recurring', perks: 'A team, 1% bonus on direct team sales and an account manager', reach: 'An active team of 5 ambassadors', tone: '' },
];

export const ambChallenges = [
  { name: 'Neighborhood ambassador', desc: 'Top sales in your country this month', reward: 'Badge + SAR 100', progress: 72 },
  { name: 'First 10 orders', desc: 'Reach 10 attributed orders', reward: '0.5% extra for two months', progress: 100 },
  { name: 'Group order', desc: 'Create a group order that 4 people join', reward: 'SAR 50 bonus', progress: 40 },
];

export const ambTeam = [
  { name: 'Khaled — Amman', orders: 14, sales: 'SAR 4,200', bonus: 'SAR 42' },
  { name: 'Reem — Irbid', orders: 9, sales: 'SAR 2,850', bonus: 'SAR 28.5' },
  { name: 'Yousef — Zarqa', orders: 5, sales: 'SAR 1,400', bonus: 'SAR 14' },
];

export const ambKyc = [
  { t: 'Mobile confirmation', s: 'Verified via OTP code', done: true },
  { t: 'Email', s: 'Confirmed', done: true },
  { t: 'National ID / passport', s: 'Accepted', done: true },
  { t: 'Selfie verification', s: 'Required to raise withdrawal limits', done: false },
  { t: 'Commission payout method', s: 'Link your wallet or bank account', done: false },
];

export const ambTerms = [
  { q: 'Who can be an ambassador?', a: 'Anyone who loves Saudi products — a visitor, a resident, or a member of an expat community abroad. Sign-up inside the Kingdom is allowed, earning starts once you are active outside the Kingdom, and commission is counted only on orders shipped outside the Kingdom.' },
  { q: 'How are orders attributed to me?', a: 'Retail: the last click on your link within 30 days, or your code entered at checkout, and the code wins over the link. Wholesale: the merchant account is linked to you for 12 months, during which you earn on repeat deals.' },
  { q: 'When does commission become withdrawable?', a: 'Commission stays “pending” until delivery is confirmed in the destination country and that return window of that country has closed, then becomes “withdrawable” once your identity is verified.' },
  { q: 'What is not allowed in the program?', a: 'An ambassador buying for himself with his own code, paid advertising under the Safeer name in search engines, using the name of any government body, and promising fixed returns for joining.' },
  { q: 'How do I get more sales?', a: 'Use the ready-made content library in your language, focus on products for your local season, create group orders to cut shipping costs, and look after the wholesale merchants you refer.' },
];

/* --------------------------------------------------------------- admin data */

export const adminNav = [
  { key: 'admin-home', label: 'Home & analytics', icon: 'ri-dashboard-3-line' },
  { key: 'admin-platform', label: 'Platform settings', icon: 'ri-equalizer-line' },
  { key: 'admin-factories', label: 'Factories', icon: 'ri-building-2-line', badge: '4' },
  { key: 'admin-products', label: 'Products & catalog', icon: 'ri-shopping-bag-3-line', badge: '3' },
  { key: 'admin-orders', label: 'Orders', icon: 'ri-file-list-3-line', badge: '12' },
  { key: 'admin-ambassadors', label: 'Ambassadors', icon: 'ri-share-forward-2-line' },
  { key: 'admin-returns', label: 'Returns register', icon: 'ri-arrow-go-back-line', badge: '3' },
  { key: 'admin-amb-pages', label: 'Ambassador pages', icon: 'ri-window-2-line', badge: '2' },
  { key: 'admin-finance', label: 'Finance & settlements', icon: 'ri-money-dollar-circle-line' },
  { key: 'admin-warehouses', label: 'Warehouse operations', icon: 'ri-building-4-line' },
  { key: 'admin-logistics', label: 'Shipping & logistics', icon: 'ri-truck-line' },
  { key: 'admin-groups', label: 'Group orders', icon: 'ri-group-line' },
  { key: 'admin-compliance', label: 'Verification & compliance', icon: 'ri-shield-check-line' },
  { key: 'admin-whatsapp', label: 'WhatsApp templates', icon: 'ri-whatsapp-line' },
  { key: 'admin-privacy', label: 'Privacy requests', icon: 'ri-user-shared-line' },
  { key: 'admin-health', label: 'System health', icon: 'ri-pulse-line' },
  { key: 'admin-marketing', label: 'Marketing & content', icon: 'ri-megaphone-line' },
  { key: 'admin-content', label: 'Content management', icon: 'ri-file-edit-line' },
  { key: 'admin-support', label: 'Support & internal', icon: 'ri-customer-service-2-line' },
  { key: 'admin-contracts', label: 'Contracts', icon: 'ri-file-paper-2-line', badge: '4' },
  { key: 'admin-accounts', label: 'Registered accounts', icon: 'ri-user-follow-line' },
];

export const adminUser = {
  name: 'Sarah Alotaibi',
  role: 'Operations manager',
  country: 'Riyadh — Saudi Arabia',
  initials: 'S.A',
};

export const adminStats = [
  { icon: 'ri-money-dollar-circle-line', num: 'SAR 4.26M', lbl: 'Total sales', delta: '+14%', up: true },
  { icon: 'ri-percent-line', num: 'SAR 294,800', lbl: 'Platform revenue', delta: '+9%', up: true },
  { icon: 'ri-shopping-bag-3-line', num: '1,240', lbl: 'Retail orders', delta: '+6%', up: true },
  { icon: 'ri-hand-coin-line', num: '86', lbl: 'Wholesale deals', delta: '+3%', up: true },
  { icon: 'ri-receipt-line', num: 'SAR 3,400', lbl: 'Average order', delta: '+2%', up: true },
  { icon: 'ri-building-2-line', num: '42', lbl: 'Active factories', delta: '', up: true },
  { icon: 'ri-share-forward-2-line', num: '512', lbl: 'Active ambassadors', delta: '+11%', up: true },
  { icon: 'ri-line-chart-line', num: '38%', lbl: 'Sales via ambassadors', delta: '+4%', up: true },
];

export const adminAlerts = [
  { icon: 'ri-timer-flash-line', t: 'Order past shipping deadline', s: 'SFR-20512 · 3 days late · Muwaffar factory', tone: 'danger', time: 'An hour ago' },
  { icon: 'ri-bank-card-2-line', t: 'Repeated failed payments', s: '4 failed attempts on the same card · Khaled A.', tone: 'warn', time: '3 hours ago' },
  { icon: 'ri-alarm-warning-line', t: 'Fraud suspicion', s: 'Clicks from a single device + self-purchase · JO-1190', tone: 'danger', time: 'Yesterday' },
  { icon: 'ri-file-warning-line', t: 'Factory documents expiring', s: 'Industrial license of “Coffee House” in 5 days', tone: 'warn', time: 'Yesterday' },
];

export const adminSalesByCountry = [
  { country: 'Jordan', value: 'SAR 920,400', pct: 41 },
  { country: 'Egypt', value: 'SAR 740,100', pct: 33 },
  { country: 'UAE', value: 'SAR 386,000', pct: 17 },
  { country: 'Turkey', value: 'SAR 198,500', pct: 9 },
];

/* Six-month platform-wide trend for the admin analytics card.
   Sales are in millions of SAR, revenue in thousands of SAR. */
export const adminTrend = {
  labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
  sales: { values: [2.9, 3.2, 3.05, 3.55, 3.95, 4.26], delta: '+14%' },
  orders: { values: [880, 950, 910, 1040, 1160, 1240], delta: '+6%' },
  revenue: { values: [186, 204, 196, 232, 258, 294.8], delta: '+9%' },
};

export const adminTopFactories = [
  { name: 'Nusaj Abayas', sales: 'SAR 684,000', score: 92 },
  { name: 'Madinah Dates', sales: 'SAR 521,400', score: 88 },
  { name: 'Dar Al Oud', sales: 'SAR 412,900', score: 85 },
  { name: 'Saudi Coffee House', sales: 'SAR 298,200', score: 79 },
];

export const adminPendingFactories = [
  { name: 'Al Waha Dates Factory', cr: 'CR-4038', city: 'Qassim', category: 'Food', status: 'Under review', tone: 'warn' },
  { name: 'Hiraf Perfume Workshop', cr: 'CR-4091', city: 'Taif', category: 'Perfumes', status: 'Missing document', tone: 'danger' },
  { name: 'Nukhab Chocolate', cr: 'CR-4102', city: 'Jeddah', category: 'Food', status: 'Under review', tone: 'warn' },
  { name: 'Najd Industries', cr: 'CR-4115', city: 'Riyadh', category: 'Textiles', status: 'Under review', tone: 'warn' },
];

export const adminFactoriesList = [
  { name: 'Nusaj Abayas', plan: 'Platinum', products: 48, sales: 'SAR 684,000', rating: '4.8', onTime: 96, returns: 2 },
  { name: 'Madinah Dates', plan: 'Gold', products: 32, sales: 'SAR 521,400', rating: '4.7', onTime: 93, returns: 3 },
  { name: 'Dar Al Oud', plan: 'Gold', products: 26, sales: 'SAR 412,900', rating: '4.6', onTime: 91, returns: 4 },
  { name: 'Saudi Coffee House', plan: 'Silver', products: 18, sales: 'SAR 298,200', rating: '4.4', onTime: 86, returns: 6 },
];

export const adminProductReview = [
  { name: 'Embroidered summer abaya', factory: 'Nusaj Abayas', category: 'Fashion', hs: '6204.42', countries: 'Jordan · Egypt', img: 'https://readdy.ai/api/search-image?query=Minimal%20product%20photo%20of%20a%20folded%20elegant%20summer%20abaya%20with%20subtle%20embroidery%20on%20a%20clean%20warm%20beige%20background%2C%20soft%20light%2C%20neutral%20palette%2C%20high%20detail&width=800&height=600&seq=sta-adm-prod-abaya-01&orientation=landscape' },
  { name: 'Premium Ajwa dates', factory: 'Madinah Dates', category: 'Food', hs: '0804.10', countries: 'Jordan · UAE', img: 'https://readdy.ai/api/search-image?query=Minimal%20product%20photo%20of%20a%20shallow%20tray%20of%20premium%20ajwa%20dates%20on%20a%20clean%20warm%20beige%20surface%2C%20soft%20amber%20light%2C%20top%20view%2C%20high%20detail&width=800&height=600&seq=sta-adm-prod-ajwa-02&orientation=landscape' },
  { name: 'Signature maamoul bakhoor', factory: 'Dar Al Oud', category: 'Perfumes', hs: '3307.41', countries: 'Egypt · Turkey', img: 'https://readdy.ai/api/search-image?query=Minimal%20product%20photo%20of%20a%20small%20glass%20jar%20of%20premium%20bakhoor%20incense%20on%20a%20clean%20warm%20beige%20surface%2C%20soft%20amber%20light%2C%20high%20detail&width=800&height=600&seq=sta-adm-prod-bakhoor-03&orientation=landscape' },
];

export const adminProductsList = [
  { name: 'Premium Sukkari date box', factory: 'Madinah Dates', status: 'Published', tone: 'ok', price: 'SAR 96', stock: '840', sales: '1,240', translation: 100 },
  { name: 'Concentrated oud perfume', factory: 'Dar Al Oud', status: 'Published', tone: 'ok', price: 'SAR 240', stock: '310', sales: '680', translation: 80 },
  { name: 'Classic embroidered abaya', factory: 'Nusaj Abayas', status: 'Under review', tone: 'warn', price: 'SAR 490', stock: '120', sales: '450', translation: 60 },
  { name: 'Ground Arabic coffee', factory: 'Saudi Coffee House', status: 'Suspended', tone: 'danger', price: 'SAR 68', stock: '0', sales: '980', translation: 100 },
];

export const adminOrders = [
  { id: 'SFR-20512', buyer: 'Khaled Alomari', country: 'Jordan', value: 'SAR 420', pay: 'Paid', payTone: 'ok', ship: 'Late', shipTone: 'danger', ambassador: 'AHMAD-JO-2481' },
  { id: 'SFR-20508', buyer: 'Layla Hassan', country: 'Egypt', value: 'SAR 760', pay: 'Paid', payTone: 'ok', ship: 'At warehouse', shipTone: 'info', ambassador: '—' },
  { id: 'SFR-20501', buyer: 'Samer Nasser', country: 'Jordan', value: 'SAR 290', pay: 'Pending', payTone: 'warn', ship: 'Preparing', shipTone: 'info', ambassador: 'REEM-JO-3012' },
  { id: 'SFR-20497', buyer: 'Nour Eldin', country: 'Turkey', value: 'SAR 1,120', pay: 'Paid', payTone: 'ok', ship: 'Left the Kingdom', shipTone: 'info', ambassador: '—' },
  { id: 'SFR-20490', buyer: 'Mariam Salem', country: 'UAE', value: 'SAR 540', pay: 'Partly refunded', payTone: 'warn', ship: 'Delivered', shipTone: 'ok', ambassador: '—' },
];

export const adminRfq = [
  { buyer: 'Al Yasmin Store', product: 'Classic abaya × 500', country: 'Jordan', delivery: 'CIF — Amman', offers: 3 },
  { buyer: 'Silk Market', product: 'Ajwa dates × 1000', country: 'Egypt', delivery: 'FOB — Jeddah', offers: 5 },
  { buyer: 'Dates Inn', product: 'Arabic coffee × 2000', country: 'Jordan', delivery: 'EXW', offers: 2 },
];

export const adminWholesaleDeals = [
  { factory: 'Nusaj Abayas', buyer: 'Al Yasmin Store', value: 'SAR 84,000', terms: '50% upfront', stage: 'Production', progress: 55 },
  { factory: 'Madinah Dates', buyer: 'Silk Market', value: 'SAR 96,000', terms: 'Single payment', stage: 'Shipping', progress: 88 },
  { factory: 'Dar Al Oud', buyer: 'Dates Inn', value: 'SAR 45,000', terms: '40% upfront', stage: 'Preparation', progress: 32 },
];

export const adminReturns = [
  { id: 'RET-118', order: 'SFR-20390', item: 'Sukkari date box', reason: 'Damaged item', amount: 'SAR 96', deadline: '2 days', decision: 'Pending', tone: 'warn' },
  { id: 'RET-113', order: 'SFR-20312', item: 'Classic abaya', reason: 'Wrong size', amount: 'SAR 490', deadline: '1 day', decision: 'Full refund', tone: 'ok' },
  { id: 'RET-109', order: 'SFR-20255', item: 'Maamoul bakhoor', reason: 'Not as described', amount: 'SAR 180', deadline: 'Expired', decision: 'Rejected + cost charged', tone: 'danger' },
];

/* Full return-case log for the admin returns register. status is the decision
   the register starts with; every later decision is layered on top from the
   admin ops store, so the log keeps one canonical state per case.
   status: pending | accepted | rejected | received */
export const adminReturnsLog = [
  { id: 'RET-126', order: 'SFR-2026-58110', buyer: 'Noura Alqahtani', country: 'Saudi Arabia', factory: 'Dar Al Oud', item: 'Premium maamoul bakhoor', reason: 'damaged', amount: 1080, creditNote: 'CN-202610-0018', requestedAt: '2026-10-11', status: 'received' },
  { id: 'RET-125', order: 'SFR-2026-54211', buyer: 'Khaled Alomari', country: 'Jordan', factory: 'Madinah Dates', item: 'Premium Sukkari date box', reason: 'damaged', amount: 480, creditNote: 'CN-202610-0012', requestedAt: '2026-10-08', status: 'accepted' },
  { id: 'RET-124', order: 'SFR-2026-52890', buyer: 'Layla Hassan', country: 'Egypt', factory: 'Nusaj Abayas', item: 'Classic embroidered abaya', reason: 'size', amount: 980, creditNote: 'CN-202610-0004', requestedAt: '2026-10-04', status: 'rejected' },
  { id: 'RET-123', order: 'SFR-2026-51102', buyer: 'Samer Nasser', country: 'Jordan', factory: 'Saudi Coffee House', item: 'Ground Arabic coffee', reason: 'notAsDescribed', amount: 264, creditNote: 'CN-202609-0044', requestedAt: '2026-09-29', status: 'received' },
  { id: 'RET-122', order: 'SFR-2026-49871', buyer: 'Mariam Salem', country: 'UAE', factory: 'Dar Al Oud', item: 'Concentrated oud perfume', reason: 'other', amount: 480, creditNote: 'CN-202609-0031', requestedAt: '2026-09-21', status: 'accepted' },
  { id: 'RET-121', order: 'SFR-2026-48330', buyer: 'Nour Eldin', country: 'Turkey', factory: 'Nusaj Abayas', item: 'Embroidered summer abaya', reason: 'size', amount: 735, creditNote: 'CN-202609-0009', requestedAt: '2026-09-12', status: 'pending' },
  { id: 'RET-120', order: 'SFR-2026-47012', buyer: 'Ahmad Alnuaimi', country: 'Jordan', factory: 'Madinah Dates', item: 'Madinah Ajwa dates', reason: 'damaged', amount: 360, creditNote: 'CN-202609-0002', requestedAt: '2026-09-05', status: 'rejected' },
];

export const adminAmbassadors = [
  { name: 'Ahmad Alnuaimi', country: 'Jordan', level: 'Certified ambassador', source: 'Public link', clicks: '8,241', orders: 47, sales: 'SAR 68,000', commission: 'SAR 4,760', status: 'Verified', tone: 'ok' },
  { name: 'Reem Alharbi', country: 'Egypt', level: 'Lead ambassador', source: 'Team invite', clicks: '15,200', orders: 63, sales: 'SAR 124,000', commission: 'SAR 9,920', status: 'Verified', tone: 'ok' },
  { name: 'Khaled Alizz', country: 'Jordan', level: 'Ambassador', source: 'TikTok campaign', clicks: '3,100', orders: 4, sales: 'SAR 8,400', commission: 'SAR 588', status: 'Awaiting KYC', tone: 'warn' },
  { name: 'Yousef Kamal', country: 'Turkey', level: 'Certified ambassador', source: 'Travel partner', clicks: '6,400', orders: 21, sales: 'SAR 31,500', commission: 'SAR 2,205', status: 'Frozen', tone: 'danger' },
];

export const adminPayments = [
  { id: 'PAY-90231', gateway: 'mada', currency: 'SAR', amount: '420.00', rate: '1.00', fee: '6.30', status: 'Reconciled', tone: 'ok' },
  { id: 'PAY-90228', gateway: 'Visa', currency: 'SAR', amount: '760.00', rate: '1.00', fee: '11.40', status: 'Reconciled', tone: 'ok' },
  { id: 'PAY-90224', gateway: 'MasterCard', currency: 'USD', amount: '145.00', rate: '3.75', fee: '8.15', status: 'Reconciling', tone: 'warn' },
  { id: 'PAY-90219', gateway: 'Apple Pay', currency: 'SAR', amount: '540.00', rate: '1.00', fee: '8.10', status: 'Failed', tone: 'danger' },
];

export const adminSettlements = [
  { factory: 'Nusaj Abayas', period: 'September 2026', sales: 'SAR 68,400', commission: 'SAR 4,104', fee: 'SAR 684', net: 'SAR 63,612', status: 'Approved', tone: 'ok' },
  { factory: 'Madinah Dates', period: 'September 2026', sales: 'SAR 52,100', commission: 'SAR 3,126', fee: 'SAR 521', net: 'SAR 48,453', status: 'In cycle', tone: 'warn' },
  { factory: 'Dar Al Oud', period: 'September 2026', sales: 'SAR 41,200', commission: 'SAR 2,472', fee: 'SAR 412', net: 'SAR 38,316', status: 'Approved', tone: 'ok' },
];

/* Per-order settlement ledger. Gross is the goods value in SAR; segment drives
   the active PlatformConfig (channel take rate, tier commission, capped discount). An ambassador
   is only commissioned on a new customer's first order, so a repeat order that
   still carries an ambassador code pays zero commission. */
export const adminFinanceOrders: LedgerOrder[] = [
  { id: 'SFR-20512', channel: 'retail', discount: 17, ambassadorTier: 'certified', leader: 'REEM-EG-3012', date: '2026-10-12', buyer: 'Khaled Alomari', country: 'Jordan', gross: 420, segment: 'new', ambassador: 'AHMAD-JO-2481', status: 'Collected', tone: 'ok' },
  { id: 'SFR-20508', channel: 'retail', discount: 30, date: '2026-10-09', buyer: 'Layla Hassan', country: 'Egypt', gross: 760, segment: 'new', ambassador: '', status: 'Collected', tone: 'ok' },
  { id: 'SFR-20501', channel: 'retail', ambassadorTier: 'starter', date: '2026-10-06', buyer: 'Samer Nasser', country: 'Jordan', gross: 290, segment: 'repeat', ambassador: 'REEM-JO-3012', status: 'Awaiting payment', tone: 'warn' },
  { id: 'SFR-20497', channel: 'wholesale', date: '2026-09-28', buyer: 'Nour Eldin', country: 'Turkey', gross: 1120, segment: 'new', ambassador: '', status: 'Collected', tone: 'ok' },
  { id: 'SFR-20490', channel: 'retail', date: '2026-09-18', buyer: 'Mariam Salem', country: 'UAE', gross: 540, segment: 'repeat', ambassador: '', status: 'Partly refunded', tone: 'warn' },
  { id: 'SFR-20481', channel: 'wholesale', monthsSinceFirstDeal: 0, leader: 'REEM-EG-3012', date: '2026-10-04', buyer: 'Ahmad Alnuaimi', country: 'Jordan', gross: 2312, segment: 'new', ambassador: 'AHMAD-JO-2481', status: 'Collected', tone: 'ok' },
  { id: 'SFR-20462', channel: 'wholesale', monthsSinceFirstDeal: 3, leader: 'REEM-EG-3012', date: '2026-09-27', buyer: 'Ahmad Alnuaimi', country: 'Jordan', gross: 285, segment: 'repeat', ambassador: 'AHMAD-JO-2481', status: 'Collected', tone: 'ok' },
];

export const adminPayouts = [
  { name: 'Reem Alharbi', country: 'Egypt', available: 'SAR 9,920', method: 'Bank transfer', status: 'Awaiting approval', tone: 'warn' },
  { name: 'Ahmad Alnuaimi', country: 'Jordan', available: 'SAR 3,060', method: 'E-wallet', status: 'Approved', tone: 'ok' },
  { name: 'Yousef Kamal', country: 'Turkey', available: 'SAR 2,205', method: 'Shopping credit', status: 'On hold (fraud)', tone: 'danger' },
];

export const adminInvoices = [
  { id: 'INV-5501', party: 'Nusaj Abayas', type: 'Commission invoice', amount: 'SAR 4,104', vat: 'Linked to “Fatoora”', status: 'Issued', tone: 'ok' },
  { id: 'INV-5498', party: 'Silk Market', type: 'Credit note', amount: 'SAR 960', vat: 'Linked to “Fatoora”', status: 'Issued', tone: 'ok' },
  { id: 'INV-5490', party: 'Madinah Dates', type: 'Commission invoice', amount: 'SAR 3,126', vat: 'Awaiting link', status: 'Draft', tone: 'warn' },
];

export const adminCarriers = [
  { name: 'Aramex', service: 'Air + sea', countries: '24 countries', status: 'Active', tone: 'ok', performance: 94 },
  { name: 'DHL', service: 'Air express', countries: '38 countries', status: 'Active', tone: 'ok', performance: 90 },
  { name: 'SMEX', service: 'Economy sea', countries: '12 countries', status: 'Active', tone: 'ok', performance: 82 },
  { name: 'Spl Post', service: 'Registered mail', countries: '4 countries', status: 'Suspended', tone: 'danger', performance: 61 },
];

export const adminWarehouse = [
  { stage: 'Inbound from factories', value: '320 shipments', pct: 80 },
  { stage: 'Awaiting consolidation', value: '128 shipments', pct: 45 },
  { stage: 'Outbound', value: '246 shipments', pct: 62 },
  { stage: 'Occupancy', value: '74% of capacity', pct: 74 },
];

export const adminShipments = [
  { id: 'SHP-7781', tracking: 'SFR-2609-K7P2QF', carrier: 'Aramex', status: 'At destination customs', tone: 'warn', last: 'Dubai — awaiting clearance', delay: '1 day late' },
  { id: 'SHP-7770', tracking: 'SFR-2608-P4L8WD', carrier: 'DHL', status: 'Out for delivery', tone: 'info', last: 'Cairo — with the courier', delay: 'On time' },
  { id: 'SHP-7762', tracking: 'SFR-2608-Q9N1XM', carrier: 'SMEX', status: 'Awaiting waybill', tone: 'warn', last: 'Jeddah warehouse — consolidating', delay: 'On time' },
  { id: 'SHP-7751', tracking: 'SFR-2607-B3M9ZR', carrier: 'DHL', status: 'Delivered', tone: 'ok', last: 'London — delivered', delay: 'On time' },
];

export const adminExportDocs = [
  { name: 'Commercial invoice', type: 'INV-5501', order: 'SFR-20512', status: 'Ready', tone: 'ok' },
  { name: 'Packing list', type: 'PL-7712', order: 'SFR-20512', status: 'Ready', tone: 'ok' },
  { name: 'Certificate of origin', type: 'CO-4410', order: 'SFR-20508', status: 'At the chamber', tone: 'warn' },
  { name: 'Halal certificate', type: 'HL-2201', order: 'SFR-20501', status: 'Required', tone: 'danger' },
];

export const adminClearanceGaps = [
  { tracking: 'SFR-2609-K7P2QF', order: 'SFR-2026-47921', country: 'UAE', hub: 'Jebel Ali Port', incoterm: 'CIF', party: 'Buyer', missing: ['Bill of lading', 'Certificate of origin', 'Export declaration'], ageDays: 6, tone: 'danger' },
  { tracking: 'SFR-2608-P4L8WD', order: 'SFR-2026-41128', country: 'Egypt', hub: 'Alexandria Port', incoterm: 'FOB', party: 'Freight agent', missing: ['Packing list', 'Importer details'], ageDays: 3, tone: 'warn' },
  { tracking: 'SFR-2608-Q9N1XM', order: 'SFR-2026-39907', country: 'Morocco', hub: 'Casablanca Port', incoterm: 'CIF', party: 'Buyer', missing: ['Certificate of origin'], ageDays: 1, tone: 'warn' },
];

export const adminCountryRules = [
  { country: 'Jordan', threshold: 'JOD 150 exempt', restricted: '3 categories', docs: 'Invoice + origin', fee: '10%' },
  { country: 'Egypt', threshold: 'EGP 1,500 exempt', restricted: '5 categories', docs: 'Invoice + halal', fee: '14%' },
  { country: 'UAE', threshold: 'AED 1,000 exempt', restricted: '2 categories', docs: 'Invoice + origin', fee: '5%' },
  { country: 'Turkey', threshold: 'EUR 150 exempt', restricted: '7 categories', docs: 'Invoice + health', fee: '20%' },
];

export const adminVerifications = [
  { entity: 'Al Waha Dates Factory', type: 'KYB — factory', result: 'Conditional accept', sanctions: 'Clean', tone: 'warn' },
  { entity: 'Khaled Alizz', type: 'KYC — ambassador', result: 'Under review', sanctions: 'Watchlist', tone: 'warn' },
  { entity: 'Nukhab Chocolate', type: 'KYB — factory', result: 'Accepted', sanctions: 'Clean', tone: 'ok' },
  { entity: 'Yousef Kamal', type: 'KYC — ambassador', result: 'Rejected', sanctions: 'Name match', tone: 'danger' },
];

export const adminCampaigns = [
  { name: 'Eid campaign', period: '1–20 Oct', countries: 'Jordan · Egypt', factories: 8, performance: '84% of target' },
  { name: 'Eid al-Fitr — dates', period: '1–15 Mar', countries: '4 countries', factories: 6, performance: 'Completed' },
  { name: 'Back-to-school season', period: '20 Aug', countries: 'Jordan', factories: 5, performance: 'Upcoming' },
];

export const adminCoupons = [
  { code: 'EID4', type: '4% off (cap)', limits: 'Up to SAR 500', usage: '320 / 1000', bearer: 'Platform' },
  { code: 'FACTORY50', type: 'Free shipping', limits: 'Above SAR 500', usage: '128 / 500', bearer: 'Factory' },
  { code: 'AMB20', type: 'SAR 20', limits: 'First order', usage: '840 / 999', bearer: 'Factory' },
];

export const adminContentLibrary = [
  { name: 'The dates factory story', lang: 'Urdu', product: 'Madinah Dates', posts: 34, img: 'https://readdy.ai/api/search-image?query=Minimal%20editorial%20still%20of%20Saudi%20date%20factory%20interior%20with%20warm%20light%20and%20kraft%20boxes%2C%20clean%20beige%20tones%2C%20high%20detail&width=800&height=600&seq=sta-adm-content-dates-01&orientation=landscape' },
  { name: 'Sale-season abaya photos', lang: 'English', product: 'Nusaj Abayas', posts: 21, img: 'https://readdy.ai/api/search-image?query=Minimal%20editorial%20still%20of%20folded%20abayas%20on%20a%20neutral%20surface%20with%20soft%20light%2C%20clean%20beige%20tones%2C%20high%20detail&width=800&height=600&seq=sta-adm-content-abaya-02&orientation=landscape' },
  { name: 'Second-bag campaign banner', lang: 'Arabic', product: 'General', posts: 48, img: 'https://readdy.ai/api/search-image?query=Minimal%20editorial%20banner%20scene%20of%20a%20kraft%20suitcase%20and%20shipping%20box%20in%20a%20light%20airport%20corridor%2C%20neutral%20beige%20tones%2C%20warm%20light%2C%20high%20detail&width=800&height=600&seq=sta-adm-content-bag-03&orientation=landscape' },
];

export const adminNotifications = [
  { event: 'Order confirmation', channels: 'Email · WhatsApp', langs: '6 languages', status: 'Active', tone: 'ok' },
  { event: 'Order shipping', channels: 'Email · WhatsApp · SMS', langs: '6 languages', status: 'Active', tone: 'ok' },
  { event: 'Factory settlement', channels: 'Email', langs: '2 languages', status: 'Draft', tone: 'warn' },
  { event: 'Balance refund', channels: 'Email · WhatsApp', langs: '4 languages', status: 'Active', tone: 'ok' },
];

export const adminTranslations = [
  { lang: 'Arabic', pct: 100 },
  { lang: 'English', pct: 96 },
  { lang: 'Urdu', pct: 74 },
  { lang: 'Indonesian', pct: 58 },
  { lang: 'Turkish', pct: 41 },
];

export const adminTickets = [
  { party: 'Ahmad Alnuaimi', lang: 'Arabic', priority: 'High', priorityTone: 'danger', agent: 'Sarah Alotaibi', deadline: '4 hours', status: 'Open', tone: 'warn' },
  { party: 'Muwaffar factory', lang: 'English', priority: 'Medium', priorityTone: 'warn', agent: '—', deadline: '24 hours', status: 'Awaiting assignment', tone: 'danger' },
  { party: 'Al Yasmin Store', lang: 'Arabic', priority: 'Low', priorityTone: 'mute', agent: 'Yousef K.', deadline: '48 hours', status: 'In progress', tone: 'info' },
  { party: 'Umm Ahmad', lang: 'Urdu', priority: 'Medium', priorityTone: 'warn', agent: 'Reem H.', deadline: '24 hours', status: 'Resolved', tone: 'ok' },
];

export const adminStaff = [
  { name: 'Sarah Alotaibi', role: 'Operations manager', scope: 'All permissions', twofa: true },
  { name: 'Yousef Kamal', role: 'Orders officer', scope: 'Orders · Shipping', twofa: true },
  { name: 'Reem Alharbi', role: 'Ambassadors officer', scope: 'Ambassadors · Marketing', twofa: false },
  { name: 'Khaled Alomari', role: 'Accountant', scope: 'Finance (read)', twofa: true },
];

export const adminAudit = [
  { who: 'Sarah Alotaibi', what: 'Factory approval · Al Waha Dates Factory', cat: 'factory', device: 'MacBook · Riyadh', before: 'Under review', after: 'Approved', daysAgo: 0, hour: 11, minute: 4 },
  { who: 'Yousef Kamal', what: 'Shipment pickup scheduled · SFR-2608-P4L8WD', cat: 'shipment', device: 'Windows · Jeddah', before: 'Awaiting waybill', after: 'Pickup scheduled', daysAgo: 0, hour: 9, minute: 40 },
  { who: 'Reem Alharbi', what: 'Product approval · Embroidered summer abaya', cat: 'product', device: 'iPhone · Cairo', before: 'Under review', after: 'Approved', daysAgo: 0, hour: 8, minute: 12 },
  { who: 'Sarah Alotaibi', what: 'Return dispute arbitration · RET-118', cat: 'return', device: 'MacBook · Riyadh', before: 'Pending', after: 'Full refund (arbitration)', daysAgo: 1, hour: 18, minute: 22 },
  { who: 'Khaled Alomari', what: 'Shipment delivery confirmed · SFR-2607-B3M9ZR', cat: 'shipment', device: 'Windows · Riyadh', before: 'Out for delivery', after: 'Delivered', daysAgo: 1, hour: 15, minute: 5 },
  { who: 'Yousef Kamal', what: 'Product approval · Premium Ajwa dates', cat: 'product', device: 'Windows · Jeddah', before: 'Under review', after: 'Approved', daysAgo: 3, hour: 13, minute: 30 },
  { who: 'Reem Alharbi', what: 'Factory rejection · Najd Industries', cat: 'factory', device: 'iPhone · Cairo', before: 'Under review', after: 'Rejected', daysAgo: 6, hour: 10, minute: 45 },
  { who: 'Sarah Alotaibi', what: 'Refund execution · RET-113', cat: 'return', device: 'MacBook · Riyadh', before: 'Full refund', after: 'Refunded', daysAgo: 12, hour: 16, minute: 20 },
  { who: 'Yousef Kamal', what: 'Factory approval · Nukhab Chocolate', cat: 'factory', device: 'Windows · Jeddah', before: 'Under review', after: 'Approved', daysAgo: 40, hour: 9, minute: 0 },
];

/* Platform settings shown in the support screen now come from PlatformConfig (AdminSupport). */

export const adminLabels = {
  meta: { eyebrow: 'Administration', title: 'Operations room' },
  common: {
    approve: 'Approve', reject: 'Reject', review: 'Review', details: 'Details',
    exportExcel: 'Export Excel', exportPdf: 'Export PDF',
    filter: 'Filter', search: 'Search', assign: 'Assign an officer', resolve: 'Resolve',
    close: 'Close', edit: 'Edit', create: 'Create', pause: 'Pause',
    view: 'View', addRule: 'Add rule', simulate: 'Simulate price',
    promote: 'Promote', demote: 'Demote', suspend: 'Suspend', message: 'Message',
    requestDocs: 'Request documents', schedule: 'Schedule', upload: 'Upload', send: 'Send',
    target: 'Destination', period: 'Period', country: 'Country', status: 'Status',
    actions: 'Actions', value: 'Value', date: 'Date', name: 'Name',
    factory: 'Factory', buyer: 'Buyer', order: 'Order', amount: 'Amount',
    commission: 'Commission', net: 'Net', payment: 'Payment', shipping: 'Shipping',
    ambassador: 'Ambassador', deadline: 'Deadline', priority: 'Priority', agent: 'Officer',
    role: 'Role', scope: 'Permissions', twofa: 'Two-factor', device: 'Device',
    before: 'Before', after: 'After', when: 'When', who: 'Actor', arbitrate: 'Arbitrate',
    refund: 'Refund', reproportion: 'Re-credit an ambassador', intervene: 'Intervene as broker',
    targetFactories: 'Route to more factories', category: 'Category', plan: 'Plan',
    products: 'Products', sales: 'Sales', rating: 'Rating', onTime: 'On-time shipping',
    returnsCol: 'Returns', price: 'Price', stock: 'Stock', translation: 'Translation',
    level: 'Level', source: 'Source', clicks: 'Clicks', orders: 'Orders',
    gateway: 'Gateway', currency: 'Currency', rate: 'FX rate', fee: 'Fee',
    method: 'Method', available: 'Withdrawable balance', service: 'Service',
    countries: 'Countries served', performance: 'Performance', carrier: 'Carrier', last: 'Last event',
    delay: 'Delay', type: 'Type', threshold: 'Exempt threshold', restricted: 'Restricted',
    docs: 'Required documents', result: 'Result', sanctions: 'Sanctions lists',
    code: 'Code', limits: 'Limits', usage: 'Usage', bearer: 'Discount bearer',
    lang: 'Language', completion: 'Completion', event: 'Event', channels: 'Channels',
    party: 'Party', result2: 'Status',
  },
  ops: {
    factoryApproved: 'Factory approved — its account is activated and notified.',
    factoryRejected: 'Request rejected and the factory was told which documents to resubmit.',
    productApproved: 'Product approved and published to the catalogue.',
    productRejected: 'Product rejected and sent back to the factory for edits.',
    productEdit: 'The product was opened for editing.',
    returnArbitrated: 'Arbitration accepted a full refund for the buyer.',
    returnRefunded: 'Refund executed and the buyer was notified.',
    shipmentScheduled: 'Pickup scheduled with the carrier.',
    shipmentDelivered: 'Delivery confirmed and the shipment status updated.',
    docsRequested: 'The document-request template was downloaded.',
    statusApproved: 'Approved',
    statusRejected: 'Rejected',
    statusArbitrated: 'Full refund (arbitration)',
    statusRefunded: 'Refunded',
    statusScheduled: 'Pickup scheduled',
    statusDelivered: 'Delivered',
    lastScheduled: 'Pickup scheduled with the carrier',
    lastDelivered: 'Delivered — signed by the recipient',
    onTime: 'On time',
  },
  audit: {
    factoryApprove: 'Factory approval',
    factoryReject: 'Factory rejection',
    productApprove: 'Product approval',
    productReject: 'Product rejection',
    returnArbitrate: 'Return dispute arbitration',
    returnRefund: 'Refund execution',
    shipmentSchedule: 'Shipment pickup scheduled',
    shipmentDeliver: 'Shipment delivery confirmed',
    export: 'Export log',
    empty: 'No actions recorded yet — every approval or arbitration will appear here instantly with its time and device.',
    searchPlaceholder: 'Search by actor, action or device…',
    allActors: 'All staff',
    allTypes: 'All actions',
    allDates: 'All time',
    today: 'Today',
    d7: 'Last 7 days',
    d30: 'Last 30 days',
    catFactory: 'Factories',
    catProduct: 'Products',
    catReturn: 'Returns',
    catShipment: 'Shipments',
    catOther: 'Other',
    results: 'results',
    clear: 'Clear filters',
    noResults: 'No rows match the current filter.',
    report: 'Monthly audit report',
    reportSub: 'Approvals and arbitrations per staff member, for the month',
    thEmployee: 'Staff member',
    thFactory: 'Factory approvals',
    thProduct: 'Product approvals',
    thReturns: 'Arbitrations / refunds',
    thShipments: 'Shipments',
    thTotal: 'Total',
    reportExport: 'Export report',
    reportEmpty: 'No actions recorded in this month.',
    reportNote: 'The report is summed from the live audit log by staff member and month.',
  },
  home: {
    sub: 'Every order, every riyal, every commission and every shipment passes through this board and is written to an audit log.',
    alerts: 'Urgent alerts', alertsSub: 'Late orders, failed payments, fraud suspicion, expiring documents',
    sales: 'Sales by country', salesSub: 'Revenue split this month',
    topFactories: 'Top-performing factories', topFactoriesSub: 'By sales and export-readiness score',
    ready: 'Readiness score', period: 'Last 30 days', salesShare: 'of revenue',
  },
  factories: {
    sub: 'Review join requests and track the plan, status and performance of every factory.',
    pending: 'Join requests', pendingSub: 'Awaiting review and verification',
    list: 'Factory list', listSub: 'factories on the platform',
    thFacility: 'Facility', thCr: 'Commercial registration', thCity: 'City',
  },
  products: {
    sub: 'Approve products, manage categories and attributes, restricted-product rules and reviews.',
    reviewTitle: 'Awaiting approval', reviewSub: 'Products submitted by factories',
    allTitle: 'All products', allSub: 'Status, price, stock, sales and translation',
    thProduct: 'Product', thHs: 'HS code', thAllowed: 'Allowed countries',
  },
  orders: {
    sub: 'Follow every order platform-wide: retail, price quotes, wholesale deals and returns.',
    retail: 'Retail orders', retailSub: 'Latest orders on the platform',
    rfq: 'Price-quote requests', rfqSub: 'Awaiting routing to factories',
    wholesale: 'Wholesale deals', wholesaleSub: 'In production and shipping',
    returnsTitle: 'Returns & disputes', returnsSub: 'Arbitration and decision',
    thQty: 'Quantity', thDelivery: 'Delivery term', thOffers: 'Offers', thStage: 'Stage',
    thReason: 'Reason', thDecision: 'Decision',
  },
  returnsLog: {
    sub: 'Every return from request to arrival: the decision, the receipt and the credit-note value.',
    title: 'Returns register',
    statTotal: 'Total returns', statPending: 'Awaiting decision', statAccepted: 'Accepted / received', statCredit: 'Credit-note value',
    filterAll: 'All statuses',
    statusPending: 'Awaiting decision', statusAccepted: 'Accepted', statusRejected: 'Rejected', statusReceived: 'Received',
    thCase: 'Return', thOrder: 'Order', thBuyer: 'Buyer', thItem: 'Item', thReason: 'Reason',
    thAmount: 'Credit value', thCredit: 'Credit note', thRequested: 'Requested', thStatus: 'Status',
    accept: 'Accept', reject: 'Reject', markReceived: 'Confirm receipt',
    acceptDone: 'Return {{id}} accepted and its credit note issued.',
    rejectDone: 'Return {{id}} rejected and the buyer was told why.',
    receivedDone: 'Return {{id}} was booked in at the Jeddah warehouse.',
    receivedAt: 'Received {{date}}',
    empty: 'No returns match the current filter.',
    exportDone: 'The returns register was exported to your device.',
    hint: 'The value shown is the total credit note after the 5% restocking fee is deducted.',
    reasonDamaged: 'Damaged item', reasonSize: 'Wrong size', reasonNotAsDescribed: 'Not as described', reasonOther: 'Other reason',
    reasonsTitle: 'Top return reasons',
    reasonsSub: 'Reasons ranked by number of returns and credit value, highest first',
    reasonTop: 'Top reason: {{reason}} — {{count}} of {{total}} returns ({{pct}}%)',
    reasonsNote: 'The breakdown is computed from every return in the register and ignores the status filter above. The third figure next to each reason is the total value of its credit notes.',
  },
  ambassadors: {
    sub: 'Each ambassador’s performance, level, recruitment source, commissions and verification status.',
  },
  finance: {
    sub: 'Incoming payments, the ledger, factory settlements, ambassador payout runs and invoices.',
    payments: 'Incoming payments', paymentsSub: 'Reconcile transactions and fees',
    settlements: 'Factory settlements', settlementsSub: 'Monthly settlement cycle',
    payouts: 'Ambassador payouts', payoutsSub: 'Batch payouts awaiting approval',
    invoices: 'Invoices & tax', invoicesSub: 'Linked with the “Fatoora” platform',
    thInvoice: 'Invoice', thVat: 'Tax',
    ledger: 'Order economics & platform net',
    ledgerSub: 'Take rate retail {{retail}}, wholesale {{wholesale}} · ambassador commission by tier ({{tiers}}) on a new customer’s first order, wholesale {{ambW}} recurring for {{months}} months · discounts, capped at {{cap}}, come out of platform net',
    thGross: 'Order value', thSegment: 'Customer type', thTakeRate: 'Take rate', thTake: 'Platform take',
    thAmb: 'Ambassador', thFee: 'Payment fee', thReserve: 'Return reserve',
    thDiscount: 'Discount', thLeader: 'Leader bonus', thChannel: 'Channel', channelRetail: 'Retail', channelWholesale: 'Wholesale',
    belowFloor: 'Below margin floor', belowFloorCount: '{{count}} orders below the margin floor', closeServer: 'Close period on server', closedServer: 'The close was recorded on the server', closeLocalOnly: 'No server connection — the document is for review only and is not valid proof of a close.',
    thNet: 'Platform net', thMargin: 'Net margin',
    newCustomer: 'New customer', repeatCustomer: 'Repeat customer',
    noAmb: 'No ambassador', total: 'Total', ordersCount: 'orders',
    statGmv: 'Total order value', statTake: 'Platform take', statAmb: 'Ambassador commission', statNet: 'Platform net',
    thDate: 'Date',
    periodMonth: 'This month', period30: 'Last 30 days', period90: 'Last 90 days', periodAll: 'All periods',
    periodLabel: 'Settlement period', periodRange: '{{from}} → {{to}}', periodAllRange: 'Every recorded period',
    closed: 'Closed cycle', closing: 'Open cycle',
    exportExcel: 'Export Excel', exported: 'The settlement ledger was downloaded to your device.',
    exportEmpty: 'No orders in this period to export.',
    exportLedger: 'Settlement ledger', exportSummary: 'Period summary',
    exportNote: 'A full month-end export: every order with its rate, platform take, ambassador commission and platform net.',
    periodShort: '{{count}} orders in the selected period',
    exportPdf: 'Export signed PDF', exportedPdf: 'The signed month-close summary was downloaded as a PDF.',
    exportPdfFail: 'The PDF could not be created — try printing instead.', pdfGenerating: 'Preparing the document…',
    pdfTitle: 'Month-close summary — settlement ledger', pdfSub: 'An official archive document generated automatically from the settlement ledger',
    pdfRef: 'Document reference', pdfGenerated: 'Issued at', pdfPeriod: 'Settlement period',
    pdfOrders: 'Orders', pdfCycle: 'Cycle status', pdfTotals: 'Period totals',
    pdfSignature: 'Finance approval', pdfSignedBy: 'Finance manager', pdfSignLine: 'Signature',
    pdfSignatureNote: 'This document comes from the settlement ledger. Its fingerprint is computed on the server and stored in the append-only close log, chained to the previous close. Verify it by matching the close log — not by recomputing it.',
    pdfHash: 'Verification fingerprint', pdfAuditNote: 'The archive copy is filed with the month-close documents and cannot be edited after approval.',
    formula: 'Sustainability rule: platform net = take − discount (cap {{cap}}) − ambassador commission − leader bonus ({{leader}}) − payment fee − return reserve. Worst case retail: {{worstRetail}} · wholesale: {{worstWholesale}}. Any row below the floor is flagged red.',
    compareTitle: 'Month-on-month summary',
    compareSub: 'This month against last month, on the same settlement ledger',
    compareCurrent: 'This month', comparePrev: 'Last month',
    compareGross: 'Order value', compareTake: 'Platform take', compareNet: 'Platform net', compareOrders: 'Orders',
    compareNoPrev: 'No data for last month',
    compareUp: 'Up', compareDown: 'Down',
  },
  logistics: {
    sub: 'Carriers, pricing rules, the Jeddah warehouse, every shipment and international returns.',
    carriers: 'Carriers', carriersSub: 'Link status and performance',
    warehouse: 'Jeddah warehouse', warehouseSub: 'Inbound, awaiting, outbound and occupancy',
    shipments: 'All shipments', shipmentsSub: 'Tracking number, unified status and delay',
    pricing: 'Pricing rules', pricingSub: 'By weight, country and platform margin',
    thTracking: 'Tracking number', thCompany: 'Company',
    schedulePickup: 'Schedule pickup', confirmDelivery: 'Confirm delivery',
  },
  compliance: {
    sub: 'Export documents, country rules, and factory (KYB) and ambassador (KYC) identity checks.',
    docsTitle: 'Export documents', docsSub: 'Auto-generate, upload and send',
    rules: 'Country rules', rulesSub: 'Exemption, restricted items and fees',
    verify: 'Identity verification', verifySub: 'KYB for factories, KYC for ambassadors and sanctions lists',
    thEntity: 'Entity', thDocs: 'Documents',
    gapsTitle: 'Shipments missing clearance documents',
    gapsSub: 'CIF / FOB shipments that left Jeddah without a complete destination clearance file.',
    gapsAlert: '{{count}} shipment(s) need the desk — alert the export office before they are held at customs.',
    gapsClear: 'Every open shipment has a complete clearance file — nothing needs attention.',
    thTrackingOrder: 'Shipment & order', thMissing: 'Missing documents', thParty: 'Cleared by', thAge: 'Waiting',
    notifyDesk: 'Alert the desk', notifiedBtn: 'Desk alerted', pending: 'Pending',
    notifyDone: 'An alert about {{tracking}} was sent to the export office.',
    missingCount: '{{count}} documents', daysLate: '{{count}} days',
    alertTitle: 'Urgent alert for the export office',
  },
  marketing: {
    sub: 'Campaigns, coupons, the ambassador content library, storefront management, notifications and translation.',
    campaigns: 'Campaigns', campaignsSub: 'Period, countries, participating factories and performance',
    coupons: 'Coupons', couponsSub: 'Type, limits and who bears the discount',
    content: 'Ambassador content library', contentSub: 'Assets, language, product and share count',
    notifications: 'Notifications', notificationsSub: 'Email and message templates per event and language',
    translations: 'Translation', translationsSub: 'Completion per language',
    thPerformance: 'Performance', thPages: 'Shares',
  },
  support: {
    sub: 'Support tickets, users and permissions, the audit log and general settings.',
    tickets: 'Support tickets', ticketsSub: 'Priority, officer, deadline and status',
    staff: 'Users & permissions', staffSub: 'Staff, roles and two-factor',
    audit: 'Audit log', auditSub: 'Who did what, when and from which device',
    settings: 'General settings', settingsSub: 'Currencies, countries, languages, rates and return window',
    auditNote: 'The audit log is search and export only — no delete and no edit.',
  },
  accounts: {
    title: 'Registered accounts',
    sub: 'Every account created through the sign-up screens: its full dossier, verification state and approval decision.',
    statTotal: 'Total accounts',
    statPending: 'Awaiting review',
    statVerified: 'Verified',
    statFactories: 'Factory accounts',
    filterAll: 'All',
    searchPh: 'Search by name, email, business or CR number…',
    thAccount: 'Account',
    thPanel: 'Panel',
    thEntity: 'Business',
    thLocation: 'Location',
    thVerification: 'Verification',
    thJoined: 'Joined',
    thMethod: 'Verification route',
    statusPending: 'In review',
    statusVerified: 'Verified',
    statusRejected: 'Rejected',
    statusUnverified: 'Unverified',
    approve: 'Approve',
    reject: 'Reject',
    approveDone: '{{name}} is approved and the account is active.',
    rejectDone: 'Verification for {{name}} was rejected and they were emailed.',
    saveError: 'Could not save the decision — please try again.',
    loading: 'Loading accounts…',
    loadError: 'Could not load accounts from the server.',
    retry: 'Try again',
    refresh: 'Refresh',
    empty: 'No accounts match the current filter.',
    emptyHint: 'Every new sign-up shows up here immediately.',
    hint: 'These rows come straight from sign-up — the decision here only sets the verification state and never deletes data.',
    demoNote: 'Demo mode — the table shows sample accounts. Sign in with an admin account to see real registrations.',
    methods: {
      nafath: 'Nafath',
      cr: 'Commercial registration',
      manual: 'Manual review',
      none: '—',
    },
  },
};