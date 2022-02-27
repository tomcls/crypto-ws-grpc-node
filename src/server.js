
import { createRequire } from "module";
const require = createRequire(import.meta.url);
var grpc = require('@grpc/grpc-js');
var protoLoader = require('@grpc/proto-loader');

const server = new grpc.Server();
const SERVER_ADDRESS = "0.0.0.0:50051";
var PROTO_PATH =  './protos/orderbook.proto';
var packageDefinition = protoLoader.loadSync(
  PROTO_PATH,
  {keepCase: true,
   longs: String,
   enums: String,
   defaults: true,
   oneofs: true
  });
var proto = grpc.loadPackageDefinition(packageDefinition);

/**
 * Starts an RPC server that receives requests for the Greeter service at the
 * sample server port
 */
 function main() {
  let users = [];

    function join(call, callback) {
      users.push(call);
      broadcast({ user: "Server", text: "new user joined ..." })
    }
    //Receive message from client
    function send(call, callback) {
      broadcast(call.request);
    }
    //Send message to all connected clients
    function broadcast(client) {
      const used = process.memoryUsage().heapUsed / 1024 / 1024;
      console.log(
        'Broadcast to all clients', 
        new Date(),
        `Memory usage: ${Math.round(used * 100) / 100} MB`);
      users.forEach(user => {
         user.write(client);
      });
    }
  var server = new grpc.Server();
  server.addService(proto.crypto.Book.service, {join: join, send: send});
  server.bindAsync(SERVER_ADDRESS, grpc.ServerCredentials.createInsecure(), () => {
    server.start();
    console.log("Server started");
  });
}

main();