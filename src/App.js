
import './App.css';
import Home from './Components/Home/Home/Home';
import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";
import { createContext, useState } from 'react';
import Login from './Components/Login/Login/Login';
import Dashboard from './Components/Dashboard/Dashboard/Dashboard'
import AddReview from './Components/AddReview/AddReview';
import AddService from './Components/AddService/AddService';
import Book from './Components/Book/Book';
import PrivateRoute from './Components/Login/PrivateRoute/PrivateRoute';
import OrderList from './Components/OrderList/OrderList';
import ManageService from './Components/manageService/manageService';
import BookingList from './Components/BookingList/BookingList';
import AddAdmin from './Components/AddAdmin/AddAdmin';
import Services from './Components/Services/Services/Services';
export const UserContext = createContext();
function App() {
  const [loggedInUser, setLoggedInUser] = useState({});

  return (
    <UserContext.Provider value={[loggedInUser, setLoggedInUser]}>
    <Router>
     

    <Switch>
      
      <Route exact path="/">
        <Home></Home>
      </Route>
      <Route path="/login">
              <Login></Login>
          </Route>
          <PrivateRoute path="/dashboard">
            <Dashboard></Dashboard>
          </PrivateRoute>
          <PrivateRoute path="/addReview">
              <AddReview></AddReview>
           </PrivateRoute>
           <Route path="/orderList">
             <OrderList></OrderList>
           </Route>
           <PrivateRoute path="/addService">
              <AddService></AddService>
           </PrivateRoute>
           <PrivateRoute path="/addAdmin">
              <AddAdmin></AddAdmin>
           </PrivateRoute>
           <PrivateRoute path="/addManage">
              <ManageService></ManageService>
           </PrivateRoute>
           <PrivateRoute path="/bookList">
              <BookingList></BookingList>
           </PrivateRoute>
           <PrivateRoute path="/book/:id">
              <Book></Book>
           </PrivateRoute>
           <PrivateRoute path="/book">
              <Services></Services>
           </PrivateRoute>
           
     
        
        
    </Switch>
  
</Router>
</UserContext.Provider>
  );
}

export default App;
