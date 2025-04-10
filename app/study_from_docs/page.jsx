"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function StudyFromDocsPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    days: "",
    documents: null,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Create a new FormData object (renamed to "payload" to avoid conflict)
    const payload = new FormData();
    payload.append("name", formData.name);
    payload.append("study_duration", formData.days);

    // Ensure that documents exist before iterating
    if (formData.documents) {
      Array.from(formData.documents).forEach((file) => {
        payload.append("file", file);
      });
    } else {
      console.error("No documents selected.");
      return;
    }

    try {
      const res = await fetch("http://localhost:8003/generate_day_timeline/", {
        method: "POST",
        body: payload,
      });
      if (!res.ok) {
        throw new Error("Failed to generate timeline");
      }
      const data = await res.json();
      // Optionally, you can process the response here before navigating
      router.push("/rag_timeline"); // Redirect to your next page
    } catch (err) {
      console.error("Error generating timeline:", err);
    }
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      documents: e.target.files,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white shadow-xl border-none rounded-2xl">
          <CardHeader className="space-y-3">
            <CardTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600">
              Create Your Personal Learning Plan
            </CardTitle>
            <CardDescription className="text-gray-500 text-center">
              Fill out the form below to start your personalized learning
              journey.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="days">Study Duration (in days)</Label>
                <Input
                  id="days"
                  type="number"
                  placeholder="How many days do you have?"
                  value={formData.days}
                  onChange={(e) =>
                    setFormData({ ...formData, days: e.target.value })
                  }
                  required
                  min="1"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="documents">Upload Your Documents</Label>
                <Input
                  id="documents"
                  type="file"
                  onChange={handleFileChange}
                  required
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                  className="w-full"
                />
                <p className="text-sm text-gray-500">
                  Supported formats: PDF, DOC, DOCX, TXT
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white py-2 rounded-lg transition-all"
              >
                Create Learning Plan
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
