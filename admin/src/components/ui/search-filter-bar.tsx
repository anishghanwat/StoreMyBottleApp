import * as React from "react"
import { Search, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { debounce } from "@/lib/utils"

interface Filter {
    id: string
    label: string
    options: { value: string; label: string }[]
    value: string
    onChange: (value: string) => void
}

interface SearchFilterBarProps {
    searchPlaceholder?: string
    searchValue: string
    onSearchChange: (value: string) => void
    filters?: Filter[]
    onRefresh?: () => void
    refreshing?: boolean
}

export function SearchFilterBar({
    searchPlaceholder = "Search...",
    searchValue,
    onSearchChange,
    filters = [],
    onRefresh,
    refreshing = false
}: SearchFilterBarProps) {
    const [localSearch, setLocalSearch] = React.useState(searchValue)

    // Debounce search
    const debouncedSearch = React.useMemo(
        () => debounce((value: string) => onSearchChange(value), 300),
        [onSearchChange]
    )

    React.useEffect(() => {
        debouncedSearch(localSearch)
    }, [localSearch, debouncedSearch])

    return (
        <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
            <div className="relative flex-1 w-full md:max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder={searchPlaceholder}
                    className="pl-8"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto ml-auto flex-wrap">
                {filters.map((filter) => (
                    <Select key={filter.id} value={filter.value} onValueChange={filter.onChange}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder={filter.label} />
                        </SelectTrigger>
                        <SelectContent>
                            {filter.options.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ))}

                {onRefresh && (
                    <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                )}
            </div>
        </div>
    )
}
