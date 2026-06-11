import jenkins.model.*
import org.jenkinsci.plugins.workflow.job.WorkflowJob
import org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition
import hudson.plugins.git.*
import hudson.model.*
import java.util.*

def jenkins = Jenkins.getInstance()
def jobName = 'internship-portal'

if (jenkins.getItem(jobName) == null) {
    println "Creating Jenkins pipeline job: ${jobName}"

    def repoUrl = 'https://github.com/anusha864/internship-and-job-portal.git'
    def branches = [new BranchSpec('*/main')]
    def userRemoteConfig = new UserRemoteConfig(repoUrl, null, null, null)
    def scm = new GitSCM([userRemoteConfig], branches, false, Collections.<SubmoduleConfig>emptyList(), null, null, Collections.<GitSCMExtension>emptyList())

    def job = jenkins.createProject(WorkflowJob, jobName)
    job.setDefinition(new CpsScmFlowDefinition(scm, 'Jenkinsfile'))
    job.save()
    println "Job ${jobName} created."
} else {
    println "Job ${jobName} already exists. Skipping creation."
}
