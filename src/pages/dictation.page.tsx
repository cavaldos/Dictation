import React from 'react';
import MainLayout from '~/components/Layout/main.layout';

import ListTitle from '~/components/Dictation/ListTitle';
import DictationMain from '~/components/Dictation/DictationMain';
import NoteWord from '~/components/Dictation/NoteWord';
const DictationPage: React.FC = () => {

    return (
        <MainLayout
            maincontent={<DictationMain />}
            rightSide={<ListTitle />}
            leftSide={<NoteWord />}
        />

    );
}
export default DictationPage;