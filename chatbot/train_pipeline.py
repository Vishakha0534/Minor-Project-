import json
import os
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from dotenv import load_dotenv

load_dotenv()

def run_training_pipeline():
    print("Starting Smart Campus AI Training Pipeline...")
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: OPENAI_API_KEY is missing. Training aborted.")
        return

    print("1. Loading dataset (JSON + Text)...")
    try:
        with open("../backend/smart_campus_dataset.json", "r", encoding="utf-8") as f:
            dataset = json.load(f)
    except Exception as e:
        print(f"Error loading JSON dataset: {e}")
        return

    documents = []

    print("2. Converting structured Student data into text embeddings...")
    for user in dataset.get("users", []):
        if user.get("role") == "student":
            text = f"Student Profile: {user['name']} is a {user.get('year', 'Unknown')} year student in the {user['department']} department, Section {user.get('section', 'Unknown')}."
            metadata = {
                "type": "student_profile",
                "studentId": user["_id"],
                "department": user["department"]
            }
            documents.append(Document(page_content=text, metadata=metadata))

    print("3. Converting Attendance data into text embeddings...")
    for att in dataset.get("attendance", []):
        student_name = next((u["name"] for u in dataset["users"] if u["_id"] == att["studentId"]), "Unknown Student")
        text = f"Attendance Record: {student_name} was {att['status']} for {att['subject']} class on {att['date']}."
        metadata = {
            "type": "attendance",
            "studentId": att["studentId"],
            "subject": att["subject"]
        }
        documents.append(Document(page_content=text, metadata=metadata))

    print("4. Processing University Notices...")
    for notice in dataset.get("notices", []):
        text = f"University Notice: {notice['title']} - {notice['description']}. Date: {notice['date']}."
        metadata = {
            "type": "notice",
            "targetAudience": notice.get("targetAudience", "All")
        }
        documents.append(Document(page_content=text, metadata=metadata))

    print("5. Processing General Knowledge Base...")
    try:
        with open("../backend/chatbot_knowledge_base.txt", "r", encoding="utf-8") as f:
            kb_text = f.read()
            documents.append(Document(page_content=f"University Knowledge: {kb_text}", metadata={"type": "general_knowledge"}))
    except:
        print("Note: chatbot_knowledge_base.txt not found. Skipping.")

    print(f"Generated {len(documents)} total text chunks.")
    
    print("6. Creating FAISS Vector Database using OpenAI Embeddings...")
    embeddings = OpenAIEmbeddings(api_key=api_key)
    
    vector_store = FAISS.from_documents(documents, embeddings)
    
    print("7. Saving FAISS index to disk...")
    vector_store.save_local("faiss_index")
    
    print("Training Pipeline Complete! The AI has successfully learned the dataset.")

if __name__ == "__main__":
    run_training_pipeline()
