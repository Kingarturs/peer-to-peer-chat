const path = require('path')
const express = require('express')
const app = express()
const mongoose = require('mongoose')

app.use(express.static(path.join(__dirname + '/client/')))

const server = require('http').createServer(app)
server.listen(process.env.PORT || 3000, () => {
    console.log(`Servidor iniciado...`)
})

// Database model
mongoose.connect('mongodb://127.0.0.1:27017/p2pchat', {useNewUrlParser: true, useUnifiedTopology: true, 'useCreateIndex': true})

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: [true, "El nombre de usuario es obligatorio"],
        min: [6, "El nombre es demasiado corto"],
        max: 20,
    },
    password: {
        type: String,
        required: [true, "Es necesario definir una contraseña"],
        min: [6, "La contraseña es demasiado corta"],
        max: 32,
    }
})

const User = mongoose.model('Users', userSchema)

const io = require('socket.io')(server)

io.on("connection", socket => {
    socket.on("Signup", function (data) {
        try {
            User.create(
                [{
                    username: data.username,
                    password: data.password,
                }]
            )
        } catch (error) {
            console.warn(error)
        }
    })
})