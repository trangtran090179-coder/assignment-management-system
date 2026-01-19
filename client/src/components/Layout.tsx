import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
    children: React.ReactNode;
    user?: any;
    onLogout?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
    return (
        <div>
            <Header user={user} onLogout={onLogout} />
            <main>{children}</main>
            <Footer />
        </div>
    );
};

export default Layout;