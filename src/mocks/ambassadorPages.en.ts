/* English mirror of src/mocks/ambassadorPages.ts — identical shape, translated
   text. Structural values are kept aligned so both are interchangeable. */

export const ambRegistry = [
  { slug: 'ahmad-jo-2481', name: 'Ahmad Alnuaimi', initials: 'A.N', country: 'Jordan', level: 'Certified ambassador', code: 'AHMAD-JO-2481' },
  { slug: 'reem-eg-3012', name: 'Reem Alharbi', initials: 'R.H', country: 'Egypt', level: 'Lead ambassador', code: 'REEM-EG-3012' },
  { slug: 'khaled-jo-1190', name: 'Khaled Alizz', initials: 'K.A', country: 'Jordan', level: 'Ambassador', code: 'KHALED-JO-1190' },
  { slug: 'yousef-tr-2044', name: 'Yousef Kamal', initials: 'Y.K', country: 'Turkey', level: 'Certified ambassador', code: 'YOUSEF-TR-2044' },
];

export const ambPageStats = [
  { icon: 'ri-window-2-line', num: '2', lbl: 'Published pages' },
  { icon: 'ri-cursor-line', num: '4,385', lbl: 'Page clicks' },
  { icon: 'ri-shopping-bag-3-line', num: '29', lbl: 'Attributed orders' },
  { icon: 'ri-money-dollar-circle-line', num: 'SAR 4,025', lbl: 'Page commissions' },
];

export const ambFactoryPages = [
  {
    id: 'PG-1001', factoryId: 'hasa', factory: 'Al-Ahsa Dates Factory', city: 'Al-Ahsa',
    status: 'published', statusLabel: 'Published', tone: 'ok', commission: '7%',
    code: 'AHMAD-TAMR4', link: 'safeer.sa/f/ahmad-jo-2481/hasa', clicks: '3,120', baseClicks: 3120,
    orders: 21, sales: 'SAR 48,300', earned: 'SAR 3,381', variant: 'full', since: 'October 1, 2026',
  },
  {
    id: 'PG-1002', factoryId: 'oud', factory: 'Riyadh Oud House', city: 'Riyadh',
    status: 'published', statusLabel: 'Published', tone: 'ok', commission: '7%',
    code: 'AHMAD-OUD4', link: 'safeer.sa/f/ahmad-jo-2481/oud', clicks: '1,265', baseClicks: 1265,
    orders: 8, sales: 'SAR 9,200', earned: 'SAR 644', variant: 'short', since: 'September 18, 2026',
  },
  {
    id: 'PG-1003', factoryId: 'fifa', factory: 'Fifa Coffee Farms', city: 'Jazan',
    status: 'pending', statusLabel: 'Awaiting factory approval', tone: 'warn', commission: '—',
    code: '—', link: '—', clicks: '—', baseClicks: 0, orders: 0, sales: '—', earned: '—', variant: 'full', since: 'October 6, 2026',
  },
  {
    id: 'PG-1004', factoryId: 'taif', factory: 'Taif Rose Works', city: 'Taif',
    status: 'rejected', statusLabel: 'Rejected', tone: 'danger', commission: '—',
    code: '—', link: '—', clicks: '—', baseClicks: 0, orders: 0, sales: '—', earned: '—', variant: 'full', since: 'October 2, 2026',
  },
];

export const ambPageRules = [
  { icon: 'ri-link', t: 'A unique link per factory', s: 'Every factory gets its own link that carries your code automatically.' },
  { icon: 'ri-coupon-3-line', t: 'A discount code at checkout', s: 'The code beats the link when entered at checkout — so your share is always kept.' },
  { icon: 'ri-time-line', t: 'A 30-day attribution window', s: 'The last click on your link is credited to you for 30 days.' },
  { icon: 'ri-shield-check-line', t: 'Commission locks after delivery and returns', s: 'Commission becomes withdrawable once delivery is confirmed in the destination country and its return window has closed — not a fixed number of days from the order.' },
];

export const factoryAmbRequests = [
  {
    id: 'RQ-2201', ambassador: 'Ahmad Alnuaimi', initials: 'A.N', country: 'Jordan', level: 'Certified ambassador',
    requested: '7%', date: '2 hours ago', note: 'My Jordan audience loves premium dates.',
  },
  {
    id: 'RQ-2198', ambassador: 'Reem Alharbi', initials: 'R.H', country: 'Egypt', level: 'Lead ambassador',
    requested: '8%', date: 'Yesterday', note: 'I’d like a marketing page for your factory for my Egypt followers.',
  },
  {
    id: 'RQ-2190', ambassador: 'Khaled Alizz', initials: 'K.A', country: 'Jordan', level: 'Ambassador',
    requested: '5%', date: '3 days ago', note: 'Just starting with you and want to try the page.',
  },
];

export const factoryAmbPages = [
  { id: 'PG-1001', ambassador: 'Ahmad Alnuaimi', country: 'Jordan', code: 'AHMAD-TAMR4', ambSlug: 'ahmad-jo-2481', factoryId: 'hasa', commission: '7%', clicks: '3,120', baseClicks: 3120, orders: 21, sales: 'SAR 48,300', owed: 'SAR 3,381', status: 'Active', tone: 'ok' },
  { id: 'PG-1010', ambassador: 'Reem Alharbi', country: 'Egypt', code: 'REEM-TAMR4', ambSlug: 'reem-eg-3012', factoryId: 'hasa', commission: '8%', clicks: '5,400', baseClicks: 5400, orders: 34, sales: 'SAR 78,600', owed: 'SAR 6,288', status: 'Active', tone: 'ok' },
  { id: 'PG-1020', ambassador: 'Yousef Kamal', country: 'Turkey', code: 'YOUSEF-TAMR4', ambSlug: 'yousef-tr-2044', factoryId: 'hasa', commission: '7%', clicks: '980', baseClicks: 980, orders: 6, sales: 'SAR 12,100', owed: 'SAR 847', status: 'Suspended', tone: 'danger' },
];

export const factoryAmbConfig = {
  factoryId: 'hasa',
  defaultCommission: '7%',
  minCommission: '5%',
  maxCommission: '8%',
  codePrefix: 'TAMR',
  windowDays: '30 days',
  returnWindow: 'Per destination, after confirmed delivery',
  autoApprove: false,
};

export const adminAmbPages = [
  { id: 'PG-1001', ambassador: 'Ahmad Alnuaimi', country: 'Jordan', factory: 'Al-Ahsa Dates Factory', code: 'AHMAD-TAMR4', ambSlug: 'ahmad-jo-2481', factoryId: 'hasa', baseClicks: 3120, commission: '7%', clicks: '3,120', orders: 21, sales: 'SAR 48,300', commissionValue: 'SAR 3,381', status: 'Published', tone: 'ok' },
  { id: 'PG-1002', ambassador: 'Ahmad Alnuaimi', country: 'Jordan', factory: 'Riyadh Oud House', code: 'AHMAD-OUD4', ambSlug: 'ahmad-jo-2481', factoryId: 'oud', baseClicks: 1265, commission: '7%', clicks: '1,265', orders: 8, sales: 'SAR 9,200', commissionValue: 'SAR 644', status: 'Published', tone: 'ok' },
  { id: 'PG-1010', ambassador: 'Reem Alharbi', country: 'Egypt', factory: 'Al-Ahsa Dates Factory', code: 'REEM-TAMR4', ambSlug: 'reem-eg-3012', factoryId: 'hasa', baseClicks: 5400, commission: '8%', clicks: '5,400', orders: 34, sales: 'SAR 78,600', commissionValue: 'SAR 6,288', status: 'Published', tone: 'ok' },
  { id: 'PG-1015', ambassador: 'Khaled Alizz', country: 'Jordan', factory: 'Fifa Coffee Farms', code: 'KHALED-COF4', ambSlug: 'khaled-jo-1190', factoryId: 'fifa', baseClicks: 640, commission: '6%', clicks: '640', orders: 3, sales: 'SAR 4,800', commissionValue: 'SAR 288', status: 'Under review', tone: 'warn' },
  { id: 'PG-1020', ambassador: 'Yousef Kamal', country: 'Turkey', factory: 'Al-Ahsa Dates Factory', code: 'YOUSEF-TAMR4', ambSlug: 'yousef-tr-2044', factoryId: 'hasa', baseClicks: 980, commission: '7%', clicks: '980', orders: 6, sales: 'SAR 12,100', commissionValue: 'SAR 847', status: 'Suspended', tone: 'danger' },
  { id: 'PG-1025', ambassador: 'Reem Alharbi', country: 'Egypt', factory: 'Taif Rose Works', code: 'REEM-ROSE4', ambSlug: 'reem-eg-3012', factoryId: 'taif', baseClicks: 2100, commission: '7%', clicks: '2,100', orders: 13, sales: 'SAR 26,400', commissionValue: 'SAR 1,848', status: 'Published', tone: 'ok' },
];

export const adminAmbDisputes = [
  { id: 'DSP-77', ambassador: 'Khaled Alizz', factory: 'Fifa Coffee Farms', reason: 'Order attribution disputed', amount: 'SAR 267', age: '2 days', status: 'Open', tone: 'warn' },
  { id: 'DSP-74', ambassador: 'Yousef Kamal', factory: 'Al-Ahsa Dates Factory', reason: 'Suspected self-purchase', amount: 'SAR 1,240', age: '5 days', status: 'Under review', tone: 'danger' },
  { id: 'DSP-70', ambassador: 'Reem Alharbi', factory: 'Al-Ahsa Dates Factory', reason: 'Return after attribution', amount: 'SAR 380', age: 'Closed', status: 'Resolved', tone: 'ok' },
];

export const ambPageAttribution = [
  { id: 'SUB-20481', date: 'October 6, 2026', page: 'Al-Ahsa dates page', source: 'Discount code', code: 'AHMAD-TAMR4', country: 'Jordan', value: 'SAR 380', commission: 'SAR 26.6', status: 'Pending', tone: 'warn' },
  { id: 'SUB-20476', date: 'October 3, 2026', page: 'Riyadh oud page', source: 'Link', code: '—', country: 'Jordan', value: 'SAR 520', commission: 'SAR 36.4', status: 'Pending', tone: 'warn' },
  { id: 'SUB-20455', date: 'September 28, 2026', page: 'Al-Ahsa dates page', source: 'Discount code', code: 'AHMAD-TAMR4', country: 'Egypt', value: 'SAR 740', commission: 'SAR 51.8', status: 'Withdrawable', tone: 'ok' },
  { id: 'SUB-20430', date: 'September 18, 2026', page: 'Taif rose page', source: 'Link', code: '—', country: 'Turkey', value: 'SAR 490', commission: 'SAR 34.3', status: 'Paid', tone: 'info' },
];