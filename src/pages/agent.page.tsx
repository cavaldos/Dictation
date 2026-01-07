import React from "react";
import ChatBot from "~/components/Agent/ChatBot";
import HandleContent from "~/components/Agent/HandleContent";
import MainLayout from "~/components/Layout/main.layout";

const AgentPage: React.FC = () => {
    return <>
        <MainLayout
            leftSide={null}
            maincontent={<HandleContent />}
            rightSide={<ChatBot />}
        />
    </>;
}
export default AgentPage;