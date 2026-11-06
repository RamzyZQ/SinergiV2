import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function StudentDashboardLoading() {
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300 max-w-4xl mx-auto">
      {/* Welcome header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Active Period Hero Card Skeleton */}
      <Card className="shadow-sm border-2">
        <CardHeader className="space-y-3 pb-4">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-80" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stepper skeleton */}
          <div className="grid grid-cols-4 gap-2 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center space-y-2">
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Skeleton className="h-10 w-40" />
          </div>
        </CardContent>
      </Card>

      {/* Past applications skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-44" />
        <Card>
          <CardContent className="p-4 space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b last:border-b-0">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
