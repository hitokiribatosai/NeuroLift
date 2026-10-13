package com.neurolift.app;

import android.app.Notification;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.service.notification.StatusBarNotification;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class WorkoutNotificationsTest {
    private Context context;
    @Before public void setup() throws Exception {
        context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        if (Build.VERSION.SDK_INT >= 33) {
            android.os.ParcelFileDescriptor result = InstrumentationRegistry.getInstrumentation().getUiAutomation()
                .executeShellCommand("pm grant " + context.getPackageName() + " android.permission.POST_NOTIFICATIONS");
            try (java.io.InputStream stream = new android.os.ParcelFileDescriptor.AutoCloseInputStream(result)) { while (stream.read() != -1) {} }
        }
        WorkoutNotifications.clear(context);
    }
    @After public void cleanup() { WorkoutNotifications.clear(context); }
    private Notification notification(int id) throws Exception {
        for (int retry = 0; retry < 100; retry++) {
            for (StatusBarNotification item : context.getSystemService(NotificationManager.class).getActiveNotifications()) {
                if (item.getId() == id) return item.getNotification();
            }
            Thread.sleep(100);
        }
        throw new AssertionError("Missing notification " + id);
    }
    private JSONObject payload(long end) throws Exception {
        return new JSONObject().put("title", "Incline Dumbbell Press").put("body", "Chest · Set 2 of 3")
            .put("restTitle", "Rest · Incline Dumbbell Press").put("readyTitle", "Rest finished").put("restEnd", end);
    }
    private void awaitNotificationCount(int expected) throws Exception {
        for (int retry = 0; retry < 100; retry++) {
            if (context.getSystemService(NotificationManager.class).getActiveNotifications().length == expected) return;
            Thread.sleep(100);
        }
        assertEquals(expected, context.getSystemService(NotificationManager.class).getActiveNotifications().length);
    }
    @Test public void nativeCountdownAndCancellation() throws Exception {
        WorkoutNotifications.update(context, payload(0));
        assertEquals("Incline Dumbbell Press", notification(6101).extras.getString(Notification.EXTRA_TITLE));
        long end = System.currentTimeMillis() + 120000;
        WorkoutNotifications.update(context, payload(end));
        Thread.sleep(150);
        Notification rest = notification(6101);
        assertEquals(end, rest.when);
        assertTrue(rest.extras.getBoolean(Notification.EXTRA_SHOW_CHRONOMETER));
        assertTrue(rest.extras.getBoolean(Notification.EXTRA_CHRONOMETER_COUNT_DOWN));
        assertEquals(Notification.VISIBILITY_PRIVATE, rest.visibility);
        assertNotNull(rest.contentView);
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> {
            android.view.View view = rest.contentView.apply(context, null);
            android.widget.Chronometer timer = view.findViewById(R.id.rest_countdown);
            assertNotNull(timer);
            assertTrue(timer.isCountDown());
            assertTrue(Math.abs(timer.getBase() - android.os.SystemClock.elapsedRealtime() - 120000) < 5000);
        });
        WorkoutNotifications.update(context, payload(end + 30000));
        WorkoutNotifications.restFinished(context, end); // Old alarm must not finish extended rest.
        assertEquals(end + 30000, context.getSharedPreferences("workout_notification", 0).getLong("end", 0));
        WorkoutNotifications.clear(context);
        WorkoutNotifications.restFinished(context, end + 30000); // No resurrection after finishing/resetting.
        awaitNotificationCount(0); // NotificationManager processes cancellation asynchronously.
    }
    @Test public void backgroundRestAlertsOnceAndSkipCancels() throws Exception {
        WorkoutNotifications.foreground = false;
        long end = System.currentTimeMillis() - 1;
        WorkoutNotifications.update(context, payload(end));
        WorkoutNotifications.restFinished(context, end);
        assertEquals("Rest finished", notification(6102).extras.getString(Notification.EXTRA_TITLE));
        assertTrue(context.getSystemService(NotificationManager.class).getNotificationChannel("workout_rest_v2").getSound().toString().endsWith("/raw/neurolift_rest_beeps"));
        assertEquals(0, context.getSharedPreferences("workout_notification", 0).getLong("end", -1));
        WorkoutNotifications.restFinished(context, end);
        WorkoutNotifications.update(context, payload(System.currentTimeMillis() - 1));
        WorkoutNotifications.update(context, payload(0)); // JS expiry must not swallow the background alert.
        assertEquals("Rest finished", notification(6102).extras.getString(Notification.EXTRA_TITLE));
        WorkoutNotifications.update(context, payload(System.currentTimeMillis() + 60000));
        WorkoutNotifications.update(context, payload(0));
        Thread.sleep(150);
        assertEquals(1, context.getSystemService(NotificationManager.class).getActiveNotifications().length);
        assertFalse(notification(6101).extras.getBoolean(Notification.EXTRA_SHOW_CHRONOMETER));
    }

    private String js(MainActivity activity, String script) throws Exception {
        java.util.concurrent.CountDownLatch latch = new java.util.concurrent.CountDownLatch(1);
        java.util.concurrent.atomic.AtomicReference<String> value = new java.util.concurrent.atomic.AtomicReference<>();
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> activity.getBridge().getWebView().evaluateJavascript(script, result -> { value.set(result); latch.countDown(); }));
        assertTrue(latch.await(10, java.util.concurrent.TimeUnit.SECONDS));
        return value.get();
    }
    @Test public void webViewBridgeTracksSavedSessionAndNotificationTap() throws Exception {
        MainActivity activity = (MainActivity) InstrumentationRegistry.getInstrumentation().startActivitySync(
            new Intent(context, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        for (int i = 0; i < 100 && !"true".equals(js(activity, "!!document.querySelector('#root')?.children.length")); i++) Thread.sleep(100);
        String backup = js(activity, "JSON.stringify(Object.fromEntries(['neuroLift_workspace_guest','neuroLift_active_owner','neurolift.android-workout-notifications','neurolift.device-tour.v1'].map(k=>[k,localStorage.getItem(k)])))");
        try {
            js(activity, "localStorage.setItem('neuroLift_active_owner','guest');localStorage.setItem('neurolift.android-workout-notifications','true');localStorage.setItem('neurolift.device-tour.v1',JSON.stringify({mode:'done'}));localStorage.setItem('neuroLift_workspace_guest',JSON.stringify({version:0,dirty:false,data:{neuroLift_hasCompletedOnboarding:'true',neuroLift_userGoal:'strength',neuroLift_tracker_phase:'active',neuroLift_tracker_active_exercises:JSON.stringify([{name:'Incline Dumbbell Press',sets:[{id:'test',weight:20,reps:8,completed:false}]}])}}));location.hash='home';location.reload();");
            Thread.sleep(2000);
            assertEquals("true", js(activity, "window.Capacitor.isPluginAvailable('WorkoutNotification')"));
            Notification notice = notification(6101);
            assertEquals("Incline Dumbbell Press", notice.extras.getString(Notification.EXTRA_TITLE));
            notice.contentIntent.send();
            for (int i = 0; i < 100 && !"\"#tracker\"".equals(js(activity, "location.hash")); i++) Thread.sleep(100);
            assertEquals("\"#tracker\"", js(activity, "location.hash"));
            for (int i = 0; i < 100 && !"true".equals(js(activity, "!!document.querySelector('[aria-label=\"Done — SET 1\"]')")); i++) Thread.sleep(100);
            js(activity, "Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='View details').click()");
            for (int i = 0; i < 100 && !"1".equals(js(activity, "document.querySelectorAll('[role=\"dialog\"]').length")); i++) Thread.sleep(100);
            assertEquals("1", js(activity, "document.querySelectorAll('[role=\"dialog\"]').length"));
            js(activity, "Array.from(document.querySelectorAll('[role=\"dialog\"] button')).find(b=>b.textContent.trim().toLowerCase()==='close').click()");
            for (int i = 0; i < 100 && !"0".equals(js(activity, "document.querySelectorAll('[role=\"dialog\"]').length")); i++) Thread.sleep(100);
            js(activity, "document.querySelector('[aria-label=\"Done — SET 1\"]').click()");
            for (int i = 0; i < 100 && !notification(6101).extras.getBoolean(Notification.EXTRA_SHOW_CHRONOMETER); i++) Thread.sleep(100);
            assertTrue(notification(6101).extras.getBoolean(Notification.EXTRA_CHRONOMETER_COUNT_DOWN));
            assertEquals("0", js(activity, "document.querySelectorAll('[aria-label=\"Workout notification\"]').length"));
            js(activity, "window.dispatchEvent(new Event('neurolift-open-settings'))");
            for (int i = 0; i < 100 && !"true".equals(js(activity, "document.querySelector('[aria-label=\"Workout notification\"] button')?.getAttribute('aria-pressed')==='true'")); i++) Thread.sleep(100);
            assertEquals("true", js(activity, "document.querySelector('[aria-label=\"Workout notification\"] button')?.getAttribute('aria-pressed')==='true'"));
            js(activity, "document.querySelector('[aria-label=\"Workout notification\"] button').click()");
            for (int i = 0; i < 100 && context.getSystemService(NotificationManager.class).getActiveNotifications().length > 0; i++) Thread.sleep(100);
            assertEquals(0, context.getSystemService(NotificationManager.class).getActiveNotifications().length);
        } finally {
            js(activity, "Object.entries(JSON.parse(" + backup + ")).forEach(([k,v])=>v===null?localStorage.removeItem(k):localStorage.setItem(k,v));");
            InstrumentationRegistry.getInstrumentation().runOnMainSync(activity::finish);
            for (int i = 0; i < 100 && !activity.isDestroyed(); i++) Thread.sleep(100);
            assertTrue("Test activity must stop before native-only tests", activity.isDestroyed());
        }
    }
}
