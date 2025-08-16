# Usa Python 3.11 slim per dimensioni ridotte
FROM python:3.11-slim

# Imposta la directory di lavoro
WORKDIR /app

# Installa le dipendenze di sistema necessarie
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copia i file di dipendenze
COPY requirements.txt .

# Installa le dipendenze Python
RUN pip install --no-cache-dir -r requirements.txt

# Copia tutto il codice dell'applicazione
COPY . .

# Esponi la porta 8080 (quella che usa Fly.io)
EXPOSE 8080

# Comando per avviare l'applicazione
CMD ["python", "app.py"]
