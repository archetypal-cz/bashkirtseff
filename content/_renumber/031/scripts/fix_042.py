from fixlib5 import *


def fix(X):
    c = '042'
    # 042 is sound: 8 Sept (docx ¶4852–4873) and 9 Sept (¶4874–4899) align 1:1; ¶4900–4923 (arrival in Nice,
    # rest of 9 Sept) are genuinely missing from _original and restored as new paragraphs.
    X.edit_new(c, 4904, french="Pourquoi ai-je quitté Nice ? Que suis-je allée faire là-bas ? Quel but ? Ni plaisir, ni utilité.",
               why='OCR split «là- bas» → «là-bas»')
