import os
from flask import Flask, render_template, request, jsonify
from groq import Groq
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# Initialize Groq client
# The client automatically looks for the GROQ_API_KEY environment variable
try:
    groq_client = Groq()
except Exception as e:
    print(f"Warning: Failed to initialize Groq client. Ensure GROQ_API_KEY is set. Error: {e}")
    groq_client = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/analyze', methods=['POST'])
def analyze():
    if not groq_client:
        return jsonify({"error": "Groq client is not initialized. Please check your API key configuration."}), 500

    data = request.json
    text = data.get('text', '')
    task = data.get('task', 'summarize')

    if not text:
        return jsonify({"error": "No text provided."}), 400

    # Map the task to a specific prompt
    prompts = {
        'summarize': "Provide a clear, concise summary of the following text:",
        'action_items': "Extract a bulleted list of actionable items or next steps from the following text:",
        'key_entities': "Identify and list the key entities (people, organizations, locations, concepts) mentioned in the following text:"
    }

    system_prompt = prompts.get(task, prompts['summarize'])
    system_prompt += "\nFormat your response cleanly using Markdown."

    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": text
                }
            ],
            model="llama3-8b-8192", # Using the fast 8b model for low latency
            temperature=0.5,
            max_tokens=1024,
            top_p=1,
        )
        
        result = chat_completion.choices[0].message.content
        return jsonify({"result": result})

    except Exception as e:
        print(f"Groq API Error: {str(e)}")
        return jsonify({"error": "Failed to process text with AI. Please try again."}), 500

if __name__ == '__main__':
    # Run the application in debug mode for development
    app.run(debug=True, port=5000)
