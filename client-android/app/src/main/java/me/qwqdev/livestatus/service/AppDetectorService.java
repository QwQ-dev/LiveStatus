package me.qwqdev.livestatus.service;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.ComponentName;
import android.content.Context;
import android.content.pm.PackageManager;
import android.provider.Settings;
import android.text.TextUtils;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.view.accessibility.AccessibilityWindowInfo;

import java.util.List;
import java.util.Objects;
import java.util.stream.IntStream;

public class AppDetectorService extends AccessibilityService {
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

    public static String getCurrentPackageName() {
        return instance == null ? null : instance.queryActivePackageName();
    }

    public static String getCurrentAppName() {
        if (instance == null) {
            return null;
        }

        String packageName = instance.queryActivePackageName();
        return packageName == null ? null : instance.getAppNameFromPackage(packageName);
    }

    public static String[] getActiveAppInfo() {
        if (instance == null) {
            return null;
        }

        String packageName = instance.queryActivePackageName();

        if (packageName == null) {
            return null;
        }

        return new String[]{packageName, instance.getAppNameFromPackage(packageName)};
    }

    private String queryActivePackageName() {
        String pkg = extractPackage(getRootInActiveWindow());
        if (pkg != null) {
            return pkg;
        }

        try {
            List<AccessibilityWindowInfo> windows = getWindows();

            pkg = windows.stream()
                    .filter(w -> w.isFocused() || w.isActive())
                    .map(w -> extractPackage(w.getRoot()))
                    .filter(Objects::nonNull)
                    .findFirst()
                    .orElse(null);

            if (pkg != null) {
                return pkg;
            }

            return IntStream.of(
                            AccessibilityWindowInfo.TYPE_APPLICATION,
                            AccessibilityWindowInfo.TYPE_SYSTEM,
                            AccessibilityWindowInfo.TYPE_SPLIT_SCREEN_DIVIDER,
                            AccessibilityWindowInfo.TYPE_ACCESSIBILITY_OVERLAY)
                    .boxed()
                    .flatMap(type -> windows.stream().filter(w -> w.getType() == type))
                    .map(w -> extractPackage(w.getRoot()))
                    .filter(Objects::nonNull)
                    .findFirst()
                    .orElse(null);
        } catch (Exception ignored) {
            // ignored
        }

        return null;
    }

    private String extractPackage(AccessibilityNodeInfo node) {
        if (node == null) {
            return null;
        }

        CharSequence pkgName = node.getPackageName();

        if (pkgName == null) {
            return null;
        }

        String pkg = pkgName.toString();
        return isInputMethod(pkg) ? null : pkg;
    }

    private boolean isInputMethod(String packageName) {
        return packageName != null &&
                (packageName.contains("inputmethod") || packageName.contains("keyboard"));
    }

    private String getAppNameFromPackage(String packageName) {
        try {
            PackageManager pm = getPackageManager();
            return pm.getApplicationLabel(pm.getApplicationInfo(packageName, 0)).toString();
        } catch (PackageManager.NameNotFoundException e) {
            return packageName;
        }
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
    }

    @Override
    public void onInterrupt() {
    }

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        instance = this;

        AccessibilityServiceInfo info = getServiceInfo();
        if (info == null) {
            info = new AccessibilityServiceInfo();
        }

        info.eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
                | AccessibilityEvent.TYPE_WINDOWS_CHANGED;
        info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC;
        info.flags = AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS;
        info.notificationTimeout = 0;
        info.packageNames = null;

        setServiceInfo(info);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        instance = null;
    }
}
