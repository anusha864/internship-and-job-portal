const API = "http://localhost:5000";

const output = document.getElementById("output");
const statusBox = document.getElementById("status");
const applicationsSection = document.getElementById("applications");

function showStatus(message, type = "info") {
    if (!statusBox) return;
    statusBox.innerHTML = `
        <div class="status ${type}">
            <p>${message}</p>
        </div>
    `;
}

function clearStatus() {
    if (!statusBox) return;
    statusBox.innerHTML = "";
}

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

        if (data.studentId) {
            localStorage.setItem(
                "student",
                JSON.stringify({
                    id: data.studentId,
                    name: document.getElementById("name").value,
                    email: document.getElementById("email").value
                })
            );
        }

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
        showStatus("Loading jobs...", "info");

        const res =
            await fetch(`${API}/jobs`);

        const jobs =
            await res.json();

        clearStatus();

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
                        onclick="applyJob(${job.id})"
                    >
                        Apply
                    </button>

                </div>
            `).join("")}
        </div>
        `;

    } catch (err) {

        console.log(err);
        showStatus("Failed to load jobs", "error");
    }
}

/* ================= APPLY ================= */
async function applyJob(job_id) {

    try {
        const student = JSON.parse(
            localStorage.getItem("student")
        );

        if (!student || !student.id) {
            alert(
                "Please register a student first before applying."
            );
            return;
        }

        const res =
            await fetch(`${API}/apply`, {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    student_id: student.id,
                    job_id
                })
            });

        const data =
            await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Failed to apply");
        }

        showStatus("Application submitted successfully.", "success");

        const resultContainer =
            applicationsSection || output;

        resultContainer.innerHTML = `
            <div class="box blue">
                <h3>${data.message}</h3>
                <p>Your application has been submitted.</p>
            </div>
        `;

        // Refresh application results after applying
        await loadApplications();

    } catch (err) {
        console.log(err);
        alert("Failed to apply for job");
    }
}

/* ================= APPLICATIONS ================= */
async function loadApplications() {

    try {
        showStatus("Loading applications...", "info");

        const res =
            await fetch(
                `${API}/applications`
            );

        const applicationsContainer = applicationsSection || output;

        if (!res.ok) {
            const errorText = await res.text();
            applicationsContainer.innerHTML = `
                <div class="box purple">
                    <h3>Error loading applications</h3>
                    <p>${errorText || "Please check backend status."}</p>
                </div>
            `;
            showStatus("Failed to load applications", "error");
            return;
        }

        const data =
            await res.json();

        if (!data || data.length === 0) {
            applicationsContainer.innerHTML = `
                <div class="box purple">
                    <h3>No applications found</h3>
                    <p>Apply for a job and then click Applications again.</p>
                </div>
            `;
            showStatus("No applications found.", "info");
            return;
        }

        clearStatus();

        applicationsContainer.innerHTML = `
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
        const applicationsContainer = document.getElementById("applications") || output;
        console.log(err);
        applicationsContainer.innerHTML = `
            <div class="box purple">
                <h3>Error loading applications</h3>
                <p>${err.message || "Request failed."}</p>
            </div>
        `;
    }
}