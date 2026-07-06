# backend/events.py

GRAPH_START = "graph_start"
NODE_START = "node_start"
NODE_LOG = "node_log"
REPORT_GENERATED = "report_generated"
NODE_END = "node_end"
GRAPH_END = "graph_end"
ERROR = "error"

VALID_EVENT_TYPES = {
    GRAPH_START,
    NODE_START,
    NODE_LOG,
    REPORT_GENERATED,
    NODE_END,
    GRAPH_END,
    ERROR,
}