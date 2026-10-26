/* Urdu — launch market Pakistan. Any key not listed here falls back to
   English, then Arabic (see fallbackLng in src/i18n/index.ts). */
export default {
  common: {
    brandMark: 'سفیر',
    brand: 'سفیر',
    brandFull: 'سفیر — سعودی تجارتی سفیر',
    nav: {
      home: 'ہوم',
      shop: 'دکان',
      factories: 'فیکٹریاں',
      compare: 'مصنوعات کا موازنہ',
      ambassadors: 'سفیر پروگرام',
      how: 'یہ کیسے کام کرتا ہے',
      orders: 'میرے آرڈر',
      favorites: 'پسندیدہ',
      cart: 'خریداری کی ٹوکری',
      account: 'میرا اکاؤنٹ',
      menu: 'مینو',
      switchLang: 'زبان تبدیل کریں',
      currency: 'کرنسی',
      faq: 'عام سوالات',
    },
    faqQuick: {
      eyebrow: 'فوری جوابات',
      title: 'خریدار سب سے زیادہ کیا پوچھتے ہیں',
      note: '5 حصوں میں 30 مکمل جوابات',
      all: 'تمام عام سوالات',
      items: [
        { q: 'میں اپنا آرڈر کیسے ٹریک کروں؟', to: '/faq#orders' },
        { q: 'ترسیل میں کتنا وقت لگتا ہے؟', to: '/faq#shipping' },
        { q: 'شکایت کی مدت کتنی ہے؟', to: '/faq#returns' },
        { q: 'فیکٹری کے طور پر کیسے شامل ہوں؟', to: '/faq#factories' },
        { q: 'سفیر کا کمیشن کیسے بنتا ہے؟', to: '/faq#ambassadors' },
      ],
    },
    storeFooter: {
      about:
        'تصدیق شدہ سعودی فیکٹریوں کو ایک برآمدی چینل میں جمع کرنے والی دکان — جدہ سے ایک ہی شپنگ اور محفوظ ادائیگی، جو خریدار اور فیکٹری دونوں کی حفاظت کرتی ہے۔',
      address: 'جمع اور معائنہ گودام — جدہ، سعودی عرب',
      rights: '© 2026 سفیر — سعودی تجارتی سفیر۔ جملہ حقوق محفوظ ہیں۔',
      instagram: 'Instagram',
      tiktok: 'TikTok',
      whatsapp: 'WhatsApp',
      linkedin: 'LinkedIn',
      cols: [
        {
          title: 'دکان',
          links: [
            { label: 'تمام مصنوعات', to: '/products' },
            { label: 'کھجوریں', to: '/products?category=dates' },
            { label: 'عود اور بخور', to: '/products?category=oud' },
            { label: 'عربی قہوہ', to: '/products?category=coffee' },
          ],
        },
        {
          title: 'پلیٹ فارم',
          links: [
            { label: 'یہ کیسے کام کرتا ہے', to: '/#story' },
            { label: 'سفیر پروگرام', to: '/#ambassadors' },
            { label: 'شپنگ', to: '/#logistics' },
            { label: 'لوگو اور شناخت', to: '/brand' },
          ],
        },
        {
          title: 'فیکٹریوں کے لیے',
          links: [
            { label: 'فیکٹری کے طور پر شامل ہوں', to: '/#join' },
            { label: 'ہم فیکٹریوں کی تصدیق کیسے کرتے ہیں', to: '/#faq' },
            { label: 'فیکٹری ڈائریکٹری', to: '/factories' },
          ],
        },
        {
          title: 'مدد اور قانونی',
          links: [
            { label: 'رابطہ کریں', to: '/support' },
            { label: 'عام سوالات', to: '/faq' },
            { label: 'شرائط و ضوابط', to: '/terms' },
            { label: 'رازداری کی پالیسی', to: '/privacy' },
            { label: 'واپسی اور تبدیلی', to: '/returns' },
          ],
        },
      ],
    },
    homeFooter: {
      about:
        'سعودی فیکٹریوں کو جوڑنے والا ایک برآمدی چینل۔ عمرہ اور حج کے زائرین سے آغاز — سفیر در سفیر ہم ایک بین الاقوامی سیلز نیٹ ورک بناتے ہیں۔',
      address: 'جمع اور معائنہ گودام — جدہ، سعودی عرب',
      rights: '© 2026 سفیر — سعودی تجارتی سفیر۔ جملہ حقوق محفوظ ہیں۔',
      instagram: 'Instagram',
      tiktok: 'TikTok',
      whatsapp: 'WhatsApp',
      linkedin: 'LinkedIn',
      cols: [
        {
          title: 'پلیٹ فارم',
          links: [
            { label: 'ہماری کہانی', href: '#story' },
            { label: 'سفیر پروگرام', href: '#ambassadors' },
            { label: 'شپنگ', href: '#logistics' },
            { label: 'اعداد و شمار', href: '#numbers' },
          ],
        },
        {
          title: 'سفیروں کے لیے',
          links: [
            { label: 'سفیر بنیں', href: '#join' },
            { label: 'درجے اور کمیشن', href: '#ambassadors' },
            { label: 'عام سوالات', href: '#faq' },
          ],
        },
      ],
    },
  },
};
