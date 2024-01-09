var firebaseConfig = {
    /* your firebaseConfig here 
    */
};

firebase.initializeApp(firebaseConfig);

var db = firebase.database();
var auth = firebase.auth();
var tasks = document.getElementById("tasks");
var tasksRef = db.ref("/tasks");

taskForm.addEventListener("submit", e => {
    e.preventDefault(); // prevent reloading

    var task = document.getElementById("task");
    var taskOwnerId = document.getElementById("taskOwnerId").value;
    var details = document.getElementById("details");
    var hiddenId = document.getElementById("hiddenId");

    if (task.value == "") {
        return
    }

    var id = hiddenId.value || Date.now();

    db.ref("tasks/" + id).set({
        task: task.value,
        details: details.value,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        ownerId: taskOwnerId || getCurrentUserFromSessionStorage().uid,
    });

    clearForm();
});

/*
load tasks on page load
 */
tasksRef.on("child_added", data => {
    if (data.val().task == "") {
        return;
    }

    // return if not logged in
    if (!getCurrentUserFromSessionStorage()) {
        return;
    }

    var li = document.createElement("li");
    li.id = data.key;
    li.dataset.ownerId = data.val().ownerId;
    li.style.listStyleType = "none";
    li.style = "margin-top: 12px; border: 1px solid; padding: 8px;"
    li.innerHTML = taskTemplate(data.val());
    tasks.appendChild(li);
});

tasks.addEventListener("click", e => {
    updateTask(e);
    deleteTask(e);
});

tasksRef.on("child_changed", data => {
    var taskNode = document.getElementById(data.key);
    taskNode.innerHTML = taskTemplate(data.val());
});

tasksRef.on("child_removed", data => {
    var taskNode = document.getElementById(data.key);
    taskNode.parentNode.removeChild(taskNode)
});

function deleteTask(e) {
    var taskNode = e.target.parentNode;

    if (e.target.classList.contains("delete")) {
        var id = taskNode.id;
        db.ref("tasks/" + id).remove();

        clearForm();
    }
}

function updateTask(e) {
    var taskNode = e.target.parentNode;

    if (e.target.classList.contains("update")) {
        clearForm();
        var taskOwnerIdElement = document.getElementById("taskOwnerId");
        var taskOwnedByCurrentUser = getCurrentUserFromSessionStorage().uid == taskNode.dataset.ownerId;

        task.value = taskNode.querySelector(".task").innerText;
        task.disabled = !taskOwnedByCurrentUser;
        details.value = taskNode.querySelector(".details").innerText;
        hiddenId.value = taskNode.id;
        taskOwnerIdElement.value = taskNode.dataset.ownerId;
    }
}

function clearForm() {
    task.value = "",
    details.value = "",
    hiddenId.value = ""
}

function taskTemplate({ task, details, createdAt, ownerId }) {
    var createdAtFormatted = new Date(createdAt);
    var isOwnedByCurrentUser = getCurrentUserFromSessionStorage().uid == ownerId;

    return `
        <div>
            <label>Task:</label>
            <label class="task"><strong>${task}</strong></label>
        </div>
        <div>
            <label>Details:</label>
            <label class="details">${details}</label>
            <br/>
        </div>
        <div>
            <label>Created:</label>
            <label class="createdAt">${createdAtFormatted}</label>
            <br/>
        </div>

        ${isOwnedByCurrentUser ? `<button type="button" class="btn btn-danger delete">Delete</button>` : ''}
        <button type="button" class="btn btn-warning update">Update</button>
    `;
}

/* ========================================================================== */
/*                                 Login Logic                                */
/* ========================================================================== */
document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault(); // prevent the form from submitting normally
    login();
});

window.onload = function () { // execute when page loads
    var userObject = getCurrentUserFromSessionStorage();

    if (userObject) {
        document.getElementById('loginForm').style.display = 'none'; // hide login form
        document.getElementById('userEmail').textContent = userObject.email; // display email
        document.getElementById('userDisplay').style.display = 'block'; // show user-display div
    }
};

function getCurrentUserFromSessionStorage() {
    var userString = sessionStorage.getItem('user');

    if (userString) {
        return JSON.parse(userString);
    }
    return null;
}

function login() {
    var email = document.getElementById('email').value;
    var password = document.getElementById('password').value;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            var user = userCredential.user;
            document.getElementById('errorMessage').textContent = ''; // clear previous error message
            sessionStorage.setItem('user', JSON.stringify(user)); // save user
            window.location.reload(); // reload page
        })
        .catch((error) => {
            console.error('Login error:', error);
            document.getElementById('errorMessage').textContent = error.message;
        });
}

document.getElementById('logoutBtn').addEventListener('click', logout);

function logout() {
    auth.signOut()
        .then(() => {
            sessionStorage.removeItem('user'); // remove user from session storage
            window.location.reload(); // reload page
        })
        .catch((error) => {
            console.error('Logout error:', error);
        });
}