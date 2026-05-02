<div align="center">
  <h1>🧠 Gyan AI</h1>
  <p><strong>An Intelligent Educational Content Generator Built by Krishiv</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
    <img src="https://img.shields.io/badge/Streamlit-FF4B4B?style=for-the-badge&logo=streamlit&logoColor=white" alt="Streamlit" />
    <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask" />
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI" />
    <img src="https://img.shields.io/badge/FFmpeg-007808?style=for-the-badge&logo=ffmpeg&logoColor=white" alt="FFmpeg" />
  </p>
</div>

<br />

> **Gyan AI** is an advanced, AI-powered educational content generator that instantly creates dynamic, animated videos with natural voiceovers and interactive quizzes—all from a single text prompt. Engineered from the ground up to revolutionize the way students and educators consume and create visually rich explanations without requiring any video editing or scripting experience.

---

## 🔥 Why I Built This

I developed Gyan AI to bridge the gap between complex topics and accessible, engaging learning materials. Traditional video creation is time-consuming and requires specialized skills. Gyan AI automates the entire pipeline—from scripting and storyboarding to animation rendering, voiceover generation, and final video composition.

---

## ✨ Features That Set It Apart

*   🎬 **Fully Automated Video Generation Pipeline**: Input any topic, and the system orchestrates LLMs, headless browsers, and video processors to output a complete `p5.js` animation with perfectly synced voiceovers.
*   🗣️ **Natural TTS Narration**: Integrates seamlessly with OpenAI’s Text-to-Speech API for lifelike, engaging audio explanations.
*   🧠 **Context-Aware Interactive Quizzes**: Employs Gemini 1.5 Pro to automatically generate relevant, scoring-based quizzes after the video completes to reinforce learning.
*   🧪 **Headless Animation Rendering**: Uses Pyppeteer and CCapture.js to render and capture JavaScript animations frame-by-frame on the backend.
*   📼 **Advanced Video Processing**: Utilizes FFmpeg to precisely merge audio tracks with rendered visual frames.
*   🧰 **Sleek Interface**: Features a clean, dark-themed React and Streamlit UI designed for optimal user experience.

---

## 🏗️ Architecture & Tech Stack

Gyan AI is built on a robust, microservices-inspired architecture:

| Component | Technology | Role in System |
| :--- | :--- | :--- |
| **Frontend UI** | React & Streamlit | User interaction, prompt input, and video playback. |
| **Backend Engine** | Python (Flask / Asyncio) | Orchestrates the entire generation pipeline and serves APIs. |
| **Animation Engine** | p5.js, Pyppeteer, CCapture | Generates code, renders in headless Chrome, and captures frames. |
| **AI / LLMs** | GPT-4o, Claude 3, Gemini 1.5 | Writes scripts, generates p5.js code, and creates quiz questions. |
| **Voice / TTS** | OpenAI TTS API | Converts the AI-generated script into natural human speech. |
| **Video Compiler** | FFmpeg | Merges the captured frames and generated audio into a final `.mp4`. |

---

## 🚀 Getting Started

Want to run my project locally? Follow these steps to get the full stack up and running.

### 📦 Backend Setup (Flask/Python)

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
2. **Set up the database:**
   ```bash
   flask db init
   flask db migrate -m "Initial migration"
   flask db upgrade
   ```
3. **Run the backend:**
   ```bash
   python app.py
   ```

### 💻 Frontend Setup (React)

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend/vidlearn-frontend-main
   ```
2. **Install node modules:**
   ```bash
   npm install
   ```
3. **Start the development server:**
   ```bash
   npm run dev
   ```

### 🌍 Production Build

```bash
cd frontend/vidlearn-frontend-main
npm run build
```
*(Flask will automatically serve the frontend from `frontend/build` in production mode.)*

---

## 👨‍💻 About the Developer

**Designed, Architected, and Developed by Krishiv**

I built this project to push the boundaries of what's possible with generative AI in the EdTech space. I'm passionate about creating intelligent systems that solve real-world problems. 

If you're impressed by Gyan AI or want to collaborate, feel free to reach out or check out my other work!

---
<div align="center">
  <sub>Built with ❤️ and a lot of caffeine by Krishiv.</sub>
</div>
