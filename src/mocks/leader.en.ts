import type { LeaderMember } from './leader';

export const leaderProfile = {
  name: 'Reem Al-Harbi',
  agency: 'Al-Furqan Umrah Group — Cairo',
  code: 'REEM-EG-3012',
  since: 'March 2026',
};

export const leaderGroups = [
  { id: 'G-1112', name: '12 November trip — 45 pilgrims', departure: '2026-11-12', pilgrims: 45 },
  { id: 'G-1203', name: '3 December trip — 60 pilgrims', departure: '2026-12-03', pilgrims: 60 },
  { id: 'G-0115', name: 'Rajab trip — 80 pilgrims', departure: '2027-01-15', pilgrims: 80 },
];

export const leaderTeam: LeaderMember[] = [
  { id: 'M-01', name: 'Mahmoud Saeed', initials: 'M.S', country: 'Egypt', group: '12 October trip', joined: '2026-10-14', clicks: 1840, deliveredOrders: 22, sales: 18400, commission: 1288, active: true },
  { id: 'M-02', name: 'Fatma Ali', initials: 'F.A', country: 'Egypt', group: '12 October trip', joined: '2026-10-14', clicks: 960, deliveredOrders: 9, sales: 6120, commission: 306, active: true },
  { id: 'M-03', name: 'Ahmed Abdelrahman', initials: 'A.A', country: 'Egypt', group: 'September trip', joined: '2026-09-21', clicks: 3120, deliveredOrders: 54, sales: 41250, commission: 3300, active: true },
  { id: 'M-04', name: 'Sara Youssef', initials: 'S.Y', country: 'Jordan', group: 'September trip', joined: '2026-09-21', clicks: 410, deliveredOrders: 3, sales: 1890, commission: 95, active: true },
  { id: 'M-05', name: 'Khaled Mansour', initials: 'K.M', country: 'Egypt', group: 'August trip', joined: '2026-08-30', clicks: 120, deliveredOrders: 0, sales: 0, commission: 0, active: false },
  { id: 'M-06', name: 'Hoda Ibrahim', initials: 'H.I', country: 'Egypt', group: 'August trip', joined: '2026-08-30', clicks: 2210, deliveredOrders: 15, sales: 12900, commission: 903, active: true },
];
