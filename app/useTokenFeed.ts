import { useEffect, useRef, useState } from "react";

export type FeedEvent = {
  sig: string;
  type: "BUY" | "SELL" | "MOVE";
  text: string;
  amount: string;
};

// api.mainnet-beta.solana.com 403s browser requests — publicnode allows CORS
const RPC = "https://solana-rpc.publicnode.com";

const POLL_MS = 15_000;
const MAX_EVENTS = 100;
const MAX_PARSE_PER_TICK = 10;
// ignore SOL deltas at/below ATA rent (0.00203928) so transfers
// that create a token account don't get classified as trades
const SOL_TRADE_THRESHOLD = 0.0025;

type SigInfo = { signature: string; err: unknown };

type TokenBal = {
  mint: string;
  owner?: string;
  uiTokenAmount: { uiAmount: number | null };
};

type Tx = {
  meta: {
    err: unknown;
    preBalances: number[];
    postBalances: number[];
    preTokenBalances: TokenBal[];
    postTokenBalances: TokenBal[];
  } | null;
  transaction: { message: { accountKeys: { pubkey: string }[] } };
};

async function rpc<T>(method: string, params: unknown[]): Promise<T | null> {
  try {
    const res = await fetch(RPC, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.result ?? null) as T | null;
  } catch {
    return null;
  }
}

const fmtTokens = (n: number) =>
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");

const fmtShort = (n: number) =>
  n >= 1e6
    ? `${(n / 1e6).toFixed(2)}M`
    : n >= 1e3
      ? `${(n / 1e3).toFixed(2)}K`
      : n.toFixed(0);

function classify(tx: Tx, mint: string): Omit<FeedEvent, "sig"> | null {
  const meta = tx?.meta;
  if (!meta || meta.err) return null;

  // net token delta per owner (balance-diff classifier)
  const deltas = new Map<string, number>();
  for (const b of meta.postTokenBalances)
    if (b.mint === mint && b.owner)
      deltas.set(b.owner, (deltas.get(b.owner) ?? 0) + (b.uiTokenAmount.uiAmount ?? 0));
  for (const b of meta.preTokenBalances)
    if (b.mint === mint && b.owner)
      deltas.set(b.owner, (deltas.get(b.owner) ?? 0) - (b.uiTokenAmount.uiAmount ?? 0));

  let gainer: string | null = null;
  let gain = 0;
  let loser: string | null = null;
  let loss = 0;
  for (const [owner, d] of deltas) {
    if (d > gain) [gain, gainer] = [d, owner];
    if (d < loss) [loss, loser] = [d, owner];
  }
  if (!gainer && !loser) return null;

  const keys = tx.transaction.message.accountKeys;
  const solDelta = (owner: string | null) => {
    if (!owner) return 0;
    const i = keys.findIndex((k) => k.pubkey === owner);
    return i < 0 ? 0 : (meta.postBalances[i] - meta.preBalances[i]) / 1e9;
  };

  const tokens = gain > 0 ? gain : -loss;
  if (tokens < 1) return null;
  const buyerSol = solDelta(gainer);
  const sellerSol = solDelta(loser);

  if (gain > 0 && buyerSol < -SOL_TRADE_THRESHOLD)
    return {
      type: "BUY",
      text: `Bought ${fmtTokens(tokens)} BABYMANLET`,
      amount: `${(-buyerSol).toFixed(4)} SOL`,
    };
  if (loss < 0 && sellerSol > SOL_TRADE_THRESHOLD)
    return {
      type: "SELL",
      text: `Sold ${fmtTokens(tokens)} BABYMANLET`,
      amount: `${sellerSol.toFixed(4)} SOL`,
    };
  return {
    type: "MOVE",
    text: `Moved ${fmtTokens(tokens)} BABYMANLET`,
    amount: fmtShort(tokens),
  };
}

export function useTokenFeed(mint: string) {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;

    const tick = async () => {
      const sigs = await rpc<SigInfo[]>("getSignaturesForAddress", [
        mint,
        { limit: 25 },
      ]);
      if (!alive || !sigs) return;

      // newest first; parse a bounded batch per tick
      const fresh = sigs
        .filter((s) => !s.err && !seen.current.has(s.signature))
        .slice(0, MAX_PARSE_PER_TICK);

      const batch: FeedEvent[] = [];
      for (const s of fresh) {
        seen.current.add(s.signature);
        const tx = await rpc<Tx>("getTransaction", [
          s.signature,
          { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 },
        ]);
        if (!alive) return;
        const ev = tx && classify(tx, mint);
        if (ev) batch.push({ ...ev, sig: s.signature });
      }
      if (batch.length)
        setEvents((prev) => [...batch, ...prev].slice(0, MAX_EVENTS));
    };

    tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [mint]);

  return events;
}
