import React, { useState } from 'react'

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
  const [isEditing, setIsEditing] = useState(false)
  const [rawInput, setRawInput] = useState('')

  // Keep amount in valid range if props change
  const clamp = (v: number) => Math.max(effectiveMinBet, Math.min(effectiveMaxBet, v))

  // Used by slider and +/- step buttons — snaps to minBet increments
  const setAmountSnapped = (v: number) =>
    setAmount(clamp(Math.round(v / effectiveMinBet) * effectiveMinBet || effectiveMinBet))

  // Used by preset buttons and typed input — exact clamp, no step quantization
  const setAmountExact = (v: number) =>
    setAmount(clamp(v))

  const handleAmountTap = () => {
    if (!canAffordMinBet) return
    setRawInput(String(amount))
    setIsEditing(true)
  }

  const handleRawInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRawInput(e.target.value)
  }

  const commitRawInput = () => {
    const parsed = parseInt(rawInput, 10)
    if (!isNaN(parsed)) setAmountExact(parsed)
    setIsEditing(false)
  }

  const handleRawInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitRawInput()
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
              onClick={() => valid && setAmountExact(preset)}
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
          onClick={() => setAmountSnapped(amount - effectiveMinBet)}
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
              onChange={(e) => setAmountSnapped(Number(e.target.value))}
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
          {isEditing ? (
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={rawInput}
              onChange={handleRawInputChange}
              onBlur={commitRawInput}
              onKeyDown={handleRawInputKeyDown}
              autoFocus
              aria-label="Enter bet amount"
              className="text-center text-2xl font-bold text-white tabular-nums bg-transparent border-b border-accent outline-none w-full"
            />
          ) : (
            <p
              onClick={handleAmountTap}
              role="button"
              tabIndex={0}
              onKeyDown={e => (e.key === ' ' || e.key === 'Enter') && handleAmountTap()}
              className="text-center text-2xl font-bold text-white tabular-nums cursor-pointer underline decoration-dotted decoration-white/20"
            >
              {amount}
            </p>
          )}
        </div>
        <StepButton
          label="+"
          onClick={() => setAmountSnapped(amount + effectiveMinBet)}
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
