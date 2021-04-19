const path = require('path')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const express = require('express')
const app = express()

app.use(express.static(path.join(__dirname + '/client/')))

const server = require('http').createServer(app)
server.listen(process.env.PORT || 3000, () => {
    console.log(`Servidor iniciado...`)
})
const io = require('socket.io')(server)

const MongoClient = require('mongodb').MongoClient
const { lutimesSync } = require('fs')
const url = "mongodb://localhost"

clientes = {}

io.on("connection", socket => {

    socket.on("Signup", async function (data) {
        if (data.username, data.password) {
            if (data.username.length < 6) {
                socket.emit("UserMsgError", "El usuario debe tener al menos 6 carácteres")
                return
            }
            
            const client = await MongoClient.connect(url, { 
                useNewUrlParser: true, 
                useUnifiedTopology: true,
            })
    
            const db = client.db('p2pchat')
            const collection = await db.collection('users')
    
            collection.findOne({ Username: data.username }, (err, item) => {
                if (err) {
                    console.error(err)
                    return
                }
    
                if (item) {
                    console.log(item)
                    socket.emit("UserMsgError", "El usuario que ingresó ya existe")
                    return
                } else {
                    collection.insertOne(
                        {
                            Username: data.username,
                            Password: data.password
                        },
                        (err, result) => {
                            if (err) {
                                console.error(err)
                                return
                            }
                            socket.emit("Signup", "El usuario se registró correctamente") 
                        }
                    )
                }
            })
        } else {
            socket.emit("UserMsgError", "Por favor llene todos los campos")
        }
    })
    
    socket.on("Login", async function (data) {
        if(data.username, data.password) {
            const client = await MongoClient.connect(url, { 
                useNewUrlParser: true, 
                useUnifiedTopology: true,
            })
    
            const db = client.db('p2pchat')
            const collection = await db.collection('users')
    
            collection.findOne({ Username: data.username, Password: data.password }, (err, item) => {
                if (err) {
                    console.error(err)
                    return
                }
                if (item) {
                    const token = jwt.sign({
                        ip: socket.handshake.address,
                        username: data.username
                    }, process.env.DEBUG_KEY );

                    clientes[socket.handshake.address] = data.username
                    
                    socket.emit("Login", token, data.username)
                }
            })
        } else {
            socket.emit("UserMsgError", "Por favor llene todos los campos")
        }
    })
})