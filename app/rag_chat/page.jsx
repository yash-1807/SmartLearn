"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen,
  ArrowLeft,
  Calendar,
  ChevronRight,
  Send,
  Clock,
  Sparkles,
  MessageSquare,
  CheckSquare,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function RagChatPage() {
  const [daySections, setDaySections] = useState([]);
  const [description, setDescription] = useState("");
  const [activeDay, setActiveDay] = useState(1);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [assessmentQuestions, setAssessmentQuestions] = useState(null);
  const router = useRouter();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load study plan and description from localStorage
  useEffect(() => {
    try {
      const storedDays = localStorage.getItem("studyPlanDays");
      const storedDescription = localStorage.getItem("studyPlanDescription");

      if (storedDays && storedDescription) {
        const parsedDays = JSON.parse(storedDays);
        const parsedDescription = JSON.parse(storedDescription);
        setDaySections(parsedDays);
        setDescription(parsedDescription);

        // Initialize chat with welcome message
        setChatMessages([
          {
            sender: "ai",
            text: "Welcome! I'm your study assistant. I'll help you understand your learning material. What would you like to know?",
            timestamp: new Date().toISOString(),
          },
        ]);

        if (parsedDays.length > 0) {
          setActiveDay(1);
        }
      } else {
        router.push("/rag_timeline");
      }
    } catch (error) {
      console.error("Error loading study plan:", error);
    }
  }, [router]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Process day content
  const getProcessedDayContent = (dayNumber) => {
    if (!dayNumber || dayNumber > daySections.length) return "";
    const section = daySections[dayNumber - 1] || "";
    const cleanedSection = section.replace(/\*\*/g, "");
    const lines = cleanedSection.split("\n");
    if (lines[0]?.match(/^Day\s*\d+:\s*/i)) {
      lines.shift();
    }
    return lines.join("\n");
  };

  // Handle day selection
  const handleSelectDay = (dayNumber) => {
    setActiveDay(dayNumber);
    setChatMessages((prev) => [
      ...prev,
      {
        sender: "ai",
        text: `Switched to Day ${dayNumber}. You can ask me anything about the content for this day.`,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  // Handle sending message and calling the API at port 8004
  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    const userMsg = {
      sender: "user",
      text: messageInput,
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setMessageInput("");
    setIsTyping(true);

    // Build conversation history
    const conversationHistory = [...chatMessages, userMsg].map((msg) => ({
      sender: msg.sender,
      message: msg.text,
    }));

    const activeDayContent = getProcessedDayContent(activeDay);

    try {
      const res = await fetch("http://localhost:8004/chat_teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_message: messageInput,
          active_day_content: activeDayContent,
          description: description,
          conversation_history: conversationHistory,
        }),
      });

      if (!res.ok) throw new Error("Failed to get response");

      const data = await res.json();

      const finalText =
        typeof data.response === "object" && data.response.raw
          ? data.response.raw
          : data.response;

      const aiResponse = {
        sender: "ai",
        text: finalText,
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Sorry, I encountered an error processing your request.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle assessment generation
  const handleGenerateAssessment = async () => {
    if (!selectedDay) return;

    setAssessmentLoading(true);

    // Get content for the selected day
    const dayNumber = parseInt(selectedDay);
    const activeDayContent = getProcessedDayContent(dayNumber);

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

      // Display the assessment in chat
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "user",
          text: `I'd like to test my knowledge on Day ${dayNumber} with ${questionCount} questions.`,
          timestamp: new Date().toISOString(),
        },
        {
          sender: "ai",
          text: `Here's your assessment for Day ${dayNumber}:\n\n${data.response}`,
          timestamp: new Date().toISOString(),
        },
      ]);

      setAssessmentQuestions(data.response);
      setAssessmentOpen(false);
    } catch (error) {
      console.error("Error generating assessment:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Sorry, I encountered an error generating your assessment.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setAssessmentLoading(false);
    }
  };

  const formatContent = (text) => {
    // Split content by headers (Task 1:, Task 2:, etc.)
    const tasks = text.split(/(?=Task \d+:)/).filter(Boolean);

    return tasks.map((task) => {
      const [title, ...content] = task.split("\n");
      const sections = content
        .join("\n")
        .split(/(?=Concept:|Details:|Example:|Key Questions:)/)
        .filter(Boolean);

      const formattedSections = sections.reduce((acc, section) => {
        if (section.startsWith("Concept:"))
          acc.concept = section.replace("Concept:", "").trim();
        else if (section.startsWith("Details:"))
          acc.details = section.replace("Details:", "").trim();
        else if (section.startsWith("Example:"))
          acc.example = section.replace("Example:", "").trim();
        else if (section.startsWith("Key Questions:"))
          acc.questions = section.replace("Key Questions:", "").trim();
        return acc;
      }, {});

      return {
        title: title.trim(),
        ...formattedSections,
      };
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3 px-6 shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-1.5 rounded-lg">
              <BookOpen className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold">SmartLearn</h1>
          </div>
          <Link href="/rag_timeline">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Timeline
            </Button>
          </Link>
        </div>
      </header>

      {/* Active Day Banner */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-500 border-b border-purple-600 py-3 px-6 sticky top-[60px] z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-medium text-white">Day {activeDay}</h2>
            </div>
          </div>
          <Badge className="bg-white/20 hover:bg-white/30 text-white border-none transition-colors">
            Current Focus
          </Badge>
        </div>
      </div>

      {/* Main content - Sidebar + Chat */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div className="w-72 bg-white border-r overflow-hidden flex flex-col fixed top-[120px] bottom-0 left-0 shadow-sm">
          <div className="p-4 font-medium text-gray-700 border-b bg-slate-100 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-violet-600" />
            <span>Study Days</span>
          </div>
          <ScrollArea className="flex-1">
            <nav className="p-2">
              {daySections.map((_, index) => {
                const dayNum = index + 1;
                return (
                  <motion.button
                    key={index}
                    onClick={() => handleSelectDay(dayNum)}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-all mb-2 ${
                      activeDay === dayNum
                        ? "bg-violet-50 text-violet-700 font-medium border-l-4 border-violet-500"
                        : "text-gray-700 hover:bg-slate-100 border-l-4 border-transparent"
                    }`}
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center">
                      <div
                        className={`p-2 rounded-full ${
                          activeDay === dayNum
                            ? "bg-violet-100 text-violet-600"
                            : "bg-slate-100 text-slate-600"
                        } mr-3`}
                      >
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">Day {dayNum}</div>
                      </div>
                    </div>
                    {activeDay === dayNum && (
                      <ChevronRight className="h-4 w-4 text-violet-600" />
                    )}
                  </motion.button>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Assessment Button */}
          <div className="p-3 border-t mt-auto">
            <Link href="/assessment">
              <Button className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-medium gap-2">
                <CheckSquare className="h-4 w-4" />
                Assess Yourself
              </Button>
            </Link>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col ml-72 h-[calc(100vh-120px)]">
          <div className="border-b bg-white px-4 py-3 flex items-center shadow-sm">
            <div className="p-1.5 bg-violet-100 rounded-full text-violet-600 mr-2">
              <MessageSquare className="h-4 w-4" />
            </div>
            <h2 className="font-medium">Learning Assistant</h2>
            <Badge
              variant="outline"
              className="ml-2 text-xs bg-violet-50 text-violet-600 border-violet-200"
            >
              AI Powered
            </Badge>
          </div>

          <ScrollArea className="flex-1 p-4 bg-slate-50">
            <AnimatePresence>
              {chatMessages.map((message, index) => (
                <motion.div
                  key={index}
                  className={`mb-4 flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  {message.sender === "ai" && (
                    <Avatar className="h-8 w-8 mr-2 mt-1 border-2 border-white shadow-sm">
                      <AvatarImage src="/placeholder.svg?height=32&width=32" />
                      <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
                        AI
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex flex-col">
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.sender === "user"
                          ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-none shadow-md"
                          : "bg-white border border-gray-200 rounded-tl-none shadow-md"
                      }`}
                    >
                      {message.sender === "ai" &&
                      message.text.includes("Task") ? (
                        <div className="space-y-4">
                          {formatContent(message.text).map((task, idx) => (
                            <div
                              key={idx}
                              className="border-b border-gray-100 last:border-0 pb-4 last:pb-0"
                            >
                              <h3 className="font-semibold text-violet-600 mb-2">
                                {task.title}
                              </h3>

                              {task.concept && (
                                <div className="mb-2">
                                  <span className="font-medium text-sm text-violet-500">
                                    Concept:{" "}
                                  </span>
                                  <span className="text-gray-700">
                                    {task.concept}
                                  </span>
                                </div>
                              )}

                              {task.details && (
                                <div className="mb-2">
                                  <span className="font-medium text-sm text-violet-500">
                                    Details:{" "}
                                  </span>
                                  <span className="text-gray-700">
                                    {task.details}
                                  </span>
                                </div>
                              )}

                              {task.example && (
                                <div className="mb-2 bg-violet-50 p-2 rounded">
                                  <span className="font-medium text-sm text-violet-500">
                                    Example:{" "}
                                  </span>
                                  <span className="text-gray-700">
                                    {task.example}
                                  </span>
                                </div>
                              )}

                              {task.questions && (
                                <div className="mb-2">
                                  <span className="font-medium text-sm text-violet-500">
                                    Key Questions:{" "}
                                  </span>
                                  <span className="text-gray-700">
                                    {task.questions}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <ReactMarkdown>
                          {typeof message.text === "string"
                            ? message.text
                            : String(message.text)}
                        </ReactMarkdown>
                      )}
                    </div>
                    <div
                      className={`text-xs text-gray-500 mt-1 ${
                        message.sender === "user" ? "text-right" : "text-left"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                  {message.sender === "user" && (
                    <Avatar className="h-8 w-8 ml-2 mt-1 border-2 border-white shadow-sm">
                      <AvatarImage src="/placeholder.svg?height=32&width=32" />
                      <AvatarFallback className="bg-slate-700 text-white">
                        U
                      </AvatarFallback>
                    </Avatar>
                  )}
                </motion.div>
              ))}
              {isTyping && (
                <motion.div
                  className="flex mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Avatar className="h-8 w-8 mr-2 border-2 border-white shadow-sm">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" />
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
                      AI
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white border border-gray-200 rounded-lg rounded-tl-none p-3 shadow-md">
                    <div className="flex space-x-1">
                      <div
                        className="w-2 h-2 bg-violet-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-violet-500 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-violet-500 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </ScrollArea>

          <div className="border-t bg-white p-4 sticky bottom-0 left-0 right-0 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask about your learning material..."
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent shadow-sm"
              />
              <Button
                onClick={handleSendMessage}
                className="rounded-full p-2 h-10 w-10 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md transition-all"
                disabled={!messageInput.trim()}
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Dialog */}
      <AlertDialog
        open={assessmentOpen}
        onOpenChange={(open) => setAssessmentOpen(open)}
      >
        <AlertDialogContent className="sm:max-w-[425px] bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Generate Assessment</AlertDialogTitle>
            <AlertDialogDescription>
              Create a quiz to test your knowledge on specific study material.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="day" className="text-right">
                Day
              </Label>
              <Select
                value={selectedDay}
                onValueChange={setSelectedDay}
                className="col-span-3"
              >
                <SelectTrigger id="day">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {daySections.map((_, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      Day {index + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="questions" className="text-right">
                Questions
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Slider
                  id="questions"
                  min={1}
                  max={10}
                  step={1}
                  value={[questionCount]}
                  onValueChange={(value) => setQuestionCount(value[0])}
                  className="flex-1"
                />
                <span className="w-8 text-center font-medium">
                  {questionCount}
                </span>
              </div>
            </div>
          </div>

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel onClick={() => setAssessmentOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleGenerateAssessment}
              disabled={!selectedDay || assessmentLoading}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
            >
              {assessmentLoading ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Generating...
                </>
              ) : (
                "Generate Assessment"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Helper function to format timestamp
function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
