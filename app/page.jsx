import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { SearchCourses } from "@/components/search-courses";
import { BenefitsSection } from "@/components/benefits-section";
import { PopularCourses } from "@/components/popular-courses";
import { BecomeInstructor } from "@/components/become-instructor";
import { Testimonials } from "@/components/testimonials";
import { OnboardingForm } from "@/components/OnboardingForm";
import StudyFromDocsCard from "@/components/StudyFromDocsCard";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      <div className="container mx-auto px-4">
        <BenefitsSection />
      </div>

      <div id="industry" className="container mx-auto px-4 py-10">
        <h2 className="text-3xl font-bold text-center mb-8">
          Industrial Training Courses
        </h2>
        <PopularCourses />
      </div>

      <div id="onboarding" className="container mx-auto px-4">
        <OnboardingForm />
      </div>

      <div className="flex items-center justify-center py-8">
        <h2 className="text-2xl font-bold text-gray-500">OR</h2>
      </div>

      <div className="container mx-auto p-4">
        <StudyFromDocsCard />
      </div>
    </main>
  );
}
