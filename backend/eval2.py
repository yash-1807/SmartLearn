from fastapi import FastAPI, UploadFile, File, HTTPException
import shutil
import os
from crewai_tools import PDFSearchTool
from crewai import Agent, Crew, Task, LLM
from pydantic import BaseModel
from typing import List

# Initialize FastAPI app
app = FastAPI()

# Directory to store uploaded PDFs
UPLOAD_DIR = "V:\\Serious\\SmartLearn\\study_materials"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Global variable to store the path of the uploaded PDF
pdf_path = None

# Configure the LLM to use Google's Gemini
llm = LLM(model="gemini/gemini-1.5-pro-latest", temperature=0.7)

# Define a tool for PDF search (to fetch test questions)
def get_pdf_tool():
    if not pdf_path:
        raise HTTPException(status_code=400, detail="No PDF has been uploaded yet.")
    
    return PDFSearchTool(
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

# **Step 1: Generate Questions**
class TestRequest(BaseModel):
    test_type: str
    num_questions: int
    time_limit: int  # Time limit in minutes

def create_test_agent():
    return Agent(
        role="Test Generator",
        goal="Generate a structured test based on the uploaded PDF.",
        backstory="An AI responsible for creating tests based on the provided study material.",
        tools=[get_pdf_tool()],
        llm=llm,
        verbose=True,
    )

def create_test_task(test_type: str, num_questions: int, time_limit: int):
    return Task(
        description=f"Generate {num_questions} questions for a '{test_type}' test from the PDF content. The test should be completed in {time_limit} minutes.",
        expected_output="A structured test with the required number of questions.",
        agent=create_test_agent(),
    )

@app.post("/upload_pdf/")
async def upload_pdf(file: UploadFile = File(...)):
    global pdf_path  # Ensure this is modified correctly
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    # Save the uploaded file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    pdf_path = file_path  # 🔥 Ensure global variable is updated!
    return {"message": "PDF uploaded successfully", "filename": file.filename}

# Store generated questions globally
generated_questions = []

@app.post("/generate_test/")
async def generate_test(request: TestRequest):
    global generated_questions
    try:
        task = create_test_task(request.test_type, request.num_questions, request.time_limit)
        crew = Crew(
            agents=[task.agent],
            tasks=[task],
            llm=llm,
            verbose=True
        )
        crew_output = crew.kickoff()  # 🔥 CrewOutput object
        
        # Properly extract test questions from CrewOutput
        if hasattr(crew_output, "raw"):  # Check if output has raw text
            test_paper = crew_output.raw
        elif hasattr(crew_output, "json_dict") and crew_output.json_dict:
            test_paper = crew_output.json_dict.get("test_paper", "")
        elif hasattr(crew_output, "tasks_output") and crew_output.tasks_output:
            test_paper = crew_output.tasks_output[0].get("raw", "")
        else:
            raise HTTPException(status_code=500, detail="Failed to extract test questions.")
        
        generated_questions = test_paper.strip().split("\n")  # Store extracted questions
        return {"test_paper": test_paper}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class UserAnswers(BaseModel):
    answers: List[str]

user_submitted_answers = []

@app.post("/submit_answers/")
async def submit_answers(request: UserAnswers):
    global user_submitted_answers
    user_submitted_answers = request.answers
    return {"message": "Answers received. Now evaluating..."}

def create_evaluation_agent():
    return Agent(
        role="Test Evaluator",
        goal="Evaluate the student's answers and provide feedback.",
        backstory="An AI responsible for grading student responses based on the provided PDF content.",
        tools=[get_pdf_tool()],
        llm=llm,
        verbose=True,
    )

def parse_questions_and_answers(questions, answers):
    """
    Process the questions and answers to properly match multiple-choice questions
    with their options and the student's response.
    """
    processed_data = []
    current_question = None
    options = []
    
    # Check for empty inputs
    if not questions or not answers:
        return processed_data
    
    for i, line in enumerate(questions):
        # Skip empty lines
        if not line.strip():
            continue
            
        # If line starts with a letter followed by a parenthesis, it's likely an option
        if line.strip() and line.strip()[0].lower() in 'abcd' and ')' in line[:5]:
            if current_question:  # Add to current options
                options.append(line.strip())
        else:
            # If we have a prior question, add it to our processed data
            if current_question and i > 0:
                # Get the corresponding answer if available
                answer_idx = len(processed_data)
                student_answer = answers[answer_idx] if answer_idx < len(answers) else ""
                
                processed_data.append({
                    "question": current_question,
                    "options": options.copy(),  # Use copy to avoid reference issues
                    "student_answer": student_answer
                })
                options = []  # Reset options for new question
                
            # Set new current question
            current_question = line.strip()
    
    # Don't forget to add the last question
    if current_question:
        answer_idx = len(processed_data)
        student_answer = answers[answer_idx] if answer_idx < len(answers) else ""
        
        processed_data.append({
            "question": current_question,
            "options": options,
            "student_answer": student_answer
        })
    
    return processed_data

def create_evaluation_task(questions, answers):
    # First, process the questions and answers
    processed_data = parse_questions_and_answers(questions, answers)
    
    # Format the evaluation input
    formatted_input = ""
    
    for i, item in enumerate(processed_data):
        formatted_input += f"Question {i+1}: {item['question']}\n"
        
        # Add options if available
        if item['options']:
            formatted_input += "Options:\n"
            for opt in item['options']:
                formatted_input += f"  {opt}\n"
        
        # Add student answer
        formatted_input += f"Student's Answer: {item['student_answer']}\n\n"
    
    print("DEBUG - Formatted Input for Evaluation:", formatted_input)
    
    return Task(
        description="Evaluate the student's answers against the given questions and provide feedback on accuracy, correctness, and improvement suggestions.",
        expected_output="A performance report that includes scores, detailed feedback for each question, and improvement suggestions.",
        agent=create_evaluation_agent(),
        context=formatted_input,  # Using context parameter for input
    )

@app.get("/evaluate/")
async def evaluate():
    global generated_questions, user_submitted_answers
    
    # If no questions or answers, return helpful message
    if not generated_questions:
        return {
            "feedback": {
                "raw": "Please provide the student's questions and answers so I can evaluate them against the provided PDF.",
                "pydantic": None,
                "json_dict": None,
            },
            "tasks_output": [{
                "description": "Evaluate the student's answers against the given questions and provide feedback on accuracy, correctness, and improvement suggestions.",
                "name": None,
                "expected_output": "A performance report that includes scores, detailed feedback for each question, and improvement suggestions.",
                "summary": "Evaluate the student's answers against the given questions and provide...",
                "raw": "Please provide the student's questions and answers so I can evaluate them against the provided PDF.",
                "pydantic": None,
                "json_dict": None,
                "agent": "Test Evaluator",
                "output_format": "raw"
            }],
            "token_usage": {
                "total_tokens": 448,
                "prompt_tokens": 370,
                "cached_prompt_tokens": 0,
                "completion_tokens": 78,
                "successful_requests": 1
            }
        }
  
    # Clean and process questions
    cleaned_questions = [
        q for q in generated_questions if not q.startswith("**") and "Instructions" not in q and "Answer:" not in q and q.strip() != ""
    ]
    print("DEBUG - Cleaned Questions:", cleaned_questions)
    print("DEBUG - Submitted Answers:", user_submitted_answers)
    
    try:
        # Create evaluation task with cleaned questions and answers
        task = create_evaluation_task(cleaned_questions, user_submitted_answers)
        crew = Crew(
            agents=[task.agent],
            tasks=[task],
            llm=llm,
            verbose=True
        )
        
        feedback = crew.kickoff()
        
        # Return the feedback in the expected format
        return {
            "feedback": {
                "raw": feedback.raw if hasattr(feedback, "raw") else str(feedback),
                "pydantic": None,
                "json_dict": feedback.json_dict if hasattr(feedback, "json_dict") else None,
            },
            "tasks_output": [{
                "description": "Evaluate the student's answers against the given questions and provide feedback on accuracy, correctness, and improvement suggestions.",
                "name": None,
                "expected_output": "A performance report that includes scores, detailed feedback for each question, and improvement suggestions.",
                "summary": "Evaluate the student's answers against the given questions and provide...",
                "raw": feedback.raw if hasattr(feedback, "raw") else str(feedback),
                "pydantic": None,
                "json_dict": feedback.json_dict if hasattr(feedback, "json_dict") else None,
                "agent": "Test Evaluator",
                "output_format": "raw"
            }],
            "token_usage": feedback.token_usage if hasattr(feedback, "token_usage") else {
                "total_tokens": 0,
                "prompt_tokens": 0,
                "cached_prompt_tokens": 0,
                "completion_tokens": 0,
                "successful_requests": 1
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to the SmartLearn Evaluation Agent"}