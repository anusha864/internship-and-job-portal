import jenkins.model.*
import hudson.security.*

def instance = Jenkins.get()

if (!instance.isUseSecurity()) {
    def adminUser = System.getenv('JENKINS_ADMIN_ID') ?: 'admin'
    def adminPassword = System.getenv('JENKINS_ADMIN_PASSWORD') ?: 'admin'
    def hudsonRealm = new HudsonPrivateSecurityRealm(false)
    hudsonRealm.createAccount(adminUser, adminPassword)
    instance.setSecurityRealm(hudsonRealm)
    instance.setAuthorizationStrategy(new FullControlOnceLoggedInAuthorizationStrategy())
    instance.save()
    println("Initialized Jenkins security with user: ${adminUser}")
} else {
    println("Jenkins security already enabled.")
}
