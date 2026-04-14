import json
import os
import time
from deep_translator import GoogleTranslator

AR_JSON_PATH = 'locales/ar.json'
FR_JSON_PATH = 'locales/fr.json'

def main():
    if not os.path.exists(AR_JSON_PATH):
        print(f"File {AR_JSON_PATH} not found.")
        return

    with open(AR_JSON_PATH, 'r', encoding='utf-8') as f:
        ar_data = json.load(f)

    if os.path.exists(FR_JSON_PATH):
        with open(FR_JSON_PATH, 'r', encoding='utf-8') as f:
            fr_data = json.load(f)
    else:
        fr_data = {}

    translator = GoogleTranslator(source='ar', target='fr')

    # To avoid rate limits, we will batch translate strings
    keys_to_translate = [k for k in ar_data.keys() if k not in fr_data]
    total = len(keys_to_translate)
    
    print(f"Found {total} strings to translate.")
    if total == 0:
        return

    batch_size = 50
    for i in range(0, total, batch_size):
        batch_keys = keys_to_translate[i:i + batch_size]
        try:
            texts = batch_keys
            # Use translate_batch
            translations = translator.translate_batch(texts)
            for k, trans in zip(batch_keys, translations):
                fr_data[k] = trans
            
            # Save progress iteratively
            with open(FR_JSON_PATH, 'w', encoding='utf-8') as f:
                json.dump(fr_data, f, ensure_ascii=False, indent=2)
                
            print(f"Translated batch {i//batch_size + 1}/{(total//batch_size) + 1}...")
            time.sleep(1) # Be gentle with the API
            
        except Exception as e:
            print(f"Batch error: {str(e).encode('ascii', 'ignore').decode('ascii')}. Retrying 1 by 1...")
            # Retry one by one
            for k in batch_keys:
                try:
                    fr_data[k] = translator.translate(k)
                    time.sleep(0.5)
                except Exception as ex:
                    print(f"Failed to translate 1 string. Putting original. Error: {str(ex)[:30]}")
                    fr_data[k] = k
                    
            with open(FR_JSON_PATH, 'w', encoding='utf-8') as f:
                json.dump(fr_data, f, ensure_ascii=False, indent=2)

    print("Translation complete!")

if __name__ == '__main__':
    main()
