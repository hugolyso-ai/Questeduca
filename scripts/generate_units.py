"""Generate villager + soldier unit sprites on magenta background, chroma-key to transparency."""
import asyncio
import os
import base64
import sys
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')
from emergentintegrations.llm.chat import LlmChat, UserMessage

sys.path.insert(0, '/app/scripts')
from regen_sprites import chroma_key  # reuse chroma key pipeline

OUT_DIR = '/app/frontend/public/assets/units'
os.makedirs(OUT_DIR, exist_ok=True)

UNITS = {
    'villager': (
        "A single medieval peasant villager character sprite for an isometric strategy video game "
        "(Age of Empires 2 painterly style). Full body, walking pose facing slightly right, carrying a small "
        "wooden tool. Simple brown tunic. The character must be COMPLETELY isolated: every pixel that is not "
        "the character must be SOLID UNIFORM MAGENTA #FF00FF. No ground, no shadow, no checkerboard, no text. "
        "Character centered, fills most of the frame."
    ),
    'soldier': (
        "A single medieval soldier character sprite for an isometric strategy video game "
        "(Age of Empires 2 painterly style). Full body, marching pose facing slightly right, holding a spear "
        "and a round shield, metal helmet, chainmail. The character must be COMPLETELY isolated: every pixel "
        "that is not the character must be SOLID UNIFORM MAGENTA #FF00FF. No ground, no shadow, no checkerboard, "
        "no text. Character centered, fills most of the frame."
    ),
}


async def gen(name, prompt):
    api_key = os.getenv('EMERGENT_LLM_KEY')
    chat = LlmChat(api_key=api_key, session_id=f"unit-{name}", system_message="You are a game sprite artist")
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    text, images = await chat.send_message_multimodal_response(UserMessage(text=prompt))
    if not images:
        print(f"FAIL {name}: {str(text)[:120]}")
        return
    raw = f'/tmp/unit_{name}.png'
    with open(raw, 'wb') as f:
        f.write(base64.b64decode(images[0]['data']))
    size = chroma_key(raw, os.path.join(OUT_DIR, f'{name}.png'))
    print(f"OK {name}: {size}")


async def main():
    for name, prompt in UNITS.items():
        try:
            await gen(name, prompt)
        except Exception as e:
            print(f"ERROR {name}: {e}")

asyncio.run(main())
