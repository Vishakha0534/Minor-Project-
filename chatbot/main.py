from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
import PyPDF2
from io import BytesIO

from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Advanced Smart Campus AI Chatbot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI Components
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("WARNING: OPENAI_API_KEY not found in environment!", flush=True)

embeddings = OpenAIEmbeddings(api_key=api_key)
llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0.3, api_key=api_key)

# Global FAISS vector store
vector_store = None
# In-memory dictionary for conversational history
user_memories = {}

def init_knowledge_base():
    global vector_store
    
    # Try loading the pre-trained FAISS index from disk
    if os.path.exists("faiss_index"):
        try:
            vector_store = FAISS.load_local("faiss_index", embeddings, allow_dangerous_deserialization=True)
            print("FAISS vector store loaded from pre-trained disk index.", flush=True)
            return
        except Exception as e:
            print("Warning: Failed to load pre-trained FAISS index. Falling back to dynamic init.", e, flush=True)
            
    # Fallback if no pre-trained DB exists
    text = ""
    try:
        with open("../backend/chatbot_knowledge_base.txt", "r", encoding="utf-8") as f:
            text = f.read()
    except Exception as e:
        print("Knowledge base file not found:", e, flush=True)
        text = "This is a Smart Campus AI Assistant."
        
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100)
    docs = text_splitter.create_documents([text])
    
    try:
        vector_store = FAISS.from_documents(docs, embeddings)
        print("FAISS vector store dynamically initialized.", flush=True)
    except Exception as e:
        print("CRITICAL ERROR: Failed to initialize OpenAI Embeddings.", flush=True)
        print(f"Error details: {e}")
        vector_store = None

# Initialize FAISS on startup
init_knowledge_base()

class ChatRequest(BaseModel):
    message: str
    userId: str = "anonymous"
    context: dict = {}

class ChatResponse(BaseModel):
    reply: str

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    global vector_store
    
    retrieved_knowledge = ""
    if not vector_store:
        retrieved_knowledge = "SYSTEM NOTE: Vector database is offline due to OpenAI API Quota issues. You cannot search documents right now."
    else:
        try:
            docs = vector_store.similarity_search(request.message, k=3)
            retrieved_knowledge = "\n".join([d.page_content for d in docs])
        except Exception as e:
            retrieved_knowledge = "SYSTEM NOTE: Vector search failed. " + str(e)

    # 2. Extract SQLite structured data sent from Node.js
    profile = request.context.get("profile", {})
    attendance = request.context.get("attendance", [])
    timetable = request.context.get("timetable", [])
    
    db_context = f"User Name: {profile.get('name', 'Unknown')}\n"
    db_context += f"Role: {profile.get('role', 'Unknown')}\n"
    if timetable:
        db_context += f"Timetable Classes: {len(timetable)} scheduled.\n"
    if attendance:
        db_context += f"Attendance Records: {len(attendance)} total classes recorded.\n"

    # 3. Construct the prompt
    system_prompt = f"""You are the highly advanced Smart Campus AI Assistant.
You have access to the university's database and documents.
Answer the user's questions strictly using the context provided below.

--- RAG KNOWLEDGE BASE ---
{retrieved_knowledge}

--- USER'S SECURE DATABASE CONTEXT ---
{db_context}
Raw Timetable Data: {timetable}
Raw Attendance Data: {attendance}

INSTRUCTIONS:
- If the user asks about their personal data (attendance, timetable), use the SECURE DATABASE CONTEXT to answer accurately.
- If the user asks general questions, summarize uploaded notes, or needs academic help, use the RAG KNOWLEDGE BASE.
- Be conversational, friendly, and act like ChatGPT.
- Do not hallucinate. If you do not know the answer based on context, state that clearly.
"""

    # 4. Handle Conversation Memory manually
    user_id = request.userId
    if user_id not in user_memories:
        user_memories[user_id] = []
        
    memory_list = user_memories[user_id]
    
    # Append the new human message to memory
    memory_list.append(HumanMessage(content=request.message))
    
    # Keep only the last 10 messages to avoid token limit
    if len(memory_list) > 10:
        user_memories[user_id] = memory_list[-10:]
        memory_list = user_memories[user_id]
    
    # 5. Build Message Chain
    messages = [SystemMessage(content=system_prompt)]
    messages.extend(memory_list)
    
    # 6. Generate Response
    try:
        response = llm.invoke(messages)
        reply_text = response.content
        
        # Save AI reply to memory
        memory_list.append(AIMessage(content=reply_text))
        
        return ChatResponse(reply=reply_text)
    except Exception as e:
        print("LLM Error:", e, flush=True)
        return ChatResponse(reply="Sorry, I encountered an error while processing your request.")


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    global vector_store
    try:
        content = await file.read()
        text = ""
        
        # Extract Text
        if file.filename.endswith('.pdf'):
            pdf_reader = PyPDF2.PdfReader(BytesIO(content))
            for page in pdf_reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        else:
            # Assume text file
            text = content.decode('utf-8')
            
        if not text.strip():
            return {"status": "error", "message": "Could not extract text from the file."}
            
        # Add to FAISS RAG Pipeline
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100)
        docs = text_splitter.create_documents([text], metadatas=[{"source": file.filename}])
        
        if vector_store is None:
            vector_store = FAISS.from_documents(docs, embeddings)
        else:
            vector_store.add_documents(docs)
        
        return {"status": "success", "message": f"Successfully processed '{file.filename}' into my neural network! You can now ask me questions about it."}
    except Exception as e:
        print("Upload Error:", e, flush=True)
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
