from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from crewai import Agent, Task, Crew, LLM
import os

app = FastAPI()

# Configure CORS for your timeline service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # adjust this as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory to store uploaded PDFs
UPLOAD_DIR = "V:/Serious/SmartLearn/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Initialize LLM (Google Gemini)
llm = LLM(model="gemini/gemini-1.5-pro-latest", temperature=0.7)

# Define the Study Timeline Agent
timeline_agent = Agent(
    name="Study Planner",
    role="Creates a structured study plan based on the user's goal and timeline.",
    goal="Generate an optimized weekly study timeline.",
    backstory="An AI scheduler that helps users achieve their study goals efficiently.",
    allow_delegation=False,
    llm=llm
)

# Global variable to store the latest generated timeline
timeline_result = None

@app.post("/upload_pdf/")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Uploads a PDF file for showcase purposes (not linked to timeline generation).
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    return {"filename": file.filename, "message": "PDF uploaded successfully."}

@app.post("/generate_timeline/")
async def generate_timeline(
    goal: str = Form(...),
    weeks: int = Form(...),
    hours: int = Form(...)
):
    """
    Generates a structured week-wise study plan based on the user's goal,
    number of weeks, and available study hours per week.
    """
    if weeks < 1:
        raise HTTPException(status_code=400, detail="Number of weeks must be at least 1.")
    if hours < 1:
        raise HTTPException(status_code=400, detail="Number of study hours must be at least 1.")

    task_description = (
        f"Goal: {goal}\n"
        f"Study Duration: {weeks} weeks\n"
        f"Available Study Hours per Week: {hours}\n\n"
        "IMP---First check whether the no. of weeks and no .of hours are sufficient to complete the syllabus.\n" \
        "IF NO, then return a message saying 'Not enough time to complete the syllabus and exit DONT GENERATE ANY STUDY PLAN'\n" \
        "If yes, then generate a structured week-wise study plan. Format output as:\n"
        "Week 1: ...\n"
        "Week 2: ...\n"
        "Week 3: ...\n"
        "(Continue for the given number of weeks)."
    )

    timeline_task = Task(
        description=task_description,
        agent=timeline_agent,
        expected_output="A detailed weekly study plan.",
    )

    crew = Crew(agents=[timeline_agent], tasks=[timeline_task])
    result = crew.kickoff()

    global timeline_result
    timeline_result = result

    return {"study_plan": result}

@app.get("/timeline_result/")
async def get_timeline_result():
    """
    Retrieves the latest generated study timeline.
    """
    if timeline_result is None:
        return {"study_plan": "No timeline generated yet."}
    return {"study_plan": timeline_result}
