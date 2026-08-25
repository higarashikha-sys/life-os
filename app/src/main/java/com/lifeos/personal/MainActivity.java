package com.lifeos.personal;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import android.webkit.JavascriptInterface;
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
    private WebView webView;
    private String pendingExportJson;
    private String pendingAiExportText;

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this); setContentView(webView);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true); settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true); settings.setAllowFileAccess(true); settings.setAllowContentAccess(true);
        webView.setWebViewClient(new WebViewClient() {
            @Override public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                try (InputStream in = getAssets().open("ai_export.js")) {
                    ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                    byte[] tmp = new byte[8192];
                    int n;
                    while ((n = in.read(tmp)) > 0) buffer.write(tmp, 0, n);
                    String script = new String(buffer.toByteArray(), StandardCharsets.UTF_8);
                    view.evaluateJavascript(script, null);
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "AI出力機能の読み込みに失敗しました", Toast.LENGTH_LONG).show();
                }
            }
        });
        webView.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");
        webView.loadUrl("file:///android_asset/index.html");
    }

    public class AndroidBridge {
        @JavascriptInterface public void toast(final String message) { runOnUiThread(() -> Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show()); }

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
                String b64 = Base64.encodeToString(buffer.toByteArray(), Base64.NO_WRAP);
                webView.evaluateJavascript("window.receiveImportedBackupBase64('" + b64 + "')", null);
            } catch (Exception e) {
                Toast.makeText(this, "読み込みに失敗しました", Toast.LENGTH_LONG).show();
            }
        }
    }
}
