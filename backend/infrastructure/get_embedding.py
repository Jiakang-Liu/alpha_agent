from openai import AsyncOpenAI, OpenAIError

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