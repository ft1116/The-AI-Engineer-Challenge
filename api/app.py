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

# Import aimakerspace components for RAG functionality
import sys
sys.path.append(str(Path(__file__).parent.parent))
from aimakerspace.text_utils import PDFLoader, CharacterTextSplitter
from aimakerspace.vectordatabase import VectorDatabase
from aimakerspace.openai_utils.chatmodel import ChatOpenAI

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

# Global variable to store the vector database for RAG
vector_db: Optional[VectorDatabase] = None
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
            # Load PDF using aimakerspace
            pdf_loader = PDFLoader(tmp_file_path)
            documents = pdf_loader.load_documents()
            
            if not documents:
                raise HTTPException(status_code=400, detail="No text could be extracted from the PDF")
            
            # Split documents into chunks
            text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            chunks = text_splitter.split_texts(documents)
            
            # Create vector database and build embeddings
            vector_db = VectorDatabase()
            await vector_db.abuild_from_list(chunks)
            
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
                        return_as_text=True
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
