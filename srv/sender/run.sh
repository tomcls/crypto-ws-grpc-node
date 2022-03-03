#!/usr/bin/env bash

remote_server=crypto-grpc-server   
dockerName=crypto-grpc-sender
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

docker rm -f ${dockerName}

docker build --file="srv/sender/Dockerfile"  --build-arg host=${remote_server} --build-arg with_ssl=${with_ssl}  -t crypto/grpc-sender  .

docker run -it --name ${dockerName} \
    --link crypto-grpc-server \
    --restart always \
    crypto/grpc-sender  
