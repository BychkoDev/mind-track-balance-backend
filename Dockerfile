FROM node:24-alpine AS base

WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

COPY package*.json ./
COPY nest-cli.json ./
COPY tsconfig*.json ./
COPY apps ./apps
COPY libs ./libs
COPY packages ./packages


FROM base AS deps

RUN npm install


FROM deps AS builder

ARG SERVICE_NAME
ARG SERVICE_DB

RUN npm run generate --workspace @mind-track/${SERVICE_DB}
RUN npm run build:${SERVICE_NAME}

FROM node:24-alpine AS runner

WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

ENV NODE_ENV=production

ARG SERVICE_NAME
ARG SERVICE_DB

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/packages/${SERVICE_DB} ./packages/${SERVICE_DB}

ENV SERVICE_NAME=${SERVICE_NAME}
ENV SERVICE_DB=${SERVICE_DB}

EXPOSE 3000

CMD ["sh", "-c", "node dist/apps/${SERVICE_NAME}/apps/${SERVICE_NAME}/src/main.js"]