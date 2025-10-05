"use client";
import { useState } from "react";

export default function AICVAssistantUI() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [jobDesc, setJobDesc] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const handleAnalyze = async () => {
    if (!files || !jobDesc) {
      alert("Please upload CVs and enter a job description.");
      return;
    }

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));
    formData.append("jobDesc", jobDesc);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      // ✅ Use .text() since the API returns plain text
      const text = await res.text();
      setResult(text);
    } catch (err) {
      console.error("Error analyzing CVs:", err);
      setResult("Failed to fetch analysis.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-4">AI CV Assistant</h1>

      <input
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt"
        onChange={handleUpload}
        className="mb-3"
      />

      <textarea
        placeholder="Paste job description here..."
        value={jobDesc}
        onChange={(e) => setJobDesc(e.target.value)}
        className="border p-2 w-96 h-32 mb-3"
      />

      <button
        onClick={handleAnalyze}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Analyzing..." : "Analyze"}
      </button>

      {result && (
        <pre className="bg-white text-sm text-left p-4 mt-4 border w-full max-w-2xl whitespace-pre-wrap overflow-auto rounded">
          {result}
        </pre>
      )}
    </main>
  );
}
