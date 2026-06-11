#!/usr/bin/env node
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'portal.db');

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Cannot open database:', dbPath);
    console.error(err.message);
    process.exit(1);
  }
});

function all(sql) {
  return new Promise((resolve, reject) => {
    db.all(sql, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

(async () => {
  try {
    console.log('=== Students ===');
    const students = await all('SELECT * FROM students;');
    console.log(JSON.stringify(students, null, 2));

    console.log('\n=== Jobs ===');
    const jobs = await all('SELECT * FROM jobs;');
    console.log(JSON.stringify(jobs, null, 2));

    console.log('\n=== Applications (joined) ===');
    const applications = await all(`
      SELECT
        applications.id,
        students.id as student_id,
        students.name,
        jobs.id as job_id,
        jobs.title,
        jobs.company
      FROM applications
      JOIN students ON students.id = applications.student_id
      JOIN jobs ON jobs.id = applications.job_id
    `);
    console.log(JSON.stringify(applications, null, 2));

  } catch (err) {
    console.error('Query error:', err.message || err);
    process.exitCode = 1;
  } finally {
    db.close();
  }
})();
