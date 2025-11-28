package me.qwqdev.livestatus.service;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.ComponentName;
import android.content.Context;
import android.content.pm.PackageManager;
import android.provider.Settings;
import android.text.TextUtils;
import android.view.accessibility.AccessibilityEvent;
import lombok.Getter;

public class AppDetectorService extends AccessibilityService {
    @Getter
    private static String currentPackageName = null;

    @Getter
    private static String currentAppName = null;

    private static AppDetectorService instance = null;

    public static boolean isServiceEnabled(Context context) {
        String enabledServices = Settings.Secure.getString(
                context.getContentResolver(),
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        );

        if (TextUtils.isEmpty(enabledServices)) {
            return false;
        }

        ComponentName serviceName = new ComponentName(context, AppDetectorService.class);
        return enabledServices.contains(serviceName.flattenToString());
    }

    public static boolean isServiceRunning() {
        return instance != null;
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event.getEventType() == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            CharSequence packageNameSeq = event.getPackageName();
            if (packageNameSeq != null) {
                String packageName = packageNameSeq.toString();

                if (packageName.contains("systemui") ||
                        packageName.contains("inputmethod") ||
                        packageName.equals("android")) {
                    return;
                }

                currentPackageName = packageName;
                currentAppName = getAppNameFromPackage(packageName);
            }
        }
    }

    @Override
    public void onInterrupt() {
    }

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        instance = this;

        AccessibilityServiceInfo info = new AccessibilityServiceInfo();
        info.eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED;
        info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC;
        info.flags = AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS;
        setServiceInfo(info);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        instance = null;
    }

    private String getAppNameFromPackage(String packageName) {
        try {
            PackageManager pm = getPackageManager();
            return pm.getApplicationLabel(pm.getApplicationInfo(packageName, 0)).toString();
        } catch (PackageManager.NameNotFoundException e) {
            return packageName;
        }
    }
}
