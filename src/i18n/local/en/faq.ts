export default {
  faq: {
    crumb: 'FAQ',
    titleLead: 'Everything you',
    titleAccent: 'need to know',
    sub: 'The questions buyers, factories and ambassadors actually send us, grouped into five sections. Search a keyword or jump to the section you need — and if your answer is not here, the Jeddah support team is one message away.',
    searchPlaceholder: 'Search the questions… e.g. customs, commission, returns',
    searchAria: 'Search the FAQ',
    clearSearch: 'Clear search',
    noResults: 'No question matches your search. Try another word or send your question straight to support.',
    resultsCount: '{{count}} of {{total}} questions',
    totalCount: '{{count}} questions across {{sections}} sections',
    jumpTitle: 'Question sections',
    sectionCount: '{{count}} questions',
    questionsTitle: 'Questions',
    helpTitle: 'Still need an answer?',
    helpText: 'Open a ticket from the contact page with your order number or factory name, and we reply within one business day. Every ticket gets a reference you can track from your account.',
    helpCta: 'Send your question',
    helpSecondary: 'Support tickets in my account',
    relatedTitle: 'Quick links',
    categories: [
      {
        id: 'orders',
        icon: 'ri-shopping-bag-3-line',
        title: 'Orders & payment',
        desc: 'From adding a product to the cart to confirming payment and seeing the order in your account.',
        items: [
          {
            q: 'How do I track my order?',
            a: 'Open "My orders" from the top of the site or from your account: every order shows its number, status and shipping stage. Open an order to see the tracking number and the last update on each stage.',
          },
          {
            q: 'Can I change or cancel an order after paying?',
            a: 'You can change or cancel before the factory starts preparing the order — usually within the first 12 hours after payment. Message us with the order number right away; if the order already shipped, you can open a return after delivery.',
          },
          {
            q: 'Which payment methods do you accept?',
            a: 'Credit and debit cards (mada, Visa, Mastercard) through a licensed gateway inside Saudi Arabia. Wholesale orders and export contracts are paid by bank transfer or scheduled instalments linked to the contract.',
          },
          {
            q: 'Why is the payment not showing even though my card was charged?',
            a: 'Bank confirmation can take a few minutes, and the amount may show as pending for up to 24 hours. If it stays pending longer than two days, send us the transaction reference and we will match it with the gateway.',
          },
          {
            q: 'Do prices include VAT and shipping?',
            a: 'Prices are shown in Saudi riyals and include VAT where it applies. Shipping is calculated separately at checkout by destination and weight, and customs duties in the destination country are paid by the recipient.',
          },
          {
            q: 'Can I buy wholesale or request a quote?',
            a: 'Yes. From a product page or the "Price quotes" section of your account, send the quantity and destination country. The factory replies with its unit price, production lead time and payment terms before you commit to anything.',
          },
        ],
      },
      {
        id: 'shipping',
        icon: 'ri-truck-line',
        title: 'Shipping & delivery',
        desc: 'Consolidation in Jeddah, delivery times, tracking, and customs at destination.',
        items: [
          {
            q: 'How long does shipping take?',
            a: 'Inside Saudi Arabia 2–5 business days, the GCC 5–9 days, and the rest of the world 7–18 business days after the order is prepared. Timings are estimates and are affected by customs and peak seasons.',
          },
          {
            q: 'How are orders from several factories combined?',
            a: 'Every order arrives at the Jeddah consolidation and inspection warehouse, where it is checked and packed together into one shipment. That lowers the shipping cost and gives you one tracking number instead of several.',
          },
          {
            q: 'Who pays customs duties and taxes?',
            a: 'Customs duties and taxes at destination are the recipient\'s responsibility unless stated otherwise on the order page or in the export contract. We attach the invoice, packing list and certificate of origin to make clearance easier.',
          },
          {
            q: 'How do I track the shipment and know where it is?',
            a: 'The order page in your account shows the tracking number, the carrier and the status of each stage. You also get an email or SMS update when the shipment leaves Jeddah and when it reaches the local delivery hub.',
          },
          {
            q: 'Do you ship to every country?',
            a: 'We ship to most countries, but some food and fragrance products face import restrictions in certain destinations. If your destination is restricted, a notice appears before checkout or we contact you about an alternative.',
          },
          {
            q: 'What if my shipment is late or never arrives?',
            a: 'Open a ticket from the contact page and choose "Order or shipment enquiry". We open an investigation with the carrier, and if the shipment is confirmed lost we reship it or refund it in full.',
          },
        ],
      },
      {
        id: 'returns',
        icon: 'ri-arrow-go-back-line',
        title: 'Returns & exchanges',
        desc: 'Claim window, accepted cases, the return steps, and refund timing.',
        items: [
          {
            q: 'How long do I have to claim a return?',
            a: 'The return window starts on the delivery date and depends on the destination (7 days within Saudi Arabia, 14 days for most countries — full table in the returns policy), unless a shorter window is stated on the product page because of its nature. Fresh or seasonal products must be reported within 48 hours.',
          },
          {
            q: 'Which products cannot be returned?',
            a: 'Food products, dates and coffee once the seal is opened, perfumes and bakhoor after use, customised or personalised items, and any product damaged by unsuitable storage after delivery.',
          },
          {
            q: 'How do I open a return?',
            a: 'From the contact page choose "Return or exchange", add the order number and a description of the issue, and attach clear photos of the packaging, label and product. Once quality approves, we send packing and return-shipping instructions.',
          },
          {
            q: 'When does the refund arrive?',
            a: 'After the return is received and inspected in Jeddah, the refund is issued within 5 to 14 business days depending on the payment provider and bank.',
          },
          {
            q: 'Who pays the return shipping cost?',
            a: 'If the mistake is ours — wrong, damaged or missing product — we cover shipping both ways. If you return because you changed your mind, you cover the shipping cost as long as the product is unused and properly packed.',
          },
          {
            q: 'What should I do if the product arrives damaged?',
            a: 'Photograph the outer packaging before opening it where possible, then report within 48 hours of delivery. We open a case with the carrier and cover the replacement or refund in full.',
          },
        ],
      },
      {
        id: 'factories',
        icon: 'ri-building-2-line',
        title: 'Factories & supply',
        desc: 'Joining as a factory, verification, fulfilment, commissions and payouts.',
        items: [
          {
            q: 'How do I join the platform as a factory?',
            a: 'Send a joining request from the "Join as a factory" section or the contact page with the factory name, product types and commercial registration. Our verification team then contacts you to complete the file.',
          },
          {
            q: 'Which documents are required to verify a factory?',
            a: 'Commercial registration, industrial licence or municipal permit, the quality certificates relevant to your product (such as SFDA for food), and sample photos of the product and packaging. Some sectors require extra certificates.',
          },
          {
            q: 'How are factories and products verified?',
            a: 'We check the documents and product category, and may request a site visit or a sample inspection. Once approved, product photos and descriptions are reviewed before publishing, and any product that does not match its specs is removed.',
          },
          {
            q: 'Who handles shipping and customs?',
            a: 'The platform handles consolidation, inspection, packing, international shipping and export documents from Jeddah. The factory is responsible for preparing the quantity to the agreed quality and labelling, and delivering it to the warehouse on time.',
          },
          {
            q: 'How is the platform commission calculated and paid?',
            a: 'The platform take is 18% of the goods value on retail and 6% on wholesale, covering ambassador marketing, collection and consolidation. The factory\'s share is held until the return window in the buyer\'s country closes, then transferred and shown under "Finance & settlements".',
          },
          {
            q: 'Can I sell wholesale through the platform?',
            a: 'Yes. Factories receive quote requests from trade buyers and respond with unit price, production lead time and payment terms. Large deals are managed with a supply contract and scheduled instalments inside the factory dashboard.',
          },
        ],
      },
      {
        id: 'ambassadors',
        icon: 'ri-share-forward-2-line',
        title: 'Ambassadors & commissions',
        desc: 'Joining the programme, commission rates, attribution, and withdrawing earnings.',
        items: [
          {
            q: 'How do I become an Safeer ambassador?',
            a: 'Register from the "Ambassador programme" section with your country and the products you care about. Once approved you get a personal code, a public link, a QR card and a ready marketing page to share.',
          },
          {
            q: 'How is the ambassador commission calculated?',
            a: 'Retail: a rate by tier (ambassador 5%, certified 7%, elite 8%) on a new customer\'s first order with the factory. Wholesale: 2%, recurring on the same buyer for 12 months. The commission is cancelled automatically if the order is returned; current rates always show under "Levels & challenges".',
          },
          {
            q: 'How is an order attributed to me?',
            a: 'If the buyer arrives through your link or marketing page, the click is recorded and the order is attributed within the attribution window. If your discount code is used, the code takes priority over the link — the code always wins.',
          },
          {
            q: 'When are earnings paid and how do I withdraw?',
            a: 'The commission stays pending until delivery is confirmed and the return window in the buyer\'s country has closed, then it becomes withdrawable under "Wallet & payouts". The minimum payout is SAR 200, and bank transfers require verified identity and IBAN.',
          },
          {
            q: 'Can I earn commission on other ambassadors?',
            a: 'There is a single team bonus level: you earn on sales from ambassadors you invited directly, not on the people they invite. The bonus is on real sales, not recruitment, which keeps the programme clear of pyramid marketing.',
          },
          {
            q: 'How do I get my QR card and the content library?',
            a: 'In the ambassador dashboard, the downloadable and printable QR card lives in "My links & codes", and a library of ready images and copy in your language lives in "Content library". Every asset carries your link automatically when shared.',
          },
        ],
      },
    ],
    relatedLinks: [
      { label: 'Returns and exchanges policy', to: '/returns' },
      { label: 'Privacy policy', to: '/privacy' },
      { label: 'Terms and conditions', to: '/terms' },
      { label: 'Contact and support', to: '/support' },
    ],
  },
};