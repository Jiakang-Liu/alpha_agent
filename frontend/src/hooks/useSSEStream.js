import { useState } from "react";

export function useSSEStream() {
  const [activeNode, setActiveNode] = useState(null);
  const [logs, setLogs] = useState([]);
  const [report, setReport] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const triggerAnalysis = async (ticker, userQuery) => {
    setIsStreaming(true);
    setActiveNode(null);
    setLogs([]);
    setReport("");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticker,
          user_query: userQuery,
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        const frames = buffer.split("\n\n");
        buffer = frames.pop() || "";

        for (const frame of frames) {
          const lines = frame.split("\n");
          const dataLine = lines.find((line) => line.startsWith("data:"));

          if (!dataLine) continue;

          const jsonText = dataLine.replace(/^data:\s*/, "").trim();

          if (!jsonText) continue;

          const event = JSON.parse(jsonText);

          console.log("SSE EVENT:", event);

          if (event.type === "node_start") {
            setActiveNode(event.node);
          }

          if (event.type === "node_log") {
            setLogs((prev) => [...prev, event.message]);
          }

          if (event.type === "token") {
            setReport((prev) => prev + event.content);
          }

          if (event.type === "error") {
            setLogs((prev) => [...prev, `❌ ${event.content}`]);
            setActiveNode(null);
            setIsStreaming(false);
            return;
          }

          if (event.type === "graph_end") {
            setActiveNode(null);
            setIsStreaming(false);
            return;
          }
        }
      }

      setActiveNode(null);
      setIsStreaming(false);
    } catch (error) {
      console.error(error);

      setLogs((prev) => [...prev, `❌ ${error.message}`]);
      setActiveNode(null);
      setIsStreaming(false);
    }
  };

  return {
    activeNode,
    logs,
    report,
    isStreaming,
    triggerAnalysis,
  };
}