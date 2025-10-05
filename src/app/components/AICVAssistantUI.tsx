"use client";
import { useState } from "react";

export default function RecruitlyUI() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [jobDesc, setJobDesc] = useState("");
  const [results, setResults] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState("");

  const MAX_FILES = 10;

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    if (selectedFiles.length > MAX_FILES) {
      setWarning(`You can upload a maximum of ${MAX_FILES} CVs at once.`);
      setFiles(null);
      return;
    }

    setWarning("");
    setFiles(selectedFiles);
  };

  const handleAnalyze = async () => {
    if (!files || !jobDesc) {
      alert("Please upload CVs and enter a job description.");
      return;
    }

    setLoading(true);
    setResults(null);

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));
    formData.append("jobDesc", jobDesc);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const text = await res.text();
      setResults(text);
    } catch (err) {
      console.error("Error analyzing CVs:", err);
      setResults("Failed to fetch analysis.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex flex-col items-center p-8">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-gradient-x">
          Recruitly
        </h1>
        <p className="text-gray-700 mt-2 text-lg">
          Smart AI CV Analyzer – Match candidates to your job effortlessly
        </p>
      </header>

      {/* Input Card */}
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-3xl space-y-6 border-l-4 border-gradient-to-b from-blue-400 via-purple-400 to-pink-400">
        <div>
          <label className="block mb-2 font-semibold text-gray-700">Upload a maximum of 10 CV(s)</label>
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleUpload}
            className="block w-full text-gray-700 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
          />
          {warning && <p className="text-red-600 mt-2">{warning}</p>}
        </div>

        <div>
          <label className="block mb-2 font-semibold text-gray-700">Job Description</label>
          <textarea
            placeholder="Paste job description here..."
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
            className="w-full h-40 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
          ></textarea>
        </div>

        <button
          onClick={handleAnalyze}
          className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold py-3 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          {loading ? "Analyzing..." : "Analyze CVs"}
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className="w-full max-w-3xl mt-8 space-y-4">
          <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">Analysis Results</h2>
          {results.split("=====").map((section, index) => {
            if (!section.trim()) return null;
            return (
              <details
                key={index}
                className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-purple-400 cursor-pointer hover:bg-purple-50 transition"
              >
                <summary className="font-semibold text-gray-800 text-lg">{section.split("\n")[0]}</summary>
                <pre className="whitespace-pre-wrap text-gray-700 text-sm mt-3">{section}</pre>
              </details>
            );
          })}
        </div>
      )}

      <footer className="mt-12 text-gray-500 text-sm text-center">
        &copy; 2025 Recruitly AI. All rights reserved.
      </footer>
    </main>
  );
}
