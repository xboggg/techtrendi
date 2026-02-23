// Sample content data for when Supabase is unavailable or empty
// This ensures the site always displays content

export interface Review {
  id: string;
  slug: string;
  title: string;
  category: string;
  image: string | null;
  rating: number;
  verdict: string;
  pros: string[];
  cons: string[];
  price: string | null;
  release_date: string | null;
  specs: Record<string, string>;
  full_review: string | null;
  views: number | null;
  created_at: string;
  is_published: boolean;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  category: string;
  cover_image: string | null;
  read_time_minutes: number | null;
  created_at: string;
  updated_at: string;
  is_premium: boolean;
  is_published: boolean;
  tags: string[] | null;
  author: string | null;
  views: number | null;
}

export const sampleReviews: Review[] = [
  {
    id: "1",
    slug: "samsung-galaxy-s24-ultra-review",
    title: "Samsung Galaxy S24 Ultra",
    category: "Smartphones",
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&h=600&fit=crop",
    rating: 4.8,
    verdict: "The Galaxy S24 Ultra sets a new standard for flagship smartphones with its AI-powered features and stunning display.",
    pros: ["Incredible 200MP camera system", "Galaxy AI features are genuinely useful", "Best-in-class S Pen integration", "7-year software support"],
    cons: ["Premium price point", "Heavy at 232g", "Charger not included"],
    price: "$1,299",
    release_date: "2024-01-17",
    specs: { display: "6.8\" QHD+ AMOLED", processor: "Snapdragon 8 Gen 3", ram: "12GB", storage: "256GB-1TB", battery: "5000mAh", camera: "200MP + 12MP + 50MP + 10MP" },
    full_review: "The Samsung Galaxy S24 Ultra represents the pinnacle of Android smartphone technology. With its stunning 6.8-inch QHD+ Dynamic AMOLED display, the S24 Ultra delivers an unparalleled visual experience.\n\nThe camera system is where this phone truly shines. The 200MP main sensor captures incredibly detailed photos, while the AI-powered features help you get the perfect shot every time. Galaxy AI brings real-time translation, smart photo editing, and intelligent suggestions that actually make your life easier.\n\nThe S Pen integration remains best-in-class, with improved latency and new AI-assisted features. Battery life is excellent, easily lasting a full day of heavy use.\n\nWhile the price is premium, you're getting a device that excels in every category. The 7-year software support commitment means this phone will stay current for years to come.",
    views: 15420,
    created_at: "2024-01-20T10:00:00Z",
    is_published: true
  },
  {
    id: "2",
    slug: "apple-iphone-15-pro-max-review",
    title: "Apple iPhone 15 Pro Max",
    category: "Smartphones",
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&h=600&fit=crop",
    rating: 4.7,
    verdict: "Apple's most powerful iPhone yet, with the A17 Pro chip enabling console-quality gaming and professional video capabilities.",
    pros: ["A17 Pro chip is incredibly fast", "USB-C finally arrives", "Action button is versatile", "5x optical zoom"],
    cons: ["USB-C limited to USB 2.0 speeds on base model", "Price increase over predecessor", "Camera bump is large"],
    price: "$1,199",
    release_date: "2023-09-22",
    specs: { display: "6.7\" Super Retina XDR", processor: "A17 Pro", ram: "8GB", storage: "256GB-1TB", battery: "4422mAh", camera: "48MP + 12MP + 12MP" },
    full_review: "The iPhone 15 Pro Max is Apple's most ambitious smartphone to date. The switch to USB-C is long overdue but welcome, and the new Action button adds customizable functionality that power users will love.\n\nThe A17 Pro chip delivers console-quality gaming experiences, with titles like Resident Evil Village running smoothly. The 5x optical zoom brings the Pro Max closer to dedicated cameras in telephoto capability.\n\nBuild quality is exceptional with the new titanium frame, making it lighter than its predecessor while maintaining durability. ProRAW and ProRes video recording continue to make this the smartphone of choice for content creators.\n\nThe ecosystem integration with other Apple devices remains unmatched, and the software experience is refined to perfection.",
    views: 23150,
    created_at: "2023-09-25T14:30:00Z",
    is_published: true
  },
  {
    id: "3",
    slug: "google-pixel-8-pro-review",
    title: "Google Pixel 8 Pro",
    category: "Smartphones",
    image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&h=600&fit=crop",
    rating: 4.5,
    verdict: "The Pixel 8 Pro delivers Google's best AI features with excellent cameras and 7 years of updates.",
    pros: ["Best AI photo editing features", "Clean Android experience", "7 years of updates", "Excellent night photography"],
    cons: ["Battery could be better", "No expandable storage", "Tensor G3 not the fastest"],
    price: "$999",
    release_date: "2023-10-12",
    specs: { display: "6.7\" LTPO OLED", processor: "Tensor G3", ram: "12GB", storage: "128GB-1TB", battery: "5050mAh", camera: "50MP + 48MP + 48MP" },
    full_review: "Google's Pixel 8 Pro showcases what Android can be when hardware and software work in perfect harmony. The Tensor G3 chip may not win benchmark races, but its AI capabilities are unmatched.\n\nMagic Eraser, Best Take, and Audio Magic Eraser are genuinely useful features that work remarkably well. The camera system produces some of the most natural-looking photos of any smartphone.\n\nThe 7-year update commitment is industry-leading and ensures your investment is protected. The clean Android experience with no bloatware is refreshing.\n\nBattery life is adequate but not exceptional, and the lack of expandable storage may be a concern for some users.",
    views: 12800,
    created_at: "2023-10-15T11:00:00Z",
    is_published: true
  },
  {
    id: "4",
    slug: "macbook-pro-m3-max-review",
    title: "MacBook Pro 16\" M3 Max",
    category: "Laptops",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=600&fit=crop",
    rating: 4.9,
    verdict: "The most powerful laptop Apple has ever made. M3 Max delivers desktop-class performance in a portable form factor.",
    pros: ["Incredible performance", "Outstanding battery life", "Best laptop display", "Runs cool and quiet"],
    cons: ["Very expensive", "Limited port selection on right side", "Notch still present"],
    price: "$3,499",
    release_date: "2023-11-07",
    specs: { display: "16.2\" Liquid Retina XDR", processor: "M3 Max", ram: "36GB-128GB", storage: "512GB-8TB", battery: "22 hours", weight: "2.14 kg" },
    full_review: "The MacBook Pro 16\" with M3 Max is a laptop that defies conventional limits. This machine handles 8K video editing, complex 3D rendering, and intensive software development without breaking a sweat.\n\nThe Liquid Retina XDR display is simply the best screen on any laptop, with ProMotion, P3 wide color, and up to 1600 nits peak HDR brightness. Whether you're color grading video or designing graphics, the accuracy is impeccable.\n\nBattery life is remarkable given the performance on tap - you can genuinely work a full day away from power. The thermal management is exceptional; even under load, the laptop stays cool and quiet.\n\nThe only real drawback is the price, but for professionals who need this level of performance, the investment is justified.",
    views: 8900,
    created_at: "2023-11-10T16:00:00Z",
    is_published: true
  },
  {
    id: "5",
    slug: "sony-wh-1000xm5-review",
    title: "Sony WH-1000XM5",
    category: "Audio",
    image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=600&fit=crop",
    rating: 4.6,
    verdict: "The new benchmark for premium noise-canceling headphones with improved comfort and call quality.",
    pros: ["Industry-leading ANC", "Improved microphone quality", "30-hour battery life", "Lightweight design"],
    cons: ["No longer folds flat", "Higher price than XM4", "Touch controls can be finicky"],
    price: "$399",
    release_date: "2022-05-12",
    specs: { driver: "30mm", battery: "30 hours", weight: "250g", connectivity: "Bluetooth 5.2", codecs: "LDAC, AAC, SBC" },
    full_review: "Sony's WH-1000XM5 headphones continue the company's dominance in the premium ANC headphone market. The noise cancellation is simply the best available, adapting intelligently to your environment.\n\nThe redesigned headband and lighter weight make these the most comfortable XM headphones yet. You can wear them for hours without fatigue. Sound quality is excellent with Sony's signature warm tuning.\n\nCall quality has been dramatically improved with the new microphone system and beamforming technology. The 30-hour battery life means you'll rarely need to charge.\n\nThe only significant downside is that they no longer fold flat for storage, which may be an issue for frequent travelers.",
    views: 19200,
    created_at: "2022-05-15T13:00:00Z",
    is_published: true
  },
  {
    id: "6",
    slug: "apple-watch-series-9-review",
    title: "Apple Watch Series 9",
    category: "Wearables",
    image: "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=800&h=600&fit=crop",
    rating: 4.4,
    verdict: "A refined smartwatch experience with the clever Double Tap gesture and brighter display.",
    pros: ["Double Tap is intuitive", "Brighter 2000 nit display", "S9 chip enables on-device Siri", "Carbon neutral options"],
    cons: ["Minor upgrade from Series 8", "Still only 18-hour battery", "Requires iPhone"],
    price: "$399",
    release_date: "2023-09-22",
    specs: { display: "41mm/45mm OLED", processor: "S9 SiP", battery: "18 hours", water: "50m", sensors: "Blood oxygen, ECG, Temperature" },
    full_review: "The Apple Watch Series 9 is an iterative update that adds meaningful new features while maintaining everything that makes the Apple Watch great.\n\nDouble Tap is the headline feature, allowing you to control the watch by tapping your index finger and thumb together. It works surprisingly well and is genuinely useful when your other hand is occupied.\n\nThe S9 chip brings on-device Siri processing, which means faster responses and the ability to work offline. The display is now 2000 nits bright, making it easily readable in direct sunlight.\n\nIf you have a Series 7 or newer, the upgrade may not be essential. But for those coming from older models or new Apple Watch users, the Series 9 is the best smartwatch available.",
    views: 14300,
    created_at: "2023-09-25T10:30:00Z",
    is_published: true
  },
];

export const sampleArticles: Article[] = [
  {
    id: "1",
    title: "The Complete Guide to Password Security in 2024",
    slug: "complete-guide-password-security-2024",
    content: "# Why Password Security Matters\n\nIn today's digital world, your passwords are the keys to your online life. A weak password can lead to identity theft, financial loss, and privacy breaches.\n\n## Creating Strong Passwords\n\nA strong password should:\n- Be at least 16 characters long\n- Include uppercase and lowercase letters\n- Contain numbers and special characters\n- Not be based on personal information\n- Be unique for each account\n\n## Using a Password Manager\n\nPassword managers like 1Password, Bitwarden, or LastPass can:\n- Generate strong, unique passwords\n- Store passwords securely\n- Auto-fill login forms\n- Sync across devices\n\n## Two-Factor Authentication\n\nAlways enable 2FA when available. Use authenticator apps rather than SMS when possible, as they're more secure.\n\n## Regular Security Audits\n\nCheck your accounts regularly for unauthorized access and update passwords for any compromised accounts immediately.",
    excerpt: "Learn how to create strong passwords, use password managers effectively, and protect your online accounts from hackers.",
    category: "Security",
    cover_image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&h=500&fit=crop",
    read_time_minutes: 8,
    created_at: "2024-02-15T10:00:00Z",
    updated_at: "2024-02-15T10:00:00Z",
    is_premium: false,
    is_published: true,
    tags: ["security", "passwords", "privacy"],
    author: "TechTrendi Team",
    views: 5420
  },
  {
    id: "2",
    title: "iPhone 16 vs Samsung Galaxy S24: Which Should You Buy?",
    slug: "iphone-16-vs-samsung-galaxy-s24",
    content: "# The Ultimate Flagship Comparison\n\nChoosing between Apple and Samsung's flagship phones is one of the biggest decisions in mobile tech. Let's break down every aspect.\n\n## Design & Build\n\nBoth phones feature premium materials and water resistance. The iPhone 16 has the new Action button, while the S24 maintains the familiar Samsung design with a slightly more angular look.\n\n## Display\n\nThe Samsung Galaxy S24 offers:\n- Higher peak brightness\n- More vibrant colors\n- Same 120Hz refresh rate as iPhone\n\nThe iPhone 16 counters with:\n- ProMotion adaptive refresh\n- Better color accuracy\n- Dynamic Island\n\n## Camera Systems\n\nBoth phones excel at photography, but with different strengths. Samsung leads in versatility with more lens options, while Apple's computational photography often produces more natural-looking results.\n\n## Software & Ecosystem\n\niOS vs Android remains the fundamental choice. Consider which ecosystem you're already invested in.",
    excerpt: "A comprehensive comparison of Apple's latest iPhone and Samsung's flagship to help you make the right choice.",
    category: "Phones",
    cover_image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&h=500&fit=crop",
    read_time_minutes: 12,
    created_at: "2024-02-10T14:30:00Z",
    updated_at: "2024-02-10T14:30:00Z",
    is_premium: false,
    is_published: true,
    tags: ["iphone", "samsung", "comparison"],
    author: "TechTrendi Team",
    views: 8930
  },
  {
    id: "3",
    title: "How to Set Up Your Smart Home: A Beginner's Guide",
    slug: "smart-home-setup-beginners-guide",
    content: "# Getting Started with Smart Home\n\nTransforming your home into a smart home doesn't have to be complicated or expensive. Here's how to get started.\n\n## Choosing a Platform\n\nThe three major platforms are:\n- **Apple HomeKit**: Best for Apple users, excellent privacy\n- **Google Home**: Great voice control, wide compatibility\n- **Amazon Alexa**: Most affordable options, largest device selection\n\n## Essential Smart Devices\n\n### Smart Lighting\nStart with smart bulbs or switches. Philips Hue and LIFX offer excellent options.\n\n### Smart Thermostat\nSave money and energy with a Nest or Ecobee thermostat.\n\n### Smart Speakers\nHomePod Mini, Nest Audio, or Echo Dot serve as your voice control hub.\n\n### Smart Locks\nAugust and Yale make reliable smart locks that don't compromise security.\n\n## Setting Up Automations\n\nThe real magic happens when devices work together. Set up routines like:\n- Lights dimming at sunset\n- Thermostat adjusting when you leave\n- Cameras arming when you're away",
    excerpt: "Transform your home with smart devices. From lighting to security, learn how to get started with home automation.",
    category: "How-To",
    cover_image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&h=500&fit=crop",
    read_time_minutes: 10,
    created_at: "2024-02-08T09:00:00Z",
    updated_at: "2024-02-08T09:00:00Z",
    is_premium: false,
    is_published: true,
    tags: ["smart home", "automation", "iot"],
    author: "TechTrendi Team",
    views: 6240
  },
  {
    id: "4",
    title: "Understanding AI: ChatGPT, Claude, and Beyond",
    slug: "understanding-ai-chatgpt-claude",
    content: "# The AI Revolution\n\nArtificial intelligence has transformed from science fiction to an everyday tool. Here's what you need to know.\n\n## What is Generative AI?\n\nGenerative AI creates new content - text, images, code, music - based on patterns learned from training data. Unlike traditional software, it can handle novel situations.\n\n## Major AI Assistants\n\n### ChatGPT (OpenAI)\nThe most well-known AI assistant, excelling at:\n- General conversation\n- Code generation\n- Creative writing\n- Analysis and summarization\n\n### Claude (Anthropic)\nKnown for:\n- Longer context windows\n- Nuanced reasoning\n- Safety-focused design\n- Document analysis\n\n### Gemini (Google)\nGoogle's offering with:\n- Real-time information access\n- Integration with Google services\n- Multimodal capabilities\n\n## Practical Applications\n\nUse AI to:\n- Draft emails and documents\n- Brainstorm ideas\n- Learn new concepts\n- Debug code\n- Analyze data\n\n## Limitations to Understand\n\nAI can make mistakes, has knowledge cutoffs, and shouldn't be trusted blindly for critical decisions.",
    excerpt: "Dive deep into the world of artificial intelligence and learn how these powerful tools can boost your productivity.",
    category: "AI Tech",
    cover_image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=500&fit=crop",
    read_time_minutes: 15,
    created_at: "2024-02-05T11:00:00Z",
    updated_at: "2024-02-05T11:00:00Z",
    is_premium: true,
    is_published: true,
    tags: ["ai", "chatgpt", "productivity"],
    author: "TechTrendi Team",
    views: 12100
  },
  {
    id: "5",
    title: "Best Gaming Laptops Under $1500 in 2024",
    slug: "best-gaming-laptops-under-1500-2024",
    content: "# Gaming on a Budget\n\nYou don't need to spend $3000 to get a great gaming experience. Here are our top picks.\n\n## Our Top Picks\n\n### ASUS ROG Strix G16 - Best Overall\n- RTX 4060\n- Intel Core i7-13650HX\n- 16GB RAM, 512GB SSD\n- 165Hz display\n- Price: $1,399\n\n### Lenovo Legion 5 - Best Value\n- RTX 4050\n- AMD Ryzen 7 7735H\n- 16GB RAM, 512GB SSD\n- 144Hz display\n- Price: $1,099\n\n### Acer Nitro 5 - Budget King\n- RTX 4050\n- Intel Core i5-13420H\n- 16GB RAM, 512GB SSD\n- 144Hz display\n- Price: $899\n\n## What to Look For\n\n### GPU\nAt this price range, aim for at least an RTX 4050. The 4060 offers the best value.\n\n### Display\n1080p at 144Hz is the sweet spot. 1440p is nice but demands more GPU power.\n\n### Cooling\nGaming laptops run hot. Look for models with good thermal reviews.",
    excerpt: "Find the perfect gaming laptop without breaking the bank. We've tested the top options for performance and value.",
    category: "Gaming",
    cover_image: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&h=500&fit=crop",
    read_time_minutes: 9,
    created_at: "2024-02-01T16:00:00Z",
    updated_at: "2024-02-01T16:00:00Z",
    is_premium: false,
    is_published: true,
    tags: ["gaming", "laptops", "reviews"],
    author: "TechTrendi Team",
    views: 9870
  },
  {
    id: "6",
    title: "Must-Have Phone Accessories for 2024",
    slug: "must-have-phone-accessories-2024",
    content: "# Upgrade Your Phone Experience\n\nThe right accessories can transform how you use your phone. Here are our essentials.\n\n## Wireless Chargers\n\n### MagSafe Charger (iPhone)\nApple's magnetic charging solution offers:\n- Perfect alignment every time\n- 15W fast charging\n- Works through thin cases\n\n### Anker PowerWave (Android)\nA great universal option with:\n- Qi2 compatibility\n- 15W charging\n- Excellent build quality\n\n## Phone Cases\n\n### Protection vs Style\n- Otterbox for maximum protection\n- Apple Silicone for minimalists\n- Dbrand for customization\n\n## Power Banks\n\n### Our Picks\n- Anker 737: Best overall\n- Samsung 25W: Best for Samsung phones\n- Mophie Snap+: Best for iPhone\n\n## Audio Accessories\n\nTrue wireless earbuds have replaced wired headphones:\n- AirPods Pro 2: Best for iPhone\n- Samsung Galaxy Buds 2 Pro: Best for Samsung\n- Sony WF-1000XM5: Best for everyone else",
    excerpt: "From wireless chargers to protective cases, discover the essential accessories that will enhance your smartphone experience.",
    category: "Accessories",
    cover_image: "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800&h=500&fit=crop",
    read_time_minutes: 6,
    created_at: "2024-01-28T13:00:00Z",
    updated_at: "2024-01-28T13:00:00Z",
    is_premium: false,
    is_published: true,
    tags: ["accessories", "phones", "gadgets"],
    author: "TechTrendi Team",
    views: 4560
  },
  {
    id: "7",
    title: "How to Protect Your Privacy Online",
    slug: "protect-privacy-online-guide",
    content: "# Your Privacy Matters\n\nIn an age of data breaches and surveillance, protecting your privacy online is more important than ever.\n\n## Browser Privacy\n\n### Choose a Privacy-Focused Browser\n- Firefox: Open source, customizable\n- Brave: Built-in ad blocking\n- Safari: Good default privacy\n\n### Essential Extensions\n- uBlock Origin: Block ads and trackers\n- Privacy Badger: Learn and block trackers\n- HTTPS Everywhere: Force secure connections\n\n## VPN Usage\n\nA VPN encrypts your internet traffic:\n- Mullvad: Best privacy\n- ProtonVPN: Best free tier\n- NordVPN: Best features\n\n## Secure Messaging\n\n### Signal\nThe gold standard for private messaging:\n- End-to-end encryption\n- Open source\n- No data collection\n\n## Social Media Privacy\n\nReview your settings on:\n- Facebook: Privacy Checkup tool\n- Google: Privacy Dashboard\n- Twitter: Privacy settings\n\nLimit what you share and who can see it.",
    excerpt: "Essential tips and tools to keep your personal data safe from trackers, hackers, and data brokers.",
    category: "Security",
    cover_image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=500&fit=crop",
    read_time_minutes: 11,
    created_at: "2024-01-25T10:30:00Z",
    updated_at: "2024-01-25T10:30:00Z",
    is_premium: false,
    is_published: true,
    tags: ["privacy", "security", "vpn"],
    author: "TechTrendi Team",
    views: 7320
  },
  {
    id: "8",
    title: "The Future of Foldable Phones",
    slug: "future-of-foldable-phones",
    content: "# Foldable Phones Are Here to Stay\n\nWhat was once a novelty is becoming mainstream. Here's where foldable technology is heading.\n\n## Current State of Foldables\n\n### Samsung Galaxy Z Fold5\nThe most refined book-style foldable:\n- Large 7.6\" inner display\n- Improved hinge durability\n- S Pen support\n- $1,799 starting price\n\n### Samsung Galaxy Z Flip5\nThe compact clamshell:\n- Larger cover screen\n- More practical everyday use\n- $999 starting price\n\n### Google Pixel Fold\nGoogle's first foldable:\n- Excellent cameras\n- Stock Android experience\n- Wider aspect ratio\n\n## What's Coming\n\n### Improved Durability\nCrease reduction and better materials are priorities for all manufacturers.\n\n### Lower Prices\nExpect sub-$800 foldables within 2 years.\n\n### New Form Factors\nRollables and tri-folds are in development.\n\n## Should You Buy One?\n\nIf you want cutting-edge tech and have the budget, today's foldables are genuinely usable. For everyone else, waiting another generation makes sense.",
    excerpt: "Are foldable phones ready for mainstream adoption? We examine the latest innovations and what's coming next.",
    category: "Phones",
    cover_image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&h=500&fit=crop",
    read_time_minutes: 7,
    created_at: "2024-01-20T14:00:00Z",
    updated_at: "2024-01-20T14:00:00Z",
    is_premium: true,
    is_published: true,
    tags: ["foldable", "samsung", "innovation"],
    author: "TechTrendi Team",
    views: 5890
  },
  {
    id: "9",
    title: "Cloud Gaming in 2024: Xbox Cloud vs GeForce Now vs PlayStation Plus",
    slug: "cloud-gaming-comparison-2024",
    content: "# Gaming Without a Console\n\nCloud gaming lets you play AAA titles on any device. Here's how the services compare.\n\n## Xbox Cloud Gaming\n\n**Included with Game Pass Ultimate ($17/month)**\n\nPros:\n- Huge library of games\n- Play on any device\n- New games on day one\n\nCons:\n- 1080p max resolution\n- Some input lag\n- Requires good internet\n\n## GeForce Now\n\n**Free tier available, Priority $10/month, Ultimate $20/month**\n\nPros:\n- Play games you already own\n- Up to 4K resolution\n- RTX graphics enabled\n\nCons:\n- Not all games supported\n- Session time limits on free tier\n\n## PlayStation Plus Premium\n\n**$18/month**\n\nPros:\n- Stream PS5 exclusives\n- Classic game catalog\n- Works well on PlayStation\n\nCons:\n- Limited to Sony ecosystem\n- Streaming only, no download\n\n## The Verdict\n\nFor most gamers, Xbox Cloud Gaming offers the best value. Enthusiasts who want the best quality should look at GeForce Now Ultimate.",
    excerpt: "Compare the top cloud gaming services and find out which one offers the best value for your gaming needs.",
    category: "Gaming",
    cover_image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&h=500&fit=crop",
    read_time_minutes: 13,
    created_at: "2024-01-15T12:00:00Z",
    updated_at: "2024-01-15T12:00:00Z",
    is_premium: false,
    is_published: true,
    tags: ["cloud gaming", "xbox", "playstation"],
    author: "TechTrendi Team",
    views: 6780
  },
];

// Helper functions
export function getReviewBySlug(slug: string): Review | undefined {
  return sampleReviews.find(r => r.slug === slug);
}

export function getArticleBySlug(slug: string): Article | undefined {
  return sampleArticles.find(a => a.slug === slug);
}

export function getRelatedReviews(category: string, excludeSlug: string): Review[] {
  return sampleReviews.filter(r => r.category === category && r.slug !== excludeSlug).slice(0, 3);
}

export function getRelatedArticles(category: string, excludeId: string): Article[] {
  return sampleArticles.filter(a => a.category === category && a.id !== excludeId).slice(0, 3);
}
