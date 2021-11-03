FROM node:latest AS build

WORKDIR "/dist"

COPY [ "package.json", "yarn.lock*", "./" ]
RUN [ "yarn" ]

FROM testcafe/testcafe:latest AS app

WORKDIR "/app"

COPY --from=build /dist/node_modules /app/node_modules

ENTRYPOINT [ "testcafe" ]