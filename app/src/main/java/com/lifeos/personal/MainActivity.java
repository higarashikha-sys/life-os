package com.lifeos.personal;

import android.app.Activity;
import android.app.backup.BackupManager;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class MainActivity extends Activity {
    private static final int REQ_EXPORT = 2001;
    private static final int REQ_IMPORT = 2002;
    private static final int REQ_EXPORT_AI = 2003;
    private static final String PREFS_NAME = "lifeos_state";
    private static final String PREFS_STATE_KEY = "state_json";

    private WebView webView;
    private String pendingExportJson;
    private String pendingAiExportText;

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);

        // JavaScript の alert/confirm を Android WebView 上で正しく表示する。
        // Life / Works の削除確認は confirm() を使用しているため必須。
        webView.setWebChromeClient(new WebChromeClient());

        webView.setWebViewClient(new WebViewClient() {
            @Override public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                injectAsset(view, "native_state_patch.js", "履歴保存機能の読み込みに失敗しました");
                injectAsset(view, "inbox_delete.js", "Inbox削除機能の読み込みに失敗しました");
            }
        });
        webView.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");
        webView.loadUrl("file:///android_asset/index.html");
    }

    private void injectAsset(WebView view, String assetName, String errorMessage) {
        try (InputStream in = getAssets().open(assetName)) {
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            byte[] tmp = new byte[8192];
            int n;
            while ((n = in.read(tmp)) > 0) buffer.write(tmp, 0, n);
            String script = new String(buffer.toByteArray(), StandardCharsets.UTF_8);
            view.evaluateJavascript(script, null);
        } catch (Exception e) {
            Toast.makeText(MainActivity.this, errorMessage, Toast.LENGTH_LONG).show();
        }
    }

    private SharedPreferences statePrefs() {
        return getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
    }

    private void signalBackupChanged() {
        try { new BackupManager(this).dataChanged(); } catch (Exception ignored) {}
    }

    public class AndroidBridge {
        @JavascriptInterface public void toast(final String message) {
            runOnUiThread(() -> Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show());
        }

        @JavascriptInterface public String getStateJson() {
            return statePrefs().getString(PREFS_STATE_KEY, "");
        }

        @JavascriptInterface public void saveStateJson(final String json) {
            if (json == null || json.trim().isEmpty()) return;
            statePrefs().edit().putString(PREFS_STATE_KEY, json).apply();
            signalBackupChanged();
        }

        @JavascriptInterface public void exportBackup(final String json) { runOnUiThread(() -> {
            pendingExportJson = json;
            Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
            i.addCategory(Intent.CATEGORY_OPENABLE);
            i.setType("application/json");
            String date = new SimpleDateFormat("yyyyMMdd_HHmm", Locale.US).format(new Date());
            i.putExtra(Intent.EXTRA_TITLE, "LifeOS_backup_" + date + ".json");
            startActivityForResult(i, REQ_EXPORT);
        }); }

        @JavascriptInterface public void exportForAI(final String text) { runOnUiThread(() -> {
            pendingAiExportText = text;
            Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
            i.addCategory(Intent.CATEGORY_OPENABLE);
            i.setType("text/plain");
            String date = new SimpleDateFormat("yyyyMMdd_HHmm", Locale.US).format(new Date());
            i.putExtra(Intent.EXTRA_TITLE, "LifeOS_for_ChatGPT_" + date + ".md");
            startActivityForResult(i, REQ_EXPORT_AI);
        }); }

        @JavascriptInterface public void importBackup() { runOnUiThread(() -> {
            Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
            i.addCategory(Intent.CATEGORY_OPENABLE);
            i.setType("application/json");
            startActivityForResult(i, REQ_IMPORT);
        }); }
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (resultCode != RESULT_OK || data == null || data.getData() == null) return;
        Uri uri = data.getData();

        if (requestCode == REQ_EXPORT) {
            try (OutputStream out = getContentResolver().openOutputStream(uri)) {
                if (out != null && pendingExportJson != null) {
                    out.write(pendingExportJson.getBytes(StandardCharsets.UTF_8));
                    out.flush();
                    Toast.makeText(this, "バックアップを書き出しました", Toast.LENGTH_SHORT).show();
                }
            } catch (Exception e) {
                Toast.makeText(this, "書き出しに失敗しました", Toast.LENGTH_LONG).show();
            }
            pendingExportJson = null;
        } else if (requestCode == REQ_EXPORT_AI) {
            try (OutputStream out = getContentResolver().openOutputStream(uri)) {
                if (out != null && pendingAiExportText != null) {
                    out.write(pendingAiExportText.getBytes(StandardCharsets.UTF_8));
                    out.flush();
                    Toast.makeText(this, "ChatGPT用ファイルを書き出しました", Toast.LENGTH_SHORT).show();
                }
            } catch (Exception e) {
                Toast.makeText(this, "書き出しに失敗しました", Toast.LENGTH_LONG).show();
            }
            pendingAiExportText = null;
        } else if (requestCode == REQ_IMPORT) {
            try (InputStream in = getContentResolver().openInputStream(uri)) {
                if (in == null) return;
                ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                byte[] tmp = new byte[8192];
                int n;
                while ((n = in.read(tmp)) > 0) buffer.write(tmp, 0, n);
                String json = new String(buffer.toByteArray(), StandardCharsets.UTF_8);
                statePrefs().edit().putString(PREFS_STATE_KEY, json).apply();
                signalBackupChanged();
                String b64 = Base64.encodeToString(json.getBytes(StandardCharsets.UTF_8), Base64.NO_WRAP);
                webView.evaluateJavascript("window.receiveImportedBackupBase64('" + b64 + "')", null);
            } catch (Exception e) {
                Toast.makeText(this, "読み込みに失敗しました", Toast.LENGTH_LONG).show();
            }
        }
    }
}
