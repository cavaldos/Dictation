import React from "react";

const HomePage: React.FC = () => {
    return (
        <div className="flex items-center justify-center h-full">
            <div className="text-center text-[rgb(142,142,142)]">
                <h1 className="text-2xl font-semibold text-[rgb(240,240,240)] mb-2">
                    Welcome to Dictation
                </h1>
                <p className="text-sm">
                    Start building your new project here
                </p>
            </div>
        </div>
    );
}

export default HomePage;
