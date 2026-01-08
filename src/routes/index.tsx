import { lazy } from 'react';

const MainLayout = lazy(() => import('~/components/Layout/main.layout'));
const DictationPage = lazy(() => import('~/pages/dictation.page'));
const SettingPage = lazy(() => import('~/pages/setting.page'));
const ArchivePage = lazy(() => import('~/pages/archive.page'));
const AgentPage = lazy(() => import('~/pages/agent.page'));
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
    {
        name: 'Agent',
        icon: '',
        path: '/agent',
        component: AgentPage,
        Layout: null,
    },
    {
        name: 'Market',
        icon: '',
        path: '/market',
        component: lazy(() => import('~/components/market')),
        Layout: null,
    }

];

export default Router;