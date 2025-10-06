"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";

export default function AICVAssistantUI() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [jobDesc, setJobDesc] = useState("");
  const [results, setResults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState("");
  const [open, setOpen] = useState(true);

  const MAX_FILES = 10;

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;

    if (selected.length > MAX_FILES) {
      setWarning(`⚠️ You can upload a maximum of ${MAX_FILES} CVs.`);
      setFiles(null);
      return;
    }

    setWarning("");
    setFiles(selected);
  };

  const handleAnalyze = async () => {
    if (!files || !jobDesc) {
      alert("Please upload CVs and enter a job description first.");
      return;
    }

    setLoading(true);
    setResults({});

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));
    formData.append("jobDesc", jobDesc);

    try {
      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      const text = await res.text();
      const cleanText = text
        .replace(/\r/g, "")
        .replace(/📄 Job Description:[\s\S]*?(?=\n[A-Z]|$)/gi, "")
        .trim();

      const sections = cleanText
        .split(/(?:^|\n)(?=[A-Z].*\.pdf|\=+|---)/gm)
        .map((s) => s.trim())
        .filter((s) => s && s.length > 10);

      const newResults: Record<string, string> = {};
      for (const section of sections) {
        const lines = section.split("\n").filter((l) => l.trim());
        const header = lines[0]?.trim() || "Unnamed Candidate";
        const content = lines.slice(1).join("\n").trim();

       // Skip any section that matches the job description or job title
       if (header.toLowerCase().includes("role") || header.toLowerCase().includes(jobDesc.slice(0, 20).toLowerCase())) {
          continue;
      }

       newResults[header] = content;
      }   

      setResults(newResults);
    } catch (err) {
      console.error("Error analyzing CVs:", err);
      alert("Failed to analyze CVs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let y = 50;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Recruitly AI Candidate Analysis Results", 40, y);
  y += 30;

  // Job Description separate
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("📄 Job Description", 40, y);
  y += 20;
  doc.setFont("helvetica", "normal");
  const jobLines = doc.splitTextToSize(jobDesc, 500);
  jobLines.forEach((line: string) => {
    if (y > 750) {
      doc.addPage();
      y = 50;
    }
    doc.text(line, 40, y);
    y += 16;
  });
  y += 20;

  // Helper: clean text for PDF
  const cleanTextForPDF = (text: string) =>
    text
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // remove control chars
      .replace(/📄 Job Description[:\s\S]*?(?=\n[A-Z]|$)/gi, "") // remove job description block
      .replace(/^=+\s*.*\s*=+/gm, "") // remove ===== lines
      .trim();

  // Candidate Results
  let candidateIndex = 1;
  Object.entries(results)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([fileName, result]) => {
      // Skip any section that matches job description or empty
      if (!result || result.trim().length === 0) return;

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`${candidateIndex}. ${fileName}`, 40, y);
      y += 20;
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(cleanTextForPDF(result), 500);
      lines.forEach((line: string) => {
        if (y > 750) {
          doc.addPage();
          y = 50;
        }
        doc.text(line, 40, y);
        y += 16;
      });
      y += 20;
      candidateIndex += 1;
    });

  doc.save("Recruitly_Results.pdf");
};

  const extractScore = (text: string): number => {
    const match = text.match(/Match Score[:\s]*([0-9]{1,3})/i);
    const score = match ? parseInt(match[1]) : 0;
    return Math.min(Math.max(score, 0), 100);
  };

  const getCardColor = (score: number) => {
    if (score >= 80) return "from-emerald-800/30 via-gray-900 to-gray-950";
    if (score >= 50) return "from-yellow-800/30 via-gray-900 to-gray-950";
    return "from-red-800/30 via-gray-900 to-gray-950";
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
    }),
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-gray-100 flex flex-col items-center p-8 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(147,51,234,0.2),transparent_70%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.15),transparent_70%)] animate-pulse-slow -z-10" />

      {/* Header */}
      <motion.header
        className="text-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.h1
          className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 drop-shadow-[0_0_25px_rgba(168,85,247,0.6)]"
          animate={{
            textShadow: [
              "0 0 20px #a855f7",
              "0 0 30px #ec4899",
              "0 0 20px #3b82f6",
              "0 0 25px #a855f7",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
        >
          Recruitly<span className="text-pink-400">+</span>
        </motion.h1>
        <p className="text-gray-400 mt-3 text-lg font-medium">
          AI-Powered Talent Matching
        </p>
      </motion.header>

      {/* Upload Section */}
      <motion.div
        className="relative bg-black/40 backdrop-blur-xl border border-purple-700/40 rounded-2xl p-8 w-full max-w-3xl space-y-6 shadow-[0_0_40px_rgba(168,85,247,0.15)] overflow-hidden"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Gradient border shimmer */}
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-transparent bg-[conic-gradient(from_0deg,rgba(147,51,234,0.4),rgba(236,72,153,0.3),rgba(59,130,246,0.4),rgba(147,51,234,0.4))] animate-spin-slow"
          style={{
            maskImage: "linear-gradient(white, white)",
            WebkitMaskImage: "linear-gradient(white, white)",
          }}
        />

        {/* Inner glass panel */}
        <div className="relative z-10 space-y-6">
          {/* Upload CVs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block mb-2 font-semibold text-gray-300 text-lg">
              Upload up to 10 CVs
            </label>
            <motion.input
              type="file"
              multiple
              accept=".pdf"
              onChange={handleUpload}
              whileHover={{ scale: 1.01 }}
              className="block w-full text-gray-200 bg-gray-900/70 border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition shadow-[inset_0_0_15px_rgba(147,51,234,0.2)]"
            />
            {warning && <p className="text-red-400 mt-2">{warning}</p>}
          </motion.div>

          {/* Job Description */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block mb-2 font-semibold text-gray-300 text-lg">
              Job Description
            </label>
            <textarea
              placeholder="Paste the job description here..."
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              className="w-full h-40 p-3 bg-gray-900/70 border border-gray-700 rounded-lg text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-pink-500 transition shadow-[inset_0_0_15px_rgba(236,72,153,0.2)]"
            />
          </motion.div>

          {/* Analyze Button */}
          <motion.button
            onClick={handleAnalyze}
            disabled={loading}
            className={`relative w-full py-4 rounded-xl font-bold text-white overflow-hidden flex items-center justify-center transition-all ${
              loading
                ? "bg-gray-800 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 hover:scale-[1.02] shadow-[0_0_25px_rgba(168,85,247,0.3)]"
            }`}
            whileTap={{ scale: 0.97 }}
          >
            {loading ? (
              <motion.div className="flex flex-col items-center gap-3" initial="hidden" animate="visible">
                <motion.div
                  className="relative flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <motion.div
                    className="absolute w-14 h-14 rounded-full border-4 border-transparent border-t-purple-500 border-b-pink-400"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                  <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.6)]"></div>
                </motion.div>
                <motion.span
                  className="text-sm text-gray-300 font-medium"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Analyzing talent matches...
                </motion.span>
              </motion.div>
            ) : (
              <>
                <motion.span
                  className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0.2)_25%,transparent_50%,rgba(255,255,255,0.2)_75%)] animate-shimmer"
                  aria-hidden="true"
                />
                🚀 Analyze CVs
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Results Section */}
      <AnimatePresence>
        {!loading && Object.keys(results).length > 0 && (
          <motion.section
            className="w-full max-w-7xl mt-14 flex flex-col items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="rounded-2xl border border-purple-700/40 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-800 shadow-[0_0_40px_rgba(168,85,247,0.15)] w-full">
              <button
                onClick={() => setOpen(!open)}
                className="w-full flex justify-between items-center px-6 py-5 text-left text-2xl font-bold text-purple-300 hover:text-pink-400 transition-colors"
              >
                <span>📊 Candidate Analysis Results</span>
                <motion.span animate={{ rotate: open ? 90 : 0 }} className="text-gray-400">
                  ▶
                </motion.span>
              </button>

              <AnimatePresence>
                {open && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4 }}
                    className="border-t border-gray-700 p-8 overflow-y-auto max-h-[75vh]"
                  >
                    {/* Job Description Card */}
                    <motion.div
                      className="rounded-2xl border border-purple-600/40 bg-gradient-to-br from-gray-900/50 via-gray-950 to-gray-900 p-6 mb-6 shadow-md"
                      initial="hidden"
                      animate="visible"
                      custom={0}
                    >
                      <h3 className="text-lg font-bold text-purple-300 mb-2">📄 Job Description</h3>
                      <pre className="whitespace-pre-wrap text-sm text-gray-200 leading-relaxed">{jobDesc}</pre>
                    </motion.div>

                    <motion.div
                      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8"
                      initial="hidden"
                      animate="visible"
                    >
                      {Object.entries(results)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([fileName, result], i) => {
                          const cleanName = fileName
                            .replace(/^=+|=+$/g, "")
                            .replace(".pdf", "")
                            .replace(/\(\d+\)/g, "")
                            .replace(/_/g, " ")
                            .trim();
                          const score = extractScore(result);
                          const colorClass = getCardColor(score);

                          return (
                            <motion.div
                              key={fileName}
                              custom={i + 1}
                              whileHover={{
                                scale: 1.05,
                                rotateX: 5,
                                rotateY: -5,
                                boxShadow:
                                  "0 0 40px rgba(168,85,247,0.4), 0 0 80px rgba(59,130,246,0.2)",
                              }}
                              className={`rounded-2xl border border-purple-600/40 bg-gradient-to-br ${colorClass} p-6 shadow-md transition-all`}
                            >
                              <h3 className="text-lg font-bold text-purple-300 mb-2">{cleanName}</h3>
                              <p className="text-sm mb-3 text-gray-400">
                                Match Score:{" "}
                                <span
                                  className={`font-bold ${
                                    score >= 80
                                      ? "text-green-400"
                                      : score >= 50
                                      ? "text-yellow-400"
                                      : "text-red-400"
                                  }`}
                                >
                                  {score}%
                                </span>
                              </p>
                              <pre className="whitespace-pre-wrap text-sm text-gray-200 leading-relaxed">
                                {result
                                  .replace(/^=+\s*.*\s*=+/g, "")
                                  .replace(/📄 Job Description:[\s\S]*?(?=\n[A-Z]|$)/gi, "")
                                  .trim()}
                              </pre>
                            </motion.div>
                          );
                        })}
                    </motion.div>

                    <div className="text-center pt-10">
                      <button
                        onClick={handleDownloadPDF}
                        className="px-8 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 rounded-xl font-bold text-white hover:scale-105 shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-all"
                      >
                        📥 Download Results as PDF
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-16 text-gray-500 text-sm text-center">
        &copy; {new Date().getFullYear()} Recruitly AI —{" "}
        <span className="text-purple-400">Smarter and Faster Hiring with Recruitly AI.</span>
        <br />
        <span className="text-gray-400">Developed by Brian Pope Dela Rosa</span>
      </footer>
    </main>
  );
}
