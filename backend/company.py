from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from crewai import Agent, Task, Crew, LLM
from io import BytesIO
import PyPDF2
import docx  # for DOC/DOCX extraction
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from collections import defaultdict

# In-memory storage for documents
document_storage = defaultdict(str)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Adjust as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize LLM and agent for segmentation
llm_segmentation = LLM(model="gemini/gemini-1.5-pro-latest", temperature=0.7)
segmentation_agent = Agent(
    name="Document Segmenter",
    role="Divides a document into sections with subheadings and corresponding content.",
    goal="Return a JSON object with sections extracted from the document.",
    backstory="An assistant that processes company documents and organizes them into subheadings with their text.",
    allow_delegation=False,
    llm=llm_segmentation
)

def extract_text_from_pdf(contents: bytes) -> str:
    pdf_reader = PyPDF2.PdfReader(BytesIO(contents))
    extracted_text = ""
    for page in pdf_reader.pages:
        page_text = page.extract_text()
        if page_text:
            extracted_text += page_text + "\n"
    return extracted_text

def extract_text_from_doc(contents: bytes) -> str:
    # Use python-docx to extract text from DOCX (or DOC if compatible)
    # First, load the document from BytesIO
    doc = docx.Document(BytesIO(contents))
    extracted_text = "\n".join([para.text for para in doc.paragraphs])
    return extracted_text

def extract_text_from_txt(contents: bytes) -> str:
    # Assume UTF-8 encoding
    return contents.decode("utf-8")

@app.post("/segment_document/")
async def segment_document(file: UploadFile = File(...)):
    # Accept PDF, DOC, DOCX, and TXT files
    filename = file.filename.lower()
    if not (filename.endswith(".pdf") or filename.endswith(".doc") or filename.endswith(".docx") or filename.endswith(".txt")):
        raise HTTPException(status_code=400, detail="Unsupported file format. Supported formats: PDF, DOC, DOCX, TXT.")

    try:
        contents = await file.read()
        if filename.endswith(".pdf"):
            extracted_text = extract_text_from_pdf(contents)
        elif filename.endswith((".doc", ".docx")):
            extracted_text = extract_text_from_doc(contents)
        elif filename.endswith(".txt"):
            extracted_text = extract_text_from_txt(contents)
        else:
            extracted_text = ""
            
        # Store the extracted text with a unique identifier (using filename for now)
        document_id = file.filename
        document_storage[document_id] = extracted_text

        # Construct prompt instructing the agent to segment the document
        task_description = (
            "Below is the full text extracted from a company document.\n\n"
            "Please divide the text into sections. For each section, identify a subheading and the associated content.\n"
            "Return the result as a JSON object with the following format:\n"
            '{ "sections": [ { "heading": "Subheading 1", "content": "Content for subheading 1" }, { "heading": "Subheading 2", "content": "Content for subheading 2" }, ... ] }\n\n'
            "Document Text:\n" +
            extracted_text +
            "\n\nDo not include any additional commentary."
        )

        segmentation_task = Task(
            description=task_description,
            agent=segmentation_agent,
            expected_output="A JSON object with a 'sections' key containing an array of subheading-content pairs."
        )

        crew = Crew(agents=[segmentation_agent], tasks=[segmentation_task])
        result = crew.kickoff()
        return {
            "segmented_document": result,
            "document_id": document_id  # Return the ID to the frontend
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error processing document: " + str(e))




""""""

# Initialize LLM and agent for Q&A
llm_qa = LLM(model="gemini/gemini-2.0-flash-exp", temperature=0.5)
qa_agent = Agent(
    name="Document Q&A Assistant",
    role="Answers questions based solely on the provided document content.",
    goal="Provide an answer strictly using the document text as context.",
    backstory="A specialized assistant that refers only to company document content when answering questions.",
    allow_delegation=False,
    llm=llm_qa
)

class Message(BaseModel):
    sender: str  # "user" or "ai"
    message: str

class DocumentQARequest(BaseModel):
    question: str
    document_id: str  # Changed from context to document_id
    conversation_history: List[Message] = []  # Optional, if you want to include conversation context

@app.post("/document_qa/")
def document_qa_endpoint(request: DocumentQARequest):
    # Retrieve the document context from storage
    context = document_storage.get(request.document_id)
    if not context:
        raise HTTPException(status_code=404, detail="Document not found")

    task_description = (
        "Use the following document content as the only reference to answer the question.\n\n"
        f"Document Content:\n{context}\n\n"  # Using retrieved context
        f"Conversation History:\n" +
        "\n".join([f"{msg.sender}: {msg.message}" for msg in request.conversation_history]) +
        f"\n\nQuestion: {request.question}\n\n"
        "Provide a concise and accurate answer based solely on the above document content."
    )

    qa_task = Task(
        description=task_description,
        agent=qa_agent,
        expected_output="A concise answer based on the provided document content."
    )

    try:
        crew = Crew(agents=[qa_agent], tasks=[qa_task])
        result = crew.kickoff()
        return {"answer": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
""""""