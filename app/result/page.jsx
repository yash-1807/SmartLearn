"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Sparkles, Clock, Target, ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";

// Helper function to parse the onboarding message
function parseOnboardingMessage(raw) {
  const regex = /([\s\S]*?)\n\n"([^"]+)"\s*-\s*([^\n]+)\n\n([\s\S]*)/;
  const match = raw.match(regex);
  if (match) {
    return {
      intro: match[1].trim(),
      quote: match[2].trim(),
      attribution: match[3].trim(),
      conclusion: match[4].trim(),
    };
  }
  return { intro: raw, quote: null, attribution: null, conclusion: null };
}

export default function ResultPage() {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState("");
  const [weeks, setWeeks] = useState("");
  const [hours, setHours] = useState("");
  const [extraError, setExtraError] = useState(null);
  const router = useRouter();

  // Retrieve the goal from localStorage
  useEffect(() => {
    const storedGoal = localStorage.getItem("goal");
    if (storedGoal) {
      setGoal(storedGoal);
    }
  }, []);

  // Fetch the onboarding result from your FastAPI backend
  useEffect(() => {
    async function fetchResult() {
      try {
        const res = await fetch("http://localhost:8000/result");
        if (!res.ok) {
          throw new Error("Failed to fetch result");
        }
        const data = await res.json();
        const rawMessage =
          typeof data.message === "object" && data.message.raw
            ? data.message.raw
            : data.message;
        setResult(rawMessage);
      } catch (err) {
        setResult("Error: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchResult();
  }, []);

  // Updated extra input form submit handler that calls the timeline API
  const handleExtraSubmit = async (e) => {
    e.preventDefault();
    if (!weeks || !hours) {
      setExtraError(
        "Please enter both the number of weeks and hours available."
      );
      return;
    }
    setExtraError(null);
    setLoading(true);
    try {
      // Save weeks and hours in localStorage
      localStorage.setItem("studyWeeks", weeks);
      localStorage.setItem("studyHoursPerWeek", hours);

      const formData = new FormData();
      formData.append("goal", goal);
      formData.append("weeks", weeks);
      formData.append("hours", hours);

      const res = await fetch("http://localhost:8001/generate_timeline/", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to generate timeline");
      }

      router.push("/timeline_result");
    } catch (err) {
      setExtraError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-primary/5">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-lg font-medium text-primary">
            Preparing your learning journey...
          </p>
        </div>
      </div>
    );
  }

  // Parse the result message into sections
  const { intro, quote, attribution, conclusion } =
    parseOnboardingMessage(result);

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

      <div className="max-w-3xl mx-auto py-12 px-4 space-y-8">
        {/* Onboarding Message Card */}
        <Card className="border-none shadow-lg overflow-hidden">
          <div className="bg-primary h-2 w-full"></div>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-2xl">
                Your Personalized Learning Plan
              </CardTitle>
            </div>
            <CardDescription>
              Tailored just for you based on your learning goals
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="prose max-w-none">
              <div>
                {intro.split("\n").map((line, index) => (
                  <p key={index} className="mb-4 text-gray-700">
                    {line}
                  </p>
                ))}
              </div>
              {quote && (
                <div className="my-6 px-6 py-4 bg-accent rounded-lg border-l-4 border-primary">
                  <p className="text-lg font-medium text-gray-800 italic">
                    "{quote}"
                  </p>
                  {attribution && (
                    <p className="text-right text-primary font-medium mt-2">
                      - {attribution}
                    </p>
                  )}
                </div>
              )}
              {conclusion && (
                <div>
                  {conclusion.split("\n").map((line, index) => (
                    <p key={index} className="mb-4 text-gray-700">
                      {line}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t">
            <Button
              onClick={() => router.push("/")}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Start Over
            </Button>
          </CardFooter>
        </Card>

        {/* Learning Goal Card */}
        <Card className="border-none shadow-lg overflow-hidden">
          <div className="bg-purple-700 h-2 w-full"></div>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-700" />
              <CardTitle>Your Learning Goal</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-accent/50 p-4 rounded-lg border border-accent">
              <p className="text-lg font-medium">{goal || "No goal found."}</p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Details Card */}
        <Card className="border-none shadow-lg overflow-hidden">
          <div className="bg-pink-500 h-2 w-full"></div>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-pink-500" />
              <CardTitle>Additional Details</CardTitle>
            </div>
            <CardDescription>
              Help us customize your learning plan further
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleExtraSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label
                    htmlFor="weeks"
                    className="block font-medium text-gray-700"
                  >
                    Number of Weeks
                  </label>
                  <Input
                    id="weeks"
                    type="number"
                    value={weeks}
                    onChange={(e) => setWeeks(e.target.value)}
                    placeholder="e.g., 12"
                    className="border-gray-300 focus:border-primary focus:ring-primary"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="hours"
                    className="block font-medium text-gray-700"
                  >
                    Hours per Week Available
                  </label>
                  <Input
                    id="hours"
                    type="number"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="e.g., 10"
                    className="border-gray-300 focus:border-primary focus:ring-primary"
                    required
                  />
                </div>
              </div>
              {extraError && (
                <p className="text-red-600 text-sm">{extraError}</p>
              )}
            </form>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t">
            <Button
              onClick={handleExtraSubmit}
              className="bg-pink-500 hover:bg-pink-600 text-white"
            >
              Submit Details
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
