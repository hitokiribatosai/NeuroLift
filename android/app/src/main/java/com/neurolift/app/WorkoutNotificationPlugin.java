package com.neurolift.app;

import android.Manifest;
import android.app.AlarmManager;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.app.NotificationManagerCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(name = "WorkoutNotification", permissions = @Permission(alias = "notifications", strings = {Manifest.permission.POST_NOTIFICATIONS}))
public class WorkoutNotificationPlugin extends Plugin {
    @Override public void load() {
        WorkoutNotifications.foreground = true;
        opened(getActivity().getIntent());
    }
    private void opened(Intent intent) {
        if (intent != null && intent.getBooleanExtra("neuroliftWorkout", false)) {
            intent.removeExtra("neuroliftWorkout");
            notifyListeners("openWorkout", new JSObject(), true);
        }
    }
    @Override protected void handleOnNewIntent(Intent intent) { opened(intent); }
    @Override protected void handleOnResume() {
        WorkoutNotifications.foreground = true;
        notifyListeners("resume", new JSObject());
    }
    @Override protected void handleOnPause() { WorkoutNotifications.foreground = false; }
    @PluginMethod public void status(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", NotificationManagerCompat.from(getContext()).areNotificationsEnabled());
        AlarmManager alarm = (AlarmManager) getContext().getSystemService(android.content.Context.ALARM_SERVICE);
        result.put("exact", Build.VERSION.SDK_INT < 31 || alarm.canScheduleExactAlarms());
        call.resolve(result);
    }
    @PluginMethod public void enable(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 33 && !NotificationManagerCompat.from(getContext()).areNotificationsEnabled()) {
            requestPermissionForAlias("notifications", call, "permissionResult");
        } else status(call);
    }
    @PermissionCallback private void permissionResult(PluginCall call) { status(call); }
    @PluginMethod public void update(PluginCall call) {
        try { WorkoutNotifications.update(getContext(), call.getData()); call.resolve(); }
        catch (Exception error) { call.reject("Unable to update workout notification", error); }
    }
    @PluginMethod public void clear(PluginCall call) { WorkoutNotifications.clear(getContext()); call.resolve(); }
    @PluginMethod public void settings(PluginCall call) {
        boolean exact = Boolean.TRUE.equals(call.getBoolean("exact", false));
        if (Build.VERSION.SDK_INT < 26) {
            getActivity().startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getContext().getPackageName())));
            call.resolve(); return;
        }
        Intent intent = new Intent(exact && Build.VERSION.SDK_INT >= 31
            ? Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM : Settings.ACTION_APP_NOTIFICATION_SETTINGS);
        if (exact && Build.VERSION.SDK_INT >= 31) intent.setData(Uri.parse("package:" + getContext().getPackageName()));
        else intent.putExtra(Settings.EXTRA_APP_PACKAGE, getContext().getPackageName());
        getActivity().startActivity(intent);
        call.resolve();
    }
}
