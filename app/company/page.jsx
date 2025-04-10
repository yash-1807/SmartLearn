"use client";

import { useState, useEffect } from "react";
import { Upload, Send, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ReactMarkdown from "react-markdown";
import { useSearchParams } from "next/navigation";

const DocumentUploader = () => {
  // Use search params to get company information
  const searchParams = useSearchParams();
  const companyId = searchParams.get("id") || "default";
  const companyTitle = searchParams.get("title") || "Company";

  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Safe stringify function that handles circular references and complex objects
  const safeStringify = (obj) => {
    try {
      // Handle circular references
      const getCircularReplacer = () => {
        const seen = new WeakSet();
        return (key, value) => {
          if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
              return "[Circular Reference]";
            }
            seen.add(value);
          }
          return value;
        };
      };

      return JSON.stringify(obj, getCircularReplacer(), 2);
    } catch (error) {
      return `Cannot stringify response: ${error.message}`;
    }
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!name || !file) {
      alert("Please enter your name and select a document.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8005/segment_document/", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      // Check if the response contains a raw field with markdown formatting
      if (data.segmented_document && data.segmented_document.raw) {
        const rawText = data.segmented_document.raw;
        // Remove markdown formatting (e.g. "```json" and "```")
        const cleaned = rawText
          .replace(/```json/, "")
          .replace(/```/, "")
          .trim();
        try {
          const parsed = JSON.parse(cleaned);
          if (parsed.sections) {
            setSections(parsed.sections);
            // Select the first section by default if available
            if (parsed.sections.length > 0) {
              setSelectedSection(parsed.sections[0]);
            }
          } else {
            setSections([]);
          }
        } catch (jsonError) {
          console.error("Error parsing JSON:", jsonError);
          setSections([]);
        }
      } else {
        setSections([]);
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      setSections([]);
    }
  };

  const handleSectionClick = (section) => {
    setSelectedSection(section);
    setIsMobileMenuOpen(false);
  };

  const handleSendMessage = async () => {
    if (message.trim() && file?.name) {
      setApiError(null);
      // Check if we have both message and file
      const userMessage = { sender: "user", message: message }; // Changed 'text' to 'message' to match Backend
      setChatMessages((prevMessages) => [...prevMessages, userMessage]);
      setMessage("");

      try {
        const response = await fetch("http://localhost:8005/document_qa/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: message,
            document_id: file.name, // Use the filename as document_id
            conversation_history: chatMessages.map((msg) => ({
              sender: msg.sender,
              message: msg.text || msg.message, // Map 'text' to 'message'
            })),
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Extract the raw answer from the response structure
        let answerText = "No answer received.";

        if (data && data.answer && data.answer.raw) {
          // If the answer is in the expected format with a 'raw' field
          answerText = data.answer.raw;
        } else if (data && data.answer && typeof data.answer === "string") {
          // If the answer is directly a string
          answerText = data.answer;
        } else if (data && typeof data === "string") {
          // If the entire response is a string
          answerText = data;
        }

        const aiMessage = {
          sender: "ai",
          message: answerText,
        };

        setChatMessages((prevMessages) => [...prevMessages, aiMessage]);
      } catch (error) {
        console.error("Error sending message:", error);
        setApiError(`Error: ${error.message}`);
        const errorAiMessage = {
          sender: "ai",
          message: "Error: Could not retrieve answer.",
        };
        setChatMessages((prevMessages) => [...prevMessages, errorAiMessage]);
      }
    }
  };

  // Scroll to bottom of chat when messages change
  const scrollRef = useEffect(() => {
    const scrollElement = document.querySelector(".chat-scroll-area");
    if (scrollElement) {
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [chatMessages]);

  // Get company logo URL based on ID
  const getCompanyLogo = (id) => {
    switch (id.toLowerCase()) {
      case "unisys":
        return "/unisys.webp?height=30&width=30";
      default:
        return "/placeholder.svg?height=30&width=30";
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Top Navbar */}
      <header className="bg-primary text-primary-foreground p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">SmartLearn</h1>
          <div className="flex items-center gap-2">
            <span>{name || "Guest"}</span>
          </div>
        </div>
      </header>

      {/* Secondary Navbar - Dynamic Company Title */}
      <div className="bg-slate-100 p-3 border-b">
        <div className="container mx-auto flex items-center gap-2">
          <img
            src={getCompanyLogo(companyId)}
            alt={`${companyTitle} Logo`}
            className="h-8 w-8"
          />
          <span className="font-semibold text-slate-800">{companyTitle}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar for Desktop */}
        <div className="hidden md:block w-64 border-r bg-slate-50 overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex flex-col gap-3">
              <Input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={handleNameChange}
              />
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="file-upload"
                  className="flex-1 cursor-pointer px-4 py-2 border rounded-md text-sm text-center hover:bg-slate-100"
                >
                  {file ? file.name : "Select Document"}
                </label>
                <Button onClick={handleUpload} size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </div>
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-13rem)]">
            <div className="p-2">
              <h3 className="font-medium px-2 py-1">Document Sections</h3>
              {sections.length > 0 ? (
                <div className="mt-2 space-y-1">
                  {sections.map((section, index) => (
                    <button
                      key={index}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                        selectedSection === section
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-slate-200"
                      }`}
                      onClick={() => handleSectionClick(section)}
                    >
                      {section.heading || `Section ${index + 1}`}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground p-2">
                  Upload a document to see sections
                </p>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Mobile Menu Button */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="md:hidden absolute top-20 left-4 z-10"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <div className="p-4 border-b">
              <div className="flex flex-col gap-3">
                <Input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={handleNameChange}
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    id="mobile-file-upload"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <label
                    htmlFor="mobile-file-upload"
                    className="flex-1 cursor-pointer px-4 py-2 border rounded-md text-sm text-center hover:bg-slate-100"
                  >
                    {file ? file.name : "Select Document"}
                  </label>
                  <Button onClick={handleUpload} size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-10rem)]">
              <div className="p-2">
                <h3 className="font-medium px-2 py-1">Document Sections</h3>
                {sections.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {sections.map((section, index) => (
                      <button
                        key={index}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                          selectedSection === section
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-slate-200"
                        }`}
                        onClick={() => handleSectionClick(section)}
                      >
                        {section.heading || `Section ${index + 1}`}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground p-2">
                    Upload a document to see sections
                  </p>
                )}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chat/Content Display */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 p-4 chat-scroll-area">
              {selectedSection ? (
                <div className="max-w-3xl mx-auto">
                  <h2 className="text-2xl font-bold mb-4">
                    {selectedSection.heading}
                  </h2>
                  <div className="prose">
                    <p className="whitespace-pre-wrap">
                      {selectedSection.content}
                    </p>
                  </div>

                  {/* API Error message */}
                  {apiError && (
                    <div className="mt-8 space-y-4">
                      <Separator />
                      <h3 className="text-lg font-semibold mt-4 text-red-500">
                        Error
                      </h3>
                      <Card className="bg-red-50 border-red-200">
                        <CardContent className="p-3">
                          <p className="text-red-600">{apiError}</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Chat Messages */}
                  {chatMessages.length > 0 && (
                    <div className="mt-8 space-y-4">
                      <Separator />
                      <h3 className="text-lg font-semibold mt-4">
                        Conversation
                      </h3>
                      {chatMessages.map((msg, idx) => (
                        <Card
                          key={idx}
                          className={`${
                            msg.sender === "user"
                              ? "ml-auto bg-primary text-primary-foreground"
                              : "mr-auto bg-muted"
                          } max-w-[80%]`}
                        >
                          <CardContent className="p-3">
                            {msg.sender === "user" ? (
                              <p>{msg.text || msg.message}</p>
                            ) : (
                              <div className="prose prose-sm max-w-none">
                                <ReactMarkdown>
                                  {msg.text || msg.message}
                                </ReactMarkdown>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center max-w-md mx-auto p-6">
                    <h3 className="text-xl font-semibold mb-2">
                      No Content Selected
                    </h3>
                    <p className="text-muted-foreground">
                      {sections.length > 0
                        ? "Select a section from the sidebar to view its content"
                        : "Upload a document to get started"}
                    </p>
                  </div>
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="max-w-3xl mx-auto flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask a question about this document..."
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <Button onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploader;
