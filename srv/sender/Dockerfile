FROM node
ARG environment
ENV env=$environment
COPY .env-docker /var/www/.env
COPY ./src /var/www/src
COPY ./protos /var/www/protos
COPY ./package.json /var/www/package.json
COPY ./protos /var/www/protos
COPY ./srv/sender/start.sh /var/www/start.sh
WORKDIR /var/www
RUN npm install
CMD [ "npm run start-sender" ] 
ENTRYPOINT ./start.sh