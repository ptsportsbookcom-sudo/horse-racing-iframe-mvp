"use client";

import { useEffect, useMemo, useState } from "react";
import {
  calculateExactaBoxed,
  calculateExactaStraight,
  calculateTotalStake,
  calculateTrifectaBoxed,
  calculateTrifectaStraight,
} from "@/lib/betting";

type BetType =
  | "WIN"
  | "PLACE"
  | "EXACTA_BOXED"
  | "TRIFECTA_BOXED"
  | "EXACTA_STRAIGHT"
  | "TRIFECTA_STRAIGHT";
type ParentMessage = {
  type: string;
  payload?: unknown;
};

type Horse = {
  number: number;
  name: string;
  odds: string;
};

const RACE = {
  title: "Race 5 - Springfield Park",
  time: "3:45 PM",
  horses: [
    { number: 1, name: "Thunder Strike", odds: "4.50" },
    { number: 2, name: "Silver Comet", odds: "6.00" },
    { number: 3, name: "Moonlight Dash", odds: "8.00" },
    { number: 4, name: "Golden Arrow", odds: "3.80" },
    { number: 5, name: "Crimson Tide", odds: "11.00" },
    { number: 6, name: "Rapid Echo", odds: "5.50" },
    { number: 7, name: "Night Falcon", odds: "9.50" },
    { number: 8, name: "Emerald Storm", odds: "7.00" },
    { number: 9, name: "Iron Spirit", odds: "13.00" },
    { number: 10, name: "Royal Legend", odds: "10.00" },
  ] satisfies Horse[],
};
const BET_TYPES: BetType[] = [
  "WIN",
  "PLACE",
  "EXACTA_BOXED",
  "TRIFECTA_BOXED",
  "EXACTA_STRAIGHT",
  "TRIFECTA_STRAIGHT",
];
const INITIAL_COUNTDOWN_SECONDS = 2 * 60;

export default function Home() {
  const [selectedHorseNumbers, setSelectedHorseNumbers] = useState<number[]>([]);
  const [betType, setBetType] = useState<BetType>("WIN");
  const [enabledBetTypes, setEnabledBetTypes] = useState<Record<BetType, boolean>>({
    WIN: true,
    PLACE: true,
    EXACTA_BOXED: true,
    TRIFECTA_BOXED: true,
    EXACTA_STRAIGHT: true,
    TRIFECTA_STRAIGHT: true,
  });
  const [stakePerLine, setStakePerLine] = useState<string>("1");
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(INITIAL_COUNTDOWN_SECONDS);
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [placedBetSummary, setPlacedBetSummary] = useState<{
    betType: BetType;
    selectedHorses: number[];
    totalStake: number;
  } | null>(null);
  const [placeBetError, setPlaceBetError] = useState<string | null>(null);

  const lines = useMemo(() => {
    switch (betType) {
      case "EXACTA_BOXED":
        return calculateExactaBoxed(selectedHorseNumbers).numberOfLines;
      case "TRIFECTA_BOXED":
        return calculateTrifectaBoxed(selectedHorseNumbers).numberOfLines;
      case "EXACTA_STRAIGHT":
        return calculateExactaStraight(selectedHorseNumbers);
      case "TRIFECTA_STRAIGHT":
        return calculateTrifectaStraight(selectedHorseNumbers);
      case "WIN":
      case "PLACE":
        return selectedHorseNumbers.length;
      default:
        return 0;
    }
  }, [selectedHorseNumbers, betType]);

  const stakeValue = Number(stakePerLine) > 0 ? Number(stakePerLine) : 0;
  const totalStake = useMemo(
    () => calculateTotalStake(lines, stakeValue),
    [lines, stakeValue]
  );
  const selectedHorseNames = useMemo(
    () =>
      selectedHorseNumbers
        .map((horseNumber) => RACE.horses.find((horse) => horse.number === horseNumber)?.name)
        .filter((horseName): horseName is string => Boolean(horseName)),
    [selectedHorseNumbers]
  );
  const selectedHorseOdds = useMemo(
    () =>
      selectedHorseNumbers
        .map((horseNumber) => {
          const horse = RACE.horses.find((runner) => runner.number === horseNumber);
          return horse ? Number(horse.odds) : null;
        })
        .filter((odds): odds is number => typeof odds === "number"),
    [selectedHorseNumbers]
  );
  const enabledBetTypeOptions = useMemo(
    () => BET_TYPES.filter((type) => enabledBetTypes[type]),
    [enabledBetTypes]
  );
  const defaultBetType = enabledBetTypeOptions[0] ?? "WIN";
  const raceStatus = secondsRemaining > 0 ? "OPEN" : "CLOSED";
  const isSelectedBetTypeEnabled = enabledBetTypes[betType];
  const hasValidSelectionForBetType = useMemo(() => {
    if (betType === "EXACTA_BOXED") {
      return selectedHorseNumbers.length >= 2;
    }

    if (betType === "TRIFECTA_BOXED") {
      return selectedHorseNumbers.length >= 3;
    }

    if (betType === "EXACTA_STRAIGHT") {
      return selectedHorseNumbers.length === 2;
    }

    if (betType === "TRIFECTA_STRAIGHT") {
      return selectedHorseNumbers.length === 3;
    }

    return selectedHorseNumbers.length > 0;
  }, [betType, selectedHorseNumbers.length]);
  const hasValidStake = stakePerLine.trim() !== "" && stakeValue > 0;
  const canPlaceBet =
    raceStatus === "OPEN" &&
    isSelectedBetTypeEnabled &&
    hasValidSelectionForBetType &&
    hasValidStake &&
    !isPlacingBet;
  const formattedCountdown = useMemo(() => {
    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = secondsRemaining % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }, [secondsRemaining]);
  const averageOdds = useMemo(() => {
    if (selectedHorseOdds.length === 0) {
      return 0;
    }

    const totalOdds = selectedHorseOdds.reduce((sum, odds) => sum + odds, 0);
    return totalOdds / selectedHorseOdds.length;
  }, [selectedHorseOdds]);
  const estimatedReturns = useMemo(
    () => totalStake * averageOdds,
    [totalStake, averageOdds]
  );

  function sendParentMessage(message: ParentMessage) {
    if (typeof window === "undefined") {
      return;
    }

    console.log("Outgoing iframe message:", message);
    window.parent.postMessage(message, "*");
  }

  useEffect(() => {
    async function fetchBalance() {
      setBalanceError(null);

      try {
        const response = await fetch("/api/balance");

        if (!response.ok) {
          throw new Error("Failed to fetch balance");
        }

        const data: { balance?: number } = await response.json();
        setBalance(typeof data.balance === "number" ? data.balance : 0);
      } catch {
        setBalanceError("Unable to load balance.");
      }
    }

    fetchBalance();
  }, []);

  useEffect(() => {
    const handleParentMessage = (event: MessageEvent<ParentMessage>) => {
      console.log("Incoming iframe message:", event.data);

      if (event.data?.type === "BALANCE_UPDATE") {
        const nextBalance = (event.data.payload as { balance?: unknown } | undefined)?.balance;
        if (typeof nextBalance === "number") {
          setBalance(nextBalance);
          setBalanceError(null);
        }
      }
    };

    window.addEventListener("message", handleParentMessage);
    sendParentMessage({ type: "GET_BALANCE" });

    return () => {
      window.removeEventListener("message", handleParentMessage);
    };
  }, []);

  useEffect(() => {
    if (secondsRemaining <= 0) {
      return;
    }

    const intervalId = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [secondsRemaining]);

  useEffect(() => {
    if (!isSelectedBetTypeEnabled) {
      const firstEnabledType = enabledBetTypeOptions[0];
      if (firstEnabledType) {
        setBetType(firstEnabledType);
      }
    }
  }, [isSelectedBetTypeEnabled, enabledBetTypeOptions]);

  function toggleHorseSelection(horseNumber: number) {
    setSelectedHorseNumbers((prev) =>
      prev.includes(horseNumber)
        ? prev.filter((number) => number !== horseNumber)
        : [...prev, horseNumber]
    );
  }

  async function handlePlaceBet() {
    if (!canPlaceBet) {
      return;
    }

    const payload = {
      betType,
      selectedHorses: selectedHorseNumbers,
      stakePerLine: stakeValue,
      totalStake,
      numberOfLines: lines,
    };

    setIsPlacingBet(true);
    setPlaceBetError(null);

    try {
      const response = await fetch("/api/place-bet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to place bet");
      }

      setPlacedBetSummary({
        betType: payload.betType,
        selectedHorses: payload.selectedHorses,
        totalStake: payload.totalStake,
      });
      setBalance((prevBalance) =>
        typeof prevBalance === "number" ? Math.max(0, prevBalance - payload.totalStake) : prevBalance
      );
      setSelectedHorseNumbers([]);
      setStakePerLine("1");
      setBetType(defaultBetType);
      sendParentMessage({ type: "BET_PLACED", payload });
    } catch {
      setPlaceBetError("Unable to place bet. Please try again.");
    } finally {
      setIsPlacingBet(false);
    }
  }

  function toggleBetType(type: BetType) {
    setEnabledBetTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  }

  function handlePlaceAnotherBet() {
    setPlacedBetSummary(null);
    setPlaceBetError(null);
  }

  return (
    <main className="min-h-screen bg-[#0f172a] p-6 text-[#e2e8f0]">
      <div className="mx-auto max-w-6xl">
        <section className="mb-6 rounded-xl border border-slate-600 bg-[#1e293b] p-4 shadow-lg shadow-black/30">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#94a3b8]">
            Operator Settings
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {BET_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-2 text-sm text-[#e2e8f0]">
                <input
                  type="checkbox"
                  checked={enabledBetTypes[type]}
                  onChange={() => toggleBetType(type)}
                  className="h-4 w-4 rounded border-slate-500 bg-slate-700 text-emerald-500"
                />
                <span>{type}</span>
              </label>
            ))}
          </div>
        </section>

        <div className="grid w-full gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-xl border border-slate-600 bg-[#1e293b] p-6 shadow-lg shadow-black/30">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Horse Racing MVP</h1>
            <p className="mt-1 text-sm text-[#94a3b8]">
              {RACE.title} - {RACE.time}
            </p>
            <p className="mt-2 text-sm font-medium text-[#e2e8f0]">
              Balance: {balance === null ? "Loading..." : balance.toFixed(2)}
            </p>
            <p className="mt-1 text-sm font-medium text-[#e2e8f0]">
              Status:{" "}
              <span className={raceStatus === "OPEN" ? "text-emerald-400" : "text-rose-400"}>
                {raceStatus}
              </span>
            </p>
            <p className="mt-1 text-sm text-[#94a3b8]">
              Race starts in: {formattedCountdown}
            </p>
            {balanceError ? (
              <p className="mt-1 text-sm text-rose-400">{balanceError}</p>
            ) : null}
          </div>

          <div className="space-y-3">
            {RACE.horses.map((horse) => {
              const isSelected = selectedHorseNumbers.includes(horse.number);

              return (
                <button
                  key={horse.number}
                  type="button"
                  onClick={() => toggleHorseSelection(horse.number)}
                  className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition ${
                    isSelected
                      ? "border-emerald-400 bg-emerald-500/15 shadow-md shadow-emerald-500/20"
                      : "border-slate-600 bg-[#0f172a] hover:border-slate-400 hover:bg-slate-800/80"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[#e2e8f0]">
                      {horse.number}. {horse.name}
                    </p>
                    <p className="text-xs text-[#94a3b8]">Runner</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-right text-2xl font-extrabold leading-none text-amber-300">
                      {horse.odds}
                    </p>
                    <span
                    className={`rounded px-2 py-1 text-xs font-semibold ${
                      isSelected
                        ? "bg-emerald-500 text-slate-950"
                        : "bg-slate-700 text-[#e2e8f0]"
                    }`}
                  >
                    {isSelected ? "Selected" : "Select"}
                  </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="self-start rounded-xl border border-slate-600 bg-[#1e293b] p-6 shadow-lg shadow-black/30 lg:sticky lg:top-6">
          <h2 className="text-lg font-semibold">Bet Slip</h2>

          <div className="mt-5 space-y-5">
            <div className="rounded-lg border border-slate-600 bg-[#0f172a] p-4">
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[#94a3b8]">
                Bet Type
              </label>
              <select
                value={betType}
                onChange={(event) => setBetType(event.target.value as BetType)}
                disabled={enabledBetTypeOptions.length === 0}
                className="w-full rounded-md border border-slate-500 bg-[#1e293b] px-3 py-2 text-sm text-[#e2e8f0]"
              >
                {enabledBetTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {enabledBetTypeOptions.length === 0 ? (
                <p className="mt-2 text-xs text-[#94a3b8]">No bet types are enabled.</p>
              ) : null}
            </div>

            <div className="rounded-lg border border-slate-600 bg-[#0f172a] p-4">
              <label
                htmlFor="stake"
                className="mb-2 block text-xs font-medium uppercase tracking-wide text-[#94a3b8]"
              >
                Stake per line
              </label>
              <input
                id="stake"
                type="number"
                min="0"
                step="0.5"
                value={stakePerLine}
                onChange={(event) => setStakePerLine(event.target.value)}
                className="w-full rounded-md border border-slate-500 bg-[#1e293b] px-3 py-2 text-sm text-[#e2e8f0]"
              />
            </div>

            <div className="rounded-lg border border-slate-600 bg-[#0f172a] p-4 text-sm">
              <p className="font-semibold text-[#e2e8f0]">Bet Summary</p>
              <p className="mt-2 flex justify-between">
                <span className="text-xs uppercase tracking-wide text-[#94a3b8]">Bet type</span>
                <span className="font-semibold">{betType}</span>
              </p>
              <p className="mt-2 flex justify-between">
                <span className="text-xs uppercase tracking-wide text-[#94a3b8]">
                  {selectedHorseNames.length === 1 ? "Selected horse" : "Selected horses"}
                </span>
                <span className="max-w-[60%] text-right font-semibold">
                  {selectedHorseNames.length > 0 ? selectedHorseNames.join(", ") : "-"}
                </span>
              </p>
              <p className="mt-2 flex justify-between">
                <span className="text-xs uppercase tracking-wide text-[#94a3b8]">Number of lines</span>
                <span className="font-semibold">{lines}</span>
              </p>
              <p className="mt-2 flex justify-between">
                <span className="text-xs uppercase tracking-wide text-[#94a3b8]">Stake per line</span>
                <span className="font-semibold">{stakeValue.toFixed(2)}</span>
              </p>
              <p className="mt-2 flex justify-between">
                <span className="text-xs uppercase tracking-wide text-[#94a3b8]">Total stake</span>
                <span className="font-semibold">{totalStake.toFixed(2)}</span>
              </p>
            </div>

            <div className="rounded-lg border border-emerald-700/50 bg-[#0f172a] p-4 text-sm">
              <p className="font-semibold text-[#e2e8f0]">Estimated Returns</p>
              <p className="mt-2 flex justify-between">
                <span className="text-xs uppercase tracking-wide text-[#94a3b8]">Average odds</span>
                <span className="font-semibold">
                  {selectedHorseOdds.length > 0 ? averageOdds.toFixed(2) : "-"}
                </span>
              </p>
              <p className="mt-2 flex justify-between">
                <span className="text-xs uppercase tracking-wide text-[#94a3b8]">Estimated payout</span>
                <span className="font-semibold text-emerald-300">{estimatedReturns.toFixed(2)}</span>
              </p>
            </div>

            {placedBetSummary ? (
              <button
                type="button"
                onClick={handlePlaceAnotherBet}
                className="w-full rounded-md bg-slate-700 px-4 py-2 font-medium text-[#e2e8f0] transition hover:bg-slate-600"
              >
                Place Another Bet
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePlaceBet}
                disabled={!canPlaceBet}
                className="w-full rounded-md bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
              >
                {raceStatus === "CLOSED"
                  ? "Betting Closed"
                  : isPlacingBet
                    ? "Placing Bet..."
                    : `Place Bet (€${totalStake.toFixed(2)})`}
              </button>
            )}

            {placeBetError ? (
              <div className="rounded-md border border-rose-700/60 bg-rose-500/10 p-4 text-sm text-rose-300">
                {placeBetError}
              </div>
            ) : null}

            {placedBetSummary ? (
              <div className="rounded-md border border-emerald-700/60 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                <p className="font-semibold">Bet placed successfully</p>
                <p className="mt-2">
                  <span className="font-medium">Bet type:</span>{" "}
                  {placedBetSummary.betType}
                </p>
                <p className="mt-1">
                  <span className="font-medium">Selected horses:</span>{" "}
                  {placedBetSummary.selectedHorses.join(", ")}
                </p>
                <p className="mt-1">
                  <span className="font-medium">Total stake:</span>{" "}
                  {placedBetSummary.totalStake.toFixed(2)}
                </p>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
      </div>
    </main>
  );
}
