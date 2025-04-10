"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function StudyFromDocsCard() {
  const router = useRouter();

  const handleBegin = () => {
    router.push("/study_from_docs");
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="p-8 border border-gray-200 rounded-xl shadow-lg bg-gradient-to-r from-violet-50 to-indigo-50">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600">
            Want to study from your own docs?
          </h2>
          <p className="text-lg text-gray-600">
            Upload your documents and let AI create a personalized learning
            experience
          </p>
          <Button
            onClick={handleBegin}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-8 py-2 rounded-full font-medium transition-all transform hover:scale-105"
          >
            Begin Your Journey
          </Button>
        </div>
      </div>
    </div>
  );
}
