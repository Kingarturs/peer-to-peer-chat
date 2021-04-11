window.onload = init;

function init() {
    if (localStorage.getItem("token")) {
        alert("Authed user")
    } else {
        window.location.href = "login.html"
    }
}
