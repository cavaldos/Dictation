import { lazy } from 'react';

const MainLayout = lazy(() => import('~/components/Layout/main.layout'));
const DictationPage = lazy(() => import('~/pages/dictation.page'));
const SettingPage = lazy(() => import('~/pages/setting.page'));
const ArchivePage = lazy(() => import('~/pages/archive.page'));
const Router = [
    {
        name: '',
        icon: '',
        path: '/',
        component: DictationPage,
        Layout: null,
    },
    {
        name: 'Setting',
        icon: '',
        path: '/setting',
        component: SettingPage,
        Layout: MainLayout,
    },
    {
        name: 'Archive',
        icon: '',
        path: '/archive',
        component: ArchivePage,
        Layout: null,
    },
    {
        name: 'Carbin',
        icon: '',
        path: '/carbin',
        component: () => <h1>Carbin Page</h1>,
        Layout: MainLayout,
    },

];

export default Router;