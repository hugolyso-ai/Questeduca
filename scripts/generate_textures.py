import asyncio
import os
import base64
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

from emergentintegrations.llm.chat import LlmChat, UserMessage

OUT_DIR = '/app/frontend/public/assets'

TEXTURES = {
    'grass_texture.png': (
        "Seamless tileable texture of lush green grass terrain viewed directly from above (top-down orthographic), "
        "in the painterly style of Age of Empires 2 Definitive Edition terrain. Subtle natural color variation between "
        "green shades, tiny scattered dirt specks and small clover patches. No objects, no buildings, no shadows of objects, "
        "no borders, no text. Must tile seamlessly on all edges. Square texture."
    ),
    'road_texture.png': (
        "Seamless tileable texture of a packed dirt road with small embedded cobblestones viewed directly from above "
        "(top-down orthographic), in the painterly style of Age of Empires 2 Definitive Edition roads. Warm brown and tan "
        "earth tones with subtle stone gray accents. No objects, no borders, no text. Must tile seamlessly on all edges. Square texture."
    ),
}


async def gen(filename, prompt):
    api_key = os.getenv('EMERGENT_LLM_KEY')
    chat = LlmChat(api_key=api_key, session_id=f"texture-{filename}", system_message="You are a game texture artist")
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    text, images = await chat.send_message_multimodal_response(UserMessage(text=prompt))
    if images:
        image_bytes = base64.b64decode(images[0]['data'])
        path = os.path.join(OUT_DIR, filename)
        with open(path, 'wb') as f:
            f.write(image_bytes)
        print(f"OK {filename} ({len(image_bytes)} bytes)")
    else:
        print(f"FAIL {filename}: no image. Text: {str(text)[:200]}")


async def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for fn, prompt in TEXTURES.items():
        try:
            await gen(fn, prompt)
        except Exception as e:
            print(f"ERROR {fn}: {e}")

asyncio.run(main())
