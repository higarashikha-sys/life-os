plugins {
    id("com.android.application")
}

android {
    namespace = "com.lifeos.personal"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.lifeos.personal"
        minSdk = 24
        targetSdk = 35
        val ciRun = System.getenv("GITHUB_RUN_NUMBER")?.toIntOrNull()
        versionCode = ciRun ?: 1
        versionName = if (ciRun != null) "0.1." + ciRun else "0.1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
}
