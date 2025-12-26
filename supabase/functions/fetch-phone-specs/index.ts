import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[FETCH-PHONE-SPECS] ${step}${detailsStr}`);
};

// Common phone specs database (fallback/cache)
const phoneDatabase: Record<string, {
  name: string;
  brand: string;
  specs: {
    display: string;
    processor: string;
    ram: string;
    storage: string;
    battery: string;
    camera: string;
    os: string;
    dimensions: string;
    weight: string;
    price: string;
  };
}> = {
  "iphone 15 pro max": {
    name: "iPhone 15 Pro Max",
    brand: "Apple",
    specs: {
      display: "6.7\" Super Retina XDR OLED, 120Hz ProMotion",
      processor: "Apple A17 Pro (3nm)",
      ram: "8GB",
      storage: "256GB / 512GB / 1TB",
      battery: "4441 mAh, 27W wired, 15W MagSafe",
      camera: "48MP + 12MP + 12MP (5x optical zoom)",
      os: "iOS 17",
      dimensions: "159.9 x 76.7 x 8.25 mm",
      weight: "221g",
      price: "From $1,199",
    },
  },
  "iphone 15 pro": {
    name: "iPhone 15 Pro",
    brand: "Apple",
    specs: {
      display: "6.1\" Super Retina XDR OLED, 120Hz ProMotion",
      processor: "Apple A17 Pro (3nm)",
      ram: "8GB",
      storage: "128GB / 256GB / 512GB / 1TB",
      battery: "3274 mAh, 27W wired, 15W MagSafe",
      camera: "48MP + 12MP + 12MP (3x optical zoom)",
      os: "iOS 17",
      dimensions: "146.6 x 70.6 x 8.25 mm",
      weight: "187g",
      price: "From $999",
    },
  },
  "iphone 15": {
    name: "iPhone 15",
    brand: "Apple",
    specs: {
      display: "6.1\" Super Retina XDR OLED, 60Hz",
      processor: "Apple A16 Bionic (4nm)",
      ram: "6GB",
      storage: "128GB / 256GB / 512GB",
      battery: "3349 mAh, 20W wired, 15W MagSafe",
      camera: "48MP + 12MP",
      os: "iOS 17",
      dimensions: "147.6 x 71.6 x 7.8 mm",
      weight: "171g",
      price: "From $799",
    },
  },
  "samsung galaxy s24 ultra": {
    name: "Samsung Galaxy S24 Ultra",
    brand: "Samsung",
    specs: {
      display: "6.8\" Dynamic AMOLED 2X, 120Hz, QHD+",
      processor: "Snapdragon 8 Gen 3 for Galaxy",
      ram: "12GB",
      storage: "256GB / 512GB / 1TB",
      battery: "5000 mAh, 45W wired, 15W wireless",
      camera: "200MP + 12MP + 50MP + 10MP (5x optical)",
      os: "Android 14, One UI 6.1",
      dimensions: "162.3 x 79 x 8.6 mm",
      weight: "233g",
      price: "From $1,299",
    },
  },
  "samsung galaxy s24": {
    name: "Samsung Galaxy S24",
    brand: "Samsung",
    specs: {
      display: "6.2\" Dynamic AMOLED 2X, 120Hz, FHD+",
      processor: "Exynos 2400 / Snapdragon 8 Gen 3",
      ram: "8GB",
      storage: "128GB / 256GB",
      battery: "4000 mAh, 25W wired, 15W wireless",
      camera: "50MP + 12MP + 10MP (3x optical)",
      os: "Android 14, One UI 6.1",
      dimensions: "147 x 70.6 x 7.6 mm",
      weight: "167g",
      price: "From $799",
    },
  },
  "google pixel 8 pro": {
    name: "Google Pixel 8 Pro",
    brand: "Google",
    specs: {
      display: "6.7\" LTPO OLED, 120Hz, QHD+",
      processor: "Google Tensor G3",
      ram: "12GB",
      storage: "128GB / 256GB / 512GB / 1TB",
      battery: "5050 mAh, 30W wired, 23W wireless",
      camera: "50MP + 48MP + 48MP (5x optical)",
      os: "Android 14",
      dimensions: "162.6 x 76.5 x 8.8 mm",
      weight: "213g",
      price: "From $999",
    },
  },
  "google pixel 8": {
    name: "Google Pixel 8",
    brand: "Google",
    specs: {
      display: "6.2\" OLED, 120Hz, FHD+",
      processor: "Google Tensor G3",
      ram: "8GB",
      storage: "128GB / 256GB",
      battery: "4575 mAh, 27W wired, 18W wireless",
      camera: "50MP + 12MP",
      os: "Android 14",
      dimensions: "150.5 x 70.8 x 8.9 mm",
      weight: "187g",
      price: "From $699",
    },
  },
  "oneplus 12": {
    name: "OnePlus 12",
    brand: "OnePlus",
    specs: {
      display: "6.82\" LTPO AMOLED, 120Hz, QHD+",
      processor: "Snapdragon 8 Gen 3",
      ram: "12GB / 16GB",
      storage: "256GB / 512GB",
      battery: "5400 mAh, 100W wired, 50W wireless",
      camera: "50MP + 48MP + 64MP (3x optical)",
      os: "Android 14, OxygenOS 14",
      dimensions: "164.3 x 75.8 x 9.15 mm",
      weight: "220g",
      price: "From $799",
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneName } = await req.json();
    logStep("Received request", { phoneName });

    if (!phoneName) {
      throw new Error("Phone name is required");
    }

    const normalizedName = phoneName.toLowerCase().trim();
    logStep("Normalized name", { normalizedName });

    // Check our database first
    const phoneData = phoneDatabase[normalizedName];
    
    if (phoneData) {
      logStep("Found in database", { phone: phoneData.name });
      return new Response(JSON.stringify(phoneData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Try fuzzy matching
    const matchingKey = Object.keys(phoneDatabase).find(key => 
      key.includes(normalizedName) || normalizedName.includes(key)
    );

    if (matchingKey) {
      logStep("Found fuzzy match", { key: matchingKey });
      return new Response(JSON.stringify(phoneDatabase[matchingKey]), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Phone not found", { phoneName });
    return new Response(
      JSON.stringify({ error: "Phone not found", phoneName }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
