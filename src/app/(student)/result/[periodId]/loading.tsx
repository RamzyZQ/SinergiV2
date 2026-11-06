import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function StudentResultLoading() {
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300 max-w-4xl mx-auto">
      {/* Back link & Title */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Hero Result Banner Skeleton */}
      <Card className="shadow-sm border-2">
        <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
          <Skeleton className="size-16 rounded-full" />
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-80" />
          <Skeleton className="h-10 w-48 mt-2" />
        </CardContent>
      </Card>

      {/* Score Position Bar Skeleton */}
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-6 w-full rounded-full" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-28" />
          </div>
        </CardContent>
      </Card>

      {/* Radar & Criteria Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent className="flex justify-center p-6">
            <Skeleton className="size-48 rounded-full" />
          </CardContent>
        </Card>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4 flex justify-between items-center">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-12" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
