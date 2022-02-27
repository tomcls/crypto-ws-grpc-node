#!/usr/bin/env bash
#if [ $# -eq 0 ]
#  then
#echo "No arguments supplied: ./run.sh {production,staging,dev}"
#    exit
#fi
export environment=$1
dockerName=crypto-grpc-sender
docker rm -f ${dockerName}
docker build --file="srv/sender/Dockerfile"  --build-arg environment=${environment}  -t crypto/grpc-ws-sender  .
docker run -itd --name ${dockerName} \
--link crypto-ws-server \
--restart always \
crypto/grpc-ws-sender  