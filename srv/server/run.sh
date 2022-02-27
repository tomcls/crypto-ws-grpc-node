#!/usr/bin/env bash
#if [ $# -eq 0 ]
#  then
#echo "No arguments supplied: ./run.sh {production,staging,dev}"
#    exit
#fi
export environment=$1
dockerName=crypto-ws-server
docker rm -f ${dockerName}
docker build --file="srv/server/Dockerfile"  --build-arg environment=${environment}  -t crypto/grpc-server .
docker run -it --name ${dockerName} crypto/grpc-server  