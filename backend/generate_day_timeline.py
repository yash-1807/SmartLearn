from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from crewai import Agent, Task, Crew, LLM
from io import BytesIO
import PyPDF2
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # or ["*"] to allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variable to store the latest timeline result
timeline_result = None

# Initialize LLM and agent
llm = LLM(model="gemini/gemini-1.5-pro-latest", temperature=0.7)
timeline_agent = Agent(
    name="Daywise Study Planner",
    role="Generates a detailed day-by-day study timeline based on provided study materials.",
    goal="Create a personalized daily study plan.",
    backstory="An educational AI that reads study materials and produces a structured day-by-day learning timeline.",
    allow_delegation=False,
    llm=llm
)

@app.post("/generate_day_timeline/")
async def generate_day_timeline(
    name: str = Form(...),
    study_duration: int = Form(...),  # in days
    file: UploadFile = File(...)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    try:
        contents = await file.read()
        pdf_reader = PyPDF2.PdfReader(BytesIO(contents))
        extracted_text = ""
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                extracted_text += page_text + "\n"
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error processing PDF file: " + str(e))

    task_description = (
        f"Name: {name}\n"
        f"Study Duration (in days): {study_duration}\n\n"
        f"Study Materials (extracted from PDF):\n{extracted_text}\n\n"
        "Generate a detailed day-by-day study timeline. For each day, list topics or tasks to study. "
        "Return the timeline in a clear, structured format with day numbers and study tasks."
    )

    day_task = Task(
        description=task_description,
        agent=timeline_agent,
        expected_output="A detailed day-by-day study timeline."
    )

    try:
        crew = Crew(agents=[timeline_agent], tasks=[day_task])
        result = crew.kickoff()
        global timeline_result
        timeline_result = result
        return {"timeline": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/timeline_result/")
def get_timeline_result():
    if timeline_result is None:
        return {"timeline": "No timeline generated yet."}
    return {"timeline": timeline_result}  
