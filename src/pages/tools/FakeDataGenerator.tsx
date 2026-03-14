import { useState, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { Database, Copy, Download, RefreshCw, Code, FileJson, Table, Check, Trash2, Clock, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

// ============================================================
// DATA POOLS (per locale)
// ============================================================

interface LocaleData {
  firstNames: { male: string[]; female: string[] };
  lastNames: string[];
  streets: string[];
  cities: string[];
  states: string[];
  phoneFmt: string; // # = digit
  countryCode: string;
  zipFmt: string;
  domains: string[];
}

const LOCALES: Record<string, LocaleData> = {
  US: {
    firstNames: {
      male: ["James","John","Robert","Michael","David","William","Richard","Joseph","Thomas","Daniel","Matthew","Anthony","Christopher","Andrew","Joshua","Ethan","Ryan","Nathan","Brandon","Kevin"],
      female: ["Mary","Patricia","Jennifer","Linda","Barbara","Elizabeth","Susan","Jessica","Sarah","Karen","Lisa","Nancy","Ashley","Emily","Donna","Michelle","Dorothy","Carol","Amanda","Melissa"],
    },
    lastNames: ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin"],
    streets: ["Main St","Oak Ave","Maple Dr","Cedar Ln","Elm St","Pine Rd","Washington Blvd","Park Ave","Broadway","Lake Dr","Sunset Blvd","River Rd","Hill St","Forest Ave","Spring St","Church St","Market St","Valley Rd","Union Ave","High St"],
    cities: ["New York","Los Angeles","Chicago","Houston","Phoenix","Philadelphia","San Antonio","San Diego","Dallas","Austin","Jacksonville","San Jose","Columbus","Charlotte","Indianapolis","Seattle","Denver","Boston","Nashville","Portland"],
    states: ["CA","NY","TX","FL","IL","PA","OH","GA","NC","MI","NJ","VA","WA","AZ","MA","TN","IN","MO","MD","WI"],
    phoneFmt: "(###) ###-####",
    countryCode: "+1",
    zipFmt: "#####",
    domains: [".com",".net",".org",".io",".co"],
  },
  UK: {
    firstNames: {
      male: ["Oliver","George","Harry","Jack","Jacob","Noah","Charlie","Muhammad","Thomas","Oscar","William","James","Leo","Alfie","Henry","Archie","Edward","Samuel","Joseph","David"],
      female: ["Olivia","Amelia","Isla","Ava","Emily","Sophia","Grace","Mia","Poppy","Ella","Lily","Charlotte","Jessica","Daisy","Sophie","Freya","Alice","Evelyn","Rosie","Florence"],
    },
    lastNames: ["Smith","Jones","Williams","Taylor","Brown","Davies","Evans","Wilson","Thomas","Roberts","Johnson","Lewis","Walker","Robinson","Wood","Thompson","White","Watson","Jackson","Wright"],
    streets: ["High Street","Station Road","Church Lane","Park Road","Victoria Road","Manor Road","Mill Lane","Kings Road","Queens Road","London Road","School Lane","Green Lane","North Road","South Street","West End","East Road","Bridge Street","Hill Road","Chapel Lane","Garden Close"],
    cities: ["London","Manchester","Birmingham","Leeds","Glasgow","Liverpool","Edinburgh","Bristol","Sheffield","Newcastle","Nottingham","Leicester","Brighton","Oxford","Cambridge","Cardiff","Southampton","York","Bath","Canterbury"],
    states: ["England","Scotland","Wales","Northern Ireland"],
    phoneFmt: "07### ######",
    countryCode: "+44",
    zipFmt: "AA# #AA",
    domains: [".co.uk",".uk",".com",".org.uk"],
  },
  GH: {
    firstNames: {
      male: ["Kwame","Kofi","Kwesi","Kwadwo","Yaw","Kwabena","Kojo","Komla","Edem","Fiifi","Nana","Kobina","Ebo","Mensah","Ofori","Asante","Osei","Boateng","Adjei","Tetteh"],
      female: ["Ama","Akua","Abena","Adwoa","Yaa","Afia","Efua","Akosua","Esi","Aba","Nana","Adjoa","Afua","Araba","Ekua","Adzo","Mawusi","Dzifa","Sena","Emefa"],
    },
    lastNames: ["Mensah","Owusu","Asante","Boateng","Osei","Agyemang","Appiah","Adjei","Amoah","Badu","Darko","Frimpong","Gyamfi","Kusi","Nkrumah","Opoku","Sarpong","Tetteh","Yeboah","Acheampong"],
    streets: ["Independence Ave","Liberation Road","Oxford Street","Ring Road","Castle Road","High Street","Kwame Nkrumah Ave","Cantonments Rd","Spintex Road","Tema Motorway","Airport Bypass","Achimota Rd","Graphic Road","Barnes Road","Farrar Ave","Boundary Road","Ridge St","Labone Crescent","Osu Badu St","Adabraka Lane"],
    cities: ["Accra","Kumasi","Tamale","Takoradi","Cape Coast","Sunyani","Ho","Koforidua","Bolgatanga","Wa","Tema","Techiman","Obuasi","Nkawkaw","Hohoe","Winneba","Aflao","Kasoa","Madina","Dansoman"],
    states: ["Greater Accra","Ashanti","Northern","Western","Central","Eastern","Volta","Bono","Upper East","Upper West","Oti","Savannah","North East","Bono East","Ahafo","Western North"],
    phoneFmt: "0## ### ####",
    countryCode: "+233",
    zipFmt: "GA-###-####",
    domains: [".com.gh",".gh",".com",".org.gh"],
  },
  NG: {
    firstNames: {
      male: ["Chukwuemeka","Oluwaseun","Adebayo","Chinedu","Emeka","Obinna","Tunde","Ifeanyi","Olumide","Babatunde","Uche","Nnamdi","Olamide","Yemi","Dayo","Kunle","Segun","Ikenna","Femi","Adeola"],
      female: ["Chioma","Ngozi","Adaeze","Funmilayo","Yetunde","Bukola","Amara","Ifeoma","Oluchi","Folake","Nneka","Titilayo","Aisha","Halima","Zainab","Fatima","Adaora","Chiamaka","Nkechi","Toyin"],
    },
    lastNames: ["Okafor","Adeyemi","Ibrahim","Ogundimu","Balogun","Nwosu","Abubakar","Okonkwo","Eze","Afolabi","Musa","Chukwu","Oladipo","Nwachukwu","Yusuf","Adeniyi","Okoro","Emeka","Danjuma","Adebisi"],
    streets: ["Broad Street","Marina Road","Allen Avenue","Admiralty Way","Adeola Odeku","Awolowo Road","Herbert Macaulay","Bode Thomas","Opebi Road","Ikorodu Road","Airport Road","Aba Road","Azikiwe Road","Ahmadu Bello Way","Ibrahim Taiwo Road","Murtala Mohammed Way","Yakubu Gowon Way","Ademola Adetokunbo","Victoria Island Rd","Ozumba Mbadiwe Ave"],
    cities: ["Lagos","Abuja","Kano","Ibadan","Port Harcourt","Benin City","Kaduna","Enugu","Calabar","Jos","Abeokuta","Owerri","Warri","Ilorin","Maiduguri","Sokoto","Uyo","Asaba","Akure","Ado-Ekiti"],
    states: ["Lagos","FCT","Kano","Oyo","Rivers","Edo","Kaduna","Enugu","Cross River","Plateau","Ogun","Imo","Delta","Kwara","Borno","Sokoto","Akwa Ibom","Anambra","Ondo","Ekiti"],
    phoneFmt: "0### ### ####",
    countryCode: "+234",
    zipFmt: "######",
    domains: [".com.ng",".ng",".com",".org.ng"],
  },
};

const LOCALE_LABELS: Record<string, string> = {
  US: "United States",
  UK: "United Kingdom",
  GH: "Ghana",
  NG: "Nigeria",
};

// ============================================================
// DATA TYPES
// ============================================================

type DataType =
  | "name"
  | "email"
  | "phone"
  | "address"
  | "company"
  | "creditcard"
  | "uuid"
  | "ip"
  | "url"
  | "date"
  | "paragraph"
  | "json"
  | "username"
  | "password";

const DATA_TYPES: { value: DataType; label: string }[] = [
  { value: "name", label: "Full Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone Number" },
  { value: "address", label: "Address" },
  { value: "company", label: "Company Name" },
  { value: "creditcard", label: "Credit Card (fake)" },
  { value: "uuid", label: "UUID" },
  { value: "ip", label: "IP Address" },
  { value: "url", label: "URL" },
  { value: "date", label: "Date" },
  { value: "paragraph", label: "Paragraph (Lorem Ipsum)" },
  { value: "json", label: "JSON Object" },
  { value: "username", label: "Username" },
  { value: "password", label: "Password" },
];

type OutputFormat = "plain" | "json" | "csv" | "sql";

// ============================================================
// RANDOM HELPERS
// ============================================================

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function formatPattern(pattern: string): string {
  let result = "";
  for (const ch of pattern) {
    if (ch === "#") {
      result += rand(0, 9).toString();
    } else if (ch === "A") {
      result += String.fromCharCode(65 + rand(0, 25));
    } else {
      result += ch;
    }
  }
  return result;
}

function generateUUID(): string {
  const hex = () => rand(0, 15).toString(16);
  const s = (n: number) => Array.from({ length: n }, hex).join("");
  return `${s(8)}-${s(4)}-4${s(3)}-${pick(["8","9","a","b"])}${s(3)}-${s(12)}`;
}

// ============================================================
// Lorem Ipsum corpus
// ============================================================

const LOREM_WORDS = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum".split(" ");

function loremSentence(): string {
  const len = rand(8, 18);
  const words = Array.from({ length: len }, () => pick(LOREM_WORDS));
  words[0] = words[0][0].toUpperCase() + words[0].slice(1);
  return words.join(" ") + ".";
}

function loremParagraph(): string {
  return Array.from({ length: rand(3, 7) }, loremSentence).join(" ");
}

// ============================================================
// Company name parts
// ============================================================

const COMPANY_PREFIXES = ["Global","Tech","Apex","Nova","Prime","Vertex","Zenith","Quantum","Alpha","Nexus","Vanguard","Summit","Pacific","Atlantic","Sterling","Pinnacle","Frontier","Horizon","Crest","Titan"];
const COMPANY_SUFFIXES = ["Solutions","Technologies","Systems","Industries","Enterprises","Group","Corp","Labs","Dynamics","Innovations","Partners","Holdings","Digital","Analytics","Consulting","Ventures","Networks","Studios","Capital","Works"];

// ============================================================
// GENERATOR
// ============================================================

function generate(type: DataType, locale: string): string {
  const L = LOCALES[locale] || LOCALES.US;
  const gender = pick(["male", "female"] as const);
  const firstName = pick(L.firstNames[gender]);
  const lastName = pick(L.lastNames);

  switch (type) {
    case "name":
      return `${firstName} ${lastName}`;
    case "email": {
      const sep = pick([".", "_", ""]);
      const num = rand(1, 99);
      const domain = pick(["gmail.com","yahoo.com","outlook.com","hotmail.com","protonmail.com","mail.com","icloud.com","zoho.com"]);
      return `${firstName.toLowerCase()}${sep}${lastName.toLowerCase()}${num}@${domain}`;
    }
    case "phone":
      return `${L.countryCode} ${formatPattern(L.phoneFmt)}`;
    case "address": {
      const num = rand(1, 9999);
      return `${num} ${pick(L.streets)}, ${pick(L.cities)}, ${pick(L.states)} ${formatPattern(L.zipFmt)}`;
    }
    case "company":
      return `${pick(COMPANY_PREFIXES)} ${pick(COMPANY_SUFFIXES)}`;
    case "creditcard": {
      // Generate Luhn-valid-looking 16 digit number (always starts with 4 for Visa look)
      const prefix = pick(["4","5","37","6011"]);
      const remaining = 16 - prefix.length - 1;
      let digits = prefix + Array.from({ length: remaining }, () => rand(0, 9)).join("");
      // Luhn check digit
      let sum = 0;
      for (let i = 0; i < digits.length; i++) {
        let d = parseInt(digits[digits.length - 1 - i]);
        if (i % 2 === 0) { d *= 2; if (d > 9) d -= 9; }
        sum += d;
      }
      const checkDigit = (10 - (sum % 10)) % 10;
      digits += checkDigit;
      return digits.replace(/(.{4})/g, "$1 ").trim();
    }
    case "uuid":
      return generateUUID();
    case "ip":
      return `${rand(1,255)}.${rand(0,255)}.${rand(0,255)}.${rand(1,254)}`;
    case "url": {
      const protocol = pick(["https","http"]);
      const sub = pick(["www","app","api","dev","staging","docs","portal","dashboard"]);
      const word = pick(COMPANY_PREFIXES).toLowerCase();
      const domain = pick(L.domains);
      const path = pick(["","/about","/products","/api/v1","/dashboard","/users","/docs","/blog",`/items/${rand(1,999)}`]);
      return `${protocol}://${sub}.${word}${domain}${path}`;
    }
    case "date": {
      const year = rand(2000, 2026);
      const month = rand(1, 12);
      const day = rand(1, 28);
      return `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    }
    case "paragraph":
      return loremParagraph();
    case "json":
      return JSON.stringify({
        id: generateUUID(),
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${pick(["gmail.com","outlook.com","company.com"])}`,
        age: rand(18, 75),
        active: pick([true, false]),
        role: pick(["admin","user","editor","viewer","moderator"]),
        createdAt: `${rand(2020, 2026)}-${rand(1,12).toString().padStart(2,"0")}-${rand(1,28).toString().padStart(2,"0")}T${rand(0,23).toString().padStart(2,"0")}:${rand(0,59).toString().padStart(2,"0")}:00Z`,
      }, null, 2);
    case "username": {
      const styles = [
        `${firstName.toLowerCase()}${rand(1,999)}`,
        `${firstName.toLowerCase()}_${lastName.toLowerCase()}`,
        `${pick(["x","the","mr","ms","dr","pro","dev","code","tech"])}${firstName.toLowerCase()}`,
        `${firstName.toLowerCase()}${lastName[0].toLowerCase()}${rand(10,99)}`,
      ];
      return pick(styles);
    }
    case "password": {
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=";
      const len = rand(12, 20);
      return Array.from({ length: len }, () => chars[rand(0, chars.length - 1)]).join("");
    }
    default:
      return "";
  }
}

// ============================================================
// TEMPLATE PARSER
// ============================================================

function processTemplate(template: string, locale: string): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const typeMap: Record<string, DataType> = {
      name: "name",
      email: "email",
      phone: "phone",
      address: "address",
      company: "company",
      creditcard: "creditcard",
      uuid: "uuid",
      ip: "ip",
      url: "url",
      date: "date",
      paragraph: "paragraph",
      json: "json",
      username: "username",
      password: "password",
    };
    const dt = typeMap[key.toLowerCase()];
    if (dt) return generate(dt, locale);
    return `{{${key}}}`;
  });
}

// ============================================================
// OUTPUT FORMATTERS
// ============================================================

function formatOutput(items: string[], dataType: DataType, format: OutputFormat, tableName: string): string {
  switch (format) {
    case "plain":
      return items.join("\n");
    case "json":
      if (dataType === "json") {
        try {
          const objs = items.map((i) => JSON.parse(i));
          return JSON.stringify(objs, null, 2);
        } catch {
          return JSON.stringify(items, null, 2);
        }
      }
      return JSON.stringify(items, null, 2);
    case "csv": {
      if (dataType === "json") {
        try {
          const objs = items.map((i) => JSON.parse(i));
          if (objs.length === 0) return "";
          const headers = Object.keys(objs[0]);
          const rows = objs.map((o: Record<string, unknown>) =>
            headers.map((h) => `"${String(o[h] ?? "").replace(/"/g, '""')}"`).join(",")
          );
          return [headers.join(","), ...rows].join("\n");
        } catch {
          return items.map((i) => `"${i.replace(/"/g, '""')}"`).join("\n");
        }
      }
      return items.map((i) => `"${i.replace(/"/g, '""')}"`).join("\n");
    }
    case "sql": {
      const tbl = tableName || "fake_data";
      if (dataType === "json") {
        try {
          const objs = items.map((i) => JSON.parse(i));
          if (objs.length === 0) return "";
          const headers = Object.keys(objs[0]);
          const rows = objs.map((o: Record<string, unknown>) => {
            const vals = headers.map((h) => {
              const v = o[h];
              if (typeof v === "number" || typeof v === "boolean") return String(v);
              return `'${String(v ?? "").replace(/'/g, "''")}'`;
            });
            return `INSERT INTO ${tbl} (${headers.join(", ")}) VALUES (${vals.join(", ")});`;
          });
          return rows.join("\n");
        } catch {
          return items.map((i) => `INSERT INTO ${tbl} (value) VALUES ('${i.replace(/'/g, "''")}');`).join("\n");
        }
      }
      const col = dataType;
      return items.map((i) => `INSERT INTO ${tbl} (${col}) VALUES ('${i.replace(/'/g, "''")}');`).join("\n");
    }
    default:
      return items.join("\n");
  }
}

// ============================================================
// HISTORY ENTRY
// ============================================================

interface HistoryEntry {
  id: string;
  type: DataType | "template";
  locale: string;
  count: number;
  format: OutputFormat;
  timestamp: number;
  preview: string;
}

// ============================================================
// COMPONENT
// ============================================================

export default function FakeDataGenerator() {
  const [dataType, setDataType] = useState<DataType>("name");
  const [quantity, setQuantity] = useState(10);
  const [locale, setLocale] = useState("US");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("plain");
  const [tableName, setTableName] = useState("fake_data");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("generate");
  const [template, setTemplate] = useState("Hello {{name}}, your order #{{uuid}} ships to {{address}}");
  const [templateOutput, setTemplateOutput] = useState("");
  const [templateQty, setTemplateQty] = useState(5);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const addToHistory = useCallback((type: DataType | "template", count: number, fmt: OutputFormat, loc: string, preview: string) => {
    setHistory((prev) => {
      const entry: HistoryEntry = {
        id: generateUUID(),
        type,
        locale: loc,
        count,
        format: fmt,
        timestamp: Date.now(),
        preview: preview.slice(0, 120) + (preview.length > 120 ? "..." : ""),
      };
      return [entry, ...prev].slice(0, 20);
    });
  }, []);

  const handleGenerate = () => {
    const clamped = Math.max(1, Math.min(100, quantity));
    const items = Array.from({ length: clamped }, () => generate(dataType, locale));
    const formatted = formatOutput(items, dataType, outputFormat, tableName);
    setOutput(formatted);
    addToHistory(dataType, clamped, outputFormat, locale, formatted);
  };

  const handleTemplateGenerate = () => {
    const clamped = Math.max(1, Math.min(100, templateQty));
    const lines = Array.from({ length: clamped }, () => processTemplate(template, locale));
    const result = lines.join("\n\n");
    setTemplateOutput(result);
    addToHistory("template", clamped, "plain", locale, result);
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = (text: string, filename: string) => {
    const ext = outputFormat === "json" ? "json" : outputFormat === "csv" ? "csv" : outputFormat === "sql" ? "sql" : "txt";
    const mimeMap: Record<string, string> = { json: "application/json", csv: "text/csv", sql: "application/sql", txt: "text/plain" };
    const blob = new Blob([text], { type: mimeMap[ext] || "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatIcons: Record<OutputFormat, typeof FileJson> = {
    plain: Table,
    json: FileJson,
    csv: Table,
    sql: Code,
  };

  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Fake Data Generator</h1>
            <p className="text-muted-foreground">
              Generate realistic test data for development &mdash; 100% client-side, no API calls
            </p>
          </motion.div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="generate" className="gap-2">
                <Database className="w-4 h-4" />
                Generate
              </TabsTrigger>
              <TabsTrigger value="template" className="gap-2">
                <Code className="w-4 h-4" />
                Template
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <Clock className="w-4 h-4" />
                History
              </TabsTrigger>
            </TabsList>

            {/* ==================== GENERATE TAB ==================== */}
            <TabsContent value="generate">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Data Type */}
                      <div className="space-y-2">
                        <Label>Data Type</Label>
                        <select
                          value={dataType}
                          onChange={(e) => setDataType(e.target.value as DataType)}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        >
                          {DATA_TYPES.map((dt) => (
                            <option key={dt.value} value={dt.value}>
                              {dt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="space-y-2">
                        <Label>Quantity (1-100)</Label>
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={quantity}
                          onChange={(e) => setQuantity(Number(e.target.value))}
                        />
                      </div>

                      {/* Locale */}
                      <div className="space-y-2">
                        <Label>Locale / Region</Label>
                        <select
                          value={locale}
                          onChange={(e) => setLocale(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        >
                          {Object.entries(LOCALE_LABELS).map(([code, label]) => (
                            <option key={code} value={code}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Output Format */}
                      <div className="space-y-2">
                        <Label>Output Format</Label>
                        <select
                          value={outputFormat}
                          onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        >
                          <option value="plain">Plain Text</option>
                          <option value="json">JSON</option>
                          <option value="csv">CSV</option>
                          <option value="sql">SQL INSERT</option>
                        </select>
                      </div>
                    </div>

                    {/* SQL Table Name */}
                    {outputFormat === "sql" && (
                      <div className="mt-4 max-w-xs">
                        <Label>Table Name</Label>
                        <Input
                          value={tableName}
                          onChange={(e) => setTableName(e.target.value)}
                          placeholder="fake_data"
                          className="mt-1"
                        />
                      </div>
                    )}

                    {/* Generate Button */}
                    <div className="mt-6">
                      <Button onClick={handleGenerate} className="gap-2">
                        <Play className="w-4 h-4" />
                        Generate Data
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Output */}
                {output && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {(() => {
                              const Icon = formatIcons[outputFormat];
                              return <Icon className="w-5 h-5" />;
                            })()}
                            Output
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {outputFormat.toUpperCase()}
                            </Badge>
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleGenerate}
                              className="gap-1"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Regenerate
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(output)}
                              className="gap-1"
                            >
                              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              {copied ? "Copied!" : "Copy"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadFile(output, `fake_${dataType}`)}
                              className="gap-1"
                            >
                              <Download className="w-3 h-3" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="max-h-[500px] overflow-auto p-4 rounded-lg border border-border bg-muted/30 font-mono text-sm whitespace-pre-wrap break-all">
                          {output}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </motion.div>
            </TabsContent>

            {/* ==================== TEMPLATE TAB ==================== */}
            <TabsContent value="template">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Custom Template Builder</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Template</Label>
                        <Textarea
                          value={template}
                          onChange={(e) => setTemplate(e.target.value)}
                          placeholder='Hello {{name}}, your order #{{uuid}} ships to {{address}}'
                          className="min-h-[100px] font-mono text-sm"
                        />
                      </div>

                      {/* Available placeholders */}
                      <div>
                        <Label className="text-sm text-muted-foreground mb-2 block">Available placeholders:</Label>
                        <div className="flex flex-wrap gap-2">
                          {DATA_TYPES.map((dt) => (
                            <Badge
                              key={dt.value}
                              variant="outline"
                              className="cursor-pointer hover:bg-muted transition-colors text-xs"
                              onClick={() =>
                                setTemplate((prev) => prev + `{{${dt.value}}}`)
                              }
                            >
                              {`{{${dt.value}}}`}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-end gap-4">
                        <div className="space-y-2">
                          <Label>Quantity (1-100)</Label>
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            value={templateQty}
                            onChange={(e) => setTemplateQty(Number(e.target.value))}
                            className="w-28"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Locale</Label>
                          <select
                            value={locale}
                            onChange={(e) => setLocale(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                          >
                            {Object.entries(LOCALE_LABELS).map(([code, label]) => (
                              <option key={code} value={code}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Button onClick={handleTemplateGenerate} className="gap-2">
                          <Play className="w-4 h-4" />
                          Generate
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Template Output */}
                {templateOutput && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Template Output</CardTitle>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleTemplateGenerate}
                              className="gap-1"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Regenerate
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(templateOutput)}
                              className="gap-1"
                            >
                              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              {copied ? "Copied!" : "Copy"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadFile(templateOutput, "fake_template")}
                              className="gap-1"
                            >
                              <Download className="w-3 h-3" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="max-h-[500px] overflow-auto p-4 rounded-lg border border-border bg-muted/30 font-mono text-sm whitespace-pre-wrap">
                          {templateOutput}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </motion.div>
            </TabsContent>

            {/* ==================== HISTORY TAB ==================== */}
            <TabsContent value="history">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {history.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <Clock className="w-12 h-12 mx-auto mb-4 opacity-40" />
                      <p>No generation history yet.</p>
                      <p className="text-sm mt-1">Generate some data and it will appear here.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">
                        {history.length} recent generation{history.length !== 1 ? "s" : ""}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setHistory([])}
                        className="gap-1 text-muted-foreground"
                      >
                        <Trash2 className="w-3 h-3" />
                        Clear
                      </Button>
                    </div>
                    {history.map((entry) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <Card className="hover:border-primary/30 transition-colors">
                          <CardContent className="py-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <Badge variant="secondary" className="text-xs">
                                    {entry.type === "template"
                                      ? "Template"
                                      : DATA_TYPES.find((d) => d.value === entry.type)?.label ?? entry.type}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {entry.format.toUpperCase()}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {LOCALE_LABELS[entry.locale] ?? entry.locale}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    x{entry.count}
                                  </span>
                                </div>
                                <p className="text-xs font-mono text-muted-foreground truncate">
                                  {entry.preview}
                                </p>
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(entry.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </TabsContent>
          </Tabs>

          {/* Info Section */}
          <div className="mt-12 p-6 bg-muted/30 rounded-xl">
            <h2 className="font-semibold mb-4">About Fake Data Generator</h2>
            <div className="grid md:grid-cols-3 gap-6 text-sm text-muted-foreground">
              <div>
                <h3 className="font-medium text-foreground mb-2">14 Data Types</h3>
                <ul className="space-y-1">
                  <li>Names, emails, phone numbers</li>
                  <li>Addresses, company names</li>
                  <li>Credit cards, UUIDs, IPs</li>
                  <li>URLs, dates, paragraphs</li>
                  <li>JSON objects, usernames, passwords</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-2">Output Formats</h3>
                <ul className="space-y-1">
                  <li>Plain text for quick use</li>
                  <li>JSON for API mocking</li>
                  <li>CSV for spreadsheets</li>
                  <li>SQL INSERT statements for databases</li>
                  <li>Custom templates with placeholders</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-2">Privacy First</h3>
                <ul className="space-y-1">
                  <li>100% client-side generation</li>
                  <li>No data sent to any server</li>
                  <li>Credit card numbers are fake</li>
                  <li>Locale-aware realistic output</li>
                  <li>Copy or download instantly</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
