import { useState } from 'react'

interface BetControlProps {
  minBet: number
  presets: [number, number, number]
  maxBet: number
  onBet: (amount: number) => Promise<void>
  disabled?: boolean
}

export function BetControl({
  minBet,
  presets,
  maxBet,
  onBet,
  disabled = false,
}: BetControlProps) {
  // Handle case where player doesn't have enough chips to meet minimum bet
  const canAffordMinBet = maxBet >= minBet
  const effectiveMinBet = canAffordMinBet ? minBet : maxBet
  const effectiveMaxBet = Math.max(effectiveMinBet, maxBet)

  const [amount, setAmount] = useState(() => Math.min(effectiveMinBet, effectiveMaxBet))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Keep amount in valid range if props change
  const clamp = (v: number) => Math.max(effectiveMinBet, Math.min(effectiveMaxBet, v))

  function setAmountClamped(v: number) {
    setAmount(clamp(Math.round(v / effectiveMinBet) * effectiveMinBet || effectiveMinBet))
  }

  async function handleBet() {
    if (loading || disabled || !canAffordMinBet || amount < effectiveMinBet || amount > effectiveMaxBet) return
    setLoading(true)
    setError(null)
    try {
      await onBet(amount)
      // Reset to min bet after successful bet
      setAmount(clamp(effectiveMinBet))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bet failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const canBet = !disabled && !loading && canAffordMinBet && amount >= effectiveMinBet && amount <= effectiveMaxBet

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Warning when player can't afford minimum bet */}
      {!canAffordMinBet && maxBet > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
          <p className="text-xs text-yellow-300 text-center">
            Not enough chips for minimum bet. You can only bet up to {maxBet.toLocaleString()}.
          </p>
        </div>
      )}

      {/* Preset buttons */}
      <div className="grid grid-cols-3 gap-2">
        {presets.map((preset) => {
          const valid = preset <= maxBet
          return (
            <button
              key={preset}
              onClick={() => valid && setAmountClamped(preset)}
              disabled={!valid || disabled}
              className={`py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                amount === preset && valid
                  ? 'bg-accent text-black'
                  : 'bg-surface-2 text-white/70 active:bg-surface border border-white/10'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              {preset.toLocaleString()}
            </button>
          )
        })}
      </div>

      {/* Slider + +/- */}
      <div className="flex items-center gap-3">
        <StepButton
          label="−"
          onClick={() => setAmountClamped(amount - effectiveMinBet)}
          disabled={disabled || amount <= effectiveMinBet || !canAffordMinBet}
        />
        <div className="flex-1 flex flex-col gap-1">
          {canAffordMinBet ? (
            <input
              type="range"
              min={effectiveMinBet}
              max={effectiveMaxBet}
              step={effectiveMinBet}
              value={amount}
              onChange={(e) => setAmountClamped(Number(e.target.value))}
              disabled={disabled}
              aria-label="Bet amount"
              aria-valuemin={effectiveMinBet}
              aria-valuemax={effectiveMaxBet}
              aria-valuenow={amount}
              className="w-full disabled:opacity-30"
            />
          ) : (
            <div className="h-[20px] flex items-center justify-center">
              <div className="w-full h-[6px] bg-surface-2 rounded-full" />
            </div>
          )}
          <p className="text-center text-lg font-bold text-white tabular-nums">
            {amount.toLocaleString()}
          </p>
        </div>
        <StepButton
          label="+"
          onClick={() => setAmountClamped(amount + effectiveMinBet)}
          disabled={disabled || amount >= effectiveMaxBet || !canAffordMinBet}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 text-center">{error}</p>
      )}

      {/* Place bet button */}
      <button
        onClick={handleBet}
        disabled={!canBet}
        className="w-full py-4 rounded-2xl bg-accent text-black font-bold text-base transition-colors active:bg-accent-dark disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? 'Placing…' : `Bet ${amount.toLocaleString()}`}
      </button>
    </div>
  )
}

function StepButton({
  label,
  onClick,
  disabled,
}: {
  label: string
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-11 h-11 flex-shrink-0 rounded-xl bg-surface-2 text-white text-xl font-bold flex items-center justify-center border border-white/10 active:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      aria-label={label === '+' ? 'Increase bet' : 'Decrease bet'}
    >
      {label}
    </button>
  )
}
