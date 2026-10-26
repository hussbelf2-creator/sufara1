/* English text overrides for the sample order history, keyed by order id.
   Line overrides are matched to the order lines by position. */

export const orderText = {
  'SFR-2026-47921': {
    customerName: 'Mohammed Alamri',
    country: 'United Arab Emirates',
    city: 'Dubai',
    port: 'Jebel Ali Port',
    shippingMethod: 'Express air freight',
    eta: '5–9 days',
    lines: [
      { name: 'Assorted Dates Gift Box — 1.5 kg', factoryName: 'Al-Ahsa Dates Factory' },
      { name: 'Arabic Coffee with Cardamom & Saffron — 250 g', factoryName: 'Fifa Coffee Farms' },
    ],
  },
  'SFR-2026-36014': {
    customerName: 'Mohammed Alamri',
    country: 'United Kingdom',
    city: 'London',
    port: 'Felixstowe Port',
    shippingMethod: 'Economy sea freight',
    eta: 'Delivered',
    lines: [
      { name: 'Concentrated Taif Rose Perfume — 50 ml', factoryName: 'Taif Rose Works' },
    ],
  },
  'SFR-2026-58110': {
    customerName: 'Noura Alqahtani',
    country: 'Saudi Arabia',
    city: 'Riyadh',
    port: 'Jeddah warehouse',
    shippingMethod: 'Domestic ground freight',
    eta: 'Delivered',
    lines: [
      { name: 'Premium Bakhoor Incense — 100 g', factoryName: 'Dar Al Oud' },
      { name: 'Arabic Coffee with Cardamom & Saffron — 250 g', factoryName: 'Fifa Coffee Farms' },
    ],
  },
};