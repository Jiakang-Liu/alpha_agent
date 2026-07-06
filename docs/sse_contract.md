# AlphaAgent SSE Contract v1

## Overview

This document defines the Server-Sent Events (SSE) protocol between the AlphaAgent backend and frontend.

The frontend must only rely on the event contract defined in this document.

---

## Transport Rules

Content-Type:

```text
text/event-stream
```

Every SSE message must be emitted in the following format:

```text
data: <json>

```

Example:

```text
data: {"type":"graph_start"}

data: {"type":"node_start","node":"data_agent"}

data: {"type":"graph_end"}
```

---

## Event Types

### graph_start

Indicates the graph execution has started.

Payload:

```json
{
  "type": "graph_start"
}
```

Rules:

* Must appear exactly once
* Must be the first event

---

### node_start

Indicates a node has started execution.

Payload:

```json
{
  "type": "node_start",
  "node": "data_agent"
}
```

Rules:

* May appear multiple times
* Must contain `node`

---

### node_log

Represents an informational log generated during node execution.

Payload:

```json
{
  "type": "node_log",
  "node": "data_agent",
  "message": "Retrieving SEC filings..."
}
```

Rules:

* Optional
* May appear multiple times
* Must contain `message`

---

### report_generated

Represents the final generated report.

Payload:

```json
{
  "type": "report_generated",
  "content": "# Investment Analysis..."
}
```

Rules:

* Must contain `content`

---

### node_end

Indicates a node has completed execution.

Payload:

```json
{
  "type": "node_end",
  "node": "data_agent"
}
```

Rules:

* May appear multiple times
* Must contain `node`

---

### graph_end

Indicates the graph execution has completed.

Payload:

```json
{
  "type": "graph_end"
}
```

Rules:

* Must appear exactly once
* Must be the final event

---

### error

Represents an unrecoverable error.

Payload:

```json
{
  "type": "error",
  "message": "Internal server error"
}
```

Rules:

* Should only appear on failure
* Stream should terminate after emission

---

## Event Ordering

Expected sequence:

```text
graph_start

node_start
node_log*
node_end

...

report_generated

graph_end
```

Where:

```text
* = zero or more occurrences
```

---

## Contract Validation

The following conditions must always be satisfied:

* Every line starts with `data:`
* Every payload is valid JSON
* Every payload contains `type`
* First event is `graph_start`
* Last event is `graph_end`
* `report_generated` contains `content`
* No `error` event during successful execution

```
```
