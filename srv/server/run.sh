#!/usr/bin/env bash

hostname=0.0.0.0  
with_ssl=0
if [ ! -z "$1" ]
  then
    with_ssl=$1
fi
if [ -z "$2" ]
  then
    echo "No arguments supplied: ./run.sh {with_ssl} {remote_server}"
    echo "So the remote server name is by default: ${remote_server}"
else 
    remote_server=$2
fi

dockerName=crypto-grpc-server

docker rm -f ${dockerName}
docker build --file="srv/server/Dockerfile"  --build-arg host=${hostname} --build-arg with_ssl=${with_ssl} -t crypto/grpc-server .
docker run -it --name ${dockerName} --restart always crypto/grpc-server  
