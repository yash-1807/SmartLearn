import { GraduationCap, Clock, Users, Video } from "lucide-react";

function Benefit({ icon, title, description, iconBg }) {
  return (
    <div className="flex items-start space-x-4 mb-6">
      <div className={`${iconBg} p-2 rounded-full`}>{icon}</div>
      <div>
        <h3 className="font-medium text-lg">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}

export function BenefitsSection() {
  return (
    <div className="w-full max-w-3xl mx-auto py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="rounded-3xl overflow-hidden">
          <img
            src="/choose.png?height=100&width=400"
            alt="Students learning"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-6">
            Why choose <span className="text-primary">SmartLearn</span>
          </h2>

          <Benefit
            icon={<GraduationCap className="h-5 w-5 text-white" />}
            title="Personalized Learning Paths"
            description="Experience customized study plans generated through AI, based on your syllabus, learning goals, and time constraints. Get the most efficient path to success."
            iconBg="bg-primary"
          />

          <Benefit
            icon={<Clock className="h-5 w-5 text-white" />}
            title="Real-Time Doubt Resolution"
            description="Never get stuck again! Our AI-driven doubt resolution system provides instant, accurate answers using a knowledge base specifically curated for your course."
            iconBg="bg-pink-500"
          />

          <Benefit
            icon={<Users className="h-5 w-5 text-white" />}
            title="Dynamic Assessments and Progress Tracking"
            description="Stay on top of your learning journey with adaptive assessments, quizzes, and progress tracking. Our system evaluates your strengths and weaknesses to help you improve continuously."
            iconBg="bg-purple-700"
          />
        </div>
      </div>
    </div>
  );
}
