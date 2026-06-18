import re
from typing import List
from datetime import datetime, timezone

class SECOmfgChunk:
    """
    Domain Data Contract: Represents an atomic text/table slice 
    extracted from SEC filings, strictly aligned with the unified database schema.
    """
    def __init__(self, ticker: str, fiscal_year: int, doc_type: str, content: str):
        self.ticker = ticker                 # e.g., "TSLA"
        self.fiscal_year = fiscal_year       # e.g., 2026
        self.doc_type = doc_type             # Aligned with schema: e.g., "SEC_Item_7_MDA"
        self.content = content               # High-density text or tabular content
        self.created_at = datetime.now(timezone.utc).isoformat()


class AdvancedSECChunker:
    """
    High-throughput linear-scan chunking engine tailored for 
    processing structural boundaries and table isolation in SEC 10-K/10-Q filings.
    """
    def __init__(self, target_chunk_size: int = 1500):
        self.target_chunk_size = target_chunk_size

    def _is_table_row(self, line: str) -> bool:
        """
        Heuristic evaluation using regular expressions to detect tabular data alignments.
        """
        # Rule 1: Detect standard markdown table pipelines
        if "|" in line and "---" in line:
            return True
        # Rule 2: Detect text-aligned financial matrices ending with numeric metrics
        if re.search(r'\s{3,}\d+[\d,.\s-]*$', line):
            return True
        return False

    def chunk_document(self, raw_text: str, ticker: str, fiscal_year: int, section_id: str) -> List[SECOmfgChunk]:
        """
        State-machine orchestrator that sequentially scans physical blocks, 
        isolating tables while maintaining optimal text chunk density and preventing contamination.
        """
        # Enforce strict multi-agent naming space convention for the database mapping
        # E.g., item_7 -> SEC_Item_7
        formatted_doc_type = f"SEC_{section_id}"

        # Split document into physical paragraph blocks based on double carriage returns
        raw_blocks = raw_text.split("\n\n")
        processed_chunks: List[SECOmfgChunk] = []
        
        # Runtime tracking pointers for the linear scan state machine
        current_buffer = []
        current_buffer_size = 0
        in_table_mode = False

        for block in raw_blocks:
            block = block.strip()
            if not block:
                continue
                
            block_lines = block.split("\n")
            block_contains_table = any(self._is_table_row(line) for line in block_lines)

            # =============================================================
            # 🔥 STATE MACHINE TRANSITION PATTERNS
            # =============================================================
            
            # Pattern 1: Transitioning from standard prose to a tabular block.
            # Flush existing prose buffer to prevent text-table contamination.
            if block_contains_table and not in_table_mode:
                if current_buffer:
                    self._flush_buffer(processed_chunks, current_buffer, ticker, fiscal_year, formatted_doc_type, section_id)
                    current_buffer = []
                    current_buffer_size = 0
                in_table_mode = True

            # Pattern 2: Transitioning out of a table back to standard prose.
            # Flush the entire table matrix as an isolated atomic data unit.
            elif not block_contains_table and in_table_mode:
                if current_buffer:
                    self._flush_buffer(processed_chunks, current_buffer, ticker, fiscal_year, formatted_doc_type, section_id)
                    current_buffer = []
                    current_buffer_size = 0
                in_table_mode = False

            # Accumulate the current valid block into the streaming buffer
            current_buffer.append(block)
            current_buffer_size += len(block)

            # Pattern 3: Threshold breach. Enforce split if target capacity is met 
            # and the pointer is not currently locked inside table boundary mode.
            if current_buffer_size >= self.target_chunk_size and not in_table_mode:
                self._flush_buffer(processed_chunks, current_buffer, ticker, fiscal_year, formatted_doc_type, section_id)
                current_buffer = []
                current_buffer_size = 0

        # Residual Cleanup: Flush any remaining strings trailing in the pipeline buffer
        if current_buffer:
            self._flush_buffer(processed_chunks, current_buffer, ticker, fiscal_year, formatted_doc_type, section_id)
            
        print(f"✂️  [SEC Chunker]: Successfully partitioned section '{section_id}' into {len(processed_chunks)} isolated chunks.")
        return processed_chunks

    def _flush_buffer(self, chunk_list: List[SECOmfgChunk], buffer: List[str], ticker: str, fiscal_year: int, doc_type: str, section_id: str):
        """
        Assembles final payload, cloning deterministic context metadata into the header token space.
        """
        merged_content = "\n\n".join(buffer)
        # Context anchors are engineered to block multi-tenant cross-contamination inside the LLM prompt space
        contextual_header = f"[Context Anchor: {ticker} | FY {fiscal_year} | Section: {section_id}]\n\n"
        
        chunk_list.append(SECOmfgChunk(
            ticker=ticker,
            fiscal_year=fiscal_year,
            doc_type=doc_type,
            content=contextual_header + merged_content
        ))