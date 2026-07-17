import { useState } from "react";
import { API_BASE_URL } from "../config/api";

function normalizeNodeName(node) {
  const normalizedNode = String(node || "")
    .trim()
    .toLowerCase();

  const aliases = {
    analyst: "analyst_agent",
    dataagent: "data_agent",
  };

  return aliases[normalizedNode] || normalizedNode;
}

function formatNodeName(node) {
  const normalizedNode = normalizeNodeName(node);

  const nodeLabels = {
    supervisor: "Supervisor",
    data_agent: "Data Agent",
    analyst_agent: "Analyst",
    critic: "Critic",
    system: "System",
  };

  return (
    nodeLabels[normalizedNode] ||
    String(node || "Pipeline")
      .replaceAll("_", " ")
      .replace(/\b\w/g, (character) =>
        character.toUpperCase(),
      )
  );
}

function createLogEntry(event, status = "completed") {
  const normalizedNode = normalizeNodeName(
    event.node || "system",
  );

  return {
    id:
      event.id ||
      `${event.type || "event"}-${normalizedNode}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,

    timestamp: new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),

    node: normalizedNode,

    message:
      event.message ||
      event.content ||
      "Pipeline event received.",

    status,
    type: event.type || "event",
    rawEvent: event,
  };
}

function addCompletedNode(previousNodes, node) {
  const normalizedNode = normalizeNodeName(node);

  if (
    !normalizedNode ||
    previousNodes.includes(normalizedNode)
  ) {
    return previousNodes;
  }

  return [...previousNodes, normalizedNode];
}

export function useSSEStream() {
  const [activeNode, setActiveNode] = useState(null);
  const [completedNodes, setCompletedNodes] = useState([]);
  const [runStatus, setRunStatus] = useState("idle");

  const [logs, setLogs] = useState([]);
  const [report, setReport] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const triggerAnalysis = async (ticker, userQuery) => {
    setIsStreaming(true);
    setRunStatus("running");

    setActiveNode(null);
    setCompletedNodes([]);
    setLogs([]);
    setReport("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify({
            ticker,
            user_query: userQuery,
          }),
        },
      );

      if (!response.ok) {
        let errorMessage = `Backend error: ${response.status}`;

        try {
          const errorBody = await response.json();

          errorMessage =
            errorBody.detail ||
            errorBody.message ||
            errorMessage;
        } catch {
          // The error response may not contain JSON.
        }

        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error(
          "The backend did not return an SSE stream.",
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let buffer = "";
      let graphFinished = false;

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, {
          stream: true,
        });

        const frames = buffer.split("\n\n");
        buffer = frames.pop() || "";

        for (const frame of frames) {
          const dataLines = frame
            .split("\n")
            .filter((line) => line.startsWith("data:"))
            .map((line) =>
              line.replace(/^data:\s*/, ""),
            );

          if (dataLines.length === 0) {
            continue;
          }

          const jsonText = dataLines.join("\n").trim();

          if (!jsonText) {
            continue;
          }

          let event;

          try {
            event = JSON.parse(jsonText);
          } catch (error) {
            console.error(
              "Invalid SSE JSON:",
              jsonText,
              error,
            );

            continue;
          }

          console.log("SSE EVENT:", event);

          switch (event.type) {
            case "graph_start": {
              setRunStatus("running");

              setLogs((previousLogs) => [
                ...previousLogs,
                createLogEntry(
                  {
                    ...event,
                    node: "system",
                    message:
                      event.message ||
                      "AlphaAgent analysis started.",
                  },
                  "completed",
                ),
              ]);

              break;
            }

            case "node_start": {
              const normalizedNode =
                normalizeNodeName(event.node);

              setActiveNode(normalizedNode);

              /*
               * Do not add a permanent "running" row here.
               *
               * LangGraph may enter the same node multiple times,
               * especially Supervisor. Adding one running row per
               * node_start can leave stale spinners in the log list.
               *
               * The active state is already represented by the
               * execution stepper.
               */
              break;
            }

            case "node_log": {
              setLogs((previousLogs) => [
                ...previousLogs,
                createLogEntry(
                  {
                    ...event,
                    node: normalizeNodeName(event.node),
                  },
                  event.status === "running"
                    ? "running"
                    : "completed",
                ),
              ]);

              break;
            }

            case "report_generated": {
              const reportContent =
                event.content ||
                event.report ||
                "";

              if (reportContent) {
                setReport((previousReport) => {
                  const isChunk =
                    event.is_chunk === true ||
                    event.streaming === true;

                  return isChunk
                    ? previousReport + reportContent
                    : reportContent;
                });
              }

              setLogs((previousLogs) => [
                ...previousLogs,
                createLogEntry(
                  {
                    ...event,
                    node: normalizeNodeName(
                      event.node || "analyst_agent",
                    ),
                    message:
                      "Financial report generated successfully.",
                  },
                  "completed",
                ),
              ]);

              break;
            }

            case "node_end": {
              const normalizedNode =
                normalizeNodeName(event.node);

              setCompletedNodes((previousNodes) =>
                addCompletedNode(
                  previousNodes,
                  normalizedNode,
                ),
              );

              setActiveNode((currentActiveNode) =>
                normalizeNodeName(currentActiveNode) ===
                normalizedNode
                  ? null
                  : currentActiveNode,
              );

              setLogs((previousLogs) => [
                ...previousLogs,
                createLogEntry(
                  {
                    ...event,
                    node: normalizedNode,
                    message: `${formatNodeName(
                      normalizedNode,
                    )} completed.`,
                  },
                  "completed",
                ),
              ]);

              break;
            }

            case "error": {
              setLogs((previousLogs) => [
                ...previousLogs,
                createLogEntry(
                  {
                    ...event,
                    node: normalizeNodeName(
                      event.node || "system",
                    ),
                    message:
                      event.message ||
                      event.content ||
                      "Analysis failed.",
                  },
                  "failed",
                ),
              ]);

              setRunStatus("failed");
              setActiveNode(null);
              setIsStreaming(false);

              return;
            }

            case "graph_end": {
              graphFinished = true;

              setLogs((previousLogs) => [
                ...previousLogs,
                createLogEntry(
                  {
                    ...event,
                    node: "system",
                    message:
                      event.message ||
                      "AlphaAgent analysis completed.",
                  },
                  "completed",
                ),
              ]);

              setRunStatus("completed");
              setActiveNode(null);
              setIsStreaming(false);

              return;
            }

            default: {
              setLogs((previousLogs) => [
                ...previousLogs,
                createLogEntry(
                  {
                    ...event,
                    node: normalizeNodeName(
                      event.node || "system",
                    ),
                  },
                  "completed",
                ),
              ]);
            }
          }
        }
      }

      /*
       * Normally graph_end returns before reaching this point.
       * Reaching the end without graph_end means the stream closed
       * unexpectedly.
       */
      if (!graphFinished) {
        setLogs((previousLogs) => [
          ...previousLogs,
          createLogEntry(
            {
              type: "error",
              node: "system",
              message:
                "The analysis stream closed before graph completion.",
            },
            "failed",
          ),
        ]);

        setRunStatus("failed");
      }

      setActiveNode(null);
      setIsStreaming(false);
    } catch (error) {
      console.error("SSE analysis failed:", error);

      setLogs((previousLogs) => [
        ...previousLogs,
        createLogEntry(
          {
            type: "error",
            node: "system",
            message:
              error instanceof Error
                ? error.message
                : "Unexpected analysis error.",
          },
          "failed",
        ),
      ]);

      setRunStatus("failed");
      setActiveNode(null);
      setIsStreaming(false);
    }
  };

  return {
    activeNode,
    completedNodes,
    runStatus,
    logs,
    report,
    isStreaming,
    triggerAnalysis,
  };
}