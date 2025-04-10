import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

function TestimonialCard({ content, name, role, avatar }) {
  return (
    <Card className="border-none shadow-md">
      <CardContent className="p-6">
        <p className="text-gray-600 mb-4">{content}</p>
        <div className="flex items-center">
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-medium">{name}</h4>
            <p className="text-sm text-gray-500">{role}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function Testimonials() {
  const testimonials = [
    {
      content:
        "Enrolling in courses at this e-learning platform was a game-changer for me. The quality of instruction and flexibility allowed me to advance my career while maintaining my full-time job.",
      name: "Maria Rodriguez",
      role: "Student",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      content:
        "I completed the Front-end Web Development course and immediately landed a job in the industry. The hands-on projects and mentor feedback were invaluable to my learning journey.",
      name: "Emily Chen",
      role: "Graduate",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      content:
        "Highly recommended! The personalized learning path and AI-driven recommendations helped me focus on exactly what I needed to learn to achieve my career goals.",
      name: "Marcus Williams",
      role: "Professional",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ]

  return (
    <div className="w-full bg-primary py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-semibold text-white mb-2 text-center">Student's Testimonials</h2>
        <p className="text-white/80 mb-8 text-center max-w-2xl mx-auto">
          Hear what our students have to say about their learning experiences. Real stories from real students who have
          transformed their lives through our courses.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} {...testimonial} />
          ))}
        </div>

        <div className="flex justify-center mt-8 space-x-2">
          <Button size="icon" variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

