from emergentintegrations.llm.chat import LlmChat, UserMessage
import os
import json
import uuid
from typing import List, Dict, Optional
from models import SchoolYear
from dotenv import load_dotenv
from datetime import datetime, timezone

load_dotenv()

# Disciplinas por ano escolar (currículo português)
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

# Tópicos específicos por disciplina e ciclo para guiar o LLM
TOPICS_BY_SUBJECT = {
    "Português": {
        "1": ["Leitura e escrita", "Vogais e consoantes", "Sílabas", "Palavras simples", "Histórias curtas"],
        "2": ["Tipos de texto", "Gramática básica", "Verbos", "Nomes e adjetivos", "Interpretação de texto"],
        "3": ["Ortografia", "Sinónimos e antónimos", "Tipos de frase", "Texto narrativo", "Poesia"]
    },
    "Matemática": {
        "1": ["Números até 100", "Adição e subtração", "Formas geométricas", "Medidas de tempo", "Dinheiro"],
        "2": ["Multiplicação", "Divisão", "Frações simples", "Geometria", "Problemas"],
        "3": ["Números decimais", "Percentagens", "Áreas e perímetros", "Estatística", "Proporcionalidade"]
    },
    "Estudo do Meio": {
        "1": ["O corpo humano", "A família", "A casa", "Animais", "Plantas", "Estações do ano"],
    },
    "Ciências Naturais": {
        "2": ["Célula", "Sistemas do corpo humano", "Ecossistemas", "Rochas e minerais"],
        "3": ["Genética", "Evolução", "Sustentabilidade", "Saúde"]
    },
    "História e Geografia de Portugal": {
        "2": ["Primeiros povos", "Formação de Portugal", "Descobrimentos", "República"]
    },
    "História": {
        "3": ["Civilizações antigas", "Idade Média", "Idade Moderna", "História contemporânea"]
    },
    "Geografia": {
        "3": ["Relevo", "Clima", "População", "Atividades económicas", "União Europeia"]
    },
    "Físico-Química": {
        "3": ["Matéria", "Energia", "Movimento", "Forças", "Reações químicas"]
    },
    "Inglês": {
        "2": ["Greetings", "Family", "Numbers", "Colors", "Animals", "Food"],
        "3": ["Grammar", "Vocabulary", "Reading comprehension", "Writing"]
    }
}

# Recompensas por dificuldade
REWARDS_BY_DIFFICULTY = {
    1: {"coins": 10, "xp": 5},
    2: {"coins": 20, "xp": 10},
    3: {"coins": 35, "xp": 20},
}

def get_cycle_from_year(year: str) -> str:
    """Obtém o ciclo a partir do ano escolar"""
    year_num = int(year)
    if year_num <= 4:
        return "1"
    elif year_num <= 6:
        return "2"
    else:
        return "3"

class QuestionGenerator:
    def __init__(self):
        self.api_key = os.environ.get('EMERGENT_LLM_KEY')
        
    async def generate_questions(
        self,
        school_year: str,
        subject: str,
        count: int = 5,
        difficulty: int = 1,
        topic: Optional[str] = None
    ) -> List[Dict]:
        """
        Gera perguntas educativas usando Claude Sonnet 4.5
        
        Args:
            school_year: Ano escolar (1-9)
            subject: Disciplina
            count: Número de perguntas (máx 10)
            difficulty: Nível de dificuldade (1-3)
            topic: Tópico específico (opcional)
        
        Returns:
            Lista de perguntas com formato estruturado
        """
        count = min(count, 10)  # Limitar a 10 perguntas por chamada
        cycle = get_cycle_from_year(school_year)
        
        # Obter tópicos sugeridos para este nível
        suggested_topics = TOPICS_BY_SUBJECT.get(subject, {}).get(cycle, [])
        topics_hint = f"Tópicos sugeridos: {', '.join(suggested_topics)}" if suggested_topics else ""
        
        if topic:
            topics_hint = f"Foca no tópico: {topic}"
        
        difficulty_desc = {
            1: "fácil - conceitos básicos, perguntas diretas",
            2: "médio - requer raciocínio, aplicação de conceitos",
            3: "difícil - análise, síntese, problemas complexos"
        }
        
        system_prompt = f"""És um especialista em educação portuguesa e criador de conteúdos educativos.
Cria perguntas de escolha múltipla baseadas no currículo oficial do Ministério da Educação de Portugal.

REGRAS IMPORTANTES:
1. As perguntas devem ser apropriadas para o {school_year}º ano do ensino básico
2. Dificuldade: {difficulty_desc.get(difficulty, 'médio')}
3. Disciplina: {subject}
4. {topics_hint}
5. Cada pergunta deve ter EXATAMENTE 4 opções de resposta
6. Apenas UMA opção pode estar correta
7. As opções erradas devem ser plausíveis mas claramente incorretas
8. Linguagem clara e acessível para crianças/jovens portugueses
9. Inclui uma breve explicação educativa para cada resposta

FORMATO DE RESPOSTA (JSON válido, sem markdown):
{{
    "questions": [
        {{
            "question_text": "Pergunta clara e educativa",
            "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
            "correct_answer": 0,
            "explanation": "Explicação breve de porque esta é a resposta correta",
            "topic": "Tópico da pergunta"
        }}
    ]
}}

O campo correct_answer é o índice (0-3) da opção correta no array options."""

        chat = LlmChat(
            api_key=self.api_key,
            session_id=f"quiz_{uuid.uuid4().hex[:8]}",
            system_message=system_prompt
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        user_message = UserMessage(
            text=f"Gera {count} perguntas de {subject} para o {school_year}º ano. Dificuldade: {difficulty}/3."
        )
        
        try:
            response = await chat.send_message(user_message)
            questions = self._parse_response(response, school_year, subject, difficulty)
            return questions
        except Exception as e:
            print(f"Error generating questions: {e}")
            # Retornar perguntas de fallback em caso de erro
            return self._get_fallback_questions(school_year, subject, count)
    
    def _parse_response(self, response: str, school_year: str, subject: str, difficulty: int) -> List[Dict]:
        """Parse a resposta do LLM e adiciona metadados"""
        try:
            # Tentar parse direto
            data = json.loads(response)
        except json.JSONDecodeError:
            # Limpar markdown se presente
            cleaned = response.strip()
            if cleaned.startswith('```json'):
                cleaned = cleaned[7:]
            elif cleaned.startswith('```'):
                cleaned = cleaned[3:]
            if cleaned.endswith('```'):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()
            
            try:
                data = json.loads(cleaned)
            except json.JSONDecodeError:
                return []
        
        questions = data.get('questions', [])
        rewards = REWARDS_BY_DIFFICULTY.get(difficulty, REWARDS_BY_DIFFICULTY[1])
        
        # Adicionar metadados a cada pergunta
        for q in questions:
            q['question_id'] = f"q_{uuid.uuid4().hex[:12]}"
            q['school_year'] = school_year
            q['subject'] = subject
            q['difficulty'] = difficulty
            q['coins_reward'] = rewards['coins']
            q['xp_reward'] = rewards['xp']
            q['created_at'] = datetime.now(timezone.utc).isoformat()
        
        return questions
    
    def _get_fallback_questions(self, school_year: str, subject: str, count: int) -> List[Dict]:
        """Retorna perguntas de fallback em caso de erro no LLM"""
        fallback = {
            "Matemática": [
                {
                    "question_text": "Quanto é 5 + 3?",
                    "options": ["6", "7", "8", "9"],
                    "correct_answer": 2,
                    "explanation": "5 + 3 = 8. Somamos 5 unidades com 3 unidades.",
                    "topic": "Adição"
                },
                {
                    "question_text": "Qual é o dobro de 4?",
                    "options": ["6", "8", "10", "12"],
                    "correct_answer": 1,
                    "explanation": "O dobro de 4 é 4 × 2 = 8.",
                    "topic": "Multiplicação"
                }
            ],
            "Português": [
                {
                    "question_text": "Qual é o plural de 'cão'?",
                    "options": ["cãos", "cães", "cãoes", "caos"],
                    "correct_answer": 1,
                    "explanation": "O plural de 'cão' é 'cães'. Palavras terminadas em 'ão' podem ter plural em 'ães'.",
                    "topic": "Gramática"
                }
            ]
        }
        
        questions = fallback.get(subject, fallback["Matemática"])[:count]
        
        for q in questions:
            q['question_id'] = f"q_{uuid.uuid4().hex[:12]}"
            q['school_year'] = school_year
            q['subject'] = subject
            q['difficulty'] = 1
            q['coins_reward'] = 10
            q['xp_reward'] = 5
            q['created_at'] = datetime.now(timezone.utc).isoformat()
        
        return questions

    async def generate_quiz(
        self,
        school_year: str,
        subject: str,
        num_easy: int = 3,
        num_medium: int = 2,
        num_hard: int = 0
    ) -> Dict:
        """
        Gera um quiz completo com perguntas de várias dificuldades
        
        Returns:
            Quiz com metadados e lista de perguntas ordenadas por dificuldade
        """
        questions = []
        
        if num_easy > 0:
            easy = await self.generate_questions(school_year, subject, num_easy, difficulty=1)
            questions.extend(easy)
        
        if num_medium > 0:
            medium = await self.generate_questions(school_year, subject, num_medium, difficulty=2)
            questions.extend(medium)
        
        if num_hard > 0:
            hard = await self.generate_questions(school_year, subject, num_hard, difficulty=3)
            questions.extend(hard)
        
        total_coins = sum(q.get('coins_reward', 0) for q in questions)
        total_xp = sum(q.get('xp_reward', 0) for q in questions)
        
        return {
            "quiz_id": f"quiz_{uuid.uuid4().hex[:12]}",
            "school_year": school_year,
            "subject": subject,
            "total_questions": len(questions),
            "max_coins": total_coins,
            "max_xp": total_xp,
            "questions": questions,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
