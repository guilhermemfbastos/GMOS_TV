package com.gmos.tv.v2;

import com.getcapacitor.BridgeActivity;

import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AppLauncherPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
