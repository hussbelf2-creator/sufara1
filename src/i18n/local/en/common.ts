export default {
  common: {
    brandMark: 'Safeer',
    brand: 'Safeer',
    brandFull: 'Safeer — Saudi Trade Ambassadors',
    nav: {
      home: 'Home',
      shop: 'Shop',
      factories: 'Factories',
      compare: 'Compare products',
      ambassadors: 'Ambassador program',
      how: 'How it works',
      orders: 'My orders',
      favorites: 'Wishlist',
      cart: 'Shopping cart',
      account: 'My account',
      menu: 'Menu',
      switchLang: 'Switch language',
      currency: 'Display currency',
      faq: 'FAQ',
    },
    faqQuick: {
      eyebrow: 'Quick answers',
      title: 'What buyers ask most',
      note: '30 full answers across 5 sections',
      all: 'All frequently asked questions',
      items: [
        { q: 'How do I track my order?', to: '/faq#orders' },
        { q: 'How long does shipping take?', to: '/faq#shipping' },
        { q: 'How long is the claim window?', to: '/faq#returns' },
        { q: 'How do I join as a factory?', to: '/faq#factories' },
        { q: 'How are ambassador commissions calculated?', to: '/faq#ambassadors' },
      ],
    },
    storeFooter: {
      about:
        'The store that brings verified Saudi factories together in one export channel, with unified shipping from Jeddah and a central held-payment system that protects both buyer and factory.',
      address: 'Consolidation and inspection warehouse — Jeddah, Saudi Arabia',
      rights: '© 2026 Safeer — Saudi Trade Ambassadors. All rights reserved.',
      instagram: 'Instagram',
      tiktok: 'TikTok',
      whatsapp: 'WhatsApp',
      linkedin: 'LinkedIn',
      cols: [
        {
          title: 'Shop',
          links: [
            { label: 'All products', to: '/products' },
            { label: 'Dates', to: '/products?category=dates' },
            { label: 'Perfume & bakhoor', to: '/products?category=oud' },
            { label: 'Arabic coffee', to: '/products?category=coffee' },
          ],
        },
        {
          title: 'Platform',
          links: [
            { label: 'How it works', to: '/#story' },
            { label: 'Ambassador program', to: '/#ambassadors' },
            { label: 'Shipping & logistics', to: '/#logistics' },
            { label: 'Logo & identity', to: '/brand' },
          ],
        },
        {
          title: 'For factories',
          links: [
            { label: 'Join as a factory', to: '/#join' },
            { label: 'How we verify factories', to: '/#faq' },
            { label: 'Export readiness index', to: '/#numbers' },
            { label: 'Factory directory', to: '/factories' },
          ],
        },
        {
          title: 'Support and legal',
          links: [
            { label: 'Contact us', to: '/support' },
            { label: 'FAQ', to: '/faq' },
            { label: 'Terms and conditions', to: '/terms' },
            { label: 'Privacy policy', to: '/privacy' },
            { label: 'Returns and exchanges', to: '/returns' },
          ],
        },
      ],
    },
    brandPage: {
      crumb: 'Logo & identity',
      titleLead: 'The logo',
      titleAccent: 'and identity',
      sub: 'A geometric date palm in gold lines on Saudi green — an emblem inspired by the "Made in Saudi" identity. Download the ready files for print, documents and social channels.',
      sizesLabel: 'Pick a size to download the PNG',
      hint: 'Each file downloads straight as a PNG, on a full background or transparent depending on the version.',
      download: 'Download',
      variants: {
        solid: {
          name: 'Primary version',
          desc: 'Deep Saudi green with gold lines — the approved version for the site and colour print.',
        },
        transparent: {
          name: 'Transparent version',
          desc: 'Lines only with no background, for placing over brand colours, photos and stickers.',
        },
        light: {
          name: 'For white paper',
          desc: 'Ivory background with deeper gold lines — stays crisp on invoices and printed shipping papers.',
        },
      },
      usageTitle: 'Usage rules',
      usage: [
        'Keep clear space around the emblem of at least a quarter of its width, and never place text on top of it.',
        'Do not stretch, rotate or squash the mark, and do not swap the gold and green for other colours.',
        'Minimum print size is 12 mm; minimum on-screen size is a 24 px mark.',
        'Use the transparent version on dark backgrounds and the ivory version on white paper.',
      ],
      colorsTitle: 'Brand colours',
      colors: [
        { name: 'Deep Saudi green', hex: '#0a4a2c' },
        { name: 'Platform green', hex: '#147a49' },
        { name: 'Brand gold', hex: '#d8b155' },
        { name: 'Print gold', hex: '#a97c27' },
      ],
      back: 'Back to the shop',
    },
    homeFooter: {
      about:
        'One export channel bringing Saudi factories together. Ambassador after ambassador — visitors to the Kingdom, expat communities and friends of Saudi products — we build an international sales network.',
      address: 'Consolidation and inspection warehouse — Jeddah, Saudi Arabia',
      rights: '© 2026 Safeer — Saudi Trade Ambassadors. All rights reserved.',
      instagram: 'Instagram',
      tiktok: 'TikTok',
      whatsapp: 'WhatsApp',
      linkedin: 'LinkedIn',
      cols: [
        {
          title: 'Platform',
          links: [
            { label: 'Our story', href: '#story' },
            { label: 'Ambassador program', href: '#ambassadors' },
            { label: 'Shipping & logistics', href: '#logistics' },
            { label: 'The numbers', href: '#numbers' },
          ],
        },
        {
          title: 'For factories',
          links: [
            { label: 'Join as a factory', href: '#join' },
            { label: 'How we verify factories', href: '#faq' },
            { label: 'Export readiness index', href: '#numbers' },
            { label: 'Export authority incentive', href: '#join' },
          ],
        },
        {
          title: 'For ambassadors',
          links: [
            { label: 'Become an ambassador', href: '#join' },
            { label: 'Levels & commissions', href: '#ambassadors' },
            { label: 'Ambassador tools', href: '#ambassadors' },
            { label: 'FAQ', href: '#faq' },
          ],
        },
      ],
    },
  },
};