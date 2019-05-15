import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { InitializingComponent } from './components/initializing/initializing.component';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';

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
    path: 'home',
    component: HomeComponent,
    children: [
      {
        path: 'settings',
        component: InitializingComponent
      },
      {
        path: 'serve',
        component: InitializingComponent
      },
      {
        path: 'deploy',
        component: InitializingComponent
      },
      {
        path: 'targets',
        component: InitializingComponent
      },
      {
        path: 'auth.export',
        component: InitializingComponent
      },
      {
        path: 'auth.import',
        component: InitializingComponent
      },
      {
        path: 'database.get',
        component: InitializingComponent
      },
      {
        path: 'database.set',
        component: InitializingComponent
      },
      {
        path: 'database.update',
        component: InitializingComponent
      },
      {
        path: 'database.push',
        component: InitializingComponent
      },
      {
        path: 'database.remove',
        component: InitializingComponent
      },
      {
        path: 'database.profile',
        component: InitializingComponent
      },
      {
        path: 'database.settings.get',
        component: InitializingComponent
      },
      {
        path: 'database.settings.set',
        component: InitializingComponent
      },
      {
        path: 'emulators.start',
        component: InitializingComponent
      },
      {
        path: 'emulators.exec',
        component: InitializingComponent
      },
      {
        path: 'emulators.setup.firestore',
        component: InitializingComponent
      },
      {
        path: 'emulators.setup.database',
        component: InitializingComponent
      },
      {
        path: 'firestore.delete',
        component: InitializingComponent
      },
      {
        path: 'firestore.indexes',
        component: InitializingComponent
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
        component: InitializingComponent
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
