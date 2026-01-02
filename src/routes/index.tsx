import { lazy } from 'react';

const MainLayout = lazy(() => import('~/components/Layout/main.layout'));
const HomePage = lazy(() => import('~/pages/home.page'));
const SettingPage = lazy(() => import('~/pages/setting.page'));
const Router = [
    {
        name: 'Dashboard',
        icon: '',
        path: '/',
        component: HomePage,
        Layout: MainLayout,
    },
    {
        name: 'Setting',
        icon: '',
        path: '/setting',
        component: SettingPage,
        Layout: MainLayout,
    },

];

export default Router;