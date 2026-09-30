import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * The card around a symbol-page panel, or no card at all when the panel sits
 * inside the Insights accordion (`embedded`), which supplies its own title.
 */
export function PanelFrame({
  title,
  embedded = false,
  children,
}: {
  title: React.ReactNode
  embedded?: boolean
  children: React.ReactNode
}) {
  if (embedded) return <div className="pt-1">{children}</div>
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
