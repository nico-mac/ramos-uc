FROM python:3.10

ENV PYTHONUNBUFFERED=1
WORKDIR /code

# Te odio poetry
RUN curl -sSL https://install.python-poetry.org | python3 -
ENV PATH="/root/.local/bin:$PATH"

# Configs, con lo del .env podemos hacer un baúl con github actions
# https://docs.github.com/es/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions
COPY pyproject.toml poetry.lock ./
COPY .env.example .env

# Instalar módulos
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi

# Traemos el resto del código
COPY . .

# Exponemos el puerto 8mil
EXPOSE 8000
