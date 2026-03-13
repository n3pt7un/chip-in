interface LoadingSpinnerProps {
  size?: 'sm' | 'lg'
  className?: string
}

export default function LoadingSpinner({ size = 'lg', className = '' }: LoadingSpinnerProps) {
  const dim = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8'
  return (
    <div className={`${dim} rounded-full border-2 border-accent border-t-transparent animate-spin ${className}`} />
  )
}
