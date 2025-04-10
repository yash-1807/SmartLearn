import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export function Navbar() {
  return (
    <nav className="w-full bg-primary px-4 py-3 flex items-center">
      <Button variant="ghost" size="icon" className="text-white">
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <div className="flex-1 flex justify-center">
        <div className="flex items-center space-x-6">
          <Link href="#" className="text-white/80 hover:text-white text-sm">
            Duolingo
          </Link>
          <Link href="#" className="text-white/80 hover:text-white text-sm">
            Magic Leap
          </Link>
          <Link href="#" className="text-white/80 hover:text-white text-sm">
            Microsoft
          </Link>
          <Link href="#" className="text-white/80 hover:text-white text-sm">
            Codecov
          </Link>
          <Link href="#" className="text-white/80 hover:text-white text-sm">
            Testify
          </Link>
        </div>
      </div>
    </nav>
  )
}

