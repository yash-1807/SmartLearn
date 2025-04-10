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
} from "lucide-react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { AnimatePresence } from "framer-motion";

// AnimatedCard component remains unchanged
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
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [daySections, setDaySections] = useState([]);
  const [activeDay, setActiveDay] = useState(1);
  const router = useRouter();

  useEffect(() => {
    async function fetchTimeline() {
      try {
        const res = await fetch("http://localhost:8003/timeline_result/");
        if (!res.ok) {
          throw new Error("Failed to fetch timeline");
        }
        const data = await res.json();
        // Extract the timeline text from the "raw" field
        const timelineData = data.timeline;
        const planText =
          typeof timelineData === "object" && timelineData.raw
            ? timelineData.raw
            : timelineData;
        setStudyPlan(planText || "");

        // Extract description from the first task output (if available)
        const desc =
          timelineData &&
          timelineData.tasks_output &&
          timelineData.tasks_output.length > 0 &&
          timelineData.tasks_output[0].description
            ? timelineData.tasks_output[0].description
            : "";
        setDescription(desc || "");

        // Save the description into localStorage for future use in chat/RAG
        localStorage.setItem("studyPlanDescription", JSON.stringify(desc));
      } catch (err) {
        setStudyPlan("Error: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchTimeline();
  }, []);

  useEffect(() => {
    if (!studyPlan) {
      setDaySections([]);
      return;
    }
    const firstDayMatch = studyPlan.match(/\*\*Day\s*\d+:/);
    const planWithoutIntro = firstDayMatch
      ? studyPlan.slice(firstDayMatch.index)
      : "";
    const daysContent = planWithoutIntro
      ? planWithoutIntro.split(/(?=\*\*Day\s*\d+:\s*)/)
      : [];
    setDaySections(daysContent);
  }, [studyPlan]);

  // Function to extract hours from a line
  const extractHours = (line) => {
    const match = line.match(/\((\d+)\s*hours?\)/i);
    return match ? Number.parseInt(match[1]) : 0;
  };

  // Calculate total hours for a day
  const calculateTotalHours = (content) => {
    const lines = content.split("\n");
    let totalHours = 0;
    lines.forEach((line) => {
      if (line.includes("hours)")) {
        totalHours += extractHours(line);
      }
    });
    return totalHours;
  };

  // Process day content for the active day
  const getProcessedDayContent = (dayNumber) => {
    if (!dayNumber || dayNumber > daySections.length) return "";
    const section = daySections[dayNumber - 1] || "";
    const cleanedSection = section.replace(/\*\*/g, "");
    const lines = cleanedSection.split("\n");
    // Remove the first line if it starts with "Day X:"
    if (lines[0]?.match(/^Day\s*\d+:\s*/i)) {
      lines.shift();
    }
    return lines.join("\n");
  };

  // Function to handle selecting a day
  const handleSelectDay = (dayNumber) => {
    setActiveDay(dayNumber);
  };

  // Function to handle navigation to chat page
  const handleGoToChat = () => {
    // Store daySections in localStorage (for use in chat/RAG)
    localStorage.setItem("studyPlanDays", JSON.stringify(daySections));
    router.push("/rag_chat");
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

      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Your Learning Roadmap
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Follow this personalized timeline to achieve your learning goals
            efficiently. Each day is structured to help you build your knowledge
            progressively.
          </p>
        </div>

        {/* Display Raw Timeline Data (for debugging or RAG usage) */}
        {!loading && studyPlan && (
          <div className="mb-8">
            <div className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
              <h2 className="text-xl font-bold mb-2">Raw Timeline Data</h2>
              <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                {studyPlan}
              </pre>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="relative">
            <div className="space-y-12">
              {daySections.map((section, index) => {
                // Remove markdown markers
                const cleanedSection = section.replace(/\*\*/g, "");
                const lines = cleanedSection.split("\n");

                // Extract day number from the first line (if present)
                const dayNumberMatch = lines[0]?.match(/Day\s*(\d+):/i);
                const dayNumber = dayNumberMatch
                  ? dayNumberMatch[1]
                  : index + 1;

                // Remove heading line if it starts with "Day X:"
                if (lines[0]?.match(/^Day\s*\d+:\s*/i)) {
                  lines.shift();
                }

                const finalContent = lines.join("\n");
                const totalHours = calculateTotalHours(finalContent);
                const isEven = index % 2 === 0;

                return (
                  <AnimatedCard key={index} isEven={isEven} index={index}>
                    {/* Timeline dot */}
                    <div className="hidden md:flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold shadow-lg z-10">
                        {dayNumber}
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
                              Day {dayNumber}
                            </CardTitle>
                          </div>
                          {totalHours > 0 && (
                            <div className="flex items-center gap-1 bg-accent/70 px-2 py-1 rounded-full">
                              <Clock className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">
                                {totalHours} hours
                              </span>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-sm max-w-none">
                          {finalContent.split("\n").map((line, lineIndex) => {
                            if (line.trim().startsWith("*")) {
                              const taskContent = line
                                .trim()
                                .substring(1)
                                .trim();
                              const hoursMatch =
                                taskContent.match(/\((\d+)\s*hours?\)/i);
                              const hours = hoursMatch ? hoursMatch[1] : null;
                              return (
                                <div
                                  key={lineIndex}
                                  className="mb-3 bg-white p-3 rounded-lg border border-gray-100 shadow-sm"
                                >
                                  <div className="flex items-start gap-2">
                                    {hours && (
                                      <div className="flex-shrink-0 bg-primary/10 text-primary font-medium px-2 py-1 rounded-md text-xs">
                                        {hours}h
                                      </div>
                                    )}
                                    <p className="text-gray-700 m-0">
                                      {taskContent}
                                    </p>
                                  </div>
                                </div>
                              );
                            }
                            return line.trim() ? (
                              <p key={lineIndex} className="text-gray-600">
                                {line}
                              </p>
                            ) : null;
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </AnimatedCard>
                );
              })}
            </div>

            {/* "Let's Go!" button */}
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

// Helper function to format timestamp
function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
