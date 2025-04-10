import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export function SearchCourses() {
  return (
    <div className="w-full max-w-3xl mx-auto py-8">
      <h2 className="text-2xl font-semibold text-center mb-6">Search Courses</h2>
      <div className="flex w-full max-w-lg mx-auto">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search for over 50+ courses"
            className="pl-10 pr-4 py-2 rounded-l-full border-r-0"
          />
        </div>
        <Button className="rounded-r-full bg-primary hover:bg-primary/90">Search</Button>
      </div>
    </div>
  )
}

