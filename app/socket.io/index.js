module.exports = function (app_pack) {
    let { io, google } = app_pack;

    io.on('connection', function (socket) {
        socket.on('comprobar información de inicio de sesión', async function (userTest) {
            let user = await google.users.getUser(userTest.celular)
            if (user) {
                if (userTest.clave == user.clave) {
                    io.to(socket.id).emit("información de inicio de sesión: CORRECTA");
                } else {
                    io.to(socket.id).emit("información de inicio de sesión: CLAVE INCORRECTA");
                }
            } else {
                io.to(socket.id).emit("información de inicio de sesión: CELULAR INCORRECTO");
            }
        })
        socket.on('registrar usuario', async function (userTest) {
            let user = await google.users.getUser(userTest.celular)
            if (user) {
                io.to(socket.id).emit("usuario ya existe");
                return
            } else {
                if (await google.users.addUser(userTest)) {
                    io.to(socket.id).emit("registro exitoso");
                }else{
                    io.to(socket.id).emit("usuario ya existe");
                }
            }
        });
    });
}