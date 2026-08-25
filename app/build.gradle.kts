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
        versionCode = 1
        versionName = "0.1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
}
