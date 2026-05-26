import sys
import os

# Adiciona o diretório raiz do backend ao path para que as importações do pacote 'app' e do 'main' funcionem no ambiente serverless
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
