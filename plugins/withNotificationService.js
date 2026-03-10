const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withNotificationService(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const mainApplication = manifest.application[0];

    // Add tools namespace for merger conflict resolution
    if (!manifest.$["xmlns:tools"]) {
      manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";
    }

    // Force allowBackup to be true and use tools:replace to avoid library conflicts
    mainApplication.$["tools:replace"] = "android:allowBackup";
    mainApplication.$["android:allowBackup"] = "true";

    // Add the NotificationListenerService
    const service = {
      $: {
        "android:name":
          "com.leandrosimoes.rnandroidnotificationlistener.RNAndroidNotificationListener",
        "android:label": "Yape Notify Listener",
        "android:permission":
          "android.permission.BIND_NOTIFICATION_LISTENER_SERVICE",
        "android:exported": "true",
      },
      "intent-filter": [
        {
          action: {
            $: {
              "android:name":
                "android.service.notification.NotificationListenerService",
            },
          },
        },
      ],
    };

    if (!mainApplication.service) {
      mainApplication.service = [];
    }

    const alreadyExists = mainApplication.service.some(
      (s) =>
        s.$["android:name"] ===
        "com.leandrosimoes.rnandroidnotificationlistener.RNAndroidNotificationListener",
    );

    if (!alreadyExists) {
      mainApplication.service.push(service);
    }

    return config;
  });
};
