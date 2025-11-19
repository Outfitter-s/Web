FROM oven/bun:alpine AS build
WORKDIR /app

# Install dependencies
COPY ./package.json .
COPY ./bun.lock .
RUN bun install

# Copy the application code
COPY . .

# Build
RUN bun run build

# Prod server
FROM oven/bun:alpine AS prod
WORKDIR /app
COPY --from=build /app/build build/
COPY --from=build /app/node_modules node_modules/
COPY --from=build /app/package.json .
COPY --from=build /app/entrypoint.sh .
COPY --from=build /app/scripts scripts/
COPY --from=build /app/sql sql/
EXPOSE 4173
ENV NODE_ENV=production
ENV POSTGRES_HOST=db
ENV REDIS_HOST=redis
CMD [ "sh", "./entrypoint.sh" ]
