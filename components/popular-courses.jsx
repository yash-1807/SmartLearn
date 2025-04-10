import { CourseCard } from "./course-card";
import Link from "next/link";

export function PopularCourses() {
  const courses = [
    {
      id: "unisys",
      title: "UNISYS",
      image: "/unisys.webp?height=200&width=300",
      description: "Learn about Unisys enterprise solutions and technologies",
    },
    {
      id: "companyb",
      title: "COMPANY B",
      image: "/placeholder.svg?height=200&width=300",
      description: "Explore Company B's innovative products and services",
    },
    // Add more companies as needed
  ];

  return (
    <div className="w-full bg-primary/10 py-12">
      <div className="max-w-6xl mx-auto px-4 flex flex-col items-center">
        <h2 className="text-2xl font-semibold mb-2 text-center">
          Explore Our Industry-Focused Training Courses
        </h2>
        <p className="text-gray-600 mb-8 text-center max-w-3xl">
          Gain hands-on experience with courses designed to make you job-ready.
          Learn from industry experts and gain skills that matter in the real
          world.
        </p>

        <div className="flex justify-center gap-8 flex-wrap">
          {courses.map((course, index) => (
            <Link
              key={index}
              href={{
                pathname: "/company",
                query: {
                  id: course.id,
                  title: course.title,
                },
              }}
              className="hover:scale-105 transition-transform"
            >
              <CourseCard {...course} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
