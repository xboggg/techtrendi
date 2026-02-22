import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Key, Copy, Check, AlertCircle, CheckCircle, Clock, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DecodedJWT {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  isExpired: boolean;
  expiresAt?: Date;
  issuedAt?: Date;
}

const sampleJWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5MTYyMzkwMjJ9.4S5XxvI8w9wq9Dz3LqJN0k5aRZP6ZfC5x9w9x9w9x9w";

export default function JWTDecoder() {
  const [token, setToken] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const decoded = useMemo((): DecodedJWT | { error: string } => {
    if (!token.trim()) {
      return { error: "Enter a JWT token to decode" };
    }

    const parts = token.trim().split(".");
    if (parts.length !== 3) {
      return { error: "Invalid JWT format. A JWT should have 3 parts separated by dots." };
    }

    try {
      const header = JSON.parse(atob(parts[0].replace(/-/g, "+").replace(/_/g, "/")));
      const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
      const signature = parts[2];

      let isExpired = false;
      let expiresAt: Date | undefined;
      let issuedAt: Date | undefined;

      if (payload.exp) {
        expiresAt = new Date(payload.exp * 1000);
        isExpired = expiresAt < new Date();
      }

      if (payload.iat) {
        issuedAt = new Date(payload.iat * 1000);
      }

      return { header, payload, signature, isExpired, expiresAt, issuedAt };
    } catch {
      return { error: "Failed to decode JWT. Make sure it's a valid token." };
    }
  }, [token]);

  const isError = "error" in decoded;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
  };

  const formatJSON = (obj: Record<string, unknown>) => {
    return JSON.stringify(obj, null, 2);
  };

  const loadSample = () => {
    setToken(sampleJWT);
    toast.success("Sample JWT loaded!");
  };

  const getClaimDescription = (key: string): string => {
    const claims: Record<string, string> = {
      iss: "Issuer - Who issued the token",
      sub: "Subject - Who the token is about",
      aud: "Audience - Who the token is for",
      exp: "Expiration Time - When the token expires",
      nbf: "Not Before - When the token becomes valid",
      iat: "Issued At - When the token was issued",
      jti: "JWT ID - Unique identifier for the token",
      name: "Full name of the user",
      email: "Email address",
      role: "User role or roles",
      scope: "OAuth scopes",
      permissions: "User permissions",
    };
    return claims[key] || "";
  };

  return (
    <Layout>
      <SEOHead
        title="JWT Decoder - Decode JSON Web Tokens | TechTrendi"
        description="Decode and inspect JWT tokens online. View header, payload, and verify token expiration. Free JWT debugger tool."
        canonicalUrl="https://techtrendi.com/tools/jwt-decoder"
      />

      <div className="container py-12 md:py-20 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            JWT <span className="text-primary">Decoder</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Decode and inspect JSON Web Tokens (JWT) instantly
          </p>
        </div>

        {/* Input */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                JWT Token
              </CardTitle>
              <Button variant="outline" size="sm" onClick={loadSample}>
                Load Sample
              </Button>
            </div>
            <CardDescription>Paste your JWT token below to decode it</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U"
              className="font-mono text-sm min-h-[120px]"
            />
          </CardContent>
        </Card>

        {/* Results */}
        {isError ? (
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                <AlertCircle className="w-6 h-6" />
                <span>{decoded.error}</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Status Banner */}
            <Card className={cn(
              "border-2",
              decoded.isExpired
                ? "border-red-500 bg-red-50 dark:bg-red-950"
                : "border-green-500 bg-green-50 dark:bg-green-950"
            )}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    {decoded.isExpired ? (
                      <>
                        <AlertCircle className="w-6 h-6 text-red-500" />
                        <span className="font-semibold text-red-700 dark:text-red-400">
                          Token Expired
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-6 h-6 text-green-500" />
                        <span className="font-semibold text-green-700 dark:text-green-400">
                          Token Valid
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    {decoded.issuedAt && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>Issued: {decoded.issuedAt.toLocaleString()}</span>
                      </div>
                    )}
                    {decoded.expiresAt && (
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        <span>Expires: {decoded.expiresAt.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-red-500">Header</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(formatJSON(decoded.header), "header")}
                    >
                      {copied === "header" ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <CardDescription>Algorithm & token type</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm font-mono">
                    {formatJSON(decoded.header)}
                  </pre>
                  <div className="mt-4 space-y-2">
                    {Object.entries(decoded.header).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <code className="text-primary">{key}</code>
                        <span className="text-muted-foreground">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Payload */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-purple-500">Payload</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(formatJSON(decoded.payload), "payload")}
                    >
                      {copied === "payload" ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <CardDescription>Token claims & data</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm font-mono max-h-[200px]">
                    {formatJSON(decoded.payload)}
                  </pre>
                  <div className="mt-4 space-y-3 max-h-[300px] overflow-y-auto">
                    {Object.entries(decoded.payload).map(([key, value]) => {
                      const description = getClaimDescription(key);
                      let displayValue = String(value);

                      // Format timestamps
                      if ((key === "exp" || key === "iat" || key === "nbf") && typeof value === "number") {
                        displayValue = new Date(value * 1000).toLocaleString();
                      }

                      return (
                        <div key={key} className="p-2 rounded bg-muted/50">
                          <div className="flex items-center justify-between">
                            <code className="text-primary font-medium">{key}</code>
                            <span className="text-sm truncate max-w-[200px]">{displayValue}</span>
                          </div>
                          {description && (
                            <p className="text-xs text-muted-foreground mt-1">{description}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Signature */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-blue-500">Signature</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(decoded.signature, "signature")}
                  >
                    {copied === "signature" ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <CardDescription>Cryptographic signature (cannot be verified client-side)</CardDescription>
              </CardHeader>
              <CardContent>
                <code className="block p-4 bg-muted rounded-lg text-sm font-mono break-all">
                  {decoded.signature}
                </code>
                <p className="text-xs text-muted-foreground mt-3">
                  Note: Signature verification requires the secret key and must be done server-side.
                </p>
              </CardContent>
            </Card>

            {/* JWT Structure Info */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">Understanding JWT Structure</h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <Badge variant="outline" className="text-red-500 border-red-500 mb-2">Header</Badge>
                    <p className="text-muted-foreground">
                      Contains the token type (JWT) and signing algorithm (e.g., HS256, RS256)
                    </p>
                  </div>
                  <div>
                    <Badge variant="outline" className="text-purple-500 border-purple-500 mb-2">Payload</Badge>
                    <p className="text-muted-foreground">
                      Contains claims - statements about the user and additional metadata
                    </p>
                  </div>
                  <div>
                    <Badge variant="outline" className="text-blue-500 border-blue-500 mb-2">Signature</Badge>
                    <p className="text-muted-foreground">
                      Verifies the token hasn't been tampered with using a secret key
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
