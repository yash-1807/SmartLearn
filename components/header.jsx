import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

export function Header() {
  return (
    <header className="w-full bg-white border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="text-2xl font-bold">
            SmartLearn
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <div className="flex items-center">
              <Link
                href="#industry"
                className="text-gray-700 hover:text-primary"
              >
                Industrial Training
              </Link>
              <ChevronDown className="h-4 w-4 ml-1 text-gray-500" />
            </div>

            <Link href="#" className="text-gray-700 hover:text-primary">
              Contact
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <Link href="#onboarding">
            <Button className="bg-primary hover:bg-primary/90 rounded-full">
              Let's Begin
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
