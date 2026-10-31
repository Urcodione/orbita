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
    private String pendingExport;
    private static final int EXPORT_SAVE=41, IMPORT_SAVE=42;
    public final class SaveFiles {
        @android.webkit.JavascriptInterface public void exportGame(String text) {
            if(text==null||text.length()>2000000)return;
            runOnUiThread(()->{pendingExport=text;android.content.Intent i=new android.content.Intent(android.content.Intent.ACTION_CREATE_DOCUMENT);i.addCategory(android.content.Intent.CATEGORY_OPENABLE);i.setType("application/json");i.putExtra(android.content.Intent.EXTRA_TITLE,"orbita-partida.json");startActivityForResult(i,EXPORT_SAVE);});
        }
        @android.webkit.JavascriptInterface public void importGame() {
            runOnUiThread(()->{android.content.Intent i=new android.content.Intent(android.content.Intent.ACTION_OPEN_DOCUMENT);i.addCategory(android.content.Intent.CATEGORY_OPENABLE);i.setType("application/json");startActivityForResult(i,IMPORT_SAVE);});
        }
    }
    @Override protected void onActivityResult(int request,int result,android.content.Intent data){
        super.onActivityResult(request,result,data);
        if(request!=EXPORT_SAVE&&request!=IMPORT_SAVE)return;
        if(result!=RESULT_OK||data==null||data.getData()==null){pendingExport=null;return;}
        final android.net.Uri uri=data.getData();final String text=pendingExport;pendingExport=null;
        new Thread(()->{try{
            if(request==EXPORT_SAVE){if(text==null)throw new java.io.IOException();try(java.io.OutputStream out=getContentResolver().openOutputStream(uri)){if(out==null)throw new java.io.IOException();out.write(text.getBytes(java.nio.charset.StandardCharsets.UTF_8));}runOnUiThread(()->android.widget.Toast.makeText(this,"Partida exportada.",android.widget.Toast.LENGTH_SHORT).show());}
            else{try(InputStream in=getContentResolver().openInputStream(uri);java.io.ByteArrayOutputStream out=new java.io.ByteArrayOutputStream()){if(in==null)throw new java.io.IOException();byte[] buffer=new byte[8192];int n;while((n=in.read(buffer))!=-1){if(out.size()+n>2000000)throw new java.io.IOException();out.write(buffer,0,n);}final String imported=out.toString("UTF-8");runOnUiThread(()->{if(!isFinishing())game.evaluateJavascript("window.orbitReceiveSave && window.orbitReceiveSave("+org.json.JSONObject.quote(imported)+")",null);});}}
        }catch(Exception e){runOnUiThread(()->android.widget.Toast.makeText(this,"Não foi possível acessar a partida. Tente outro arquivo.",android.widget.Toast.LENGTH_LONG).show());}}).start();
    }
    private static final String ORIGIN = "https://appassets.androidplatform.net/";
    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        game = new WebView(this);
        game.setBackgroundColor(Color.rgb(9,20,30));
        game.getSettings().setJavaScriptEnabled(true);
        game.addJavascriptInterface(new SaveFiles(),"OrbitFiles");
        game.getSettings().setDomStorageEnabled(true);
        game.getSettings().setAllowFileAccess(false);
        game.getSettings().setAllowContentAccess(false);
        game.getSettings().setMixedContentMode(0);
        game.getSettings().setMediaPlaybackRequiresUserGesture(true);
        game.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) { return true; }
            @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                return new WebResourceResponse("text/plain", "UTF-8", new ByteArrayInputStream(new byte[0]));
            }
        });
        FrameLayout viewport = new FrameLayout(this);
        viewport.setBackgroundColor(Color.rgb(9,20,30));
        viewport.addView(game, new FrameLayout.LayoutParams(-1,-1));
        viewport.setOnApplyWindowInsetsListener((view, insets) -> {
            int left, top, right, bottom;
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets safe = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                left=safe.left; top=safe.top; right=safe.right; bottom=safe.bottom;
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
        viewport.requestApplyInsets();
        immersive();
        try (InputStream input = getAssets().open("index.html")) {
            java.io.ByteArrayOutputStream bytes = new java.io.ByteArrayOutputStream();
            byte[] buffer = new byte[8192]; int read;
            while ((read = input.read(buffer)) != -1) bytes.write(buffer,0,read);
            game.loadDataWithBaseURL(ORIGIN, bytes.toString("UTF-8"), "text/html", "UTF-8", null);
        } catch (Exception error) {
            new AlertDialog.Builder(this).setTitle("Não foi possível abrir Órbita")
                .setMessage("Reinstale o APK para restaurar os arquivos do jogo.")
                .setPositiveButton("Fechar",(d,w)->finish()).setCancelable(false).show();
        }
    }
    private void immersive() {
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
            View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION);
    }
    @Override public void onWindowFocusChanged(boolean focused) { super.onWindowFocusChanged(focused); if(focused) immersive(); }
    @Override protected void onPause() { game.onPause(); game.pauseTimers(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); if(game!=null){game.onResume();game.resumeTimers();} }
    @Override public void onBackPressed() {
        game.evaluateJavascript("Boolean(window.orbitApp && window.orbitApp.back && window.orbitApp.back())", result -> {
            if (!"true".equals(result)) new AlertDialog.Builder(this).setTitle("Sair de Órbita?")
                .setMessage("Sua jornada fica salva neste celular.")
                .setNegativeButton("Continuar",null).setPositiveButton("Sair",(d,w)->finish()).show();
        });
    }
    @Override protected void onDestroy() { game.destroy(); super.onDestroy(); }
}
