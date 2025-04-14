from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from crewai import Agent, Task, Crew, LLM
from crewai_tools import DirectorySearchTool
from crewai.flow import Flow, start, listen
import os

app = FastAPI()

class TimelineRequest(BaseModel):
    goal: str
    time_period: str  # e.g., "4 months"

# Initialize the DirectorySearchTool
directory_tool = DirectorySearchTool(
    directory="V:\\Serious\\SmartLearn\\syllabus",
    config=dict(
        llm=dict(
            provider="google",  #  Use Gemini instead of OpenAI
            config=dict(
                model="gemini-1.5-pro-latest"  #  Set the correct Gemini model
            ),
        ),
        embedder=dict(
            provider="google",  #  Force Google for embeddings
            config=dict(
                model="models/embedding-001",  #  Google's embedding model
                task_type="retrieval_document"
            ),
        ),
    )
)

# Define the Agent
llm = LLM(model="gemini/gemini-1.5-pro-latest", temperature=0.5)
timeline_agent = Agent(
    name="Timeline Generation Assistant",
    role="Creates structured study plans based on the user's goal and available syllabus.",
    goal="Generate an optimized study timeline that breaks down the syllabus into manageable milestones.",
    backstory="An AI scheduler that helps users achieve their learning goals efficiently.",
    allow_delegation=False,
    llm=llm,
    tools=[directory_tool]
)

# Define the Flow
class StudyPlanFlow(Flow):
    def __init__(self, goal, time_period):
        super().__init__()
        self.state = {
            "goal": goal,
            "time_period": time_period,
            "syllabus_found": False,
            "study_plan": ""
        }

    @start()
    def search_syllabus(self):
        # Use the DirectorySearchTool to find relevant syllabus material
        search_results = directory_tool._run(self.state["goal"])
    
        if search_results:
            self.state["syllabus_found"] = True
            return "Syllabus found. Please wait while we generate your study plan."
    
        # Stop execution if syllabus is missing
        self.state["syllabus_found"] = False
        raise Exception("ERROR: NO SYLLABUS IN DATABASE. PLEASE ADD THE SYLLABUS.")
        

    @listen(search_syllabus)
    def validate_time_period(self, message):
        if not self.state["syllabus_found"]:
            # If syllabus is not found, stop further processing
            raise Exception("ERROR: NO SYLLABUS IN DATABASE. PLEASE ADD THE SYLLABUS.")

        # Estimate and validate the user's preferred completion time
        time_period = int(self.state["time_period"].split()[0])  # Extract number
        expected_min_duration = 3  # Example: 3 months min
        expected_max_duration = 12  # Example: 12 months max
        warning = ""
        if time_period < expected_min_duration:
            warning = "WARNING: THE SPECIFIED TIME PERIOD IS TOO SHORT."
        elif time_period > expected_max_duration:
            warning = "WARNING: THE SPECIFIED TIME PERIOD IS TOO LONG."

        self.state["warning"] = warning

    @listen(validate_time_period)
    def generate_study_plan(self, message):
        if not self.state["syllabus_found"]:
            # If syllabus is not found, stop further processing
            return message

        # Generate a weekly study plan
        study_plan = "\n".join([f"Week {i+1}: [Plan]" for i in range(int(self.state["time_period"].split()[0]))])
        
        # Combine the warning (if any) with the study plan
        response = self.state.get("warning", "") + "\n" + study_plan
        return response


@app.post("/generate_timeline")
def generate_timeline(user_data: TimelineRequest):
    try:
        # Initialize the Flow
        flow = StudyPlanFlow(goal=user_data.goal, time_period=user_data.time_period)
        result = flow.kickoff()
        return {"message": result}
    except Exception as e:
        return {"error": str(e)}  # Stop execution if syllabus is missing

@app.post("/upload_syllabus")
def upload_syllabus(file: UploadFile = File(...)):
    save_path = f"V:\\Serious\\SmartLearn\\syllabus\\{file.filename}"
    with open(save_path, "wb") as buffer:
        buffer.write(file.file.read())
    return {"message": "Syllabus uploaded successfully!", "filename": file.filename}
