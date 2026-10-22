// Practical advice, written only from facts in the dataset. Every number is
// computed from the data at render time; every rule is the network's own
// wording from familyInfo / networkFacts / bundle notes. If a fact is missing
// from the data, its card simply does not appear.
import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { Lightbulb, AlertOctagon, Infinity as InfinityIcon, Moon, RefreshCw, Lock, Phone, Coins, Sparkles, Gauge, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { GROUPS, bandFor, canWin, conditionalReason, hasConflict, isAllDay, isConditional, neverExpires, type Bundle, type BundleModel } from "@/lib/dataBundles";
import { CodesIn, Details, NetPill, SectionHeading, fmtDate, glass } from "./shared";

interface Tip { id: string; icon: ReactNode; title: string; body: ReactNode; networks: string[]; tone?: "warn" }

export function buildTips(model: BundleModel, only?: string): Tip[] {
  const tips: Tip[] = [];
  const r = model.rates;
  const money = model.money;
  const has = (n: string) => model.networks.includes(n) && (!only || only === n);
  const data = (mb: number, n: string) => model.fmtData(mb, n);

  // 1. Out-of-bundle / pay-as-you-go cost, every network that publishes one.
  const oob = model.networks.filter(has).map((n) => model.outOfBundle(n)).filter((x): x is NonNullable<typeof x> => !!x);
  if (oob.length) {
    tips.push({
      id: "oob", tone: "warn", networks: oob.map((o) => o.network), icon: <AlertOctagon className="h-5 w-5" aria-hidden />,
      title: "Never browse without a bundle",
      body: (
        <ul className="space-y-1.5">
          {oob.map((o) => {
            const name = model.networkInfo(o.network).name;
            const best = model.bestForBudget(o.network, 1);
            return (
              <li key={o.network}>
                <b>{name}</b> charges {model.rate(o.perMb)} per MB {o.label}, which is {money(o.perMb * model.mbPerGb(o.network))} per GB.
                {" "}{money(1)} that way buys about {data(1 / o.perMb, o.network)}
                {best && <>; the same {money(1)} spent on {model.spendName(best)} buys {model.dataShown(best)} ({model.validityText(best)})</>}.
                {o.note && <span className="block text-xs">{o.note}</span>}
              </li>
            );
          })}
        </ul>
      ),
    });
  }

  // 2. MTN special amounts.
  if (r && has("mtn")) {
    const specials = r.regular.filter((b) => b.exactly !== undefined).map((b) => b.exactly!);
    if (specials.length) {
      tips.push({
        id: "specials", networks: ["mtn"], icon: <Sparkles className="h-5 w-5" aria-hidden />,
        title: `Spend exactly ${specials.map((s) => money(s)).join(", ")} on MTN`,
        body: (
          <ul className="space-y-1">
            {specials.map((s) => {
              const at = model.regularMb(s);
              const below = model.regularMb(Math.round((s - 0.01) * 100) / 100);
              const above = model.regularMb(Math.round((s + 0.01) * 100) / 100);
              return (
                <li key={s}>
                  <b>{money(s)}</b> buys {data(at, "mtn")}
                  {below > 0 && <>, while {money(s - 0.01)} buys {data(below, "mtn")}</>}
                  {above > 0 ? <> and {money(s + 0.01)} buys {data(above, "mtn")}</> : <>; MTN publishes no rate above {money(s)}</>}.
                </li>
              );
            })}
          </ul>
        ),
      });
    }
  }

  // 2b. Spend cliffs: amounts that buy LESS data than a smaller amount in the same
  // published rate table (MTN: GH¢5 buys 521.03 MB, GH¢5.01 to GH¢7.32 buy less).
  // Worked out from the rates by the model; no figure is written here.
  const cliffs = model.cliffSources().filter((x) => has(x.source.network));
  if (cliffs.length) {
    tips.push({
      id: "cliffs", tone: "warn", networks: [...new Set(cliffs.map((x) => x.source.network))], icon: <TrendingDown className="h-5 w-5" aria-hidden />,
      title: "Spending a little more can buy less data",
      body: (
        <>
          <p>The rate per MB changes with the amount, and some amounts buy less data than a smaller one:</p>
          <ul className="mt-2 space-y-1.5">
            {cliffs.map(({ source: s, cliffs: cs }) => (
              <li key={s.id}>
                <b>{s.label}:</b>{" "}
                {cs.map((c, i) => {
                  const from = s.validity(bandFor(c.from, s.table)!), best = s.validity(bandFor(c.better, s.table)!);
                  return (
                    <span key={c.from}>
                      {i > 0 && " "}{money(c.better)} buys {data(c.betterMb, s.network)}; {c.from === c.to ? <>{money(c.from)} buys less</> : <>anything from {money(c.from)} to {money(c.to)} buys less</>}, so spend {money(c.better)}{from !== best ? ` (${money(c.better)} lasts ${best.toLowerCase()}, the higher amounts ${from.toLowerCase()})` : ""}.
                    </span>
                  );
                })}
              </li>
            ))}
          </ul>
          <p className="mt-1">The calculators warn you when an amount you type is one of these.</p>
        </>
      ),
    });
  }

  // 3. Borrowed data (MTN Xtrabyte, AT Data Kredit): what you repay, in the network's own
  // figures. Borrowed data is a loan, not a bundle: it is never compared with bundles or ranked.
  const borrowed = model.borrowed().filter((x) => has(x.network));
  if (borrowed.length) {
    tips.push({
      id: "borrowed", networks: [...new Set(borrowed.map((x) => x.network))], icon: <Coins className="h-5 w-5" aria-hidden />,
      title: "Borrowed data is a loan you pay back, plus a fee",
      body: (
        <>
          <ul className="space-y-1.5">
            {borrowed.map(({ network: n, key, title, block }) => {
              const rows = (block.rows ?? []).filter((x) => typeof x.price === "number" && typeof x.totalDebt === "number");
              const lo = rows[0], hi = rows[rows.length - 1];
              return (
                <li key={`${n}-${key}`}>
                  <b>{model.networkInfo(n).name} {title}</b>{block.ussd ? ` (${block.ussd})` : ""}:
                  {typeof block.feePercent === "number" && <> a {block.feePercent}% fee on what you borrow</>}
                  {lo && hi && <>; for example, {model.borrowedVolume(lo)} for {money(lo.price!)} means repaying {money(lo.totalDebt!)}{hi !== lo && <>, and {model.borrowedVolume(hi)} for {money(hi.price!)} means repaying {money(hi.totalDebt!)}</>}</>}.
                </li>
              );
            })}
          </ul>
          <p className="mt-2">Borrowed data is not a bundle you buy, so it is never compared with bundles or used in any ranking, finder or planner here. Use it only when you cannot top up, and remember the repayment.</p>
        </>
      ),
    });
  }

  // 4. Never-expires vs expiring at the same price (fixed bundles).
  const pairs: { net: string; price: number; ne: Bundle; ex: Bundle }[] = [];
  for (const n of model.networks) {
    if (only && only !== n) continue;
    const mine = model.bundles.filter((b) => b.network === n && isAllDay(b) && canWin(b));
    const ne = mine.filter(neverExpires);
    const ex = mine.filter((b) => !neverExpires(b) && b.days !== null);
    const found: typeof pairs = [];
    for (const a of ne) {
      const same = ex.filter((e) => Math.abs(e.price - a.price) < 1e-9).sort((x, y) => y.mb - x.mb)[0];
      if (same && same.mb > a.mb) found.push({ net: n, price: a.price, ne: a, ex: same });
    }
    found.sort((x, y) => y.ex.mb / y.ne.mb - x.ex.mb / x.ne.mb);
    pairs.push(...found.slice(0, 2));
  }
  if (pairs.length) {
    tips.push({
      id: "expiry", networks: [...new Set(pairs.map((p) => p.net))], icon: <InfinityIcon className="h-5 w-5" aria-hidden />,
      title: "Same price, more data, if you can use it in time",
      body: (
        <>
          <p>At the same price, a bundle that expires can give more data than one that never does:</p>
          <ul className="mt-2 space-y-1">
            {pairs.map((p) => (
              <li key={`${p.net}-${p.price}`}>
                <b>{model.networkInfo(p.net).name}, {money(p.price)}:</b> {p.ex.name} gives {model.dataShown(p.ex)} ({p.ex.validity}); {p.ne.name} gives {model.dataShown(p.ne)} that never expires.
              </li>
            ))}
          </ul>
          <p className="mt-1">If you will use it all before it expires, the expiring bundle is the better buy. If you use data slowly, no-expiry protects what you paid for.</p>
        </>
      ),
    });
  }

  // 5. Night bundles.
  const nightTest = GROUPS.find((g) => g.id === "night")!.test;
  const dayTest = GROUPS[0].test;
  const nightNets = model.networks.filter((n) => (!only || only === n) && model.all.some((b) => b.network === n && nightTest(b)));
  if (nightNets.length) {
    tips.push({
      id: "night", networks: nightNets, icon: <Moon className="h-5 w-5" aria-hidden />,
      title: "Save big downloads for night time",
      body: (
        <ul className="space-y-1">
          {nightNets.map((n) => {
            const night = model.cheapestIn(nightTest, n);
            const day = model.cheapestIn(dayTest, n);
            // validityText: a disputed expiry (MTN Midnight) is said wherever the window is shown.
            const windows = [...new Set(model.all.filter((b) => b.network === n && nightTest(b)).map((b) => model.validityText(b)))];
            return (
              <li key={n}>
                <b>{model.networkInfo(n).name}:</b> {windows.join("; ")}.
                {night && day && <> Best night value: {model.valuePer(night)}, vs {model.valuePer(day)} for the best all-day value.</>}
              </li>
            );
          })}
          <li className="text-xs">
            Night data only works inside the hours shown.
            {model.all.some((b) => nightNets.includes(b.network) && b.kind === "night" && hasConflict(b)) && " Bundles whose figures the network's own pages dispute are not used for these prices."}
          </li>
        </ul>
      ),
    });
  }

  // 6. Rollover rules, in the network's words.
  const roll = model.networks.flatMap((n) => (only && only !== n ? [] : Object.entries(model.doc.familyInfo[n] ?? {})
    .filter(([, t]) => /roll/i.test(t)).map(([f, t]) => ({ n, f, t }))));
  // Telecel's renewal and rollover terms, verbatim (telecelRates.rules).
  const telRules = model.doc.telecelRates && typeof model.doc.telecelRates === "object" ? (model.doc.telecelRates as Record<string, unknown>).rules : undefined;
  if (has("telecel") && telRules && typeof telRules === "object") {
    const label: Record<string, string> = { expiryRollover: "Rollover", autoRenewChoice: "Auto-renew", expiryAutoRenew: "Expiry bundles" };
    for (const [k, t] of Object.entries(telRules as Record<string, unknown>)) {
      if (typeof t === "string" && t.trim()) roll.push({ n: "telecel", f: `Telecel ${label[k] ?? k.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase()}`, t });
    }
    // Telecel's no-expiry renewal rule is a number in the data (telecelRates.rules.noExpiryAutoRenewAtPercent).
    const pct = (telRules as Record<string, unknown>).noExpiryAutoRenewAtPercent;
    if (typeof pct === "number" && pct > 0 && pct <= 100) {
      // Telecel's own sentence, rebuilt from the number the checker reads from it.
      roll.push({ n: "telecel", f: "Telecel no-expiry bundles", t: `Telecel's terms: “No-expiry bundle auto-renews once ${pct}% of the allocated data is used.”` });
    }
    const flexiNote = model.flexi && typeof model.flexi.raw.autoRenews === "boolean" && !model.flexi.raw.autoRenews;
    if (flexiNote) roll.push({ n: "telecel", f: `Telecel ${model.flexi!.family}`, t: "Does not auto-renew (Telecel's Flexi terms)." });
  }
  // MTN: how to stop a data bundle renewing, in MTN's help centre's own words (mtnRates.autoRenew).
  const mar = r?.autoRenew;
  if (has("mtn") && mar && typeof mar.says === "string" && mar.says.trim()) {
    roll.push({ n: "mtn", f: "MTN: stopping auto-renewal", t: `MTN's help centre${mar.label ? `, “${mar.label.replace(/^MTN help centre,\s*/, "")}”` : ""}${mar.updated ? ` (last edited ${fmtDate(mar.updated)})` : ""}: “${mar.says.trim()}”` });
  }
  if (roll.length) {
    tips.push({
      id: "rollover", networks: [...new Set(roll.map((x) => x.n))], icon: <RefreshCw className="h-5 w-5" aria-hidden />,
      title: "Leftover data and auto-renew: each network's rules",
      body: <ul className="space-y-1">{roll.map((x) => <li key={`${x.n}-${x.f}`}><b>{x.f}:</b> {x.t}</li>)}</ul>,
    });
  }

  // 7. Offers only some customers can buy, by the data's own reason: personalised
  // (MTN Data Zone, and the Just4U family the data describes as personalised) and
  // regional (MTN Jara). Shown, never ranked.
  const zone = model.bundles.filter((b) => isConditional(b) && (!only || only === b.network));
  const personalBundles = zone.filter((b) => conditionalReason(b) !== "regional" && conditionalReason(b) !== "eligibility");
  const regionalBundles = zone.filter((b) => conditionalReason(b) === "regional");
  const eligibleBundles = zone.filter((b) => conditionalReason(b) === "eligibility");
  const personal = model.networks.flatMap((n) => (only && only !== n ? [] : Object.entries(model.doc.familyInfo[n] ?? {})
    .filter(([f, t]) => (/personali[sz]ed/i.test(t) && !model.bundles.some((b) => b.network === n && b.family === f)) || personalBundles.some((b) => b.network === n && b.family === f))
    .map(([f, t]) => ({ n, f, t }))));
  if (zone.length || personal.length) {
    const row = (b: Bundle) => <li key={`${b.network}-${b.name}`}><b>{b.name}</b> ({model.dataShown(b)}, {b.validity}){b.note ? `: ${b.note}` : ""}</li>;
    tips.push({
      id: "zone", networks: [...new Set([...zone.map((b) => b.network), ...personal.map((x) => x.n)])], icon: <Lock className="h-5 w-5" aria-hidden />,
      title: "Some offers are not for everyone",
      body: (
        <>
          {(personal.length > 0 || personalBundles.length > 0) && <p className="font-semibold text-foreground">Personalised: they depend on your account</p>}
          {personal.map((x) => <div key={`${x.n}-${x.f}`}><p className="mt-1"><b>{x.f}:</b> {x.t}</p><CodesIn texts={[x.t]} /></div>)}
          {personalBundles.length > 0 && <ul className="mt-2 space-y-1">{personalBundles.map(row)}</ul>}
          {regionalBundles.length > 0 && (
            <>
              <p className="mt-3 font-semibold text-foreground">Regional: only in the regions the network lists</p>
              <ul className="mt-1 space-y-1">{regionalBundles.map(row)}</ul>
            </>
          )}
          {eligibleBundles.length > 0 && (
            <>
              <p className="mt-3 font-semibold text-foreground">Eligible groups only: you must be registered with the group</p>
              <ul className="mt-1 space-y-1">
                {[...new Set(eligibleBundles.map((b) => `${b.network}|${b.family}`))].map((k) => {
                  const [n, f] = k.split("|");
                  const bs = eligibleBundles.filter((b) => b.network === n && b.family === f);
                  return <li key={k}><b>{model.networkInfo(n).name} {f}</b> ({bs.length} pack{bs.length === 1 ? "" : "s"}, from {money(Math.min(...bs.map((b) => b.price)))}): {model.doc.familyInfo[n]?.[f] ?? bs[0].note}</li>;
                })}
              </ul>
            </>
          )}
          <p className="mt-2">Because not everyone can buy them, they are kept out of every ranking, finder and planner here.</p>
        </>
      ),
    });
  }

  // 8. Calls: on-net vs all-net.
  const tc = model.doc.familyInfo.telecel?.["Voice & Data Combo"];
  if (tc && has("telecel")) {
    const onNet = model.bundles.filter((b) => b.network === "telecel" && b.extras?.onNetMins && canWin(b)).sort((a, b) => a.price - b.price)[0];
    tips.push({
      id: "onnet", networks: ["telecel"], icon: <Phone className="h-5 w-5" aria-hidden />,
      title: "Check if minutes work for calls to all networks",
      body: (
        <>
          <p>{tc}</p>
          {onNet && <p className="mt-1">Example: {onNet.name} ({money(onNet.price)}) has {onNet.extras!.onNetMins} on-net minutes but {onNet.extras!.allNetMins ?? 0} all-net minutes.</p>}
        </>
      ),
    });
  }

  // 9. Time-limited and app-limited data. A family's own text is shown only
  // when EVERY bundle in it is limited (that is what the text describes);
  // where only some bundles of a family are limited (e.g. a weekend-only
  // bundle in an all-day family), those bundles are listed by name with
  // their window instead.
  const limited = model.limitedNotes(only);
  if (limited.length) {
    tips.push({
      id: "limited", networks: [...new Set(limited.map((x) => x.n))], icon: <Gauge className="h-5 w-5" aria-hidden />,
      title: "Data that comes with limits",
      body: <ul className="space-y-1">{limited.map((x) => <li key={`${x.n}-${x.f}`}><b>{x.f}:</b> {x.t}</li>)}</ul>,
    });
  }

  // 10. Network facts, verbatim, and MTN balance check. A fact about the
  // per-MB out-of-bundle price is left out where card 1 already gives it.
  for (const n of model.networks) {
    if (only && only !== n) continue;
    const fact = model.factText(n);
    if (!fact) continue;
    tips.push({ id: `fact-${n}`, networks: [n], icon: <Lightbulb className="h-5 w-5" aria-hidden />, title: `${model.networkInfo(n).name}: worth knowing`, body: <><p>{fact}</p><CodesIn texts={[fact]} /></> });
  }
  if (r?.balanceCheck && has("mtn")) {
    tips.push({ id: "balance", networks: ["mtn"], icon: <Gauge className="h-5 w-5" aria-hidden />, title: "Check your MTN data balance", body: <><p>{r.balanceCheck}</p><CodesIn texts={[r.balanceCheck]} /></> });
  }

  return tips;
}

export function Advice({ model, only }: { model: BundleModel; only?: string }) {
  const tips = buildTips(model, only);
  if (!tips.length) return null;
  return (
    <section aria-labelledby="advice-h" id="advice" className="scroll-mt-24">
      <SectionHeading id="advice-h" eyebrow="Advice" title="Tips to pay less" icon={<Lightbulb className="h-4 w-4" aria-hidden />}>
        All numbers come from the networks' own prices. Tap a tip to see them.
      </SectionHeading>
      <div className="grid gap-3 md:grid-cols-2">
        {tips.map((t, i) => (
          <motion.article
            key={t.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: Math.min(i, 4) * 0.05 }}
            className={cn(glass, "p-4", t.tone === "warn" && "border-red-500/40 bg-red-50/80 dark:bg-red-500/10")}
            data-testid="advice-card"
          >
            <div className="flex items-start gap-3">
              <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", t.tone === "warn" ? "bg-red-600 text-white" : "bg-foreground text-background")}>{t.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap gap-1">{t.networks.map((n) => <NetPill key={n} info={model.networkInfo(n)} className="text-[10px]" />)}</div>
                <h3 className="font-bold leading-snug">{t.title}</h3>
                {/* The headline is the tip; the figures and the networks' own words are one tap away. */}
                <Details summary="Show the figures" className="mt-1">
                  <div className="text-sm leading-relaxed text-muted-foreground">{t.body}</div>
                </Details>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
