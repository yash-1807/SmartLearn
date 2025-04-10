"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  BookOpen,
  Calendar,
  HelpCircle,
  Award,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function AssessmentPage() {
  const [daySections, setDaySections] = useState([]);
  const [description, setDescription] = useState("");
  const [selectedDays, setSelectedDays] = useState([]);
  const [questionCount, setQuestionCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedDays = localStorage.getItem("studyPlanDays");
      const storedDescription = localStorage.getItem("studyPlanDescription");

      if (storedDays && storedDescription) {
        const parsedDays = JSON.parse(storedDays);
        const parsedDescription = JSON.parse(storedDescription);
        setDaySections(parsedDays);
        setDescription(parsedDescription);
      } else {
        router.push("/rag_timeline");
      }
    } catch (error) {
      console.error("Error loading study plan:", error);
    }
  }, [router]);

  const getProcessedDayContent = (dayNumbers) => {
    if (!dayNumbers || dayNumbers.length === 0) return "";

    return dayNumbers
      .map((dayNumber) => {
        const section = daySections[Number.parseInt(dayNumber) - 1] || "";
        const cleanedSection = section.replace(/\*\*/g, "");
        const lines = cleanedSection.split("\n");
        if (lines[0]?.match(/^Day\s*\d+:\s*/i)) {
          lines.shift();
        }
        return lines.join("\n");
      })
      .join("\n\n");
  };

  const handleGenerateAssessment = async () => {
    if (selectedDays.length === 0) return;

    setIsLoading(true);
    setDebugInfo(null);
    const activeDayContent = getProcessedDayContent(selectedDays);

    try {
      const res = await fetch("http://localhost:8006/generate_mcqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_content: activeDayContent,
          description: description,
          num_questions: questionCount,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate assessment");

      const data = await res.json();
      setDebugInfo({
        rawResponse: data,
        parsedData: null,
        error: null,
      });

      let parsedData;
      if (
        data.response &&
        typeof data.response === "object" &&
        data.response.raw
      ) {
        try {
          const jsonStr = data.response.raw.replace(/^```json\n|\n```$/g, "");
          const parsed = JSON.parse(jsonStr);

          if (Array.isArray(parsed)) {
            parsedData = parsed;
          } else if (parsed.mcqs && Array.isArray(parsed.mcqs)) {
            parsedData = parsed.mcqs;
          } else {
            console.error("Unexpected response format:", parsed);
            parsedData = [];
          }

          setDebugInfo((prev) => ({
            ...prev,
            parsedData: parsedData,
          }));
        } catch (e) {
          console.error("Failed to parse questions:", e);
          setDebugInfo((prev) => ({
            ...prev,
            error: e.message,
          }));
          parsedData = [];
        }
      } else {
        parsedData = [];
      }
      setAssessment(parsedData);
    } catch (error) {
      console.error("Error generating assessment:", error);
      setDebugInfo((prev) => ({
        ...prev,
        error: error.message,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDaySelection = (day) => {
    setSelectedDays((prev) => {
      const dayStr = day.toString();
      if (prev.includes(dayStr)) {
        return prev.filter((d) => d !== dayStr);
      } else {
        return [...prev, dayStr].sort(
          (a, b) => Number.parseInt(a) - Number.parseInt(b)
        );
      }
    });
  };

  const handleAnswerSelect = (questionIndex, selectedOption) => {
    if (!isSubmitted) {
      setUserAnswers((prev) => ({
        ...prev,
        [questionIndex]: selectedOption,
      }));
    }
  };

  const handleSubmitAnswers = async () => {
    if (!assessment || assessment.length === 0) return;

    const correctAnswers = {};
    const userAnswerMap = {};

    assessment.forEach((q, idx) => {
      correctAnswers[idx] = q.answer;
      userAnswerMap[idx] = userAnswers[idx] || "";
    });

    try {
      const res = await fetch("http://localhost:8006/evaluate_answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correct_answers: correctAnswers,
          user_answers: userAnswerMap,
        }),
      });

      if (!res.ok) throw new Error("Failed to evaluate answers");

      const data = await res.json();
      setScore(Math.round(data.score));
      setIsSubmitted(true);
    } catch (error) {
      console.error("Error evaluating answers:", error);
    }
  };

  const resetAssessment = () => {
    setUserAnswers({});
    setIsSubmitted(false);
    setScore(null);
  };

  const getAnsweredCount = () => {
    return Object.keys(userAnswers).length;
  };

  const getProgressPercentage = () => {
    if (!assessment || assessment.length === 0) return 0;
    return (getAnsweredCount() / assessment.length) * 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="sticky top-0 z-10 w-full bg-white border-b border-slate-200 shadow-sm backdrop-blur-md bg-opacity-90">
        <div className="max-w-5xl mx-auto flex items-center justify-between py-4 px-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 text-white p-2 rounded-lg">
              <HelpCircle className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              SmartLearn Assessment
            </h1>
          </div>
          <Link href="/rag_chat">
            <Button
              variant="outline"
              className="flex items-center gap-2 text-slate-700 hover:text-purple-600 hover:border-purple-300 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Chat
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 pt-8">
        <Card className="mb-8 border-none shadow-lg bg-white overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Create Your Assessment
            </CardTitle>
            <CardDescription className="text-purple-100 mt-1">
              Select the days you want to be tested on and customize your
              assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-8">
            <div className="space-y-8">
              <div>
                <Label className="text-lg font-medium text-slate-800 mb-3 block flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  Select Days to Include
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                  {daySections.map((_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => handleDaySelection((index + 1).toString())}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                        selectedDays.includes((index + 1).toString())
                          ? "bg-purple-50 border-purple-400 text-purple-700 shadow-md transform scale-105"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <span className="font-medium">Day {index + 1}</span>
                    </button>
                  ))}
                </div>
                {selectedDays.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className="bg-purple-50 text-purple-700 border-purple-200 px-3 py-1"
                    >
                      {selectedDays.length}{" "}
                      {selectedDays.length === 1 ? "day" : "days"} selected
                    </Badge>
                    {selectedDays.length > 0 && (
                      <Badge
                        variant="outline"
                        className="bg-slate-50 text-slate-700 border-slate-200 px-3 py-1"
                      >
                        Days: {selectedDays.join(", ")}
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <Label
                  htmlFor="questions"
                  className="text-lg font-medium text-slate-800 mb-4 block"
                >
                  Number of Questions:{" "}
                  <span className="text-purple-600 font-bold">
                    {questionCount}
                  </span>
                </Label>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-slate-500">1</span>
                  <Slider
                    id="questions"
                    min={1}
                    max={10}
                    step={1}
                    value={[questionCount]}
                    onValueChange={(value) => setQuestionCount(value[0])}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-slate-500">10</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end">
            <Button
              onClick={handleGenerateAssessment}
              disabled={selectedDays.length === 0 || isLoading}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium px-6 py-2 h-12 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <div className="h-5 w-5 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Generating Assessment...
                </>
              ) : (
                <>Generate Assessment</>
              )}
            </Button>
          </CardFooter>
        </Card>

        {assessment && Array.isArray(assessment) && assessment.length > 0 ? (
          <Card className="border-none shadow-lg bg-white overflow-hidden mb-8">
            <CardHeader
              className={`p-6 ${
                isSubmitted
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600"
                  : "bg-gradient-to-r from-indigo-600 to-violet-600"
              } text-white`}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    {isSubmitted ? (
                      <Award className="h-5 w-5" />
                    ) : (
                      <HelpCircle className="h-5 w-5" />
                    )}
                    {isSubmitted
                      ? "Assessment Results"
                      : "Assessment Questions"}
                  </CardTitle>
                  <CardDescription className="text-purple-100 mt-1">
                    {isSubmitted
                      ? `You scored ${score}% on this assessment`
                      : `Answer all ${assessment.length} questions to complete the assessment`}
                  </CardDescription>
                </div>

                {isSubmitted && (
                  <div className="flex items-center gap-3">
                    <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2 backdrop-blur-sm">
                      <span className="text-2xl font-bold">{score}%</span>
                    </div>
                    <Button
                      onClick={resetAssessment}
                      variant="outline"
                      className="bg-white bg-opacity-10 text-white border-white border-opacity-30 hover:bg-white hover:bg-opacity-20"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Try Again
                    </Button>
                  </div>
                )}
              </div>

              {!isSubmitted && assessment.length > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-white mb-2">
                    <span>Progress</span>
                    <span>
                      {getAnsweredCount()} of {assessment.length} answered
                    </span>
                  </div>
                  <Progress
                    value={getProgressPercentage()}
                    className="h-2 bg-white/20"
                    indicatorClassName="bg-white"
                  />
                </div>
              )}
            </CardHeader>

            <CardContent className="p-6 divide-y divide-slate-100">
              {assessment.map((q, idx) => (
                <div key={idx} className="py-6 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                      {idx + 1}
                    </div>
                    <h3 className="text-lg font-medium text-slate-800">
                      {q.question}
                    </h3>
                  </div>

                  <div className="space-y-3 pl-11">
                    {Object.entries(q.options).map(([key, value]) => (
                      <div
                        key={key}
                        onClick={() => handleAnswerSelect(idx, key)}
                        className={`
                          p-4 rounded-xl cursor-pointer transition-all duration-200
                          ${
                            !isSubmitted
                              ? userAnswers[idx] === key
                                ? "bg-purple-50 border-2 border-purple-300 shadow-sm"
                                : "bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100"
                              : userAnswers[idx] === key
                              ? key === q.answer
                                ? "bg-emerald-50 border-2 border-emerald-300 shadow-sm"
                                : "bg-red-50 border-2 border-red-300 shadow-sm"
                              : key === q.answer
                              ? "bg-emerald-50 border-2 border-emerald-300 shadow-sm"
                              : "bg-slate-50 border border-slate-200"
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`
                              w-8 h-8 rounded-full flex items-center justify-center font-medium
                              ${
                                !isSubmitted
                                  ? userAnswers[idx] === key
                                    ? "bg-purple-200 text-purple-700"
                                    : "bg-slate-200 text-slate-700"
                                  : userAnswers[idx] === key
                                  ? key === q.answer
                                    ? "bg-emerald-200 text-emerald-700"
                                    : "bg-red-200 text-red-700"
                                  : key === q.answer
                                  ? "bg-emerald-200 text-emerald-700"
                                  : "bg-slate-200 text-slate-700"
                              }
                            `}
                            >
                              {key}
                            </div>
                            <span
                              className={`
                              ${
                                !isSubmitted
                                  ? userAnswers[idx] === key
                                    ? "text-purple-700"
                                    : "text-slate-700"
                                  : userAnswers[idx] === key
                                  ? key === q.answer
                                    ? "text-emerald-700"
                                    : "text-red-700"
                                  : key === q.answer
                                  ? "text-emerald-700"
                                  : "text-slate-700"
                              }
                            `}
                            >
                              {value}
                            </span>
                          </div>

                          {isSubmitted && (
                            <div className="flex items-center">
                              {userAnswers[idx] === key &&
                                (key === q.answer ? (
                                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-red-500" />
                                ))}
                              {key === q.answer && userAnswers[idx] !== key && (
                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>

            {!isSubmitted && (
              <CardFooter className="p-6 bg-slate-50 border-t border-slate-200">
                <div className="w-full flex items-center justify-between">
                  <div className="text-sm text-slate-500">
                    {getAnsweredCount()} of {assessment.length} questions
                    answered
                  </div>
                  <Button
                    onClick={handleSubmitAnswers}
                    disabled={
                      Object.keys(userAnswers).length !== assessment.length
                    }
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium px-6 py-2 h-12 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Submit Answers
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        ) : (
          debugInfo && (
            <Card className="border-none shadow-lg bg-white overflow-hidden mb-8">
              <CardHeader className="bg-amber-500 text-white p-6">
                <CardTitle className="text-xl font-bold">
                  Debug Information
                </CardTitle>
                <CardDescription className="text-amber-100">
                  Technical details about the API response
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {debugInfo.error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h3 className="font-medium text-red-800 mb-2">Error:</h3>
                    <pre className="text-sm text-red-600 whitespace-pre-wrap">
                      {debugInfo.error}
                    </pre>
                  </div>
                )}
                <div>
                  <h3 className="font-medium mb-2">Raw API Response:</h3>
                  <pre className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm overflow-auto max-h-[400px]">
                    {JSON.stringify(debugInfo.rawResponse, null, 2)}
                  </pre>
                </div>
                {debugInfo.parsedData && (
                  <div>
                    <h3 className="font-medium mb-2">Parsed Questions:</h3>
                    <pre className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm overflow-auto max-h-[400px]">
                      {JSON.stringify(debugInfo.parsedData, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        )}
      </main>
    </div>
  );
}
