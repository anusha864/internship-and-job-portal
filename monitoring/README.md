Quick start for monitoring stack

From the project root run:

```
docker compose up -d --build
```

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)

Grafana datasource is auto-provisioned to Prometheus.

Verify after startup:

- Check containers:

```
docker ps
```

- View Prometheus: `http://localhost:9090` and run the query `up`.
- View Grafana: `http://localhost:3001` (user: `admin`, pass: `admin`). The sample dashboard is available as "Sample Prometheus Dashboard".

Jenkins:

- The `Jenkinsfile` was updated to include the monitoring compose file. Jenkins must run with Docker privileges.

Notes:

- I cannot run Docker in this environment to validate the stack; please run the commands above locally and share any errors and I will help debug.

cAdvisor (container metrics):

- cAdvisor is included to collect container-level metrics (CPU, memory, network).
- cAdvisor metrics endpoint: http://localhost:8080/metrics (Prometheus scrapes cAdvisor at `cadvisor:8080`).
- The dashboard "Containers Overview" is provisioned and shows CPU and memory usage for containers.

If Grafana dashboards are not visible after startup, restart Grafana to force provisioning:

```
docker restart grafana
```
