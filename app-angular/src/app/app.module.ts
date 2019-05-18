import 'reflect-metadata';
import '../polyfills';

import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { NgxLetModule } from '@ngx-utilities/ngx-let';
import { ClarityModule } from '@clr/angular';

import { reducers, metaReducers } from './reducers';
import { effects } from './effects';
import { AppRoutingModule } from './app-routing.module';
import { ElectronService } from './providers/electron.service';
import { WebviewDirective } from './directives/webview.directive';
import { AutofocusDirective } from './directives/autofocus.directive';
import { AppComponent } from './app.component';
import { InitializingComponent } from './components/initializing/initializing.component';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { SideMenuComponent } from './components/side-menu/side-menu.component';
import { HeaderComponent } from './components/header/header.component';
import { SettingsModuleComponent } from './components/modules/settings-module/settings-module.component';
import { PromptModalComponent } from './components/prompt-modal/prompt-modal.component';
import { ShellOutputComponent } from './components/shell-output/shell-output.component';
import { AnsiPipe } from './pipes/ansi.pipe';

@NgModule({
  declarations: [
    AppComponent,
    WebviewDirective,
    InitializingComponent,
    LoginComponent,
    HomeComponent,
    SideMenuComponent,
    HeaderComponent,
    SettingsModuleComponent,
    PromptModalComponent,
    AutofocusDirective,
    ShellOutputComponent,
    AnsiPipe
  ],
  imports: [
    BrowserModule,
    RouterModule,
    FormsModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    ClarityModule,
    NgxLetModule,

    StoreModule.forRoot(reducers, { metaReducers }),
    EffectsModule.forRoot(effects)
  ],
  providers: [
    ElectronService
    // TODO: implement a RouteReuseStrategy to cache views
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
