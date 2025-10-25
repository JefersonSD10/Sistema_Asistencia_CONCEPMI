FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install uv using pip
RUN pip install --no-cache-dir uv

# Copy dependency files
COPY pyproject.toml ./

# Install dependencies using uv
RUN uv sync

# Copy application code
COPY . .

# Expose port
EXPOSE 5000

# Set environment variables
ENV FLASK_APP=app.py
ENV FLASK_ENV=development
ENV PYTHONPATH=/app

# Run the application
CMD ["uv", "run", "gunicorn", "--bind", "0.0.0.0:5000", "--workers", "1", "--threads", "2", "app:app"]
