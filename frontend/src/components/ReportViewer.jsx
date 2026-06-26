import ReactMarkdown from "react-markdown";
import "../styles/markdown.css";

export default function ReportViewer({
  report,
  isStreaming,
}) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl bg-[#242133] p-6">
      <div className="text-sm text-slate-400">
        ANALYSIS REPORT ENGINE
      </div>

      <h1 className="mt-2 text-4xl font-bold leading-tight text-white">
        Real-time Markdown Rendering
      </h1>

      <div className="mt-6 min-h-0 flex-1 overflow-y-auto rounded-2xl bg-[#faf7ef] p-8 text-black">
        <div className="prose max-w-none">
          <ReactMarkdown>
            {report}
          </ReactMarkdown>

          {isStreaming && (
            <span className="animate-pulse">|</span>
          )}
        </div>
      </div>
    </div>
  );
}