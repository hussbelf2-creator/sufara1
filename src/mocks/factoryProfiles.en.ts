/* Each factory's file: its commercial defaults (delivery, payment, penalty)
   together with its own obligations and entitlements schedule. Used to fill a
   contract template automatically as soon as a factory is chosen, with no
   manual entry. Temporary source — becomes real factory data once a backend is
   connected. */
export const factoryProfiles = [
  {
    id: 'madinah-dates',
    name: 'Madinah Dates',
    city: 'Madinah',
    incoterm: 'CIF',
    port: 'Jeddah — Islamic Port',
    leadDays: '15 days',
    duration: '12 months',
    payment: '50% advance on signing and the balance on shipment.',
    penalty: '0.5% of contract value per day of delay, up to 5%.',
    certs: 'Halal · ISO 22000 · SASO',
    specs: [
      { label: 'Material', value: 'Premium Sukkari dates — grade A' },
      { label: 'Packaging', value: '1 kg carton box with SASO label' },
      { label: 'Shelf life', value: '12 months from production date' },
      { label: 'Certificates', value: 'Halal · ISO 22000 · SASO' },
    ],
    clauseKeys: ['quality', 'packing', 'payment', 'inspection'],
    obligations: [
      { party: 'factory', text: 'Prepare and pack the dates to the approved specs and food-safety standards.' },
      { party: 'factory', text: 'Attach Halal and SASO certificates with matching nutrition data to every shipment.' },
      { party: 'buyer', text: 'Pay the advance on contract signing before production starts.' },
    ],
    dues: [
      { label: 'Advance on signing (50%)', ratio: 0.5, status: 'due' },
      { label: 'Balance on shipment (50%)', ratio: 0.5, status: 'scheduled' },
    ],
  },
  {
    id: 'nasj-abayas',
    name: 'Nasj Abayas',
    city: 'Riyadh',
    incoterm: 'FOB',
    port: 'Dammam — King Abdulaziz Port',
    leadDays: '20 days',
    duration: '180 days',
    payment: '40% advance on confirmation, the rest over two monthly instalments.',
    penalty: '1% of contract value per week of delay, up to 8%.',
    certs: 'Fabric quality · SASO',
    specs: [
      { label: 'Material', value: 'Premium matte crepe fabric' },
      { label: 'Sizes', value: 'S – XL per the attached size chart' },
      { label: 'Embroidery', value: 'Hand embroidery on the sleeves' },
      { label: 'Packaging', value: 'Fabric pouch with size label' },
    ],
    clauseKeys: ['quality', 'packing', 'delivery'],
    obligations: [
      { party: 'factory', text: 'Produce the quantity matching the agreed sizes, embroidery and specs.' },
      { party: 'factory', text: 'Pack and label to the destination country requirements and sizes.' },
      { party: 'buyer', text: 'Meet the minimum quantity in each batch and pay its instalments on time.' },
    ],
    dues: [
      { label: 'First payment on confirmation (40%)', ratio: 0.4, status: 'due' },
      { label: 'Monthly instalment (30%)', ratio: 0.3, status: 'scheduled' },
      { label: 'Monthly instalment (30%)', ratio: 0.3, status: 'scheduled' },
    ],
  },
  {
    id: 'dar-aloud',
    name: 'Dar Al Oud',
    city: 'Jeddah',
    incoterm: 'EXW',
    port: 'Jeddah — factory warehouse',
    leadDays: '10 days',
    duration: '1 year, renewable',
    payment: 'Advance on signing and the balance on order receipt.',
    penalty: '2% of the delayed order value per week, up to 10%.',
    certs: 'Oud Halal · Certified origin',
    specs: [
      { label: 'Grade', value: 'Cambodian oud — grade A' },
      { label: 'Pack', value: '50 ml with spray atomiser' },
      { label: 'Origin', value: 'Certified — Cambodia' },
      { label: 'Shelf life', value: '24 months' },
    ],
    clauseKeys: ['quality', 'delivery', 'arbitration'],
    obligations: [
      { party: 'factory', text: 'Supply oud at the agreed quality grades and quantities.' },
      { party: 'factory', text: 'Provide supply priority and marketing support to the distributor.' },
      { party: 'buyer', text: 'Not distribute outside the agreed territory.' },
    ],
    dues: [
      { label: 'Advance on signing (50%)', ratio: 0.5, status: 'due' },
      { label: 'Balance on order receipt (50%)', ratio: 0.5, status: 'scheduled' },
    ],
  },
];