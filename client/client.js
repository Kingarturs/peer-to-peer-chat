// DOM Logic
loginButton = document.getElementById("loginButton")
signupButton = document.getElementById("signupButton")
signupContainer = document.getElementById("signupContainer")
loginContainer = document.getElementById("loginContainer")
loginButton = document.getElementById("loginButton")

const socket = io("http://localhost:3000");

if (loginContainer) {
    loginButton.addEventListener('click', () => {
        data = {
            "username": document.getElementById("username").value,
            "password": document.getElementById("password").value
        }
    
        socket.emit("Login", data)
    })
} else {
    signupButton.addEventListener('click', () => {
        data = {
            "username": document.getElementById("username").value,
            "password": document.getElementById("password").value
        }
    
        socket.emit("Signup", data)
    })
}

// Socket Logic

socket.on("connect", () => {
    console.log("Conexión establecida");
});

socket.on("Signup", (data) => {
    
})