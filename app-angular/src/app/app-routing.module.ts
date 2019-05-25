import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { InitializingComponent } from './components/initializing/initializing.component';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { SettingsSectionComponent } from './components/sections/settings/settings-section.component';
import { ServeSectionComponent } from './components/sections/serve/serve-section.component';
import { AuthExportSectionComponent } from './components/sections/auth/export/auth-export-section.component';
import { AuthImportSectionComponent } from './components/sections/auth/import/auth-import-section.component';
import { DatabaseGetSectionComponent } from './components/sections/database/get/database-get-section.component';
import { DatabaseSetSectionComponent } from './components/sections/database/set/database-set-section.component';
import { DatabaseUpdateSectionComponent } from './components/sections/database/update/database-update-section.component';
import { DatabasePushSectionComponent } from './components/sections/database/push/database-push-section.component';
import { DatabaseRemoveSectionComponent } from './components/sections/database/remove/database-remove-section.component';
import { DatabaseInstancesSectionComponent } from './components/sections/database/instances/database-instances-section.component';
import { DatabaseProfileSectionComponent } from './components/sections/database/profile/database-profile-section.component';
import { FirestoreDeleteSectionComponent } from './components/sections/firestore/delete/firestore-delete-section.component';
import { FirestoreIndexesSectionComponent } from './components/sections/firestore/indexes/firestore-indexes-section.component';
import { HostingDisableSectionComponent } from './components/sections/hosting/disable/hosting-disable-section.component';

const routes: Routes = [
  {
    path: '',
    component: InitializingComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'home/:workspace',
    component: HomeComponent,
    children: [
      {
        path: 'settings',
        component: SettingsSectionComponent
      },
      {
        path: 'serve',
        component: ServeSectionComponent
      },
      {
        path: 'deploy',
        component: InitializingComponent
      },
      // {
      //   path: 'targets',
      //   component: InitializingComponent
      // },
      {
        path: 'auth.export',
        component: AuthExportSectionComponent
      },
      {
        path: 'auth.import',
        component: AuthImportSectionComponent
      },
      {
        path: 'database.get',
        component: DatabaseGetSectionComponent
      },
      {
        path: 'database.set',
        component: DatabaseSetSectionComponent
      },
      {
        path: 'database.update',
        component: DatabaseUpdateSectionComponent
      },
      {
        path: 'database.push',
        component: DatabasePushSectionComponent
      },
      {
        path: 'database.remove',
        component: DatabaseRemoveSectionComponent
      },
      {
        path: 'database.instances',
        component: DatabaseInstancesSectionComponent
      },
      {
        path: 'database.profile',
        component: DatabaseProfileSectionComponent
      },
      // {
      //   path: 'database.settings.get',
      //   component: InitializingComponent
      // },
      // {
      //   path: 'database.settings.set',
      //   component: InitializingComponent
      // },
      {
        path: 'emulators.start',
        component: InitializingComponent
      },
      {
        path: 'emulators.exec',
        component: InitializingComponent
      },
      {
        path: 'emulators.setup',
        component: InitializingComponent
      },
      {
        path: 'firestore.delete',
        component: FirestoreDeleteSectionComponent
      },
      {
        path: 'firestore.indexes',
        component: FirestoreIndexesSectionComponent
      },
      {
        path: 'functions.log',
        component: InitializingComponent
      },
      {
        path: 'functions.delete',
        component: InitializingComponent
      },
      {
        path: 'functions.config.get',
        component: InitializingComponent
      },
      {
        path: 'functions.config.set',
        component: InitializingComponent
      },
      {
        path: 'functions.config.unset',
        component: InitializingComponent
      },
      {
        path: 'functions.config.clone',
        component: InitializingComponent
      },
      {
        path: 'hosting.disable',
        component: HostingDisableSectionComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
