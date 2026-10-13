package com.neurolift.app;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(Bundle state) {
        registerPlugin(WorkoutNotificationPlugin.class);
        super.onCreate(state);
    }
}
