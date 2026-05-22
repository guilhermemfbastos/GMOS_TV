package com.gmos.tv.v2;

import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.util.Base64;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.util.List;

@CapacitorPlugin(name = "AppLauncherPlugin")
public class AppLauncherPlugin extends Plugin {

    @PluginMethod
    public void getInstalledApps(PluginCall call) {
        PackageManager pm = getContext().getPackageManager();
        List<ApplicationInfo> apps = pm.getInstalledApplications(PackageManager.GET_META_DATA);

        JSArray appsArray = new JSArray();

        for (ApplicationInfo app : apps) {
            Intent launchIntent = pm.getLaunchIntentForPackage(app.packageName);
            if (launchIntent != null && !app.packageName.equals(getContext().getPackageName())) {
                JSObject appObj = new JSObject();
                appObj.put("name", app.loadLabel(pm).toString());
                appObj.put("packageName", app.packageName);

                Drawable icon = app.loadIcon(pm);
                String base64Icon = getBase64FromDrawable(icon);
                if (base64Icon != null) {
                    appObj.put("icon", base64Icon);
                }

                appsArray.put(appObj);
            }
        }

        JSObject ret = new JSObject();
        ret.put("apps", appsArray);
        call.resolve(ret);
    }

    @PluginMethod
    public void launchApp(PluginCall call) {
        String packageName = call.getString("packageName");
        if (packageName == null) {
            call.reject("Must provide a packageName");
            return;
        }

        Intent launchIntent = getContext().getPackageManager().getLaunchIntentForPackage(packageName);
        if (launchIntent != null) {
            getContext().startActivity(launchIntent);
            call.resolve();
        } else {
            call.reject("App not found or cannot be launched");
        }
    }

    @PluginMethod
    public void openSettings(PluginCall call) {
        Intent intent = new Intent(android.provider.Settings.ACTION_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        if (intent.resolveActivity(getContext().getPackageManager()) != null) {
            getContext().startActivity(intent);
            call.resolve();
        } else {
            call.reject("Settings not found");
        }
    }

    private String getBase64FromDrawable(Drawable drawable) {
        try {
            Bitmap bitmap;
            if (drawable instanceof BitmapDrawable) {
                bitmap = ((BitmapDrawable) drawable).getBitmap();
            } else {
                int width = Math.max(1, drawable.getIntrinsicWidth());
                int height = Math.max(1, drawable.getIntrinsicHeight());
                bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
                Canvas canvas = new Canvas(bitmap);
                drawable.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
                drawable.draw(canvas);
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream);
            byte[] byteArray = outputStream.toByteArray();
            return Base64.encodeToString(byteArray, Base64.NO_WRAP);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
