import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import NavbarLegacy from './NavbarLegacy';
import NavigationIsland from './NavigationIsland';

const Navbar = () => {
  const { isAuthenticated } = useAuth();

  // For Guest Users: Use the traditional top-fixed navbar
  if (!isAuthenticated) {
    return <NavbarLegacy />;
  }

  // For Authenticated Users: Use the innovative bottom-floating Navigation Island
  // Note: The top 'Brandmark' is handled separately in the Layout component
  return <NavigationIsland />;
};

export default Navbar;
