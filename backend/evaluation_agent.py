from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
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

# Initialize the LLM and create the evaluation agent
llm = LLM(model="gemini/gemini-2.0-flash-exp", temperature=0.5)
evaluation_agent = Agent(
    name="Evaluation Assistant",
    role="Acts as a smart evaluator that generates multiple-choice questions based on provided learning content. It should generate clear questions, provide multiple answer options, and identify the correct answer for evaluation.",
    goal="Generate high-quality MCQs that test the learner's understanding based on the provided week content, and clearly indicate the correct answer.",
    backstory="A seasoned educator with a knack for assessment design, providing objective evaluations via well-crafted multiple-choice questions.",
    allow_delegation=False,
    llm=llm
)

# Request model for generating MCQs based on a week's content
class MCQGenerationRequest(BaseModel):
    week_content: str           # The content from the selected week/document section.
    description: str            # Extra details or instructions, if any.
    num_questions: int = 5      # Number of questions to generate (default is 5).

# Request model for evaluating user answers (optional extension)
class EvaluationRequest(BaseModel):
    correct_answers: Dict[str, str]  # Mapping question IDs (or question text) to correct answers.
    user_answers: Dict[str, str]     # Mapping question IDs (or question text) to the user's selected answers.

@app.post("/generate_mcqs")
def generate_mcqs(request: MCQGenerationRequest):
    """
    Generates multiple-choice questions with options based on the given week's content.
    """
    # Construct the task description for MCQ generation
    task_description = (
        f"Week Content:\n{request.week_content}\n\n"
        f"Description / Additional Instructions:\n{request.description}\n\n"
        f"Generate {request.num_questions} multiple-choice questions (MCQs). "
        "For each question, provide four options labeled A, B, C, and D, and clearly indicate the correct option. "
        "The questions should be clear, relevant, and test core concepts from the content."
    )

    evaluation_task = Task(
        description=task_description,
        agent=evaluation_agent,
        expected_output="A list of MCQs formatted as a JSON object. Each MCQ should include the question text, four options (A-D), and the correct answer."
    )

    try:
        crew = Crew(agents=[evaluation_agent], tasks=[evaluation_task])
        result = crew.kickoff()  # The result should be in a JSON-friendly format (if not, further processing might be needed).
        return {"response": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/evaluate_answers")
def evaluate_answers(request: EvaluationRequest):
    """
    (Optional) Compares user submitted answers to the correct answers and returns a score and feedback.
    """
    total_questions = len(request.correct_answers)
    correct_count = 0
    detailed_results = []

    for question_id, correct_answer in request.correct_answers.items():
        user_answer = request.user_answers.get(question_id, None)
        is_correct = (user_answer is not None) and (user_answer.strip().upper() == correct_answer.strip().upper())
        if is_correct:
            correct_count += 1
        detailed_results.append({
            "question": question_id,
            "correct_answer": correct_answer,
            "user_answer": user_answer,
            "result": "Correct" if is_correct else "Incorrect"
        })

    score = (correct_count / total_questions) * 100 if total_questions > 0 else 0

    return {"score": score, "details": detailed_results}

