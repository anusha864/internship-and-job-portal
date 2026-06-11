#!/usr/bin/env powershell
# Jenkins Pipeline Auto-Setup Script
# This script creates the Internship Portal pipeline job in Jenkins

param(
    [string]$JenkinsURL = "http://localhost:8080",
    [string]$JobName = "Internship-Portal-Pipeline",
    [string]$GitRepo = "https://github.com/anusha864/internship-and-job-portal.git",
    [string]$GitBranch = "main",
  [string]$Jenkinsfile = "Jenkinsfile",
  [string]$ConfigPath = "jenkins-job-config.xml",
  [string]$JenkinsUser = $null,
  [string]$JenkinsApiToken = $null
)

Write-Host "======================================" -ForegroundColor Green
Write-Host "Jenkins Pipeline Auto-Setup" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

# Check if Jenkins is running
Write-Host "Checking Jenkins connection..." -ForegroundColor Cyan
try {
  # Use Invoke-RestMethod to avoid Invoke-WebRequest parsing prompt
  $response = Invoke-RestMethod -Uri $JenkinsURL -Method Get -TimeoutSec 5 -ErrorAction Stop
  Write-Host "Jenkins is running at $JenkinsURL" -ForegroundColor Green
} catch {
  Write-Host "Cannot connect to Jenkins at $JenkinsURL" -ForegroundColor Red
  Write-Host "   Make sure Jenkins is running: docker compose up -d jenkins" -ForegroundColor Yellow
  exit 1
}

Write-Host ""
Write-Host "Job Configuration:" -ForegroundColor Cyan
Write-Host "  - Job Name: $JobName" -ForegroundColor Cyan
Write-Host "  - Repository: $GitRepo" -ForegroundColor Cyan
Write-Host "  - Branch: $GitBranch" -ForegroundColor Cyan
Write-Host "  - Jenkinsfile: $Jenkinsfile" -ForegroundColor Cyan
Write-Host ""

# Create job XML config
$jobXML = $null
if (Test-Path -Path $ConfigPath) {
    Write-Host "Found config file: $ConfigPath - using it to create/update job" -ForegroundColor Cyan
    $jobXML = Get-Content -Path $ConfigPath -Raw
} else {
    $jobXML = @"
<?xml version='1.1' encoding='UTF-8'?>
<flow-definition plugin="workflow-job@1364.v2ee0f7a43f2a">
  <actions/>
  <description>Automated CI/CD Pipeline for Internship Portal - Docker, Monitoring, Testing</description>
  <keepDependencies>false</keepDependencies>
  <properties>
    <org.jenkinsci.plugins.workflow.job.properties.PipelineTriggersJobProperty>
      <triggers>
        <com.cloudbees.jenkins.GitHubPushTrigger plugin="github@1.38.3">
          <spec></spec>
        </com.cloudbees.jenkins.GitHubPushTrigger>
      </triggers>
    </org.jenkinsci.plugins.workflow.job.properties.PipelineTriggersJobProperty>
  </properties>
  <definition class="org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition" plugin="workflow-cps@3942.v51013c1d4c5f">
    <scm class="hudson.plugins.git.GitSCM" plugin="git@5.4.6">
      <configVersion>2</configVersion>
      <userRemoteConfigs>
        <hudson.plugins.git.UserRemoteConfig>
          <url>$GitRepo</url>
          <credentialsId></credentialsId>
        </hudson.plugins.git.UserRemoteConfig>
      </userRemoteConfigs>
      <branches>
        <hudson.plugins.git.BranchSpec>
          <name>*/$GitBranch</name>
        </hudson.plugins.git.BranchSpec>
      </branches>
      <owner class="org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition" reference="../../.."/>
      <skipDefaultCheckout>false</skipDefaultCheckout>
      <scmName></scmName>
      <extensions/>
    </scm>
    <scriptPath>$Jenkinsfile</scriptPath>
    <lightweight>true</lightweight>
  </definition>
  <triggers/>
  <disabled>false</disabled>
</flow-definition>
"@
}

# Create the job via Jenkins API
Write-Host "Creating pipeline job..." -ForegroundColor Cyan

try {
  Write-Host "Note: If your Jenkins requires authentication, run this script with credentials via PowerShell CLI." -ForegroundColor Yellow

  # Determine credentials: prefer script params, then env vars
  $username = $JenkinsUser
  $apiToken = $JenkinsApiToken
  if (-not $username) { $username = $env:JENKINS_USER }
  if (-not $apiToken) { $apiToken = $env:JENKINS_API_TOKEN }

  # If still missing, prompt interactively (securely for token)
  if (-not $username) {
    $username = Read-Host -Prompt 'Jenkins username (leave blank for anonymous)'
    if ($username -eq '') { $username = $null }
  }
  if (-not $apiToken -and $username) {
    $secureToken = Read-Host -Prompt 'Jenkins API token or password (input hidden)' -AsSecureString
    $apiToken = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken))
  }

  $headers = @{}
  if ($username -and $apiToken) {
    $pair = "$username`:$apiToken"
    $b64 = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($pair))
    $headers['Authorization'] = "Basic $b64"

    # Try to fetch CSRF crumb
    try {
      $crumbUri = "$JenkinsURL/crumbIssuer/api/json"
      $crumbResp = Invoke-RestMethod -Uri $crumbUri -Method Get -Headers $headers -ErrorAction Stop
      if ($crumbResp -and $crumbResp.crumb) {
        $headers[$crumbResp.crumbRequestField] = $crumbResp.crumb
      }
    } catch {
      # no crumb or anonymous access
    }
  }

  $jobExists = $false
  try {
    $checkUri = "$JenkinsURL/job/$JobName/api/json"
    $resp = Invoke-RestMethod -Uri $checkUri -Method Get -Headers $headers -ErrorAction Stop
    if ($resp) { $jobExists = $true }
  } catch {
    $jobExists = $false
  }

    # Use HttpClient with CookieContainer so crumb + session cookie are honored
    try {
      $cookieContainer = New-Object System.Net.CookieContainer
      $handler = New-Object System.Net.Http.HttpClientHandler
      $handler.CookieContainer = $cookieContainer
      $client = New-Object System.Net.Http.HttpClient($handler)

      if ($username -and $apiToken) {
        $pair = "$username`:$apiToken"
        $b64 = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($pair))
        $client.DefaultRequestHeaders.Authorization = New-Object System.Net.Http.Headers.AuthenticationHeaderValue('Basic',$b64)
      }

      # Try to get crumb using same client (so cookie is stored)
      try {
        $crumbResp = $client.GetAsync("$JenkinsURL/crumbIssuer/api/json").Result
        if ($crumbResp.IsSuccessStatusCode) {
          $crumbJson = $crumbResp.Content.ReadAsStringAsync().Result | ConvertFrom-Json
          if ($crumbJson -and $crumbJson.crumb) {
            try {
              $client.DefaultRequestHeaders.Remove($crumbJson.crumbRequestField)
            } catch {}
            $client.DefaultRequestHeaders.Add($crumbJson.crumbRequestField, $crumbJson.crumb)
          }
        }
      } catch {
        # ignore crumb errors; server may allow anonymous operations
      }

      # Ensure Pipeline plugin (workflow-aggregator) is installed
      try {
        $pmResp = $client.GetAsync("$JenkinsURL/pluginManager/api/json?depth=1").Result
        if ($pmResp.IsSuccessStatusCode) {
          $pmJson = $pmResp.Content.ReadAsStringAsync().Result | ConvertFrom-Json
          $hasPipeline = $false
          if ($pmJson.plugins) {
            foreach ($p in $pmJson.plugins) { if ($p.shortName -eq 'workflow-aggregator') { $hasPipeline = $true; break } }
          }
          if (-not $hasPipeline) {
            Write-Host "Pipeline plugin not found - installing workflow-aggregator..." -ForegroundColor Cyan
            $installXml = '<jenkins><install plugin="workflow-aggregator@latest"/></jenkins>'
            $installBytes = [System.Text.Encoding]::UTF8.GetBytes($installXml)
            $installContent = New-Object System.Net.Http.ByteArrayContent -ArgumentList (, $installBytes)
            $installContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse('text/xml')
            $installRes = $client.PostAsync("$JenkinsURL/pluginManager/installNecessaryPlugins", $installContent).GetAwaiter().GetResult()
            if ($installRes.IsSuccessStatusCode) {
              Write-Host "Plugin install requested - restarting Jenkins (safeRestart)" -ForegroundColor Yellow
              $empty = New-Object System.Net.Http.StringContent ''
              $restartRes = $client.PostAsync("$JenkinsURL/safeRestart", $empty).GetAwaiter().GetResult()
              Write-Host "Restart request status: $($restartRes.StatusCode)" -ForegroundColor Cyan
              Write-Host "Wait for Jenkins to come back up, then re-run this script." -ForegroundColor Cyan
              exit 0
            } else {
              $body = $installRes.Content.ReadAsStringAsync().GetAwaiter().GetResult()
              Write-Host "Plugin install request failed: HTTP $($installRes.StatusCode)" -ForegroundColor Red
              Write-Host $body -ForegroundColor Yellow
              throw "Plugin install failed"
            }
          }
        }
      } catch {
        # proceed if plugin check fails
        Write-Host "Could not verify/install plugins: $($_.Exception.Message)" -ForegroundColor Yellow
      }

      $bytes = [System.Text.Encoding]::UTF8.GetBytes($jobXML)
      $content = New-Object System.Net.Http.ByteArrayContent($bytes)
      $content.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse('application/xml')

      if ($jobExists) {
        Write-Host "Job exists - updating configuration for $JobName" -ForegroundColor Cyan
        $uri = "$JenkinsURL/job/$JobName/config.xml"
      } else {
        Write-Host "Creating new job: $JobName" -ForegroundColor Cyan
        $uri = "$JenkinsURL/createItem?name=$JobName"
      }

      $res = $client.PostAsync($uri, $content).GetAwaiter().GetResult()
      if ($res.IsSuccessStatusCode) {
        Write-Host "Job operation successful (HTTP $($res.StatusCode))" -ForegroundColor Green
      } else {
        $body = $res.Content.ReadAsStringAsync().GetAwaiter().GetResult()
        Write-Host "Job operation failed: HTTP $($res.StatusCode)" -ForegroundColor Red
        Write-Host $body -ForegroundColor Yellow
        throw "HTTP $($res.StatusCode): job operation failed"
      }
    } catch {
      Write-Host "Job create/update failed: $($_.Exception.Message)" -ForegroundColor Red
      throw $_
    }
} catch {
  $status = $null
  try { $status = $_.Exception.Response.StatusCode.Value__ } catch { }
  if ($status -eq 400) {
    Write-Host "Job may already exist or invalid config" -ForegroundColor Yellow
  } else {
    Write-Host "Error creating/updating job: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
  }
}

Write-Host ""
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Open Jenkins: $JenkinsURL" -ForegroundColor Cyan
Write-Host "2. Go to: Dashboard -> $JobName" -ForegroundColor Cyan
Write-Host "3. Click: Build Now to trigger pipeline" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pipeline will:" -ForegroundColor Cyan
Write-Host "  - Clone code from GitHub" -ForegroundColor Cyan
Write-Host "  - Build Docker images" -ForegroundColor Cyan
Write-Host "  - Deploy services (backend, frontend, monitoring)" -ForegroundColor Cyan
Write-Host "  - Run automated tests" -ForegroundColor Cyan
Write-Host "  - Display health status" -ForegroundColor Cyan
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor Green
Write-Host "  - Backend:    http://localhost:5000" -ForegroundColor Green
Write-Host "  - Frontend:   http://localhost:80" -ForegroundColor Green
Write-Host "  - Prometheus: http://localhost:9090" -ForegroundColor Green
Write-Host "  - Grafana:    http://localhost:3000" -ForegroundColor Green
Write-Host "  - Jenkins:    http://localhost:8080" -ForegroundColor Green
Write-Host ""
