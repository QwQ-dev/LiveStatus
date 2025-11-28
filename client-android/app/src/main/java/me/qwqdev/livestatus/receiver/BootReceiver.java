package me.qwqdev.livestatus.receiver;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;
import me.qwqdev.livestatus.service.AppDetectorService;
import me.qwqdev.livestatus.service.StatusReporterService;
import me.qwqdev.livestatus.util.SettingsManager;

public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "BootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();

        if (Intent.ACTION_BOOT_COMPLETED.equals(action) ||
                Intent.ACTION_LOCKED_BOOT_COMPLETED.equals(action) ||
                "android.intent.action.QUICKBOOT_POWERON".equals(action) ||
                "com.htc.intent.action.QUICKBOOT_POWERON".equals(action)) {

            Log.i(TAG, "Boot completed, checking if service should start...");

            SettingsManager settingsManager = new SettingsManager(context);

            if (!settingsManager.isServiceEnabled()) {
                Log.i(TAG, "Service was not enabled by user, skipping auto-start");
                return;
            }

            if (!settingsManager.isConfigured()) {
                Log.w(TAG, "Service not configured, skipping auto-start");
                return;
            }

            if (!AppDetectorService.isServiceEnabled(context)) {
                Log.w(TAG, "Accessibility service not enabled, skipping auto-start");
                return;
            }

            Log.i(TAG, "Starting StatusReporterService on boot");
            startStatusService(context);
        }
    }

    private void startStatusService(Context context) {
        Intent serviceIntent = new Intent(context, StatusReporterService.class);

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
            Log.i(TAG, "StatusReporterService started successfully");
        } catch (Exception e) {
            Log.e(TAG, "Failed to start StatusReporterService: " + e.getMessage());
        }
    }
}
