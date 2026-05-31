require("dotenv").config();

const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const multerS3 = require("multer-s3");
const AWS = require("aws-sdk");
const path = require("path");

const app = express();

/* ==========================
   MIDDLEWARE
========================== */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Prometheus metrics
const client = require('prom-client');
const register = client.register;
client.collectDefaultMetrics({ register });

const httpRequestDurationMs = new client.Histogram({
    name: 'http_request_duration_ms',
    help: 'Duration of HTTP requests in ms',
    labelNames: ['method', 'route', 'code'],
    buckets: [50, 100, 200, 300, 400, 500, 1000]
});

const httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'code']
});

app.use((req, res, next) => {
    const start = process.hrtime();
    res.on('finish', () => {
        const delta = process.hrtime(start);
        const durationMs = delta[0] * 1000 + delta[1] / 1e6;
        const route = req.route && req.route.path ? req.route.path : req.path;
        httpRequestDurationMs.labels(req.method, route, res.statusCode).observe(durationMs);
        httpRequestsTotal.labels(req.method, route, res.statusCode).inc();
    });
    next();
});

app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    } catch (err) {
        res.status(500).end(err);
    }
});

/* ==========================
   AWS S3 CONFIG
========================== */
const s3 = new AWS.S3({
    accessKeyId:
        process.env.AWS_ACCESS_KEY_ID,

    secretAccessKey:
        process.env.AWS_SECRET_ACCESS_KEY,

    region:
        process.env.AWS_REGION
});

/* ==========================
   DATABASE
========================== */
const db = new sqlite3.Database(
    "./portal.db",
    (err) => {

        if (err) {

            console.log(
                "Database Error:",
                err.message
            );

        } else {

            console.log(
                "SQLite Connected"
            );
        }
    }
);

/* ==========================
   TABLES
========================== */
db.run(`
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    branch TEXT,
    skills TEXT,
    resume TEXT
)
`);

db.run(`
CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    company TEXT,
    type TEXT
)
`);

db.run(`
CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    job_id INTEGER
)
`);

/* ==========================
   FILE UPLOAD TO AWS S3
========================== */
const upload = multer({

    storage: multerS3({

        s3: s3,

        bucket:
            process.env.S3_BUCKET_NAME,

        acl:
            "public-read",

        key: function (
            req,
            file,
            cb
        ) {

            cb(
                null,

                Date.now() +
                "-" +
                file.originalname
            );
        }
    })
});

/* ==========================
   HOME ROUTE
========================== */
app.get("/", (req, res) => {

    res.send(
        "Internship Portal Backend Running"
    );
});

/* ==========================
   REGISTER STUDENT
========================== */
app.post(
    "/students",
    upload.single("resume"),

    (req, res) => {

        try {

            const {
                name,
                email,
                branch,
                skills
            } = req.body;

            const resume =
                req.file
                    ? req.file.location
                    : null;

            if (
                !name ||
                !email
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Name and Email required"
                    });
            }

            db.run(
                `
                INSERT INTO students
                (
                    name,
                    email,
                    branch,
                    skills,
                    resume
                )
                VALUES (?, ?, ?, ?, ?)
                `,
                [
                    name,
                    email,
                    branch,
                    skills,
                    resume
                ],

                function (err) {

                    if (err) {

                        console.log(err);

                        return res
                            .status(500)
                            .json({
                                error:
                                    err.message
                            });
                    }

                    res.json({
                        message:
                            "Student Registered Successfully",

                        studentId:
                            this.lastID
                    });
                }
            );

        } catch (err) {

            console.log(err);

            res.status(500).json({
                message:
                    "Server Error"
            });
        }
    }
);

/* ==========================
   GET STUDENTS
========================== */
app.get(
    "/students",

    (req, res) => {

        db.all(
            `
            SELECT *
            FROM students
            `,
            [],

            (
                err,
                rows
            ) => {

                if (err) {

                    console.log(err);

                    return res
                        .status(500)
                        .json({
                            error:
                                err.message
                        });
                }

                res.json(rows);
            }
        );
    }
);

/* ==========================
   ADD JOB / INTERNSHIP
========================== */
app.post(
    "/jobs",

    (req, res) => {

        try {

            const {
                title,
                company,
                type
            } = req.body;

            if (
                !title ||
                !company
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Title and company required"
                    });
            }

            db.run(
                `
                INSERT INTO jobs
                (
                    title,
                    company,
                    type
                )
                VALUES (?, ?, ?)
                `,
                [
                    title,
                    company,
                    type
                ],

                function (err) {

                    if (err) {

                        console.log(err);

                        return res
                            .status(500)
                            .json({
                                error:
                                    err.message
                            });
                    }

                    res.json({
                        message:
                            "Job Added Successfully",

                        jobId:
                            this.lastID
                    });
                }
            );

        } catch (err) {

            console.log(err);

            res.status(500).json({
                message:
                    "Server Error"
            });
        }
    }
);

/* ==========================
   GET JOBS
========================== */
app.get(
    "/jobs",

    (req, res) => {

        db.all(
            `
            SELECT *
            FROM jobs
            `,
            [],

            (
                err,
                rows
            ) => {

                if (err) {

                    return res
                        .status(500)
                        .json({
                            error:
                                err.message
                        });
                }

                res.json(rows);
            }
        );
    }
);

/* ==========================
   APPLY JOB
========================== */
app.post(
    "/apply",

    (req, res) => {

        const {
            student_id,
            job_id
        } = req.body;

        if (
            !student_id ||
            !job_id
        ) {

            return res
                .status(400)
                .json({
                    message:
                        "Student ID and Job ID required"
                });
        }

        db.run(
            `
            INSERT INTO applications
            (
                student_id,
                job_id
            )
            VALUES (?, ?)
            `,
            [
                student_id,
                job_id
            ],

            function (err) {

                if (err) {

                    return res
                        .status(500)
                        .json({
                            error:
                                err.message
                        });
                }

                res.json({
                    message:
                        "Applied Successfully"
                });
            }
        );
    }
);

/* ==========================
   VIEW APPLICATIONS
========================== */
app.get(
    "/applications",

    (req, res) => {

        db.all(
            `
            SELECT
                applications.id,
                students.name,
                jobs.title,
                jobs.company,
                jobs.type
            FROM applications
            JOIN students
            ON students.id =
            applications.student_id

            JOIN jobs
            ON jobs.id =
            applications.job_id
            `,
            [],

            (
                err,
                rows
            ) => {

                if (err) {

                    return res
                        .status(500)
                        .json({
                            error:
                                err.message
                        });
                }

                res.json(rows);
            }
        );
    }
);

/* ==========================
   SERVER
========================== */
app.listen(
    process.env.PORT || 5000,
    "0.0.0.0",
    () => {
        console.log("Server running on port 5000");
    }
);