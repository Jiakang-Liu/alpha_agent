from dataclasses import dataclass


@dataclass
class EvalResult:
    case_id: str

    ticker: str
    user_query: str

    success: bool

    duration_ms: int

    report_length: int

    score_data_usage: int
    score_question_answering: int
    score_risk_analysis: int
    score_structure: int

    total_score: int

    notes: str