package com.orbita.explorer;

import android.app.Activity;
import android.app.AlertDialog;
import android.os.Bundle;
import android.os.Build;
import android.view.WindowInsets;
import android.view.DisplayCutout;
import android.widget.FrameLayout;
import android.graphics.Color;
import android.view.View;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import java.io.ByteArrayInputStream;
import java.io.InputStream;


public final class MainActivity extends Activity {
    private WebView game;
    private FrameLayout viewport;
    private String pendingExport;
    private String pendingImport;
    private boolean pageReady;
    private boolean pickerOpen;
    private AlertDialog exitDialog;
    private boolean backPending;
    private static final int EXPORT_SAVE=41, IMPORT_SAVE=42;
    private static final String ORIGIN = "https://appassets.androidplatform.net/";
    private static final String PAGE = ORIGIN + "index.html";
    public final class SaveFiles {
        @android.webkit.JavascriptInterface public void exportGame(String text) {
            if(text==null||text.length()>2000000)return;
            runOnUiThread(()->{if(pickerOpen||isDestroyed())return;pickerOpen=true;pendingExport=text;android.content.Intent i=new android.content.Intent(android.content.Intent.ACTION_CREATE_DOCUMENT);i.addCategory(android.content.Intent.CATEGORY_OPENABLE);i.setType("application/json");i.putExtra(android.content.Intent.EXTRA_TITLE,"orbita-partida.json");try{startActivityForResult(i,EXPORT_SAVE);}catch(android.content.ActivityNotFoundException e){pickerOpen=false;pendingExport=null;android.widget.Toast.makeText(MainActivity.this,"Nenhum app de arquivos disponível.",android.widget.Toast.LENGTH_LONG).show();}});
        }
        @android.webkit.JavascriptInterface public void importGame() {
            runOnUiThread(()->{if(pickerOpen||isDestroyed())return;pickerOpen=true;android.content.Intent i=new android.content.Intent(android.content.Intent.ACTION_OPEN_DOCUMENT);i.addCategory(android.content.Intent.CATEGORY_OPENABLE);i.setType("application/json");try{startActivityForResult(i,IMPORT_SAVE);}catch(android.content.ActivityNotFoundException e){pickerOpen=false;pendingExport=null;android.widget.Toast.makeText(MainActivity.this,"Nenhum app de arquivos disponível.",android.widget.Toast.LENGTH_LONG).show();}});
        }
    }
    @Override protected void onSaveInstanceState(Bundle out){
        super.onSaveInstanceState(out);
        // The document picker can outlive this Activity; keep the export text so the result still has something to write.
        if(pendingExport!=null)out.putString("pendingExport",pendingExport);
        out.putBoolean("pickerOpen",pickerOpen);
    }
    @Override protected void onActivityResult(int request,int result,android.content.Intent data){
        super.onActivityResult(request,result,data);
        if(request!=EXPORT_SAVE&&request!=IMPORT_SAVE)return;
        pickerOpen=false;
        if(result!=RESULT_OK||data==null||data.getData()==null){pendingExport=null;return;}
        final android.net.Uri uri=data.getData();final String text=pendingExport;pendingExport=null;
        new Thread(()->{try{
            if(request==EXPORT_SAVE){if(text==null)throw new java.io.IOException();try(java.io.OutputStream out=getContentResolver().openOutputStream(uri,"wt")){if(out==null)throw new java.io.IOException();out.write(text.getBytes(java.nio.charset.StandardCharsets.UTF_8));}runOnUiThread(()->android.widget.Toast.makeText(this,"Partida exportada.",android.widget.Toast.LENGTH_SHORT).show());}
            else{try(InputStream in=getContentResolver().openInputStream(uri);java.io.ByteArrayOutputStream out=new java.io.ByteArrayOutputStream()){if(in==null)throw new java.io.IOException();byte[] buffer=new byte[8192];int n;while((n=in.read(buffer))!=-1){if(out.size()+n>2000000)throw new java.io.IOException();out.write(buffer,0,n);}final String imported=out.toString("UTF-8");runOnUiThread(()->{pendingImport=imported;deliverImport();});}}
        }catch(Exception e){runOnUiThread(()->{if(!isDestroyed())android.widget.Toast.makeText(this,"Não foi possível acessar a partida. Tente outro arquivo.",android.widget.Toast.LENGTH_LONG).show();});}}).start();
    }
    // An import can finish while the page is still loading (or after the Activity was recreated): hold it until the game is ready.
    private void deliverImport(){
        if(pendingImport==null||game==null||!pageReady||isFinishing()||isDestroyed())return;
        final String text=pendingImport;pendingImport=null;
        game.evaluateJavascript("window.orbitReceiveSave && window.orbitReceiveSave("+org.json.JSONObject.quote(text)+")",null);
    }
    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        if(saved!=null){pendingExport=saved.getString("pendingExport");pickerOpen=saved.getBoolean("pickerOpen",false);}
        viewport = new FrameLayout(this);
        viewport.setBackgroundColor(Color.rgb(9,20,30));
        viewport.setOnApplyWindowInsetsListener((view, insets) -> {
            int left, top, right, bottom;
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets safe = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                android.graphics.Insets ime = insets.getInsets(WindowInsets.Type.ime());
                left=safe.left; top=safe.top; right=safe.right; bottom=Math.max(safe.bottom, ime.bottom);
            } else {
                left=insets.getSystemWindowInsetLeft(); top=insets.getSystemWindowInsetTop();
                right=insets.getSystemWindowInsetRight(); bottom=insets.getSystemWindowInsetBottom();
                if (Build.VERSION.SDK_INT >= 28) {
                    DisplayCutout cutout=insets.getDisplayCutout();
                    if(cutout!=null){left=Math.max(left,cutout.getSafeInsetLeft());top=Math.max(top,cutout.getSafeInsetTop());right=Math.max(right,cutout.getSafeInsetRight());bottom=Math.max(bottom,cutout.getSafeInsetBottom());}
                }
            }
            view.setPadding(left,top,right,bottom);
            return insets;
        });
        setContentView(viewport);
        registerBack();
        viewport.requestApplyInsets();
        immersive();
        try (InputStream probe = getAssets().open("index.html")) {
            createGame();
        } catch (Exception error) {
            new AlertDialog.Builder(this).setTitle("Não foi possível abrir Órbita")
                .setMessage("Reinstale o APK para restaurar os arquivos do jogo.")
                .setPositiveButton("Fechar",(d,w)->finish()).setCancelable(false).show();
        }
    }
    private void createGame() {
        pageReady = false;
        game = new WebView(this);
        game.setBackgroundColor(Color.rgb(9,20,30));
        game.getSettings().setJavaScriptEnabled(true);
        game.addJavascriptInterface(new SaveFiles(),"OrbitFiles");
        game.getSettings().setDomStorageEnabled(true);
        game.getSettings().setAllowFileAccess(false);
        game.getSettings().setAllowContentAccess(false);
        game.getSettings().setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        game.getSettings().setMediaPlaybackRequiresUserGesture(true);
        game.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) { return true; }
            @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                // Stream the single game page straight from the APK. Loading it as one Java String costs
                // ~27 MB of UTF-16 plus copies; the origin is unchanged, so existing saves are kept.
                if (PAGE.equals(r.getUrl().toString())) {
                    try { return new WebResourceResponse("text/html", "UTF-8", getAssets().open("index.html")); }
                    catch (java.io.IOException ignored) { }
                }
                return new WebResourceResponse("text/plain", "UTF-8", new ByteArrayInputStream(new byte[0]));
            }
            @Override public void onPageFinished(WebView v, String url) { pageReady = true; deliverImport(); }
            @Override public boolean onRenderProcessGone(WebView v, android.webkit.RenderProcessGoneDetail detail) {
                // The renderer was killed (usually memory pressure). Rebuild the WebView instead of letting the app crash;
                // progress is already in localStorage because the game saves after every action.
                if (v != game) return true;
                viewport.removeView(game);
                game.destroy();
                game = null;
                if (!isFinishing() && !isDestroyed()) createGame();
                return true;
            }
        });
        viewport.addView(game, 0, new FrameLayout.LayoutParams(-1,-1));
        game.loadUrl(PAGE);
    }
    private void immersive() {
        if (Build.VERSION.SDK_INT >= 30) {
            android.view.WindowInsetsController bars = getWindow().getInsetsController();
            if (bars != null) {
                bars.hide(WindowInsets.Type.systemBars());
                bars.setSystemBarsBehavior(android.view.WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
                View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION);
        }
    }
    @Override public void onWindowFocusChanged(boolean focused) { super.onWindowFocusChanged(focused); if(focused) immersive(); }
    @Override protected void onPause() { if(game!=null){game.onPause(); game.pauseTimers();} super.onPause(); }
    @Override protected void onResume() { super.onResume(); if(game!=null){game.onResume();game.resumeTimers();} }
    // Android 13+ delivers Back through OnBackInvokedCallback (the manifest opts in, and apps targeting Android 16 no
    // longer receive onBackPressed or KEYCODE_BACK). Older versions still call onBackPressed. Both lead to goBack().
    private void registerBack() {
        if (Build.VERSION.SDK_INT >= 33)
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::goBack);
    }
    @Override public void onBackPressed() { goBack(); }
    private void goBack() {
        if (game == null) { finish(); return; }
        if (backPending || (exitDialog != null && exitDialog.isShowing())) return;
        backPending = true;
        game.evaluateJavascript("Boolean(window.orbitApp && window.orbitApp.back && window.orbitApp.back())", result -> {
            backPending = false;
            if ("true".equals(result) || isFinishing() || isDestroyed()) return;
            exitDialog = new AlertDialog.Builder(this).setTitle("Sair de Órbita?")
                .setMessage("Sua jornada fica salva neste celular.")
                .setNegativeButton("Continuar",null).setPositiveButton("Sair",(d,w)->finish()).show();
        });
    }
    @Override protected void onDestroy() {
        if (exitDialog != null) exitDialog.dismiss();
        if (game != null) { viewport.removeView(game); game.destroy(); game = null; }
        super.onDestroy();
    }
}
