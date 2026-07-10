import asyncio
import json
import time
from pathlib import Path

import httpx


BASE_URL = "http://localhost:8000"
EVAL_CASES_PATH = Path(__file__).parent / "eval_cases.json"
OUTPUT_DIR = Path(__file__).parent / "outputs"


async def run_single_case(client: httpx.AsyncClient, case: dict) -> dict:
    case_id = case["id"]
    ticker = case["ticker"]
    user_query = case["user_query"]

    print(f"\n========== Running {case_id}: {ticker} ==========")

    payload = {
        "ticker": ticker,
        "user_query": user_query,
    }

    start_time = time.perf_counter()

    events = []
    final_report = ""
    error_message = None

    try:
        async with client.stream(
            "POST",
            f"{BASE_URL}/api/analyze",
            json=payload,
            timeout=None,
        ) as response:
            response.raise_for_status()

            async for line in response.aiter_lines():
                if not line:
                    continue

                if not line.startswith("data: "):
                    continue

                raw_json = line[len("data: ") :]

                try:
                    event = json.loads(raw_json)
                except json.JSONDecodeError:
                    print(f"[WARN] Invalid JSON line: {line}")
                    continue

                events.append(event)

                event_type = event.get("type")

                if event_type == "node_start":
                    print(f"[NODE START] {event.get('node')}")

                elif event_type == "node_end":
                    print(f"[NODE END] {event.get('node')}")

                elif event_type == "report_generated":
                    final_report = event.get("content", "")
                    print(f"[REPORT GENERATED] length={len(final_report)}")

                elif event_type == "error":
                    error_message = event.get("message", "Unknown error")
                    print(f"[ERROR] {error_message}")

                elif event_type == "graph_end":
                    print("[GRAPH END]")

    except Exception as e:
        error_message = str(e)
        print(f"[CASE FAILED] {case_id}: {error_message}")

    duration_ms = int((time.perf_counter() - start_time) * 1000)

    result = {
        "case_id": case_id,
        "ticker": ticker,
        "user_query": user_query,
        "success": error_message is None and bool(final_report),
        "duration_ms": duration_ms,
        "report_length": len(final_report),
        "final_report": final_report,
        "error_message": error_message,
        "events": events,
    }

    print(
        f"[DONE] {case_id} | "
        f"success={result['success']} | "
        f"duration={duration_ms}ms | "
        f"report_length={len(final_report)}"
    )

    return result


async def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    with open(EVAL_CASES_PATH, "r", encoding="utf-8") as f:
        eval_cases = json.load(f)

    all_results = []

    async with httpx.AsyncClient() as client:
        for case in eval_cases:
            result = await run_single_case(client, case)
            all_results.append(result)

    output_path = OUTPUT_DIR / "eval_results.json"

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False)

    print("\n========== Eval Summary ==========")

    success_count = sum(1 for r in all_results if r["success"])
    total_count = len(all_results)

    avg_duration_ms = (
        sum(r["duration_ms"] for r in all_results) // total_count
        if total_count
        else 0
    )

    avg_report_length = (
        sum(r["report_length"] for r in all_results) // total_count
        if total_count
        else 0
    )

    print(f"Total cases: {total_count}")
    print(f"Success: {success_count}/{total_count}")
    print(f"Average duration: {avg_duration_ms}ms")
    print(f"Average report length: {avg_report_length}")
    print(f"Saved results to: {output_path}")


if __name__ == "__main__":
    asyncio.run(main())