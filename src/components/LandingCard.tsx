import { type ReactNode } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function LandingCard({
  icon,
  title,
  description,
  href,
}: {
  icon: ReactNode
  title: string
  description: string
  href?: string
}) {
  const body = (
    <>
      <CardHeader className="pb-2">
        <div className="mb-2 inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </>
  )

  if (href) {
    return (
      <a href={href} className="block h-full not-prose">
        <Card className="h-full hover:shadow-lg transition-shadow">{body}</Card>
      </a>
    )
  }

  return <Card className="hover:shadow-lg transition-shadow">{body}</Card>
}
