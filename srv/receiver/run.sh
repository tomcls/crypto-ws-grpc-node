#!/usr/bin/env bash
#if [ $# -eq 0 ]
#  then
#echo "No arguments supplied: ./run.sh {production,staging,dev}"
#    exit
#fi
export environment=$1
dockerName=crypto-grpc-receiver
docker rm -f ${dockerName}
docker build --file="srv/receiver/Dockerfile"  --build-arg environment=${environment}  -t crypto/grpc-receiver  .
docker run -it --name ${dockerName} \
--link crypto-ws-server \
crypto/grpc-receiver 