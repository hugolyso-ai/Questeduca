from emergentintegrations.llm.chat import LlmChat, UserMessage
import os
import json
from typing import List, Dict
from models import SchoolYear
from dotenv import load_dotenv

load_dotenv()

SUBJECTS_BY_YEAR = {
    SchoolYear.YEAR_1: ["Português", "Matemática", "Estudo do Meio"],
    SchoolYear.YEAR_2: ["Português", "Matemática", "Estudo do Meio"],
    SchoolYear.YEAR_3: ["Português", "Matemática", "Estudo do Meio"],
    SchoolYear.YEAR_4: ["Português", "Matemática", "Estudo do Meio"],
    SchoolYear.YEAR_5: ["Português", "Matemática", "Ciências Naturais", "História e Geografia de Portugal", "Inglês"],
    SchoolYear.YEAR_6: ["Português", "Matemática", "Ciências Naturais", "História e Geografia de Portugal", "Inglês"],
    SchoolYear.YEAR_7: ["Português", "Matemática", "Ciências Naturais", "Físico-Química", "História", "Geografia", "Inglês"],
    SchoolYear.YEAR_8: ["Português", "Matemática", "Ciências Naturais", "Físico-Química", "História", "Geografia", "Inglês"],
    SchoolYear.YEAR_9: ["Português", "Matemática", "Ciências Naturais", "Físico-Química", "História", "Geografia", "Inglês"],
}

class QuestionGenerator:
    def __init__(self):
        self.api_key = os.environ.get('EMERGENT_LLM_KEY')
        
    async def generate_questions(
        self,
        school_year: SchoolYear,
        subject: str,
        count: int = 10
    ) -> List[Dict]:
        
        chat = LlmChat(
            api_key=self.api_key,
            session_id=f"question_gen_{school_year}_{subject}",
            system_message=f"""És um especialista em educação portuguesa. 
            Cria perguntas educativas de escolha múltipla baseadas no currículo oficial 
            do Ministério da Educação de Portugal para o {school_year}º ano, disciplina de {subject}.
            
            Cada pergunta deve:
            - Estar alinhada com as Aprendizagens Essenciais oficiais
            - Ter 4 opções de resposta
            - Ter dificuldade apropriada para o ano escolar
            - Ser clara e educativa
            
            Responde APENAS com JSON válido no formato:
            {{
                "questions": [
                    {{
                        "question_text": "texto da pergunta",
                        "options": ["opção 1", "opção 2", "opção 3", "opção 4"],
                        "correct_answer": 0,
                        "difficulty": 1
                    }}
                ]
            }}
            """
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(
            text=f"Gera {count} perguntas de {subject} para o {school_year}º ano do ensino básico português."
        )
        
        response = await chat.send_message(user_message)
        
        try:
            data = json.loads(response)
            return data.get('questions', [])
        except json.JSONDecodeError:
            cleaned = response.strip()
            if cleaned.startswith('```json'):
                cleaned = cleaned[7:]
            if cleaned.endswith('```'):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()
            data = json.loads(cleaned)
            return data.get('questions', [])