import { createContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Home from './Components/Home/Home/Home';
import Login from './Components/Login/Login/Login';
import Dashboard from './Components/Dashboard/Dashboard/Dashboard';
import AddReview from './Components/AddReview/AddReview';
import AddService from './Components/AddService/AddService';
import Book from './Components/Book/Book';
import OrderList from './Components/OrderList/OrderList';
import ManageService from './Components/manageService/manageService';
import BookingList from './Components/BookingList/BookingList';
import AddAdmin from './Components/AddAdmin/AddAdmin';
import Services from './Components/Services/Services/Services';

export const UserContext = createContext();

const privatePaths = new Set(['/dashboard', '/addReview', '/addService', '/addAdmin', '/addManage', '/bookList', '/book']);
const pages = {
  '/': Home,
  '/login': Login,
  '/dashboard': Dashboard,
  '/addReview': AddReview,
  '/orderList': OrderList,
  '/addService': AddService,
  '/addAdmin': AddAdmin,
  '/addManage': ManageService,
  '/bookList': BookingList,
  '/book': Services,
};

export default function App() {
  const router = useRouter();
  const [loggedInUser, setLoggedInUser] = useState({});
  const pathname = router.asPath.split('?')[0].replace(/\/$/, '') || '/';
  const isBooking = pathname.startsWith('/book/');
  const isPrivate = privatePaths.has(pathname) || isBooking;
  const Page = isBooking ? Book : pages[pathname];

  useEffect(() => {
    if (isPrivate && !loggedInUser.email && pathname !== '/login') {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
    }
  }, [isPrivate, loggedInUser.email, pathname, router]);

  if (isPrivate && !loggedInUser.email && pathname !== '/login') return null;

  return <UserContext.Provider value={[loggedInUser, setLoggedInUser]}>
    {Page ? <Page /> : <Home />}
  </UserContext.Provider>;
}
