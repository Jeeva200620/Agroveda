FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy all application files
COPY . /app

# Expose port 7860 for Hugging Face Spaces
EXPOSE 7860

# Start Flask app binding to all interfaces and port 7860
CMD ["python", "app.py"]
