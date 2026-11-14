// Facts shown by /tools/ghana-tax-calculator. Checked 14–15 Nov 2026.
// VAT treatments follow the Value Added Tax Act 2025 (Act 1151), First Schedule (exempt) and
// Second Schedule (zero-rated), plus GRA's 2026 VAT notices. For things bought in Ghana only.
// Do NOT add an item unless the law or GRA clearly says how it is treated.
import type { VatTreatment } from "@/lib/ghanaTax";

export const LAST_CHECKED = "15 Nov 2026";

export interface VatItem {
  name: string;
  treatment: VatTreatment;
  note?: string;
  also?: string; // extra search words
}

export const VAT_ITEMS: VatItem[] = [
  { name: "Restaurant or chop bar meal", treatment: "standard", note: "Cooked food from a VAT-registered seller is taxed — GRA's own example is fried rice and sobolo.", also: "food fried rice jollof waakye kenkey fast food sobolo drink" },
  { name: "Raw foodstuffs grown in Ghana", treatment: "exempt", note: "Yam, plantain, cassava, maize, tomatoes, pepper, fruit — raw and produced in Ghana.", also: "food yam plantain cassava maize corn tomato pepper onion fruit vegetables market rice grains cereal" },
  { name: "Fresh fish caught in Ghana", treatment: "exempt", note: "Raw fish and other seafood produced locally.", also: "food fish tilapia seafood" },
  { name: "Live goats, sheep, cattle or chickens", treatment: "exempt", note: "Farm animals raised in Ghana.", also: "animal livestock goat sheep cow poultry fowl" },
  { name: "Medicines from a pharmacy", treatment: "exempt", note: "Pharmaceuticals are on the no-VAT list.", also: "drugs medicine pharmacy paracetamol malaria health" },
  { name: "Hospital or clinic care", treatment: "exempt", note: "Medical services and supplies. Spa and gym fees are not medical care.", also: "health doctor hospital clinic medical" },
  { name: "School fees", treatment: "exempt", note: "Education services.", also: "school fees education tuition university" },
  { name: "Approved school textbooks", treatment: "exempt", note: "Books on the Education Ministry's approved list, plus newspapers and maps.", also: "books textbook newspaper map" },
  { name: "Trotro, bus or taxi fare", treatment: "exempt", note: "Passenger transport inside Ghana by road, rail or water. Haulage (moving goods) is taxed.", also: "transport trotro bus taxi ferry train fare travel" },
  { name: "House rent", treatment: "exempt", note: "Rent for a home. Hotel and guesthouse rooms are taxed.", also: "rent house home apartment accommodation" },
  { name: "Electricity at home", treatment: "exempt", note: "Since 1 Jan 2026 there is no unit limit for homes. Business electricity is not on the list.", also: "light ecg electricity power prepaid" },
  { name: "Tap water", treatment: "exempt", note: "Pipe-borne water. Bottled and sachet water are taxed.", also: "water pipe gwcl" },
  { name: "Bottled or sachet water", treatment: "standard", note: "Water sold in bottles or packets is taxed (when the seller is VAT-registered).", also: "water pure water sachet bottle" },
  { name: "Petrol, diesel, LPG or kerosene", treatment: "exempt", note: "Fuel is on the no-VAT list.", also: "fuel petrol diesel gas lpg kerosene" },
  { name: "Salt", treatment: "exempt", note: "Salt for eating, including table salt.", also: "salt food" },
  { name: "Mosquito nets", treatment: "exempt", also: "net malaria" },
  { name: "Seeds, fertiliser, animal feed", treatment: "exempt", note: "Inputs for farming. Pet items are not included.", also: "farm farming fertilizer fertiliser seed pesticide feed" },
  { name: "Goods for persons with disability", treatment: "exempt", note: "Items made only for use by persons with disability.", also: "wheelchair disability" },
  { name: "Bank charges and loans", treatment: "exempt", note: "Financial services are on the no-VAT list, except non-life insurance.", also: "bank loan interest finance charges" },
  { name: "Life insurance", treatment: "exempt", note: "Non-life insurance (for example fire or travel cover) is not on the no-VAT list.", also: "insurance" },
  { name: "Locally made sanitary pads", treatment: "zero", note: "0% VAT on pads made in Ghana. Imported pads are taxed.", also: "sanitary pad towel period" },
  { name: "Ghana-made textiles from the factory", treatment: "zero", note: "0% when sold by an approved local manufacturer, until 31 Dec 2028.", also: "cloth textile fabric wax print" },
  { name: "Goods exported from Ghana", treatment: "zero", note: "Exports are 0%.", also: "export" },
  { name: "Phone, laptop or TV", treatment: "standard", also: "phone laptop computer tv television electronics gadget" },
  { name: "Clothes, shoes, cosmetics", treatment: "standard", note: "From a VAT-registered shop.", also: "clothes shoes dress cosmetics makeup" },
  { name: "Packaged snacks and soft drinks", treatment: "standard", note: "Processed and packaged food and drinks are not on the no-VAT list.", also: "food biscuit snack soft drink soda juice supermarket" },
  { name: "Hotel or guesthouse room", treatment: "standard", also: "hotel guesthouse lodge room" },
  { name: "New house from an estate developer", treatment: "standard", note: "The old 5% flat rate ended on 1 Jan 2026; it is now 20% in total.", also: "house estate developer property real estate" },
  { name: "Betting and lottery", treatment: "standard", note: "Taken off the no-VAT list from 1 Jan 2026.", also: "bet betting lottery lotto gaming sports" },
  { name: "Netflix, Spotify and other foreign apps", treatment: "standard", note: "Since 15 Oct 2026 your bank or MoMo takes the 20% when you pay.", also: "netflix spotify app subscription digital streaming google apple" },
  { name: "Cement and building materials", treatment: "standard", also: "cement blocks iron rods building" },
];

export interface Source { label: string; url: string }

export const TAX_SOURCES: Source[] = [
  { label: "GRA — PAYE rates (new bands from 1 Sep 2026)", url: "https://gra.gov.gh/domestic-tax/tax-types/paye/" },
  { label: "PwC Ghana tax summary — personal income (reviewed 27 Oct 2026)", url: "https://taxsummaries.pwc.com/ghana/individual/taxes-on-personal-income" },
  { label: "SSNIT — 2026 minimum and maximum insurable earnings", url: "https://www.ssnit.org.gh/wp-content/uploads/2026/01/Public-Notice-Min-Max-Insurable.pdf" },
  { label: "GRA — personal tax reliefs", url: "https://gra.gov.gh/domestic-tax/personal-tax-relief/" },
];

export const VAT_SOURCES: Source[] = [
  { label: "GRA — notice to all VAT-registered taxpayers (2026 reforms)", url: "https://gra.gov.gh/news/portfolio/notice-to-all-vat-registered-taxpayers/" },
  { label: "Value Added Tax Act 2025 (Act 1151) — text and schedules", url: "https://www.a-tla.org/ghana/value-added-tax-act-2025-act-1151" },
  { label: "EY — Ghana's new indirect tax laws from 1 Jan 2026", url: "https://globaltaxnews.ey.com/news/2026-0163-ghanas-parliament-enacts-several-indirect-tax-related-laws-effective-1-january-2026" },
  { label: "KPMG — real-time VAT on foreign digital services (21 Oct 2026)", url: "https://kpmg.com/us/en/taxnewsflash/news/2026/10/tnf-ghana-real-time-vat-collection-on-cross-border-digital-services.html" },
];
