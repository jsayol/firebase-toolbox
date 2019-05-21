import 'reflect-metadata';
import '../polyfills';

import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { ClarityModule } from '@clr/angular';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { NgxLetModule } from '@ngx-utilities/ngx-let';
import { ResizableModule } from 'angular-resizable-element';
import { HttpClientModule } from '@angular/common/http';

// Routing
import { AppRoutingModule } from './app-routing.module';

// Store
import { reducers, metaReducers } from './reducers';
import { effects } from './effects';

// Providers
import { ElectronService } from './providers/electron.service';

// Directives
import { WebviewDirective } from './directives/webview.directive';
import { AutofocusDirective } from './directives/autofocus.directive';

// Pipes
import { AnsiPipe } from './pipes/ansi.pipe';

// General components
import { AppComponent } from './app.component';
import { InitializingComponent } from './components/initializing/initializing.component';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { SideMenuComponent } from './components/side-menu/side-menu.component';
import { HeaderComponent } from './components/header/header.component';
import { PromptModalComponent } from './components/prompt-modal/prompt-modal.component';
import { ShellOutputComponent } from './components/shell-output/shell-output.component';

// Section components
import { SettingsSectionComponent } from './components/sections/settings/settings-section.component';
import { ServeSectionComponent } from './components/sections/serve/serve-section.component';
import { AuthExportSectionComponent } from './components/sections/auth/export/auth-export-section.component';
import { AuthImportSectionComponent } from './components/sections/auth/import/auth-import-section.component';

@NgModule({
  declarations: [
    AppComponent,
    WebviewDirective,
    InitializingComponent,
    LoginComponent,
    HomeComponent,
    SideMenuComponent,
    HeaderComponent,
    SettingsSectionComponent,
    PromptModalComponent,
    AutofocusDirective,
    ShellOutputComponent,
    AnsiPipe,
    ServeSectionComponent,
    AuthExportSectionComponent,
    AuthImportSectionComponent
  ],
  imports: [
    BrowserModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    ClarityModule,
    NgxLetModule,
    ResizableModule,
    HttpClientModule,

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
