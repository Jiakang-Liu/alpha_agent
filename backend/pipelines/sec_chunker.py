import re
from typing import List
from datetime import datetime, timezone


class SECChunk:
    """
    Domain Data Contract:
    Represents one atomic SEC text/table chunk aligned with financial_knowledge_base.
    """

    def __init__(self, ticker: str, fiscal_year: int, doc_type: str, content: str):
        self.ticker = ticker.upper()
        self.fiscal_year = fiscal_year
        self.doc_type = doc_type
        self.content = content
        self.created_at = datetime.now(timezone.utc).isoformat()


class AdvancedSECChunker:
    """
    Linear-scan chunking engine for SEC filing text.

    Responsibilities:
    - Split long SEC prose into dense chunks
    - Keep table-like blocks isolated
    - Add context anchor into each chunk
    """

    def __init__(self, target_chunk_size: int = 1500):
        self.target_chunk_size = target_chunk_size

    def _is_table_row(self, line: str) -> bool:
        """
        Heuristically detect table-like rows.
        """
        stripped = line.strip()

        if not stripped:
            return False

        if "|" in stripped and "---" in stripped:
            return True

        if re.search(r"\s{3,}\d+[\d,.\s()-]*$", stripped):
            return True

        return False

    def chunk_document(
        self,
        raw_text: str,
        ticker: str,
        fiscal_year: int,
        section_id: str,
    ) -> List[SECChunk]:
        ticker = ticker.upper()
        formatted_doc_type = f"SEC_{section_id}"

        raw_blocks = raw_text.split("\n\n")
        processed_chunks: List[SECChunk] = []

        current_buffer: list[str] = []
        current_buffer_size = 0
        in_table_mode = False

        for block in raw_blocks:
            block = block.strip()

            if not block:
                continue

            block_lines = block.split("\n")
            block_contains_table = any(
                self._is_table_row(line)
                for line in block_lines
            )

            if block_contains_table and not in_table_mode:
                self._flush_buffer(
                    processed_chunks,
                    current_buffer,
                    ticker,
                    fiscal_year,
                    formatted_doc_type,
                    section_id,
                )
                current_buffer = []
                current_buffer_size = 0
                in_table_mode = True

            elif not block_contains_table and in_table_mode:
                self._flush_buffer(
                    processed_chunks,
                    current_buffer,
                    ticker,
                    fiscal_year,
                    formatted_doc_type,
                    section_id,
                )
                current_buffer = []
                current_buffer_size = 0
                in_table_mode = False

            current_buffer.append(block)
            current_buffer_size += len(block)

            if current_buffer_size >= self.target_chunk_size and not in_table_mode:
                self._flush_buffer(
                    processed_chunks,
                    current_buffer,
                    ticker,
                    fiscal_year,
                    formatted_doc_type,
                    section_id,
                )
                current_buffer = []
                current_buffer_size = 0

        self._flush_buffer(
            processed_chunks,
            current_buffer,
            ticker,
            fiscal_year,
            formatted_doc_type,
            section_id,
        )

        print(
            f"✂️ [SEC Chunker]: Partitioned section '{section_id}' "
            f"into {len(processed_chunks)} chunks."
        )

        return processed_chunks

    def _flush_buffer(
        self,
        chunk_list: List[SECChunk],
        buffer: List[str],
        ticker: str,
        fiscal_year: int,
        doc_type: str,
        section_id: str,
    ) -> None:
        if not buffer:
            return

        merged_content = "\n\n".join(buffer)

        contextual_header = (
            f"[Context Anchor: {ticker} | FY {fiscal_year} | "
            f"Section: {section_id}]\n\n"
        )

        chunk_list.append(
            SECChunk(
                ticker=ticker,
                fiscal_year=fiscal_year,
                doc_type=doc_type,
                content=contextual_header + merged_content,
            )
        )