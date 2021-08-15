const path = require("path");
const Express = require("express");
const http = require("http");
const socketio = require("socketio");

const app = Express();
const server = http.createServer(app); // cria um servidor que utiliza o express para requisições
const io = socketio(server); // instancia o socket io no servidor
const port = process.env.PORT || 3000; // define a porta

app.use(Express.static(path.join(__dirname, "public")));

server.listen(port, () => {
    console.log("servidor rodando na porta ", port);
});

let onlineUsers = 0;

// evento de conexão no servidor, recebe o socket no callback
io.on("connection", socket => {
    let addedUser = false; // variável controla que o usuário já entrou

    // evento no socket quando conecta o usuário
    socket.on("addUser", username => {
        if (addedUser) {
            return;
        }

        socket.username = username;
        ++onlineUsers; // incrementa o contador de usuários conectados
        addedUser = true;

        // emite o evento de login para informar quantos usuários online agora
        socket.emit("login", {
            onlineUsers
        });

        // broadcast emite evento para todos os usuários do site
        // evento userJoined para informar qual usuário acaba de entrar
        socket.broadcast.emit("userJoined", {
            username: socket.username,
            onlineUsers
        });

        console.log(`Usuário ${username} entrou`);
    });

    // evento disparado quando o usuário começa a digitar
    socket.on("typing", () => {
        socket.broadcast.emit("typing", {
            username: socket.username
        });
    });

    // evento disparado quando o usuário pára de digitar
    socket.on("stopTyping", () => {
        socket.broadcast.emit("stopTyping", {
            username: socket.username
        });
    });

    // evento quando desconecta
    socket.on("disconnect", () => {
        if (addedUser) {
            --onlineUsers;

            // envia que o usuário saiu e mostra 
            socket.broadcast.emit("userLeft", {
                username: socket.username,
                onlineUsers
            });
        }
    });
})