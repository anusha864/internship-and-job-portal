const API = "http://localhost:5000";

const output = document.getElementById("output");

/* ================= REGISTER ================= */
async function register() {
    try {
        const form = new FormData();

        form.append(
            "name",
            document.getElementById("name").value
        );

        form.append(
            "email",
            document.getElementById("email").value
        );

        form.append(
            "branch",
            document.getElementById("branch").value
        );

        form.append(
            "skills",
            document.getElementById("skills").value
        );

        const resume =
            document.getElementById("resume").files[0];

        if (resume) {
            form.append("resume", resume);
        }

        const res = await fetch(
            `${API}/students`,
            {
                method: "POST",
                body: form
            }
        );

        const data = await res.json();

        alert(data.message);

        document.getElementById("name").value = "";
        document.getElementById("email").value = "";
        document.getElementById("branch").value = "";
        document.getElementById("skills").value = "";
        document.getElementById("resume").value = "";

    } catch (err) {
        console.log(err);
        alert("Registration Failed");
    }
}

/* ================= ADD JOB ================= */
async function addJob() {
    try {

        const title =
            document.getElementById("title").value;

        const company =
            document.getElementById("company").value;

        const type =
            document.getElementById("type").value;

        const res = await fetch(
            `${API}/jobs`,
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    title,
                    company,
                    type
                })
            }
        );

        const data = await res.json();

        alert(data.message);

    } catch (err) {
        console.log(err);
        alert("Job Add Failed");
    }
}

/* ================= VIEW STUDENTS ================= */
async function loadStudents() {

    try {

        const response =
            await fetch(`${API}/students`);

        const students =
            await response.json();

        output.innerHTML = `
        <div class="row">
            ${students.map(student => `
                <div class="box blue">
                    <h3>${student.name}</h3>

                    <p>
                        ${student.email}
                    </p>

                    <p>
                        ${student.branch}
                    </p>

                    <p>
                        ${student.skills}
                    </p>

                    ${
                    student.resume
                    ?
                    `<a href="${student.resume}"
                     target="_blank">
                     View Resume
                     </a>`
                    :
                    "<p>No Resume</p>"
                    }
                </div>
            `).join("")}
        </div>
        `;

    } catch (err) {

        console.log(err);

        alert(
            "Failed to load students"
        );
    }
}

/* ================= VIEW JOBS ================= */
async function loadJobs() {

    try {

        const res =
            await fetch(`${API}/jobs`);

        const jobs =
            await res.json();

        output.innerHTML = `
        <div class="row">
            ${jobs.map(job => `
                <div class="box green">

                    <h3>${job.title}</h3>

                    <p>
                        ${job.company}
                    </p>

                    <p>
                        ${job.type}
                    </p>

                    <button
                        onclick="applyJob(1,${job.id})"
                    >
                        Apply
                    </button>

                </div>
            `).join("")}
        </div>
        `;

    } catch (err) {

        console.log(err);
        alert("Failed to load jobs");
    }
}

/* ================= APPLY ================= */
async function applyJob(
    student_id,
    job_id
) {

    try {

        const res =
            await fetch(`${API}/apply`, {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    student_id,
                    job_id
                })
            });

        const data =
            await res.json();

        alert(data.message);

    } catch (err) {
        console.log(err);
    }
}

/* ================= APPLICATIONS ================= */
async function loadApplications() {

    try {

        const res =
            await fetch(
                `${API}/applications`
            );

        const data =
            await res.json();

        output.innerHTML = `
        <div class="row">
            ${data.map(app => `
                <div class="box purple">

                    <h3>
                        ${app.name}
                    </h3>

                    <p>
                        Job:
                        ${app.title}
                    </p>

                    <p>
                        Company:
                        ${app.company}
                    </p>

                </div>
            `).join("")}
        </div>
        `;

    } catch (err) {
        console.log(err);
    }
}