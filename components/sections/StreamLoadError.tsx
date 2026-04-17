import { Button } from '@/components/ui/Button'
import { AlertCircle, RotateCw } from 'lucide-react'

interface StreamLoadErrorProps {
  error: string
  onRetry: () => void
}

export function StreamLoadError({ error, onRetry }: StreamLoadErrorProps) {
  return (
    <div className="mt-8 rounded-xl border border-foreground/10 bg-foreground/5 p-12">
      <div className="flex flex-col items-center gap-6 text-center">
        <AlertCircle className="h-12 w-12 text-foreground/60" />
        
        <div>
          <h3 className="text-2xl font-semibold text-foreground">Failed to load streams</h3>
          <p className="text-base text-muted-foreground mt-2">{error}</p>
        </div>

        <Button onClick={onRetry} variant="primary" size="md" icon={<RotateCw className="w-4 h-4" />}>
          Retry
        </Button>
      </div>
    </div>
  )
}
