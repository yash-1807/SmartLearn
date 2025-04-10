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
  Lightbulb,
  BarChart,
  Bookmark,
  CheckCircle2,
  Zap,
  Brain,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

export default function LearningChatPage() {
  const [weekSections, setWeekSections] = useState([]);
  const [activeWeek, setActiveWeek] = useState(1);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hoursPerWeek, setHoursPerWeek] = useState(0);
  const router = useRouter();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load study plan and hours from localStorage
  useEffect(() => {
    try {
      // Get hours per week
      const storedHours = localStorage.getItem("studyHoursPerWeek");
      if (storedHours) {
        setHoursPerWeek(parseInt(storedHours));
      }

      // Get study plan
      const storedWeeks = localStorage.getItem("studyPlanWeeks");
      if (storedWeeks) {
        const parsedWeeks = JSON.parse(storedWeeks);
        setWeekSections(parsedWeeks);

        // Initialize chat with welcome message
        setChatMessages([
          {
            sender: "ai",
            text: "Welcome to your interactive learning assistant! I'm here to guide you through your personalized learning journey. Select a week from the sidebar to discuss your learning plan.",
            timestamp: new Date().toISOString(),
          },
        ]);

        // Show first week content
        if (parsedWeeks.length > 0) {
          setActiveWeek(1);
        }
      } else {
        // No data found, redirect back to timeline
        router.push("/timeline_result");
      }
    } catch (error) {
      console.error("Error loading study plan:", error);
    }
  }, [router]);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Function to get the title for a specific week
  const getWeekTitle = (weekNumber) => {
    if (!weekNumber || weekNumber > weekSections.length)
      return `Week ${weekNumber}`;

    const section = weekSections[weekNumber - 1] || "";
    const match = section.match(/Week\s*\d+:\s*(.*?)(?:\n|$)/i);
    return match ? match[1].trim() : `Week ${weekNumber}`;
  };

  // Function to handle selecting a week
  const handleSelectWeek = (weekNumber) => {
    setActiveWeek(weekNumber);
    // Add a message about the selected week
    setChatMessages((prev) => [
      ...prev,
      {
        sender: "ai",
        text: `You've selected Week ${weekNumber}. Here's your learning plan for this week. What would you like to know about these topics?`,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  // Updated function to handle sending a message using the teacher agent on port 8002.
  // It includes conversation history and active week content.
  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    // Add user message to chat
    const userMsg = {
      sender: "user",
      text: messageInput,
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, userMsg]);

    const currentUserMessage = messageInput;
    setMessageInput("");

    // Show typing indicator
    setIsTyping(true);

    // Build conversation history including the new message
    const conversationHistory = [...chatMessages, userMsg].map((msg) => ({
      sender: msg.sender,
      message: msg.text,
    }));

    // Get active week content
    const activeWeekContent = weekSections[activeWeek - 1] || "";

    // Build payload for the POST request
    const payload = {
      user_message: currentUserMessage,
      active_week_content: activeWeekContent,
      conversation_history: conversationHistory,
    };

    try {
      const res = await fetch("http://localhost:8002/chat_teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error("Failed to get teacher response");
      }
      const data = await res.json();
      const finalText =
        typeof data.response === "object" && data.response.raw
          ? data.response.raw
          : data.response;

      // Append teacher (AI) response to chat messages using finalText
      const aiResponse = {
        sender: "ai",
        text: finalText,
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error sending chat message:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Sorry, there was an error processing your message.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Helper function to get week icon based on week number
  const getWeekIcon = (weekNumber) => {
    const icons = [
      <BookOpen key="1" className="h-4 w-4" />,
      <BarChart key="2" className="h-4 w-4" />,
      <Sparkles key="3" className="h-4 w-4" />,
      <Brain key="4" className="h-4 w-4" />,
      <Zap key="5" className="h-4 w-4" />,
      <Lightbulb key="6" className="h-4 w-4" />,
      <CheckCircle2 key="7" className="h-4 w-4" />,
      <Bookmark key="8" className="h-4 w-4" />,
    ];
    return icons[(weekNumber - 1) % icons.length];
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
          <Link href="/timeline_result">
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

      {/* Active Week Banner */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-500 border-b border-purple-600 py-3 px-6 sticky top-[60px] z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              {getWeekIcon(activeWeek)}
            </div>
            <div>
              <h2 className="font-medium text-white">
                Week {activeWeek}: {getWeekTitle(activeWeek)}
              </h2>
              <p className="text-xs text-purple-100 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {hoursPerWeek} total hours
              </p>
            </div>
          </div>
          <Badge className="bg-white/20 hover:bg-white/30 text-white border-none transition-colors">
            Current Focus
          </Badge>
        </div>
      </div>

      {/* Main content - Sidebar + Chat */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar - fixed position */}
        <div className="w-72 bg-white border-r overflow-hidden flex flex-col fixed top-[120px] bottom-0 left-0 shadow-sm">
          <div className="p-4 font-medium text-gray-700 border-b bg-slate-100 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-violet-600" />
            <span>Learning Weeks</span>
          </div>
          <ScrollArea className="flex-1">
            <nav className="p-2">
              {weekSections.map((_, index) => {
                const weekNum = index + 1;
                return (
                  <motion.button
                    key={index}
                    onClick={() => handleSelectWeek(weekNum)}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-all mb-2 ${
                      activeWeek === weekNum
                        ? "bg-violet-50 text-violet-700 font-medium border-l-4 border-violet-500"
                        : "text-gray-700 hover:bg-slate-100 border-l-4 border-transparent"
                    }`}
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center">
                      <div
                        className={`p-2 rounded-full ${
                          activeWeek === weekNum
                            ? "bg-violet-100 text-violet-600"
                            : "bg-slate-100 text-slate-600"
                        } mr-3`}
                      >
                        {getWeekIcon(weekNum)}
                      </div>
                      <div>
                        <div className="font-medium">Week {weekNum}</div>
                        <div className="text-xs text-gray-500 flex items-center mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {hoursPerWeek} hours
                        </div>
                      </div>
                    </div>
                    {activeWeek === weekNum && (
                      <ChevronRight className="h-4 w-4 text-violet-600" />
                    )}
                  </motion.button>
                );
              })}
            </nav>
          </ScrollArea>
          <div className="p-4 border-t bg-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Avatar className="h-8 w-8 mr-2 border-2 border-white shadow-sm">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" />
                  <AvatarFallback className="bg-violet-100 text-violet-700">
                    U
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-medium">Student</div>
                  <div className="text-xs text-gray-500">Online</div>
                </div>
              </div>
              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white transition-colors">
                Active
              </Badge>
            </div>
          </div>
        </div>

        {/* Chat Area - with margin to make space for fixed sidebar */}
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

          {/* Chat Messages - make this scrollable with flex-1 to fill available space */}
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
                      <ReactMarkdown>
                        {typeof message.text === "string"
                          ? message.text
                          : String(message.text)}
                      </ReactMarkdown>
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

          {/* Input Area - fixed at the bottom */}
          <div className="border-t bg-white p-4 sticky bottom-0 left-0 right-0 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask about your learning plan..."
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
            <div className="flex justify-center mt-3">
              <div className="flex gap-3 text-xs">
                <button
                  className="px-3 py-1.5 rounded-full bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors"
                  onClick={() => setMessageInput("Explain the topics")}
                >
                  <Sparkles className="h-3 w-3 inline mr-1" />
                  Explain topics
                </button>
                <button
                  className="px-3 py-1.5 rounded-full bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors"
                  onClick={() => setMessageInput("Resources for this week")}
                >
                  <BookOpen className="h-3 w-3 inline mr-1" />
                  Resources
                </button>
                <button
                  className="px-3 py-1.5 rounded-full bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors"
                  onClick={() => setMessageInput("Track my progress")}
                >
                  <BarChart className="h-3 w-3 inline mr-1" />
                  Track progress
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to format timestamp
function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
