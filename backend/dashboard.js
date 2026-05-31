const student = JSON.parse(localStorage.getItem("student"));

const container = document.getElementById("studentInfo");

if (!student) {
    window.location.href = "index.html";
}

container.innerHTML = `
    <div class="student-card">
        <h2>Welcome, ${student.name}</h2>

        <p><b>Email:</b> ${student.email}</p>
        <p><b>Branch:</b> ${student.branch}</p>
        <p><b>Skills:</b> ${student.skills}</p>

        <p><b>Resume:</b> ${student.resume ? student.resume : "Not Uploaded"}</p>
    </div>
`;

function logout() {
    localStorage.removeItem("student");
    window.location.href = "index.html";
}