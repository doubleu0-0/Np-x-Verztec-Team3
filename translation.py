from googletrans import Translator

translator = Translator()

def detect_and_translate_to_english(user_input):
    # Detect the language
    detected = translator.detect(user_input)
    source_lang = detected.lang
    print(f"Detected language: {source_lang}")

    # Translate to English
    translated_text = translator.translate(user_input, src=source_lang, dest='en').text
    return translated_text

# Example: Get user input from CLI
user_input = input("Enter a sentence in any language: ")
english_translation = detect_and_translate_to_english(user_input)
print("Final Translation:", english_translation)