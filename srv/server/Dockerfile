FROM node
ARG host
ARG with_ssl
ENV host=$host
ENV with_ssl=$with_ssl
COPY .env.docker /var/www/.env
COPY ./src /var/www/src
COPY ./protos /var/www/protos
COPY ./package.json /var/www/package.json
COPY ./protos /var/www/protos
COPY ./srv/cert /var/www/srv/cert
WORKDIR /var/www
RUN npm install
CMD ["npm","run","start-server"]