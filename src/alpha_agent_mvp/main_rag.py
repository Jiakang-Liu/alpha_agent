import asyncio
import os
from dotenv import load_dotenv
from openai import AsyncOpenAI, OpenAIError
import psycopg

# Load local env variable
load_dotenv()

# db connection
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_USER = os.getenv("DB_USER", "alpha_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "alpha_password_2026")
DB_NAME = os.getenv("DB_DATABASE", "alpha_rag_db")

async def get_embedding(client: AsyncOpenAI, text: str) -> list[float]:
    """
    Convert user query into a 1536-dimensional dense embedding vector.
    """
    try:
        response = await client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding
    except OpenAIError as e:
        print(f"🚨 Fail to generate embedding via OpenAI: {e}")
        raise

async def query_vector_db(embedding: list[float], top_k: int = 3) -> list[str]:
    """
    Retrieve top-k relevant context from PostgreSQL using vector similarity search.
    """
    conninfo = f"dbname={DB_NAME} user={DB_USER} password={DB_PASSWORD} host={DB_HOST} port={DB_PORT}"
    
    # Establish asynchronous connection to PostgreSQL
    conn = await psycopg.AsyncConnection.connect(conninfo=conninfo)
    
    async with conn:
        async with conn.cursor() as cur:
            # Leverage the pgvector cosine similarity operator `<=>` combined with an HNSW index for ultra-fast retrieval.
            sql = "SELECT content FROM stock_knowledge ORDER BY embedding <=> %s::vector LIMIT %s;"
            await cur.execute(sql, (str(embedding), top_k))
            rows = await cur.fetchall()
            return [row[0] for row in rows]
    
async def main():
    # Initialize OpenAI asynchronous client
    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    # Test query focusing on hardware bottlenecks (Can be pivoted to SpaceX IPO analysis data later)
    user_query = "What is NVIDIA's hardware bottleneck currently?"

    print(f"User Query: {user_query}")

    # Step 1: Generate embedding for the user query (Synchronous data dependency)
    query_vector = await get_embedding(client, user_query)

    # Step 2: Retrieve matched documents from vector database based on spatial distance
    contexts = await query_vector_db(query_vector, top_k=2)

    # Step 3: Construct the defensive system prompt by injecting raw financial contexts
    context_str = "\n---\n".join(contexts)
    system_prompt = (
        "You are a top-tier financial analyst. Please answer the question strictly based on the verified financial report context provided below. "
        "If the information is not mentioned in the context, please answer 'I don't know.'\n\n"
        f"[Context]\n{context_str}"
    )

    # Step 4: Invoke GPT-4o with streaming enabled for low-latency response
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_query}
        ],
        stream=True
    )

    print("\nAlphaAgent real-time streaming analysis response:")
    async for chunk in response:
        content = chunk.choices[0].delta.content or ""
        print(content, end="", flush=True)
    print("\n")


if __name__ == "__main__":
    # Apply standard Windows selector event loop policy to prevent socket synchronization failures
    import sys
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        
    asyncio.run(main())