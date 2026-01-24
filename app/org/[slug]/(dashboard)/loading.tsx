
import { getRandomFunnyLoading } from '@/lib/constants/funny-messages'
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardHeader, CardContent } from "@/components/ui/card"

export default function Loading() {
    const funnyMessage = getRandomFunnyLoading()

    return (
        <div className="space-y-6 animate-pulse">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
                <div className="space-y-3">
                    <Skeleton className="h-8 w-64" /> {/* Title */}
                    <Skeleton className="h-4 w-48" /> {/* Welcome msg */}
                </div>
                <Skeleton className="h-32 w-full md:w-80 rounded-lg" /> {/* Subscription Card */}
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="bg-white dark:bg-gray-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-8 w-8 rounded-full" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-16 mb-1" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <Skeleton className="h-[300px] w-full rounded-lg" />
                <Skeleton className="h-[300px] w-full rounded-lg" />
            </div>

            {/* Activity + Quick Actions */}
            <div className="grid grid-cols-1 gap-8">
                <div className="space-y-4">
                    <Skeleton className="h-6 w-32" /> {/* Section Title */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-24 w-full rounded-lg" />
                        ))}
                    </div>
                </div>

                <Skeleton className="h-[400px] w-full rounded-lg" /> {/* Activity Widget */}
            </div>

            <div className="text-center text-xs text-muted-foreground pt-8 pb-4">
                {funnyMessage}
            </div>
        </div>
    )
}
