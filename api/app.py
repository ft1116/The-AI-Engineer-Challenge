# Import required FastAPI components for building the API
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
# Import Pydantic for data validation and settings management
from pydantic import BaseModel
# Import OpenAI client for interacting with OpenAI's API
from openai import OpenAI
import os
import tempfile
import asyncio
from typing import Optional, List
from pathlib import Path

# Import required libraries for RAG functionality
import PyPDF2
import numpy as np
from typing import Callable, Dict, Iterable, List, Optional, Tuple, Union

# Initialize FastAPI application with a title
app = FastAPI(title="OpenAI Chat API with RAG")

# Configure CORS (Cross-Origin Resource Sharing) middleware
# This allows the API to be accessed from different domains/origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from any origin
    allow_credentials=True,  # Allows cookies to be included in requests
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers in requests
)

# Simple RAG implementation
def cosine_similarity(vector_a: np.ndarray, vector_b: np.ndarray) -> float:
    """Return the cosine similarity between two vectors."""
    norm_a = np.linalg.norm(vector_a)
    norm_b = np.linalg.norm(vector_b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    dot_product = np.dot(vector_a, vector_b)
    return float(dot_product / (norm_a * norm_b))

class SimpleVectorDatabase:
    """Simple in-memory vector store for RAG."""
    
    def __init__(self, embedding_model=None):
        self.vectors: Dict[str, np.ndarray] = {}
        self.texts: Dict[str, str] = {}
        self.embedding_model = embedding_model
    
    def insert(self, key: str, vector: Iterable[float], text: str) -> None:
        """Store vector and text with key."""
        self.vectors[key] = np.asarray(vector, dtype=float)
        self.texts[key] = text
    
    def search_by_text(self, query_text: str, k: int, api_key: str) -> List[str]:
        """Search for similar texts using OpenAI embeddings."""
        if not self.vectors:
            return []
        
        # Get embedding for query
        client = OpenAI(api_key=api_key)
        try:
            response = client.embeddings.create(
                input=query_text,
                model="text-embedding-3-small"
            )
            query_vector = np.array(response.data[0].embedding)
        except Exception:
            return []
        
        # Calculate similarities
        scores = []
        for key, vector in self.vectors.items():
            similarity = cosine_similarity(query_vector, vector)
            scores.append((key, similarity))
        
        # Sort by similarity and return top k texts
        scores.sort(key=lambda x: x[1], reverse=True)
        return [self.texts[key] for key, _ in scores[:k]]

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF file."""
    with open(file_path, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() or ""
    return text

def split_text_into_chunks(text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> List[str]:
    """Split text into overlapping chunks."""
    if chunk_size <= chunk_overlap:
        raise ValueError("Chunk size must be greater than chunk overlap")
    
    step = chunk_size - chunk_overlap
    chunks = []
    for i in range(0, len(text), step):
        chunk = text[i:i + chunk_size]
        if chunk.strip():  # Only add non-empty chunks
            chunks.append(chunk.strip())
    return chunks

# Global variable to store the vector database for RAG
vector_db: Optional[SimpleVectorDatabase] = None
uploaded_document_name: Optional[str] = None

# Define the data model for chat requests using Pydantic
# This ensures incoming request data is properly validated
class ChatRequest(BaseModel):
    user_message: str      # Message from the user
    model: Optional[str] = "gpt-4o-mini"  # Optional model selection with default
    api_key: str          # OpenAI API key for authentication
    use_rag: Optional[bool] = True  # Whether to use RAG context

# PDF Upload endpoint
@app.post("/api/upload-pdf")
async def upload_pdf(file: UploadFile = File(...), api_key: str = Form(...)):
    global vector_db, uploaded_document_name
    
    try:
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        try:
            # Extract text from PDF
            text = extract_text_from_pdf(tmp_file_path)
            
            if not text.strip():
                raise HTTPException(status_code=400, detail="No text could be extracted from the PDF")
            
            # Split text into chunks
            chunks = split_text_into_chunks(text, chunk_size=1000, chunk_overlap=200)
            
            # Create vector database and build embeddings
            vector_db = SimpleVectorDatabase()
            client = OpenAI(api_key=api_key)
            
            # Get embeddings for all chunks
            for i, chunk in enumerate(chunks):
                try:
                    response = client.embeddings.create(
                        input=chunk,
                        model="text-embedding-3-small"
                    )
                    embedding = response.data[0].embedding
                    vector_db.insert(f"chunk_{i}", embedding, chunk)
                except Exception as e:
                    print(f"Error creating embedding for chunk {i}: {e}")
                    continue
            
            uploaded_document_name = file.filename
            
            return {
                "message": f"PDF '{file.filename}' uploaded and indexed successfully",
                "chunks_count": len(chunks),
                "document_name": file.filename
            }
            
        finally:
            # Clean up temporary file
            os.unlink(tmp_file_path)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

# Define the main chat endpoint that handles POST requests
@app.post("/api/chat")
async def chat(request: ChatRequest):
    global vector_db, uploaded_document_name
    
    try:
        # Initialize OpenAI client with the provided API key
        client = OpenAI(api_key=request.api_key)
        
        # Create an async generator function for streaming responses
        async def generate():
            try:
                # Prepare system message
                system_message = "You are a helpful AI assistant."
                
                # If RAG is enabled and we have a vector database, use it
                if request.use_rag and vector_db is not None:
                    # Search for relevant context
                    relevant_chunks = vector_db.search_by_text(
                        request.user_message, 
                        k=3, 
                        api_key=request.api_key
                    )
                    
                    if relevant_chunks:
                        context = "\n\n".join(relevant_chunks)
                        system_message = f"""You are a helpful AI assistant. Answer questions based ONLY on the provided context from the document '{uploaded_document_name}'. 

Context from document:
{context}

Instructions:
- Only answer questions using information from the provided context
- If the question cannot be answered from the context, say "I cannot answer this question based on the provided document"
- Be accurate and cite specific information from the document when possible"""
                
                # Create a streaming chat completion request
                stream = client.chat.completions.create(
                    model=request.model,
                    messages=[
                        {"role": "system", "content": system_message},
                        {"role": "user", "content": request.user_message}
                    ],
                    stream=True  # Enable streaming response
                )
                
                # Yield each chunk of the response as it becomes available
                for chunk in stream:
                    if chunk.choices[0].delta.content is not None:
                        yield chunk.choices[0].delta.content
            except Exception as e:
                # If there's an error in the stream, yield an error message
                yield f"Error: {str(e)}"

        # Return a streaming response to the client
        return StreamingResponse(generate(), media_type="text/plain")
    
    except Exception as e:
        # Handle any errors that occur during processing
        raise HTTPException(status_code=500, detail=str(e))

# Define a health check endpoint to verify API status
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

# Endpoint to check document status
@app.get("/api/document-status")
async def document_status():
    global vector_db, uploaded_document_name
    return {
        "has_document": vector_db is not None,
        "document_name": uploaded_document_name,
        "vector_count": len(vector_db.vectors) if vector_db else 0
    }

# Entry point for running the application directly
if __name__ == "__main__":
    import uvicorn
    # Start the server on all network interfaces (0.0.0.0) on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
