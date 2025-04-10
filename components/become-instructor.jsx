import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

export function BecomeInstructor() {
  const perks = [
    "Flexible Schedule",
    "Innovative Teaching Tools",
    "Recognition and Reputation",
    "Competitive Compensation",
    "Expand Your Expertise",
    "Networking Opportunities",
    "Professional Development",
    "Mentoring Opportunities",
  ]

  return (
    <div className="w-full max-w-6xl mx-auto py-16 px-4">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h2 className="text-2xl font-semibold mb-2">If You Are A Certified Teacher</h2>
          <h3 className="text-xl font-medium mb-4">
            Then <span className="text-primary">Become An Instructor</span>
          </h3>
          <p className="text-gray-600 mb-6">
            Share your knowledge with students worldwide by joining our team of expert instructors. Create engaging
            courses and help students achieve their learning goals while earning additional income and building your
            professional reputation.
          </p>

          <h4 className="font-semibold text-lg mb-4">Enjoy Many Perks</h4>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-6">
            {perks.map((perk, index) => (
              <div key={index} className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span className="text-sm">{perk}</span>
              </div>
            ))}
          </div>

          <Button className="bg-primary hover:bg-primary/90 rounded-full px-6">Register as Instructor</Button>
        </div>

        <div className="relative">
          <div className="absolute -top-5 -right-5 w-3/4 h-3/4 bg-primary/20 rounded-full -z-10"></div>
          <img src="/placeholder.svg?height=400&width=400" alt="Become an instructor" className="w-full rounded-full" />
        </div>
      </div>
    </div>
  )
}

