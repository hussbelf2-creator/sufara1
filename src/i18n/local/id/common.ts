/* Indonesian — launch market Indonesia. Any key not listed here falls back
   to English, then Arabic (see fallbackLng in src/i18n/index.ts). */
export default {
  common: {
    brandMark: 'Safeer',
    brand: 'Safeer',
    brandFull: 'Safeer — Duta Dagang Saudi',
    nav: {
      home: 'Beranda',
      shop: 'Toko',
      factories: 'Pabrik',
      compare: 'Bandingkan produk',
      ambassadors: 'Program duta',
      how: 'Cara kerja',
      orders: 'Pesanan saya',
      favorites: 'Favorit',
      cart: 'Keranjang belanja',
      account: 'Akun saya',
      menu: 'Menu',
      switchLang: 'Ganti bahasa',
      currency: 'Mata uang',
      faq: 'Tanya jawab',
    },
    faqQuick: {
      eyebrow: 'Jawaban cepat',
      title: 'Yang paling sering ditanyakan pembeli',
      note: '30 jawaban lengkap dalam 5 bagian',
      all: 'Semua pertanyaan umum',
      items: [
        { q: 'Bagaimana melacak pesanan saya?', to: '/faq#orders' },
        { q: 'Berapa lama pengiriman?', to: '/faq#shipping' },
        { q: 'Berapa lama masa klaim?', to: '/faq#returns' },
        { q: 'Bagaimana bergabung sebagai pabrik?', to: '/faq#factories' },
        { q: 'Bagaimana komisi duta dihitung?', to: '/faq#ambassadors' },
      ],
    },
    storeFooter: {
      about:
        'Toko yang menyatukan pabrik Saudi terverifikasi dalam satu jalur ekspor, dengan pengiriman terpadu dari Jeddah dan pembayaran yang ditahan secara aman untuk melindungi pembeli dan pabrik.',
      address: 'Gudang konsolidasi dan inspeksi — Jeddah, Arab Saudi',
      rights: '© 2026 Safeer — Duta Dagang Saudi. Hak cipta dilindungi.',
      instagram: 'Instagram',
      tiktok: 'TikTok',
      whatsapp: 'WhatsApp',
      linkedin: 'LinkedIn',
      cols: [
        {
          title: 'Toko',
          links: [
            { label: 'Semua produk', to: '/products' },
            { label: 'Kurma', to: '/products?category=dates' },
            { label: 'Parfum & bakhoor', to: '/products?category=oud' },
            { label: 'Kopi Arab', to: '/products?category=coffee' },
          ],
        },
        {
          title: 'Platform',
          links: [
            { label: 'Cara kerja', to: '/#story' },
            { label: 'Program duta', to: '/#ambassadors' },
            { label: 'Pengiriman', to: '/#logistics' },
            { label: 'Logo & identitas', to: '/brand' },
          ],
        },
        {
          title: 'Untuk pabrik',
          links: [
            { label: 'Bergabung sebagai pabrik', to: '/#join' },
            { label: 'Cara kami memverifikasi pabrik', to: '/#faq' },
            { label: 'Direktori pabrik', to: '/factories' },
          ],
        },
        {
          title: 'Bantuan & legal',
          links: [
            { label: 'Hubungi kami', to: '/support' },
            { label: 'Tanya jawab', to: '/faq' },
            { label: 'Syarat dan ketentuan', to: '/terms' },
            { label: 'Kebijakan privasi', to: '/privacy' },
            { label: 'Pengembalian dan penukaran', to: '/returns' },
          ],
        },
      ],
    },
    homeFooter: {
      about:
        'Satu jalur ekspor yang menyatukan pabrik-pabrik Saudi. Dimulai dari jamaah umrah dan haji — duta demi duta, kami membangun jaringan penjualan internasional.',
      address: 'Gudang konsolidasi dan inspeksi — Jeddah, Arab Saudi',
      rights: '© 2026 Safeer — Duta Dagang Saudi. Hak cipta dilindungi.',
      instagram: 'Instagram',
      tiktok: 'TikTok',
      whatsapp: 'WhatsApp',
      linkedin: 'LinkedIn',
      cols: [
        {
          title: 'Platform',
          links: [
            { label: 'Kisah kami', href: '#story' },
            { label: 'Program duta', href: '#ambassadors' },
            { label: 'Pengiriman', href: '#logistics' },
            { label: 'Angka', href: '#numbers' },
          ],
        },
        {
          title: 'Untuk duta',
          links: [
            { label: 'Jadi duta', href: '#join' },
            { label: 'Level & komisi', href: '#ambassadors' },
            { label: 'Tanya jawab', href: '#faq' },
          ],
        },
      ],
    },
  },
};
