from fastapi import FastAPI, UploadFile, File, HTTPException
import shutil
import os
from crewai.tools import tool
from crewai_tools import PDFSearchTool
from crewai import Agent, Crew, Task, LLM
from pydantic import BaseModel


app = FastAPI()

# Directory to store uploaded PDFs
UPLOAD_DIR = "V:\\Serious\\SmartLearn\\study_materials"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Global variable to store the path of the uploaded PDF
pdf_path = None

# Configure the LLM to use Google's Gemini
llm = LLM(model="gemini/gemini-1.5-pro-latest", temperature=0.7)

# Define a tool for PDF search
@tool
def pdf_search(query: str) -> str:
    """Search the uploaded PDF for the given query."""
    if not pdf_path:
        return "No PDF has been uploaded yet."
    pdf_tool = PDFSearchTool(
        pdf=pdf_path,
        config=dict(
            llm=dict(
                provider="google",
                config=dict(
                    model="gemini-1.5-pro-latest",
                ),
            ),
            embedder=dict(
                provider="google",
                config=dict(
                    model="models/embedding-001",
                    task_type="retrieval_document",
                ),
            ),
        )
    )
    return pdf_tool.run(query)
    

def create_agent() -> Agent:
    return Agent(
        role="PDF Research Assistant",
        goal="Provide information based on the uploaded PDF.",
        backstory="An AI assistant specialized in extracting information from PDFs.",
        tools=[pdf_search],
        llm=llm,  # This is the critical part - using our custom LLM
        verbose=True,
    )


def create_task(question: str) -> Task:
    agent = create_agent()
    return Task(
        description=f"Answer the question: '{question}' based on the PDF content.",
        expected_output="A concise and accurate answer to the user's question derived from the PDF.",
        agent=agent,
    )

# Endpoint to upload a PDF
@app.post("/upload_pdf/")
async def upload_pdf(file: UploadFile = File(...)):
    global pdf_path
    
    pdf_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(pdf_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"message": "PDF uploaded successfully", "filename": file.filename}


class QueryRequest(BaseModel):
    question: str

# Endpoint to ask queries
@app.post("/query_pdf/")
async def query_pdf(request: QueryRequest):
    if not pdf_path:
        raise HTTPException(status_code=400, detail="No PDF uploaded yet.")
    try:
        # Create the agent and task
        task = create_task(request.question)
        
        # Create and run the crew with the task
        crew = Crew(
            agents=[task.agent],
            tasks=[task],
            llm=llm,  # Also set the LLM for the Crew
            verbose=True
        )
        
        result = crew.kickoff()
        return {"answer": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to the FastAPI PDF Query Service using CrewAI"}