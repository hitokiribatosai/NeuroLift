package com.neurolift.app;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.SystemClock;
import android.media.AudioAttributes;
import android.net.Uri;
import android.widget.RemoteViews;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import org.json.JSONObject;

final class WorkoutNotifications {
    static boolean foreground = false;
    private static final int WORKOUT = 6101, REST = 6102;
    private static final String ONGOING = "workout_session_v1", ALERT = "workout_rest_v2";
    private static Uri sound(Context c) { return Uri.parse("android.resource://" + c.getPackageName() + "/raw/neurolift_rest_beeps"); }
    private static SharedPreferences prefs(Context c) { return c.getSharedPreferences("workout_notification", Context.MODE_PRIVATE); }
    private static AlarmManager alarms(Context c) { return (AlarmManager)c.getSystemService(Context.ALARM_SERVICE); }
    private static PendingIntent alarmIntent(Context c, long end) {
        return PendingIntent.getBroadcast(c, REST, new Intent(c, WorkoutRestReceiver.class).putExtra("end", end), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
    private static PendingIntent openIntent(Context c) {
        return PendingIntent.getActivity(c, WORKOUT, new Intent(c, MainActivity.class)
            .putExtra("neuroliftWorkout", true).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP),
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
    private static void channels(Context c) {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationManager manager = c.getSystemService(NotificationManager.class);
            manager.createNotificationChannel(new NotificationChannel(ONGOING, "Workout session", NotificationManager.IMPORTANCE_LOW));
            // Channel sounds are immutable. Migrate without overriding an existing mute.
            NotificationChannel old = manager.getNotificationChannel("workout_rest_v1");
            NotificationChannel alert = new NotificationChannel(ALERT, "Rest finished",
                old == null ? NotificationManager.IMPORTANCE_DEFAULT : old.getImportance());
            alert.setSound(old != null && old.getSound() == null ? null : sound(c),
                new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION).build());
            alert.enableVibration(old == null || old.shouldVibrate());
            manager.createNotificationChannel(alert);
        }
    }
    private static NotificationCompat.Builder builder(Context c, String channel) {
        NotificationCompat.Builder result = new NotificationCompat.Builder(c, channel)
            .setSmallIcon(R.drawable.ic_stat_neurolift).setContentIntent(openIntent(c))
            .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
            .setPublicVersion(new NotificationCompat.Builder(c, channel).setSmallIcon(R.drawable.ic_stat_neurolift).setContentTitle("NeuroLift").build());
        if (Build.VERSION.SDK_INT >= 26) result.setTimeoutAfter(12 * 60 * 60 * 1000L);
        return result;
    }
    private static void show(Context c, JSONObject data) {
        if (!NotificationManagerCompat.from(c).areNotificationsEnabled()) return;
        channels(c);
        long end = data.optLong("restEnd");
        boolean resting = end > System.currentTimeMillis();
        String title = resting ? data.optString("restTitle") : data.optString("title");
        NotificationCompat.Builder b = builder(c, ONGOING).setContentTitle(title)
            .setContentText(data.optString("body")).setStyle(new NotificationCompat.BigTextStyle().bigText(data.optString("body")))
            .setOngoing(true).setOnlyAlertOnce(true).setSilent(true).setShowWhen(resting)
            .setCategory(NotificationCompat.CATEGORY_PROGRESS);
        if (resting) {
            b.setWhen(end).setUsesChronometer(true).setChronometerCountDown(true);
            RemoteViews view = new RemoteViews(c.getPackageName(), R.layout.workout_rest_notification);
            view.setTextViewText(R.id.rest_title, title);
            view.setTextViewText(R.id.rest_body, data.optString("body"));
            // Android renders the ticking clock even with the WebView suspended.
            view.setChronometer(R.id.rest_countdown, SystemClock.elapsedRealtime() + end - System.currentTimeMillis(), null, true);
            view.setBoolean(R.id.rest_countdown, "setCountDown", true);
            b.setStyle(new NotificationCompat.DecoratedCustomViewStyle())
                .setCustomContentView(view).setCustomBigContentView(view);
        }
        NotificationManagerCompat.from(c).notify(WORKOUT, b.build());
    }
    static synchronized void update(Context c, JSONObject data) throws Exception {
        if (!NotificationManagerCompat.from(c).areNotificationsEnabled()) { clear(c); return; }
        long end = data.optLong("restEnd");
        long oldEnd = prefs(c).getLong("end", 0);
        // A still-running background WebView can observe expiry before AlarmManager.
        // Deliver once before cancelling that alarm, rather than losing the alert.
        boolean completedRest = oldEnd > 0 && oldEnd <= System.currentTimeMillis() && end == 0;
        if (completedRest) restFinished(c, oldEnd);
        boolean exact = Build.VERSION.SDK_INT < 31 || alarms(c).canScheduleExactAlarms();
        boolean changedPermission = prefs(c).getBoolean("exact", false) != exact;
        prefs(c).edit().putString("data", data.toString()).putLong("end", end).putBoolean("exact", exact).apply();
        if (oldEnd != end || changedPermission) {
            alarms(c).cancel(alarmIntent(c, oldEnd));
            if (!completedRest) NotificationManagerCompat.from(c).cancel(REST);
            if (end > System.currentTimeMillis()) {
                PendingIntent pending = alarmIntent(c, end);
                try {
                    if (exact) alarms(c).setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, end, pending);
                    else alarms(c).setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, end, pending);
                } catch (SecurityException revoked) { alarms(c).setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, end, pending); }
            }
        }
        show(c, data);
    }
    static synchronized void restFinished(Context c, long expectedEnd) {
        if (expectedEnd <= 0 || prefs(c).getLong("end", 0) != expectedEnd || System.currentTimeMillis() < expectedEnd) return;
        try {
            JSONObject data = new JSONObject(prefs(c).getString("data", "{}"));
            prefs(c).edit().putLong("end", 0).apply();
            data.put("restEnd", 0);
            show(c, data);
            if (!foreground && NotificationManagerCompat.from(c).areNotificationsEnabled()) {
                Notification notification = builder(c, ALERT).setContentTitle(data.optString("readyTitle"))
                    .setContentText(data.optString("body")).setAutoCancel(true)
                    .setSound(sound(c)).setDefaults(Notification.DEFAULT_VIBRATE).build();
                NotificationManagerCompat.from(c).notify(REST, notification);
            }
        } catch (Exception ignored) { clear(c); }
    }
    static synchronized void clear(Context c) {
        alarms(c).cancel(alarmIntent(c, 0));
        prefs(c).edit().clear().apply();
        NotificationManagerCompat.from(c).cancel(WORKOUT);
        NotificationManagerCompat.from(c).cancel(REST);
    }
}
