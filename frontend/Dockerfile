FROM node:20-slim AS base
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# NEXT_PUBLIC_* vars are inlined into the browser bundle at build time, so
# they must arrive as a build ARG, not a runtime environment variable —
# .env.local is excluded from the build context via .dockerignore since it
# may later hold values that shouldn't be baked into an image layer.
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

ENV NODE_ENV=production
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
