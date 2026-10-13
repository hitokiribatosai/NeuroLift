package com.neurolift.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class WorkoutRestReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        WorkoutNotifications.restFinished(context, intent.getLongExtra("end", 0));
    }
}
