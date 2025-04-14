from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from crewai import Agent, Task, Crew, LLM
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Adjust as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the LLM and create a teacher-like agent
llm = LLM(model="gemini/gemini-2.0-flash-exp", temperature=0.5)
teacher_agent = Agent(
    name="Teaching Assistant",
    role="Acts as a knowledgeable teacher who explains concepts clearly and guides students through their learning plan.",
    goal="Provide detailed, instructive responses that not only answer questions but also explain underlying concepts and strategies related to the active day's content.",
    backstory="An experienced educator dedicated to helping students understand complex subjects by breaking them down into clear, digestible parts.",
    allow_delegation=False,
    llm=llm
)

class Message(BaseModel):
    sender: str  # "user" or "ai"
    message: str

# Added description field here
class ChatTeacherRequest(BaseModel):
    user_message: str
    active_day_content: str
    description: str
    conversation_history: List[Message]

@app.post("/chat_teacher")
def chat_teacher_endpoint(request: ChatTeacherRequest):
    # Build conversation context from history
    conversation_text = "\n".join(
        [f"{msg.sender}: {msg.message}" for msg in request.conversation_history]
    )
    
    # Construct a detailed task description including the new description field
    task_description = (
        f"Active Day Content:\n{request.active_day_content}\n\n"
        f"Description:\n{request.description}\n\n"
        f"Conversation History:\n{conversation_text}\n\n"
        f"User Message: {request.user_message}\n\n"
        "As a dedicated teacher, provide a detailed and clear explanation addressing the user's query based on the description provided. "
        "Explain the relevant concepts, offer examples if necessary, and guide the student in understanding the material."
    )

    teacher_task = Task(
        description=task_description,
        agent=teacher_agent,
        expected_output="A detailed, instructive response that explains concepts and guides the student."
    )

    try:
        crew = Crew(agents=[teacher_agent], tasks=[teacher_task])
        result = crew.kickoff()
        return {"response": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
