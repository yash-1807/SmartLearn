from fastapi import FastAPI
from pydantic import BaseModel
from crewai import Agent, Task, Crew, LLM

app = FastAPI()

class OnboardingRequest(BaseModel):
    name: str
    goal: str
    hours_per_week: str

llm = LLM(model="gemini/gemini-1.5-pro-latest", temperature=0.7)

onboarding_agent = Agent(
    name="Onboarding Assistant",
    role="Processes user onboarding details and generates a structured response.",
    goal="Take user input and generate a personalized onboarding summary.",
    backstory="An AI assistant that helps users personalize their learning journey.",
    allow_delegation=False,
    llm=llm
)

# Global variable to store the latest result
last_result = None

@app.post("/onboarding")
def onboarding(user_data: OnboardingRequest):
    global last_result
    onboarding_task = Task(
        description=(
            f"Given the user's details:\n"
            f"Name: {user_data.name}\n"
            f"Learning Goal: {user_data.goal}\n"
            f"Available Study Hours per Week: {user_data.hours_per_week}\n\n"
            "1.Generate a personalized onboarding message 2.Give a motivational quote 3.End with a line to move forward to the next step which is timeline generation."
        ),
        agent=onboarding_agent,
        expected_output="A friendly, motivating onboarding message for the user."
    )

    crew = Crew(agents=[onboarding_agent], tasks=[onboarding_task])
    result = crew.kickoff()
    last_result = result
    return {"message": result}

@app.get("/result")
def get_result():
    if last_result is None:
        return {"message": "No result available yet."}
    return {"message": last_result}
