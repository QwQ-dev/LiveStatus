package me.qwqdev.livestatus.service;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import com.google.gson.Gson;
import lombok.Getter;
import me.qwqdev.livestatus.MainActivity;
import me.qwqdev.livestatus.R;
import me.qwqdev.livestatus.model.Status;
import me.qwqdev.livestatus.util.ScreenHelper;
import me.qwqdev.livestatus.util.SettingsManager;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.jetbrains.annotations.NotNull;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

public class StatusReporterService extends Service {
    private static final String TAG = "StatusReporterService";
    private static final String CHANNEL_ID = "livestatus_channel";
    private static final int NOTIFICATION_ID = 1;
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");
    private static final long WAKELOCK_TIMEOUT_MS = 10 * 60 * 1000L; // 10 minutes

    @Getter
    private static volatile boolean serviceRunning = false;

    private Handler handler;
    private Runnable reportRunnable;
    private OkHttpClient httpClient;
    private Gson gson;
    private SettingsManager settingsManager;
    private ScreenHelper screenHelper;
    private PowerManager.WakeLock wakeLock;
    private boolean isRunning = false;

    @Override
    public void onCreate() {
        super.onCreate();
        serviceRunning = true;

        handler = new Handler(Looper.getMainLooper());
        httpClient = new OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .writeTimeout(10, TimeUnit.SECONDS)
                .readTimeout(10, TimeUnit.SECONDS)
                .build();
        gson = new Gson();
        settingsManager = new SettingsManager(this);
        screenHelper = new ScreenHelper(this);

        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (powerManager != null) {
            wakeLock = powerManager.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK,
                    "LiveStatus::StatusReporterWakeLock"
            );
            wakeLock.acquire(WAKELOCK_TIMEOUT_MS);
        }

        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        startForeground(NOTIFICATION_ID, createNotification("Status reporter is running"));
        startReporting();
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        serviceRunning = false;
        stopReporting();
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        Intent restartIntent = new Intent(getApplicationContext(), StatusReporterService.class);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(restartIntent);
        } else {
            startService(restartIntent);
        }

        super.onTaskRemoved(rootIntent);
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "LiveStatus Service",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Keeps the status reporter running in the background");

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification createNotification(String contentText) {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                notificationIntent,
                PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("LiveStatus")
                .setContentText(contentText)
                .setSmallIcon(R.drawable.ic_launcher_foreground)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_SERVICE)
                .build();
    }

    private void updateNotification(String contentText) {
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, createNotification(contentText));
        }
    }

    private void startReporting() {
        if (isRunning) {
            return;
        }

        isRunning = true;

        reportRunnable = new Runnable() {
            @Override
            public void run() {
                if (!isRunning) {
                    return;
                }

                if (wakeLock != null && wakeLock.isHeld()) {
                    wakeLock.acquire(WAKELOCK_TIMEOUT_MS);
                }

                reportStatus();
                int interval = settingsManager.getUpdateIntervalSecs();
                handler.postDelayed(this, interval * 1000L);
            }
        };

        handler.post(reportRunnable);
    }

    private void stopReporting() {
        isRunning = false;
        if (handler != null && reportRunnable != null) {
            handler.removeCallbacks(reportRunnable);
        }
    }

    private void reportStatus() {
        sendStatusToServer(getCurrentStatus());
    }

    private Status getCurrentStatus() {
        if (!screenHelper.isScreenOn()) {
            return Status.screenOff();
        }

        if (AppDetectorService.isServiceRunning()) {
            String packageName = AppDetectorService.getCurrentPackageName();
            String appName = AppDetectorService.getCurrentAppName();
            if (packageName != null && appName != null) {
                return new Status(packageName, appName);
            }
        }

        return Status.na();
    }

    private void sendStatusToServer(Status status) {
        String url = settingsManager.getUrl();
        String authKey = settingsManager.getAuthKey();

        if (url == null || url.isEmpty() || authKey == null || authKey.isEmpty()) {
            Log.w(TAG, "Server URL or auth key not configured");
            return;
        }

        String json = gson.toJson(status);
        RequestBody body = RequestBody.create(json, JSON);

        Request request = new Request.Builder()
                .url(url)
                .put(body)
                .addHeader("Authorization", authKey)
                .build();

        httpClient.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(@NotNull Call call, @NotNull IOException e) {
                Log.e(TAG, "Failed to send status: " + e.getMessage());
                handler.post(() -> updateNotification("Connection error"));
            }

            @Override
            public void onResponse(@NotNull Call call, @NotNull Response response) {
                if (response.isSuccessful()) {
                    Log.i(TAG, "Sent status: " + status);
                    handler.post(() -> updateNotification("Reporting: " + status.getAppName()));
                } else {
                    Log.e(TAG, "Server returned error: " + response.code());
                    handler.post(() -> updateNotification("Server error: " + response.code()));
                }

                response.close();
            }
        });
    }
}
