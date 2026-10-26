/* Leader ambassador ("السفير القائد") — typically an Umrah / Hajj agent who
   recruits the pilgrims of their own groups as ambassadors. One level only:
   the leader earns an override on the direct team, never on the team's team.
   Numbers are raw (SAR, counts) so the view formats them and computes the
   tier and the leader bonus from the active PlatformConfig. */

export interface LeaderMember {
  id: string;
  name: string;
  initials: string;
  country: string;
  group: string;
  joined: string;
  clicks: number;
  deliveredOrders: number;
  sales: number;
  commission: number;
  active: boolean;
}

export const leaderProfile = {
  name: 'ريم الحربي',
  agency: 'حملة الفرقان للعمرة — القاهرة',
  code: 'REEM-EG-3012',
  since: 'مارس ٢٠٢٦',
};

export const leaderGroups = [
  { id: 'G-1112', name: 'رحلة ١٢ نوفمبر — ٤٥ معتمرًا', departure: '2026-11-12', pilgrims: 45 },
  { id: 'G-1203', name: 'رحلة ٣ ديسمبر — ٦٠ معتمرًا', departure: '2026-12-03', pilgrims: 60 },
  { id: 'G-0115', name: 'رحلة رجب — ٨٠ معتمرًا', departure: '2027-01-15', pilgrims: 80 },
];

export const leaderTeam: LeaderMember[] = [
  { id: 'M-01', name: 'محمود سعيد', initials: 'م.س', country: 'مصر', group: 'رحلة ١٢ أكتوبر', joined: '2026-10-14', clicks: 1840, deliveredOrders: 22, sales: 18400, commission: 1288, active: true },
  { id: 'M-02', name: 'فاطمة علي', initials: 'ف.ع', country: 'مصر', group: 'رحلة ١٢ أكتوبر', joined: '2026-10-14', clicks: 960, deliveredOrders: 9, sales: 6120, commission: 306, active: true },
  { id: 'M-03', name: 'أحمد عبد الرحمن', initials: 'أ.ع', country: 'مصر', group: 'رحلة سبتمبر', joined: '2026-09-21', clicks: 3120, deliveredOrders: 54, sales: 41250, commission: 3300, active: true },
  { id: 'M-04', name: 'سارة يوسف', initials: 'س.ي', country: 'الأردن', group: 'رحلة سبتمبر', joined: '2026-09-21', clicks: 410, deliveredOrders: 3, sales: 1890, commission: 95, active: true },
  { id: 'M-05', name: 'خالد منصور', initials: 'خ.م', country: 'مصر', group: 'رحلة أغسطس', joined: '2026-08-30', clicks: 120, deliveredOrders: 0, sales: 0, commission: 0, active: false },
  { id: 'M-06', name: 'هدى إبراهيم', initials: 'ه.إ', country: 'مصر', group: 'رحلة أغسطس', joined: '2026-08-30', clicks: 2210, deliveredOrders: 15, sales: 12900, commission: 903, active: true },
];
