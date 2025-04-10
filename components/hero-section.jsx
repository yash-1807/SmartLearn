import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function HeroSection() {
  return (
    <div className="w-full bg-[#f9f5ff] py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
              Your Personalized-Adaptive Learning Solution
            </h1>
            <p className="text-gray-600 mb-8 max-w-lg">
              Unlock your potential with a learning experience designed just for
              you. Our platform adapts to your unique needs, offering
              personalized pathways to achieve your goals efficiently and
              effectively
            </p>

            <div className="flex items-center space-x-6">
              <Link href="#onboarding">
                <Button className="bg-primary hover:bg-primary/90 rounded-full">
                  Let's Begin
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <Image
              src="/header_img.png"
              alt="Student with laptop"
              width={500}
              height={500}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Partners bar */}
    </div>
  );
}
