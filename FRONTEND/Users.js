function login(){
    let log={
        "username":document.getElementById("username").value,
        "password":document.getElementById("password1").value
    }
    putLogin(log);
}

function putLogin(data){
    let xhr=new XMLHttpRequest();
    xhr.open('PUT',"http://localhost:3000/api/login");
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(data));
    xhr.onload = function () {
        if (xhr.status != 200) { 
            alert(xhr.status + ': '+ xhr.response);
        } else {
            localStorage.token=xhr.response;
            window.location.href ="board.html";
        }
    };
}

function createUser(){
    if(document.getElementById("newPassword").value!=document.getElementById("confPassword").value) {
        alert("passwords do not match");
        return;
    }
    let user={
        "username":document.getElementById("newUsername").value,
        "email":document.getElementById("newEmail").value,
        "password":document.getElementById("newPassword").value,
    };

    let xhr=new XMLHttpRequest();
    xhr.open('POST',"http://localhost:3000/api/users");
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(user));
    xhr.onload = function () {
        if (xhr.status != 201) { 
            alert(xhr.status + ': '+ xhr.response);
        } else {
            console.log(xhr.response);
            data=JSON.parse(xhr.response);
            let log={
                "username":data.username,
                "password":document.getElementById("newPassword").value
            }
            putLogin(log);
        }
    };
}