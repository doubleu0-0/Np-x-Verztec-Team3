import warnings
warnings.filterwarnings("ignore", category=UserWarning, module="ctranslate2")
import argostranslate.package
import argostranslate.translate

# Load available packages from the Argos repo
available_packages = argostranslate.package.get_available_packages()

# Define the target language codes (from English)
target_langs = {
    'zh': 'Chinese (Simplified)',
    'ms': 'Malay',
    'th': 'Thai',
    'id': 'Indonesian',
    'ko': 'Korean',
    'ja': 'Japanese',
    'vi': 'Vietnamese',
    'my': 'Myanmar',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'hi': 'Hindi',
    'ta': 'Tamil',
}

# Install matching packages
for package in available_packages:
    from_code = package.from_code
    to_code = package.to_code

    # Check if it's English → one of our targets
    if from_code == "en" and to_code in target_langs:
        lang_name = target_langs[to_code]
        print(f"Downloading & installing en → {lang_name} ({to_code}) ...")
        argostranslate.package.install_from_path(package.download())
        print(f"Installed: English → {lang_name}\n")