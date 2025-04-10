"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpen,
  ArrowLeft,
  Calendar,
  Clock,
  MessageCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";

// Card wrapper with animation that triggers on scroll
function AnimatedCard({ children, isEven, index }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const initialX = isEven ? -100 : 100;

  return (
    <motion.div
      ref={ref}
      initial={{ x: initialX, opacity: 0 }}
      animate={isInView ? { x: 0, opacity: 1 } : { x: initialX, opacity: 0 }}
      transition={{
        duration: 0.5,
        delay: 0.1,
        type: "spring",
        stiffness: 100,
      }}
      className={`flex items-center justify-center ${
        isEven ? "md:flex-row" : "md:flex-row-reverse"
      }`}
    >
      {children}
    </motion.div>
  );
}

export default function TimelineResultPage() {
  const [studyPlan, setStudyPlan] = useState("");
  const [rawResponse, setRawResponse] = useState("");
  const [loading, setLoading] = useState(true);
  const [showRawResponse, setShowRawResponse] = useState(false);
  const [hoursPerWeek, setHoursPerWeek] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // Get hours per week from localStorage
    const storedHours = localStorage.getItem("studyHoursPerWeek");
    if (storedHours) {
      setHoursPerWeek(parseInt(storedHours));
    }

    async function fetchTimeline() {
      try {
        const res = await fetch("http://localhost:8001/timeline_result/");
        if (!res.ok) {
          throw new Error("Failed to fetch timeline");
        }
        const data = await res.json();

        // Store the raw API response for debugging
        setRawResponse(JSON.stringify(data, null, 2));

        // If study_plan is an object, extract the raw message
        const planText =
          typeof data.study_plan === "object" && data.study_plan.raw
            ? data.study_plan.raw
            : data.study_plan;
        setStudyPlan(planText || "");
      } catch (err) {
        setStudyPlan("Error: " + err.message);
        setRawResponse("Error: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchTimeline();
  }, []);

  // Process study plan data...
  const firstWeekMatch = studyPlan.match(/Week\s*\d+:/);
  let planWithoutIntro = "";
  if (firstWeekMatch) {
    planWithoutIntro = studyPlan.slice(firstWeekMatch.index);
  } else {
    planWithoutIntro = "";
  }

  const weekSections = planWithoutIntro
    ? planWithoutIntro.split(/(?=Week\s*\d+:\s*)/)
    : [];

  // Function to handle navigation to chat page
  const handleGoToChat = () => {
    // Store study plan data in localStorage
    localStorage.setItem("studyPlanWeeks", JSON.stringify(weekSections));
    // Navigate to chat page
    router.push("/learning-chat");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-primary/5">
      {/* Header */}
      <header className="w-full bg-primary text-white py-4 px-6 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            <h1 className="text-2xl font-bold">SmartLearn</h1>
          </div>
          <Link href="/">
            <Button variant="ghost" className="text-white hover:bg-primary/80">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Raw API Response (Development Only) */}
      <div className="max-w-4xl mx-auto mt-4 px-4">
        <div className="bg-gray-900 text-gray-100 rounded-md overflow-hidden border border-gray-700">
          <div
            className="p-2 bg-gray-800 flex justify-between items-center cursor-pointer"
            onClick={() => setShowRawResponse(!showRawResponse)}
          >
            <span className="font-mono font-bold">
              API Response (Debug Mode)
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-gray-300 hover:text-white"
            >
              {showRawResponse ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
          {showRawResponse && (
            <div className="max-h-96 overflow-auto p-4">
              <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                {rawResponse || "Loading API response..."}
              </pre>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Your Learning Roadmap
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Follow this personalized timeline to achieve your learning goals
            efficiently. Each week is carefully structured to build your skills
            progressively.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="relative">
            <div className="space-y-12">
              {weekSections.map((section, index) => {
                // -- Clean up the section text
                const cleanedSection = section.replace(/\*\*/g, "");

                // -- Split into lines for better processing
                const lines = cleanedSection
                  .split("\n")
                  .filter((line) => line.trim());

                // -- Extract week number and title from the first line, but use stored hours
                const weekHeaderMatch = lines[0]?.match(
                  /Week\s*(\d+):\s*(.*?)(?:\s*\((\d+)\s*hours?\))?$/i
                );
                const weekNumber = weekHeaderMatch
                  ? weekHeaderMatch[1]
                  : index + 1;
                const weekTitle = weekHeaderMatch
                  ? weekHeaderMatch[2].trim()
                  : "";

                // Use stored hoursPerWeek instead of extracting from text
                const weekHours = hoursPerWeek;

                // -- Remove the first line (header) from the content
                const contentLines = lines.slice(1);

                // -- Process the content lines to extract tasks with hours
                const tasks = contentLines
                  .filter((line) => line.trim().startsWith("*"))
                  .map((line) => {
                    // Remove the asterisk and trim
                    let taskLine = line.trim().substring(1).trim();

                    // Extract hours if present
                    const hoursMatch = taskLine.match(
                      /\s*-\s*(\d+)\s*hours?$/i
                    );
                    const hours = hoursMatch ? parseInt(hoursMatch[1]) : null;

                    // Remove the hours part from the task text
                    if (hoursMatch) {
                      taskLine = taskLine
                        .replace(/\s*-\s*\d+\s*hours?$/i, "")
                        .trim();
                    }

                    return { task: taskLine, hours };
                  });

                // Determine if card should come from left or right
                const isEven = index % 2 === 0;

                return (
                  <AnimatedCard key={index} isEven={isEven} index={index}>
                    {/* Timeline dot */}
                    <div className="hidden md:flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold shadow-lg z-10">
                        {weekNumber}
                      </div>
                    </div>

                    {/* Card */}
                    <Card
                      className={`w-full md:w-[calc(50%-2rem)] shadow-lg border-none overflow-hidden ${
                        isEven ? "md:mr-8" : "md:ml-8"
                      }`}
                    >
                      <div
                        className={`h-2 w-full ${
                          isEven ? "bg-primary" : "bg-purple-700"
                        }`}
                      ></div>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar
                              className={`h-5 w-5 ${
                                isEven ? "text-primary" : "text-purple-700"
                              }`}
                            />
                            <CardTitle className="text-xl">
                              Week {weekNumber}
                              {weekTitle ? `: ${weekTitle}` : ""}
                            </CardTitle>
                          </div>
                          <div className="flex items-center gap-1 bg-accent/70 px-2 py-1 rounded-full">
                            <Clock className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">
                              {weekHours} hours
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-sm max-w-none">
                          {tasks.map((task, taskIndex) => (
                            <div
                              key={taskIndex}
                              className="mb-3 bg-white p-3 rounded-lg border border-gray-100 shadow-sm"
                            >
                              <div className="flex items-start gap-2">
                                {task.hours && (
                                  <div className="flex-shrink-0 bg-primary/10 text-primary font-medium px-2 py-1 rounded-md text-xs">
                                    {task.hours}h
                                  </div>
                                )}
                                <p className="text-gray-700 m-0">{task.task}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </AnimatedCard>
                );
              })}
            </div>

            {/* Let's Go! button */}
            <div className="mt-16 flex justify-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <Button
                  onClick={handleGoToChat}
                  className="px-8 py-6 text-lg rounded-full flex items-center gap-2"
                  size="lg"
                >
                  <span>Let's Go!</span>
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
